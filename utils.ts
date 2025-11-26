
import { GoogleGenAI } from "@google/genai";

// --- JSON PARSING UTILITY ---
export function cleanAndParseJSON(text: string): any {
  if (!text) return null;
  try {
    let cleaned = text.replace(/```json\s*|\s*```/gi, '').trim();
    const firstCurly = cleaned.indexOf('{');
    const firstSquare = cleaned.indexOf('[');
    let startIndex = -1;
    
    if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
      startIndex = firstCurly;
    } else if (firstSquare !== -1) {
      startIndex = firstSquare;
    }

    if (startIndex !== -1) {
      cleaned = cleaned.substring(startIndex);
      // Find the last matching bracket
      const endChar = cleaned[0] === '{' ? '}' : ']';
      const lastIndex = cleaned.lastIndexOf(endChar);
      if (lastIndex !== -1) {
        cleaned = cleaned.substring(0, lastIndex + 1);
      }
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
}

// --- STATIC IMAGE LIBRARY (Instant Load) ---
// High-quality public domain/CC images for common compounds to save API quota and load instantly.
const STATIC_IMAGES: Record<string, string> = {
    'H2O': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Water-3D-balls.png/320px-Water-3D-balls.png',
    'NaCl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Sodium-chloride-3D-ionic.png/320px-Sodium-chloride-3D-ionic.png',
    'CO2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Carbon-dioxide-3D-vdW.png/320px-Carbon-dioxide-3D-vdW.png',
    'HCl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Hydrogen-chloride-3D-balls.png/320px-Hydrogen-chloride-3D-balls.png',
    'CH4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Methane-3D-balls.png/320px-Methane-3D-balls.png',
    'NH3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Ammonia-3D-balls-A.png/320px-Ammonia-3D-balls-A.png',
    'C6H6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Benzene-3D-balls.png/320px-Benzene-3D-balls.png',
    'H2SO4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sulfuric-acid-3D-balls.png/320px-Sulfuric-acid-3D-balls.png',
    'C2H5OH': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Ethanol-3D-balls.png/320px-Ethanol-3D-balls.png',
    'C6H12O6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Alpha-D-glucose-3D-balls.png/320px-Alpha-D-glucose-3D-balls.png',
    'O2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Dioxygen-3D-balls.png/320px-Dioxygen-3D-balls.png',
    'N2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Dinitrogen-3D-balls.png/320px-Dinitrogen-3D-balls.png',
    'Cl2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Dichlorine-3D-balls.png/320px-Dichlorine-3D-balls.png',
    'H2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Dihydrogen-3D-balls.png/320px-Dihydrogen-3D-balls.png',
    'NaOH': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Sodium-hydroxide-3D-ionic.png/320px-Sodium-hydroxide-3D-ionic.png',
    'CH3COOH': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Acetic-acid-3D-balls.png/320px-Acetic-acid-3D-balls.png',
    'KNO3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Potassium-nitrate-3D-balls.png/320px-Potassium-nitrate-3D-balls.png',
    'CaCO3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Calcite-3D-balls.png/320px-Calcite-3D-balls.png',
    'Fe2O3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Hematite-unit-cell-3D-balls.png/320px-Hematite-unit-cell-3D-balls.png',
    'AgNO3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Silver-nitrate-3D-balls.png/320px-Silver-nitrate-3D-balls.png',
    'CuSO4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Copper-sulfate-3D-balls.png/320px-Copper-sulfate-3D-balls.png',
    'KI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Potassium-iodide-3D-ionic.png/320px-Potassium-iodide-3D-ionic.png',
    'HNO3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Nitric-acid-3D-balls.png/320px-Nitric-acid-3D-balls.png',
    'H2O2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Hydrogen-peroxide-3D-balls.png/320px-Hydrogen-peroxide-3D-balls.png',
};


// --- COLOR GENERATOR FOR FALLBACKS ---
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function generateSVGFallback(text: string, subText?: string): string {
  const color = stringToColor(text + (subText || ''));
  // Create a nice gradient or solid color background with chemical text
  const svg = `
  <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.2" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.6" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" rx="15" />
    <circle cx="150" cy="150" r="80" fill="white" fill-opacity="0.3" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="48" fill="#334155">${text}</text>
    ${subText ? `<text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#475569">${subText}</text>` : ''}
  </svg>
  `;
  // Use encodeURIComponent for Unicode support (Arabic)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}


// --- IMAGE MANAGER CLASS ---
class ImageManagerClass {
    private queue: { id: string, prompt: string, resolve: (url: string | null) => void }[] = [];
    private processing = false;
    private cache: Record<string, string> = {};
    private pending: Record<string, Promise<string | null>> = {};
    
    // Config
    private QUEUE_DELAY = 1000; // Faster queue
    private IS_PAUSED = false;
    private CACHE_KEY = 'img_cache_v3'; // Increment version to clear old bad cache

    constructor() {
        // Load cache from localStorage
        try {
            const saved = localStorage.getItem(this.CACHE_KEY);
            if (saved) this.cache = JSON.parse(saved);
        } catch (e) {
            console.error("Cache load error", e);
        }
    }

    private saveCache() {
        try {
            // Simple LRU-like: if too big, clear it
            if (JSON.stringify(this.cache).length > 2000000) { // ~2MB limit
                this.cache = {}; 
            }
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
        } catch (e) {
            // Ignore quota errors
        }
    }

    public async getImage(id: string, prompt: string, fallbackFormula?: string): Promise<string | null> {
        // 1. Check Static Library (Instant)
        if (fallbackFormula) {
             // Remove state symbols like (l), (s), (aq), (g) and spaces
            const cleanFormula = fallbackFormula
                .replace(/\([slg]|aq\)/gi, '') 
                .replace(/\s+/g, '')
                .replace(/[\(\)₀-₉0-9]/g, match => {
                     if (match === '₂') return '2';
                     if (match === '₃') return '3';
                     if (match === '₄') return '4';
                     if (match === '₆') return '6';
                     return match;
                });
            
            // Try exact match
            if (STATIC_IMAGES[cleanFormula]) return STATIC_IMAGES[cleanFormula];
            
            // Try simplified formula match (only alphanumeric)
            const simplified = cleanFormula.replace(/[^a-zA-Z0-9]/g, '');
            if (STATIC_IMAGES[simplified]) return STATIC_IMAGES[simplified];
        }

        // 2. Check Memory Cache
        if (this.cache[id]) return this.cache[id];

        // 3. Check Pending Requests (Deduplication)
        if (this.pending[id]) return this.pending[id];

        // 4. Queue API Request (or Fallback if paused)
        if (this.IS_PAUSED) {
            return fallbackFormula ? generateSVGFallback(fallbackFormula) : null;
        }

        const promise = new Promise<string | null>((resolve) => {
            this.queue.push({ id, prompt, resolve });
            this.processQueue();
        });

        this.pending[id] = promise;
        return promise.then(res => {
            delete this.pending[id];
            // If API fails or returns null, always return fallback SVG
            if (!res && fallbackFormula) {
                return generateSVGFallback(fallbackFormula);
            }
            return res;
        });
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0 || this.IS_PAUSED) return;

        this.processing = true;
        const { id, prompt, resolve } = this.queue.shift()!;

        try {
            const url = await this.fetchImageFromApi(prompt);
            if (url) {
                this.cache[id] = url;
                this.saveCache();
                resolve(url);
            } else {
                resolve(null);
            }
        } catch (error: any) {
            console.error("Image Gen Error:", error);
            if (error.status === 429 || error.message?.includes('429')) {
                this.IS_PAUSED = true;
                setTimeout(() => { this.IS_PAUSED = false; this.processQueue(); }, 20000); // 20s cooldown
                resolve(null);
            } else {
                resolve(null);
            }
        } finally {
            this.processing = false;
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), this.QUEUE_DELAY);
            }
        }
    }

    private async fetchImageFromApi(prompt: string): Promise<string | null> {
        if (!process.env.API_KEY) return null;

        // Use correct image model: gemini-2.5-flash-image
        // Or gemini-3-pro-image-preview for high quality, but stick to flash for speed/quota
        const safePrompt = `Generate a scientific 3D ball-and-stick molecular model for: ${prompt}. White background, studio lighting, photorealistic. IMPORTANT: NO TEXT, NO LABELS, NO WATERMARKS.`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image', // CORRECTED MODEL NAME
                contents: {
                    parts: [{ text: safePrompt }]
                },
                config: {
                   // Ensure no restrictive schema or mimetype is set for image gen
                }
            });
            
             const candidates = response.candidates;
             if (candidates && candidates.length > 0) {
                 const parts = candidates[0].content.parts;
                 for (const part of parts) {
                     if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
                         return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                     }
                 }
             }
             return null;
        } catch (e) {
            return null;
        }
    }
}

export const ImageManager = new ImageManagerClass();

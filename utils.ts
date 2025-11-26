
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
// High-quality public domain/CC images for common compounds
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
    'Ca(OH)2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Calcium-hydroxide-3D-balls.png/320px-Calcium-hydroxide-3D-balls.png',
    'MgSO4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Magnesium-sulfate-3D-balls.png/320px-Magnesium-sulfate-3D-balls.png',
    'NH4Cl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Ammonium-chloride-3D-ionic.png/320px-Ammonium-chloride-3D-ionic.png',
    'Pb(NO3)2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Lead%28II%29-nitrate-3D-balls.png/320px-Lead%28II%29-nitrate-3D-balls.png',
    'Na2S2O3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Sodium-thiosulfate-3D-balls.png/320px-Sodium-thiosulfate-3D-balls.png',
    'H2O2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Hydrogen-peroxide-3D-balls.png/320px-Hydrogen-peroxide-3D-balls.png',
};

// --- COLOR GENERATOR FOR SVGs ---
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// --- SOLUTION SVG GENERATOR (For Beaker View) ---
function generateSolutionSVG(solute: string, solvent: string): string {
  // Heuristic for color based on solute properties (for visual appeal)
  let liquidColor = "#eff6ff"; // Default light blue
  const s = solute.toLowerCase();
  let particleColor = "#1e293b"; // Dark slate
  
  if (s.includes('cu') || s.includes('copper')) { liquidColor = "#3b82f6"; particleColor = "#1d4ed8"; } // Blue (Cu2+)
  else if (s.includes('permanganate') || s.includes('mno4')) { liquidColor = "#a855f7"; particleColor = "#7e22ce"; } // Purple (MnO4-)
  else if (s.includes('iron') || s.includes('fe')) { liquidColor = "#f97316"; particleColor = "#c2410c"; } // Orange/Rust
  else if (s.includes('chromate') || s.includes('cr')) { liquidColor = "#eab308"; particleColor = "#a16207"; } // Yellow
  else if (s.includes('nickel') || s.includes('ni')) { liquidColor = "#22c55e"; particleColor = "#15803d"; } // Green
  else if (s.includes('cobalt') || s.includes('co')) { liquidColor = "#ec4899"; particleColor = "#be185d"; } // Pink
  else if (s.includes('iodine') || s.includes('i2')) { liquidColor = "#a21caf"; particleColor = "#4c0519"; } // Dark Purple/Brown
  else if (s.includes('cl') || s.includes('na') || s.includes('k')) { liquidColor = "#e0f2fe"; particleColor = "#94a3b8"; } // Clear/Light Blue
  
  const svg = `
  <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${liquidColor}" stop-opacity="0.5" />
        <stop offset="100%" stop-color="${liquidColor}" stop-opacity="0.8" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="300" height="300" fill="#f8fafc" rx="12" />
    
    <!-- Beaker Rim -->
    <ellipse cx="150" cy="80" rx="70" ry="10" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2" />
    
    <!-- Beaker Body -->
    <path d="M80,80 L80,220 Q80,250 110,250 L190,250 Q220,250 220,220 L220,80" fill="none" stroke="#94a3b8" stroke-width="4" />
    
    <!-- Liquid -->
    <path d="M85,120 L85,220 Q85,245 110,245 L190,245 Q215,245 215,220 L215,120" fill="url(#liquidGrad)" />
    <ellipse cx="150" cy="120" rx="65" ry="8" fill="${liquidColor}" opacity="0.4" />
    
    <!-- Dissolving Particles (Reaction/Dissolution Animation) -->
    <!-- Falling solid particles -->
    <circle cx="150" cy="150" r="5" fill="${particleColor}" opacity="0.9"><animate attributeName="cy" from="100" to="230" dur="2s" repeatCount="indefinite" /></circle>
    <circle cx="140" cy="140" r="4" fill="${particleColor}" opacity="0.9"><animate attributeName="cy" from="110" to="235" dur="2.5s" repeatCount="indefinite" /></circle>
    
    <!-- Dispersing particles at bottom -->
    <circle cx="130" cy="230" r="3" fill="${particleColor}" opacity="0.7"><animate attributeName="cx" values="130;110;130" dur="3s" repeatCount="indefinite" /><animate attributeName="cy" values="230;210;230" dur="3s" repeatCount="indefinite" /></circle>
    <circle cx="170" cy="235" r="3" fill="${particleColor}" opacity="0.7"><animate attributeName="cx" values="170;190;170" dur="4s" repeatCount="indefinite" /><animate attributeName="cy" values="235;215;235" dur="4s" repeatCount="indefinite" /></circle>

    <!-- Rising Bubbles/Ions -->
    <circle cx="120" cy="180" r="2" fill="white" opacity="0.5"><animate attributeName="cy" from="230" to="120" dur="3s" repeatCount="indefinite" /></circle>
    <circle cx="160" cy="200" r="3" fill="white" opacity="0.5"><animate attributeName="cy" from="240" to="130" dur="4s" repeatCount="indefinite" /></circle>
    <circle cx="180" cy="170" r="2" fill="white" opacity="0.5"><animate attributeName="cy" from="220" to="125" dur="3.5s" repeatCount="indefinite" /></circle>
    
    <!-- Text -->
    <text x="150" y="275" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="16" fill="#475569">${solute}</text>
    <text x="150" y="292" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">Dissolving in ${solvent}</text>
  </svg>
  `;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// --- SVG FALLBACK GENERATOR (Arabic Support) ---
function generateFallbackSVG(name: string, formula: string): string {
  const color = stringToColor(formula || name);
  const svg = `
  <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="300" fill="#f8fafc" rx="15" />
    <circle cx="150" cy="150" r="100" fill="${color}" opacity="0.2" />
    <circle cx="150" cy="150" r="80" fill="${color}" opacity="0.4" />
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="40" fill="#334155">${formula}</text>
    <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#64748b">${name}</text>
  </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// --- LOCAL STORAGE CACHE MANAGER ---
const CACHE_PREFIX = 'elementx_img_';
const MAX_CACHE_SIZE = 4 * 1024 * 1024; // 4MB limit for images

const LocalCache = {
    get: (key: string): string | null => {
        try {
            const item = localStorage.getItem(CACHE_PREFIX + key);
            if (!item) return null;
            const entry = JSON.parse(item);
            return entry.data;
        } catch {
            return null;
        }
    },
    set: (key: string, data: string) => {
        try {
            // Prune if storage is full
            let totalSize = new Blob(Object.values(localStorage)).size;
            if (totalSize > MAX_CACHE_SIZE) {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith(CACHE_PREFIX)) {
                        localStorage.removeItem(k);
                    }
                });
            }
            
            const entry = { timestamp: Date.now(), data };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
        } catch (e) {
            console.warn("LocalStorage full, ignoring cache.");
        }
    }
};

// --- IMAGE QUEUE MANAGER ---
class ImageQueue {
    private queue: (() => Promise<void>)[] = [];
    private processing = false;
    private delay = 2000; // 2s delay to respect rate limits

    add(task: () => Promise<void>) {
        this.queue.push(task);
        this.process();
    }

    private async process() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                await task();
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }

        this.processing = false;
    }
}

const imageQueue = new ImageQueue();

// --- MAIN IMAGE MANAGER ---
export const ImageManager = {
    getImage: async (key: string, prompt: string, formula?: string, type: 'compound' | 'solution' = 'compound'): Promise<string | null> => {
        // 1. Check Static Library (Instant) - ONLY for compounds, not solution views
        if (type === 'compound' && formula) {
            const normalized = formula.replace(/\(.*\)/g, '').replace(/[\u2080-\u2089]/g, (m) => String(m.codePointAt(0)! - 0x2080));
            if (STATIC_IMAGES[normalized]) return STATIC_IMAGES[normalized];
            if (STATIC_IMAGES[formula]) return STATIC_IMAGES[formula];
        }

        // 2. Check Local Cache (Fast)
        const cached = LocalCache.get(key);
        if (cached) return cached;

        // 3. Fallback immediately if no API key (Offline mode)
        if (!process.env.API_KEY) {
            if (type === 'solution') return generateSolutionSVG(formula || 'Solute', 'Water');
            return generateFallbackSVG(prompt.split(' ').pop() || 'Compound', formula || '');
        }

        // 4. Request from API via Queue
        return new Promise((resolve) => {
            imageQueue.add(async () => {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: {
                            parts: [{ text: `${prompt}. Create a clean, high-quality visual representation. NO TEXT inside image.` }]
                        },
                        config: {}
                    });

                    // Extract image
                    let base64Image = null;
                    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                                break;
                            }
                        }
                    }

                    if (base64Image) {
                        LocalCache.set(key, base64Image);
                        resolve(base64Image);
                    } else {
                        // API returned text/refusal, fallback
                        if (type === 'solution') resolve(generateSolutionSVG(formula || 'Solute', 'Water'));
                        else resolve(generateFallbackSVG(prompt, formula || ''));
                    }

                } catch (e) {
                    console.error("Image Gen Error:", e);
                    if (type === 'solution') resolve(generateSolutionSVG(formula || 'Solute', 'Water'));
                    else resolve(generateFallbackSVG(prompt, formula || ''));
                }
            });
        });
    }
};

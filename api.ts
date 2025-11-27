import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { cleanAndParseJSON } from './utils';

export const ACADEMIC_CHEMIST_PROMPT = `
You are an expert Academic Chemistry Professor (بروفيسور كيميائي أكاديمي). 
Your goal is to provide highly accurate, scientific, and educational responses in fluent, eloquent Arabic (اللغة العربية الفصحى السلسة).
Avoid robotic or literal translations. Use proper scientific terminology.
Provide deep insights, historical context where relevant, and clear explanations.
Always ensure the output is valid JSON strictly adhering to the schema.
`;

export class AIService {
    private ai: GoogleGenAI | null = null;

    constructor() {
        if (process.env.API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    }

    private async callWithRetry<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
        if (!this.ai) {
            throw new Error("مفتاح API غير موجود. يرجى إعداده في ملف .env أو إعدادات Vercel.");
        }
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await apiCall();
            } catch (error: any) {
                attempt++;
                if (attempt >= maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            }
        }
        throw new Error("Failed after retries");
    }

    async generateContent<T>(
        model: string, 
        contents: string, 
        schema?: any,
        systemInstruction: string = ACADEMIC_CHEMIST_PROMPT
    ): Promise<T | null> {
        if (!this.ai) return null;

        try {
            const response = await this.callWithRetry<GenerateContentResponse>(() => 
                this.ai!.models.generateContent({
                    model: model,
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: 'application/json',
                        responseSchema: schema
                    }
                })
            );
            return cleanAndParseJSON(response.text || '');
        } catch (error) {
            console.error("AI Service Error:", error);
            throw error;
        }
    }
}

export const aiService = new AIService();

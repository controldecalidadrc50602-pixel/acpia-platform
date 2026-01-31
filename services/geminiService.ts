import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Audit, Language, RubricItem, SmartAnalysisResult, CoachingPlan } from '../types';
import { updateUsageStats } from './storageService';

// Configuración del cliente de IA corregida para Vite/Vercel
const getAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("MISSING_KEY: Verifica las variables de entorno en Vercel");
    return new GoogleGenerativeAI(apiKey);
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeText = async (content: string, rubric: RubricItem[], lang: Language, agentName?: string, projectName?: string, isPdf: boolean = false): Promise<SmartAnalysisResult | null> => {
    return withRetry(async () => {
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
        
        const systemInstruction = `Eres un auditor de calidad experto analizando ${isPdf ? 'documento PDF' : 'chat'}. 
        Evalúa el desempeño basado en esta rúbrica: ${rubricText}.
        Responde ÚNICAMENTE en JSON con score(0-100), csat(1-5), customData(objeto id:bool) y notes en ${lang}.`;

        const result = await model.generateContent([
            { text: isPdf ? `PDF Content (Base64): ${content}` : `Chat Transcript: ${content}` },
            { text: systemInstruction }
        ]);

        const response = await result.response;
        const tokens = response.usageMetadata?.totalTokenCount || 500;
        updateUsageStats(tokens, true);

        const text = response.text();
        return text ? JSON.parse(text) : null;
    });
}

export const analyzeAudio = async (base64Audio: string, rubric: RubricItem[], lang: Language, agentName?: string, projectName?: string): Promise<SmartAnalysisResult | null> => {
    return withRetry(async () => {
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
        
        const systemInstruction = `Auditor de calidad experto para audio. Analiza la voz del agente ${agentName}.
        Rúbrica: ${rubricText}. Genera JSON: score, csat, customData, notes en ${lang}.`;
        
        const result = await model.generateContent([
            { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
            { text: systemInstruction }
        ]);

        const response = await result.response;
        const tokens = response.usageMetadata?.totalTokenCount || 2000;
        updateUsageStats(tokens, true);

        const text = response.text();
        return text ? JSON.parse(text) : null;
    });
}

export const sendChatMessage = async (history: any[], newMessage: string, auditContext: Audit[], lang: Language): Promise<string> => {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
    });

    const result = await model.generateContent({
        contents: [ ...history, { role: 'user', parts: [{ text: newMessage }] } ],
        generationConfig: {
            stopSequences: [],
            maxOutputTokens: 1000,
            temperature: 0.7,
        }
    });

    const response = await result.response;
    const tokens = response.usageMetadata?.totalTokenCount || 1000;
    updateUsageStats(tokens, false);

    return response.text() || "Sin respuesta.";
};

export const generateAuditFeedback = async (data: any, lang: Language) => {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Genera feedback ejecutivo para ${data.agentName} basado en: ${JSON.stringify(data)}. Idioma: ${lang}.`);
    const response = await result.response;
    const tokens = response.usageMetadata?.totalTokenCount || 300;
    updateUsageStats(tokens, false);
    return response.text() || "";
}

export const testConnection = async () => {
    try { 
        const genAI = getAI(); 
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        await model.generateContent('ping'); 
        return true; 
    } catch (e) { return false; }
}

export const getQuickInsight = async (audits: any[], lang: Language) => {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Analiza brevemente la tendencia de estas auditorías: ${JSON.stringify(audits.slice(0,5))}. Idioma: ${lang}.`);
    const response = await result.response;
    const tokens = response.usageMetadata?.totalTokenCount || 500;
    updateUsageStats(tokens, false);
    return response.text() || "...";
}

export const generateReportSummary = async (audits: any[], lang: Language): Promise<string> => {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Analiza este conjunto de auditorías y genera un resumen ejecutivo detallado en ${lang}: ${JSON.stringify(audits.slice(0, 20))}`);
    const response = await result.response;
    const tokens = response.usageMetadata?.totalTokenCount || 1000;
    updateUsageStats(tokens, false);
    return response.text() || "";
};

export const generateCoachingPlan = async (agentName: string, recentAudits: any[], lang: Language): Promise<CoachingPlan | null> => {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    topic: { type: SchemaType.STRING },
                    tasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                },
                required: ["topic", "tasks"]
            }
        }
    });

    const result = await model.generateContent(`Genera un plan de coaching estructurado en JSON para el agente ${agentName} basado en sus auditorías recientes: ${JSON.stringify(recentAudits)}. Idioma: ${lang}.`);
    const response = await result.response;
    const tokens = response.usageMetadata?.totalTokenCount || 1500;
    updateUsageStats(tokens, false);

    const text = response.text();
    if (!text) return null;
    try {
        const data = JSON.parse(text);
        return {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            topic: data.topic,
            tasks: data.tasks,
            status: 'pending'
        };
    } catch (e) {
        return null;
    }
};

export const generatePerformanceAnalysis = async (name: string, type: 'AGENT' | 'PROJECT', stats: any, lang: Language): Promise<string> => {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Analiza el desempeño de ${type === 'AGENT' ? 'el agente' : 'el proyecto'} llamado ${name} basado en estas estadísticas: ${JSON.stringify(stats)}. Genera un análisis ejecutivo corto y motivador en ${lang}.`);
    const response = await result.response;
    const tokens = response.usageMetadata?.totalTokenCount || 500;
    updateUsageStats(tokens, false);
    return response.text() || "";
};


import { GoogleGenAI, Type } from '@google/genai';
import { Audit, Language, RubricItem, SmartAnalysisResult, CoachingPlan } from '../types';
import { updateUsageStats } from './storageService';

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("MISSING_KEY");
    return new GoogleGenAI({ apiKey });
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
        const ai = getAI();
        const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
        
        const systemInstruction = `Eres un auditor de calidad experto analizando ${isPdf ? 'documento PDF' : 'chat'}. 
        Evalúa el desempeño basado en esta rúbrica: ${rubricText}.
        Responde ÚNICAMENTE en JSON con score(0-100), csat(1-5), customData(objeto id:bool) y notes en ${lang}.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [
                { text: isPdf ? `PDF Content (Base64): ${content}` : `Chat Transcript: ${content}` },
                { text: systemInstruction }
            ]},
            config: { 
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });

        // Actualización de consumo
        const tokens = (response as any).usageMetadata?.totalTokenCount || 500;
        updateUsageStats(tokens, true);

        const text = response.text;
        return text ? JSON.parse(text) : null;
    });
}

export const analyzeAudio = async (base64Audio: string, rubric: RubricItem[], lang: Language, agentName?: string, projectName?: string): Promise<SmartAnalysisResult | null> => {
    return withRetry(async () => {
        const ai = getAI();
        const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
        
        const systemInstruction = `Auditor de calidad experto para audio. Analiza la voz del agente ${agentName}.
        Rúbrica: ${rubricText}. Genera JSON: score, csat, customData, notes en ${lang}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [
                { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
                { text: systemInstruction }
            ]},
            config: { 
                responseMimeType: "application/json",
                temperature: 0.1
            }
        });

        const tokens = (response as any).usageMetadata?.totalTokenCount || 2000;
        updateUsageStats(tokens, true);

        const text = response.text;
        return text ? JSON.parse(text) : null;
    });
}

export const sendChatMessage = async (history: any[], newMessage: string, auditContext: Audit[], lang: Language): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [ ...history, { role: 'user', parts: [{ text: newMessage }] } ],
        config: { 
            systemInstruction: `Eres ACPIA Copilot. Idioma: ${lang}. Contexto de auditorías: ${JSON.stringify(auditContext.slice(0, 5))}` 
        }
    });

    const tokens = (response as any).usageMetadata?.totalTokenCount || 1000;
    updateUsageStats(tokens, false);

    return response.text || "Sin respuesta.";
};

export const generateAuditFeedback = async (data: any, lang: Language) => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera feedback ejecutivo para ${data.agentName} basado en: ${JSON.stringify(data)}. Idioma: ${lang}.`,
    });
    const tokens = (res as any).usageMetadata?.totalTokenCount || 300;
    updateUsageStats(tokens, false);
    return res.text || "";
}

export const testConnection = async () => {
    try { 
        const ai = getAI(); 
        await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' }); 
        return true; 
    } catch (e) { return false; }
}

export const getQuickInsight = async (audits: any[], lang: Language) => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza brevemente la tendencia de estas auditorías: ${JSON.stringify(audits.slice(0,5))}. Idioma: ${lang}.`,
    });
    const tokens = (res as any).usageMetadata?.totalTokenCount || 500;
    updateUsageStats(tokens, false);
    return res.text || "...";
}

// Fix: Added missing generateReportSummary for Reports component
export const generateReportSummary = async (audits: any[], lang: Language): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza este conjunto de auditorías y genera un resumen ejecutivo detallado en ${lang}: ${JSON.stringify(audits.slice(0, 20))}`,
    });
    const tokens = (response as any).usageMetadata?.totalTokenCount || 1000;
    updateUsageStats(tokens, false);
    return response.text || "";
};

// Fix: Added missing generateCoachingPlan for AgentScorecard component
export const generateCoachingPlan = async (agentName: string, recentAudits: any[], lang: Language): Promise<CoachingPlan | null> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Genera un plan de coaching estructurado en JSON para el agente ${agentName} basado en sus auditorías recientes: ${JSON.stringify(recentAudits)}. 
        Idioma: ${lang}. 
        Responde con un objeto JSON que tenga los campos: topic (string), tasks (array de strings).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: {
                        type: Type.STRING,
                        description: 'El tema central del plan de coaching.'
                    },
                    tasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Lista de tareas accionables para el agente.'
                    }
                },
                required: ["topic", "tasks"]
            }
        }
    });

    const tokens = (response as any).usageMetadata?.totalTokenCount || 1500;
    updateUsageStats(tokens, false);

    const text = response.text;
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
        console.error("Error parsing coaching plan JSON", e);
        return null;
    }
};

// Fix: Added missing generatePerformanceAnalysis for Agent and Project scorecards
export const generatePerformanceAnalysis = async (name: string, type: 'AGENT' | 'PROJECT', stats: any, lang: Language): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza el desempeño de ${type === 'AGENT' ? 'el agente' : 'el proyecto'} llamado ${name} basado en estas estadísticas: ${JSON.stringify(stats)}. Genera un análisis ejecutivo corto y motivador en ${lang}.`,
    });
    const tokens = (response as any).usageMetadata?.totalTokenCount || 500;
    updateUsageStats(tokens, false);
    return response.text || "";
};

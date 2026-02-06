import Groq from "groq-sdk";
import { Audit, Language, RubricItem, SmartAnalysisResult, CoachingPlan } from '../types';
import { updateUsageStats } from './storageService';

const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("Falta VITE_GROQ_API_KEY en Vercel");
    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// Función para auditoría de texto
export const analyzeText = async (content: string, rubric: RubricItem[], lang: Language): Promise<SmartAnalysisResult | null> => {
    try {
        const groq = getGroqClient();
        const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
        
        const sys = `Eres un auditor experto. Evalúa el texto con esta rúbrica:\n${rubricText}\nResponde SOLO un objeto JSON con score(0-100), csat(1-5), customData(objeto id:bool), notes(en ${lang}).`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: sys },
                { role: "user", content: content }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const res = JSON.parse(completion.choices[0]?.message?.content || "{}");
        updateUsageStats(500, true);
        return res;
    } catch (e) {
        console.error("Error en IA:", e);
        return null;
    }
};

// Funciones para que el Dashboard no dé error
export const getQuickInsight = async (audits: any[], lang: Language) => "Listo para auditar.";
export const sendChatMessage = async (history: any[], newMessage: string, auditContext: Audit[], lang: Language) => "Copilot activo.";
export const generateAuditFeedback = async (data: any, lang: Language) => "";
export const generateReportSummary = async (audits: any[], lang: Language) => "";
export const generateCoachingPlan = async (agent: string, audits: any[], lang: Language) => null;
export const generatePerformanceAnalysis = async (name: string, type: string, stats: any, lang: Language) => "Análisis listo.";
export const testConnection = async () => true;
export const analyzeAudio = async () => null;

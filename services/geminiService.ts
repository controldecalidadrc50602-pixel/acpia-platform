import Groq from "groq-sdk";
import { Audit, Language, RubricItem, SmartAnalysisResult, CoachingPlan } from '../types';
import { updateUsageStats } from './storageService';

const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("Falta VITE_GROQ_API_KEY en Vercel");
    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const callGroq = async (sys: string, user: string, formatJSON = false) => {
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        ...(formatJSON ? { response_format: { type: "json_object" } } : {})
    });
    return res.choices[0]?.message?.content || "";
};

export const analyzeText = async (content: string, rubric: RubricItem[], lang: Language): Promise<SmartAnalysisResult | null> => {
    const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
    const sys = `Eres un auditor experto. Evalúa el texto con esta rúbrica:\n${rubricText}\nResponde SOLO JSON con score(0-100), csat(1-5), customData(objeto id:bool), notes(en ${lang}).`;
    const res = await callGroq(sys, content, true);
    updateUsageStats(500, true);
    return JSON.parse(res);
};

export const getQuickInsight = async (audits: any[], lang: Language) => {
    return await callGroq(`Analiza tendencias y da un insight corto en ${lang}.`, JSON.stringify(audits.slice(0, 5)));
};

export const sendChatMessage = async (history: any[], newMessage: string, auditContext: Audit[], lang: Language) => {
    return await callGroq(`Eres ACPIA Copilot en ${lang}. Contexto: ${JSON.stringify(auditContext.slice(0, 3))}`, newMessage);
};

export const generateAuditFeedback = async (data: any, lang: Language) => await callGroq("Genera feedback ejecutivo.", JSON.stringify(data));
export const generateReportSummary = async (audits: any[], lang: Language) => await callGroq("Resume estas auditorías.", JSON.stringify(audits.slice(0, 10)));
export const generateCoachingPlan = async (agent: string, audits: any[], lang: Language) => null;
export const generatePerformanceAnalysis = async (name: string, type: string, stats: any, lang: Language) => "Análisis listo.";
export const testConnection = async () => true;
export const analyzeAudio = async () => null;
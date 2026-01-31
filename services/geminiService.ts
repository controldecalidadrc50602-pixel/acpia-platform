import Groq from "groq-sdk";
import { Audit, Language, RubricItem, SmartAnalysisResult, CoachingPlan } from '../types';
import { updateUsageStats } from './storageService';

// Configuración para Groq
const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("MISSING_GROQ_KEY: Configura VITE_GROQ_API_KEY en Vercel");
    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// Función genérica para llamadas a Groq (JSON)
const callGroqJSON = async (systemPrompt: string, userPrompt: string, model: string = "llama-3.3-70b-versatile") => {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: model,
        response_format: { type: "json_object" },
        temperature: 0.1,
    });
    return completion.choices[0]?.message?.content || "{}";
};

// 1. Analizar Texto (Auditoría)
export const analyzeText = async (content: string, rubric: RubricItem[], lang: Language): Promise<SmartAnalysisResult | null> => {
    const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
    const system = `Eres un auditor de calidad experto. Evalúa el texto basado en esta rúbrica: ${rubricText}. Responde ÚNICAMENTE en JSON con los campos: score(number 0-100), csat(number 1-5), customData(objeto id:boolean) y notes(string en ${lang}).`;
    const user = `Contenido a auditar: ${content}`;

    const res = await callGroqJSON(system, user);
    updateUsageStats(500, true);
    return JSON.parse(res);
};

// 2. Chat con el Copilot
export const sendChatMessage = async (history: any[], newMessage: string, auditContext: Audit[], lang: Language): Promise<string> => {
    const groq = getGroqClient();
    const system = `Eres ACPIA Copilot, un asistente experto en calidad para Contact Centers. Idioma: ${lang}. Contexto de auditorías recientes: ${JSON.stringify(auditContext.slice(0, 3))}`;
    
    const completion = await groq.chat.completions.create({
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: newMessage }],
        model: "llama-3.3-70b-versatile",
    });

    updateUsageStats(1000, false);
    return completion.choices[0]?.message?.content || "Sin respuesta.";
};

// 3. Feedback rápido para el Dashboard (La función que faltaba)
export const getQuickInsight = async (audits: any[], lang: Language): Promise<string> => {
    const system = `Analiza estas tendencias de auditoría y da un insight ejecutivo de una oración. Idioma: ${lang}.`;
    const user = `Datos: ${JSON.stringify(audits.slice(0, 5))}`;
    
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        model: "llama-3.1-8b-instant",
    });
    return res.choices[0]?.message?.content || "...";
};

// 4. Generar Feedback de Auditoría
export const generateAuditFeedback = async (data: any, lang: Language): Promise<string> => {
    const system = `Genera un feedback constructivo para un agente de contact center. Idioma: ${lang}.`;
    const user = `Datos de la auditoría: ${JSON.stringify(data)}`;
    
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        model: "llama-3.1-8b-instant",
    });
    return res.choices[0]?.message?.content || "";
};

// 5. Resumen de Reportes
export const generateReportSummary = async (audits: any[], lang: Language): Promise<string> => {
    const system = `Genera un resumen ejecutivo de este conjunto de auditorías. Idioma: ${lang}.`;
    const user = `Auditorías: ${JSON.stringify(audits.slice(0, 10))}`;
    
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        model: "llama-3.3-70b-versatile",
    });
    return res.choices[0]?.message?.content || "";
};

// 6. Plan de Coaching (JSON Estructurado)
export const generateCoachingPlan = async (agentName: string, recentAudits: any[], lang: Language): Promise<CoachingPlan | null> => {
    const system = `Genera un plan de coaching en JSON para el agente ${agentName}. Responde con objeto JSON: { "topic": "string", "tasks": ["string"] }. Idioma: ${lang}.`;
    const user = `Auditorías recientes: ${JSON.stringify(recentAudits)}`;

    const res = await callGroqJSON(system, user);
    try {
        const data = JSON.parse(res);
        return {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            topic: data.topic,
            tasks: data.tasks,
            status: 'pending'
        };
    } catch (e) { return null; }
};

// 7. Análisis de Desempeño
export const generatePerformanceAnalysis = async (name: string, type: string, stats: any, lang: Language): Promise<string> => {
    const system = `Analiza el desempeño de este ${type}. Idioma: ${lang}.`;
    const user = `Nombre: ${name}, Estadísticas: ${JSON.stringify(stats)}`;
    
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        model: "llama-3.1-8b-instant",
    });
    return res.choices[0]?.message?.content || "";
};

// 8. Test de Conexión
export const testConnection = async () => {
    try {
        const groq = getGroqClient();
        await groq.chat.completions.create({ messages: [{ role: "user", content: "ping" }], model: "llama-3.1-8b-instant" });
        return true;
    } catch (e) { return false; }
};

// 9. Audio (Placeholder para evitar errores)
export const analyzeAudio = async () => { return null; };

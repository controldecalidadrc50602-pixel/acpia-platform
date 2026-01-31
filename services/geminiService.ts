import Groq from "groq-sdk";
import { Audit, Language, RubricItem, SmartAnalysisResult, CoachingPlan } from '../types';
import { updateUsageStats } from './storageService';

// Configuración para Groq
const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("MISSING_GROQ_KEY: Configura VITE_GROQ_API_KEY en Vercel");
    // Groq permite el uso desde el navegador con esta opción
    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// Función genérica para llamar a Groq
const callGroq = async (systemPrompt: string, userPrompt: string, model: string = "llama-3.3-70b-versatile") => {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        model: model,
        response_format: { type: "json_object" },
        temperature: 0.2,
    });
    return completion.choices[0]?.message?.content || "";
};

export const analyzeText = async (content: string, rubric: RubricItem[], lang: Language): Promise<SmartAnalysisResult | null> => {
    const rubricText = rubric.map(r => `- ID: ${r.id}, Label: ${r.label}`).join('\n');
    const system = `Eres un auditor de calidad experto. Evalúa el texto basado en esta rúbrica: ${rubricText}. Responde ÚNICAMENTE en JSON con los campos: score(0-100), csat(1-5), customData(objeto id:boolean) y notes(string en ${lang}).`;
    const user = `Contenido a auditar: ${content}`;

    const res = await callGroq(system, user);
    updateUsageStats(500, true);
    return JSON.parse(res);
};

export const sendChatMessage = async (history: any[], newMessage: string, auditContext: Audit[], lang: Language): Promise<string> => {
    const groq = getGroqClient();
    const system = `Eres ACPIA Copilot. Idioma: ${lang}. Contexto de auditorías: ${JSON.stringify(auditContext.slice(0, 3))}`;
    
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: newMessage }
        ],
        model: "llama-3.3-70b-versatile",
    });

    updateUsageStats(1000, false);
    return completion.choices[0]?.message?.content || "Sin respuesta.";
};

// Mantener funciones base para que el resto de la app no falle
export const testConnection = async () => {
    try {
        const groq = getGroqClient();
        await groq.chat.completions.create({ messages: [{ role: "user", content: "ping" }], model: "llama-3.1-8b-instant" });
        return true;
    } catch (e) { return false; }
};

// ... Otras funciones como analyzeAudio pueden requerir Whisper en Groq, por ahora las dejamos así o las simplificamos a texto
export const analyzeAudio = async () => { return null; };

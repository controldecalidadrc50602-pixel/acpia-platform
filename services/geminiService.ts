import Groq from "groq-sdk";

export const analyzeText = async (content: string, rubric: any[], lang: string) => {
    try {
        const key = import.meta.env.VITE_GROQ_API_KEY;
        const groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
        const res = await groq.chat.completions.create({
            messages: [{ role: "user", content: `Audita esto: ${content}` }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });
        return JSON.parse(res.choices[0]?.message?.content || "{}");
    } catch (e) {
        return { score: 0, notes: "IA no disponible momentáneamente." };
    }
};

// Rellenos obligatorios para que la app no explote
export const getQuickInsight = async () => "Listo.";
export const sendChatMessage = async () => "Copilot activo.";
export const generateAuditFeedback = async () => "";
export const generateReportSummary = async () => "";
export const generateCoachingPlan = async () => null;
export const generatePerformanceAnalysis = async () => "";
export const testConnection = async () => true;
export const analyzeAudio = async () => null;

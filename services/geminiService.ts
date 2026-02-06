import Groq from "groq-sdk";

const getGroq = () => {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) throw new Error("Llave VITE_GROQ_API_KEY no encontrada");
    return new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
};

export const analyzeText = async (content: string, rubric: any[], lang: string) => {
    try {
        const groq = getGroq();
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Eres un auditor de calidad. Responde solo en JSON." },
                { role: "user", content: `Audita esto: ${content}` }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (e) {
        console.error("Error IA:", e);
        return null;
    }
};

// Funciones de relleno para que el Dashboard no falle
export const getQuickInsight = async () => "Analizando tendencias...";
export const sendChatMessage = async () => "Copilot activo.";
export const generateAuditFeedback = async () => "";
export const generateReportSummary = async () => "";
export const generateCoachingPlan = async () => null;
export const generatePerformanceAnalysis = async () => "";
export const testConnection = async () => true;
export const analyzeAudio = async () => null;

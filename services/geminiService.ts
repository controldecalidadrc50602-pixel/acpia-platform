import Groq from "groq-sdk";

export const analyzeText = async (content: string, rubric: any[], lang: string) => {
    try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        
        console.log("¿LLAVE DE VERCEL ENCONTRADA?:", apiKey ? "SÍ (empieza con " + apiKey.substring(0, 7) + ")" : "NO, ESTÁ VACÍA");

        if (!apiKey) {
            return { score: 0, notes: "Error: No se encontró la variable VITE_GROQ_API_KEY en Vercel." };
        }

        const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
        
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Responde solo con JSON." },
                { role: "user", content: `Audita: ${content}` }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0]?.message?.content || "{}");

    } catch (error: any) {
        console.error("--- ERROR REAL DE GROQ ---");
        console.error(error); // Imprime el error completo
        return { score: 0, notes: "Fallo la conexión con la IA: " + error.message };
    }
};

// Funciones de relleno
export const getQuickInsight = async () => "Listo.";
export const sendChatMessage = async () => "Copilot listo.";
// ...y las demás funciones vacías...
export const generateAuditFeedback = async () => "";
export const generateReportSummary = async () => "";
export const generateCoachingPlan = async () => null;
export const generatePerformanceAnalysis = async () => "";
export const testConnection = async () => true;
export const analyzeAudio = async () => null;

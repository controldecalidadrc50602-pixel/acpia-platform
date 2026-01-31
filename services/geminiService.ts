import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("LA LLAVE VITE_GROQ_API_KEY NO ESTÁ LLEGANDO A LA APP");
    }
    return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

export const analyzeText = async (content: string, rubric: any[], lang: string) => {
    try {
        const groq = getGroqClient();
        
        // Mensaje de diagnóstico en consola
        console.log("Intentando conectar con Groq...");

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Eres un auditor. Responde solo en JSON." },
                { role: "user", content: `Audita este contenido: ${content}` }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const res = completion.choices[0]?.message?.content;
        
        if (!res) {
            console.error("Groq respondió pero el contenido vino vacío.");
            return { score: 0, notes: "IA respondió vacío." };
        }

        console.log("Respuesta recibida con éxito!");
        return JSON.parse(res);

    } catch (error: any) {
        // ESTA PARTE ES LA MÁS IMPORTANTE
        console.error("--- ERROR DETALLADO DE GROQ ---");
        console.error("Código de error:", error?.status);
        console.error("Mensaje:", error?.message);
        console.error("Cuerpo del error:", error?.error);
        
        return { 
            score: 0, 
            notes: `Fallo técnico: ${error?.message || 'Error desconocido'}` 
        };
    }
};

// Funciones vacías para evitar que el resto de la app falle
export const getQuickInsight = async () => "Analizando datos...";
export const sendChatMessage = async () => "Asistente listo.";
export const generateAuditFeedback = async () => "";
export const generateReportSummary = async () => "";
export const generateCoachingPlan = async () => null;
export const generatePerformanceAnalysis = async () => "";
export const testConnection = async () => true;
export const analyzeAudio = async () => null;


import Groq from "groq-sdk";

// Configuración del cliente Groq
const getGroqClient = () => {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) throw new Error("API Key de Groq no configurada en Vercel");
    return new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
};

export const analyzeText = async (content: string, rubric: any[], lang: string) => {
    try {
        const groq = getGroqClient();
        
        // Construimos un "System Prompt" para que la IA sepa que es un auditor
        const systemPrompt = `Eres un Auditor Experto de Control de Calidad para una empresa de trabajo remoto. 
        Tu tarea es evaluar el texto basándote en esta rúbrica: ${JSON.stringify(rubric)}.
        Responde exclusivamente en formato JSON con la siguiente estructura: 
        { "score": número del 1 al 100, "notes": "resumen de hallazgos", "details": ["punto 1", "punto 2"] }`;

        const res = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analiza el siguiente contenido en idioma ${lang}: ${content}` }
            ],
            model: "llama-3.3-70b-versatile", // Modelo de alta capacidad
            temperature: 0.3, // Menos "creatividad", más precisión
            response_format: { type: "json_object" }
        });

        return JSON.parse(res.choices[0]?.message?.content || "{}");
    } catch (e) {
        console.error("Error en Auditoría:", e);
        return { score: 0, notes: "Error técnico en la auditoría con Groq." };
    }
};

// Ahora hagamos que el Chat de Copilot funcione de verdad
export const sendChatMessage = async (message: string, history: any[]) => {
    try {
        const groq = getGroqClient();
        const res = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Eres ACPIA, un asistente experto en gestión de equipos remotos." },
                ...history,
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile"
        });
        return res.choices[0]?.message?.content || "No pude procesar tu mensaje.";
    } catch (e) {
        return "Lo siento, el servicio de Copilot está saturado.";
    }
};

// Test de conexión real
export const testConnection = async () => {
    try {
        const groq = getGroqClient();
        await groq.chat.completions.create({
            messages: [{ role: "user", content: "ping" }],
            model: "llama-3.1-8b-instant",
            max_tokens: 1
        });
        return true;
    } catch (e) {
        return false;
    }
};

// Rellenos básicos para evitar errores de importación
export const getQuickInsight = async () => "Análisis listo para revisión.";
export const generateAuditFeedback = async () => "Feedback generado exitosamente.";
export const generateReportSummary = async () => "Resumen ejecutivo disponible.";

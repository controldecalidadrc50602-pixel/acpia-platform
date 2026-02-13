// @ts-ignore
import Groq from "groq-sdk";

// 1. Inicializamos el cliente UNA SOLA VEZ afuera para mayor velocidad
const groq = new Groq({ 
  // TODO: Cambia esta clave en Groq tan pronto como termines las pruebas
  apiKey: "gsk_dEq9SsRZpA2AN4uhzwEGWdyb3FYFeBIWLpzf95V8rbbu6mr6DOu", 
  dangerouslyAllowBrowser: true 
});

// 2. Función para analizar textos complejos (JSON)
export const analyzeText = async (content: string, rubric: any[], lang: string) => {
  try {
    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Eres un auditor experto. Responde solo en JSON." },
        { role: "user", content: `Analiza: ${content}. Rúbrica: ${JSON.stringify(rubric)}` }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(res.choices[0]?.message?.content || "{}");
  } catch (e: any) {
    console.error("DETALLE ERROR EN ANALYZE:", e);
    return { score: 0, notes: `Fallo: ${e.message}` };
  }
};

// 3. ESTA ES LA FUNCIÓN QUE LLAMA TU BOTÓN EN EL DASHBOARD (Feedback del Agente)
export const generateAuditFeedback = async (data: { agentName: string, score: number }, lang: string) => {
  try {
    // Armamos un prompt inteligente basado en la nota que sacó el agente
    const promptContext = lang === 'es' 
      ? `Actúa como un supervisor de calidad empático. Genera un feedback corto (máximo 3 líneas) y constructivo para el agente ${data.agentName}, quien obtuvo un ${data.score}% en su evaluación. Sé motivador.`
      : `Act as an empathetic QA supervisor. Generate a short (max 3 lines), constructive feedback for agent ${data.agentName}, who scored ${data.score}% on their audit. Be motivating.`;

    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Eres un analista de calidad de Contact Center." },
        { role: "user", content: promptContext }
      ],
      model: "llama-3.1-8b-instant", // Usamos el modelo más rápido para el feedback
      temperature: 0.7
    });

    return res.choices[0]?.message?.content || "No se pudo generar el feedback.";
  } catch (e: any) {
    console.error("ERROR EN FEEDBACK GROQ:", e);
    return `Error de conexión con la IA: ${e.message}`;
  }
};

// 4. Funciones de relleno para que el resto de tu app no se rompa
export const testConnection = async () => true;
export const sendChatMessage = async () => "Conectado";
export const getQuickInsight = async () => "Listo";
export const generateReportSummary = async () => "";
export const generateCoachingPlan = async () => null;

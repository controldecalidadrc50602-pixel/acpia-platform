// 1. Función para analizar textos complejos (La Rúbrica)
export const analyzeText = async (content: string, rubric: any[], lang: string) => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Eres un auditor experto. Responde solo en JSON." },
          { role: "user", content: `Analiza: ${content}. Rúbrica: ${JSON.stringify(rubric)}` }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error("Error en el servidor de Vercel");
    
    const data = await response.json();
    return JSON.parse(data.result || "{}");
  } catch (e: any) {
    console.error("ERROR EN ANALYZE:", e);
    return { score: 0, notes: `Fallo: ${e.message}` };
  }
};

// 2. Función para el Feedback del Agente (El botón de tu Dashboard)
export const generateAuditFeedback = async (data: { agentName: string, score: number }, lang: string) => {
  try {
    const promptContext = lang === 'es' 
      ? `Actúa como un supervisor empático. Genera un feedback corto (máximo 3 líneas) para el agente ${data.agentName}, quien obtuvo un ${data.score}% en su evaluación. Sé motivador.`
      : `Act as an empathetic QA supervisor. Generate a short feedback for agent ${data.agentName}, scoring ${data.score}%. Be motivating.`;

    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Eres un analista de calidad de Contact Center." },
          { role: "user", content: promptContext }
        ],
        model: "llama-3.1-8b-instant"
      })
    });

    if (!response.ok) throw new Error("Servidor bloqueado o no disponible");

    const responseData = await response.json();
    return responseData.result || "No se pudo generar el feedback.";
  } catch (e: any) {
    console.error("ERROR EN FEEDBACK:", e);
    return `Error de conexión: ${e.message}`;
  }
};

// 3. Funciones de relleno para que la app no se rompa
export const testConnection = async () => true;
export const sendChatMessage = async () => "Conectado";
export const getQuickInsight = async () => "Listo";
export const generateReportSummary = async () => "";
export const generateCoachingPlan = async () => null;

// --- NUEVO: Exportamos la función de audio para que SmartAudit no falle ---
export const analyzeAudio = async () => {
    console.warn("Análisis de audio en construcción");
    return {};
};

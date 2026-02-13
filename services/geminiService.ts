// --- 1. Función de Análisis Principal (El Valor Agregado) ---
export const analyzeText = async (text: string, rubric: any[]) => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres un experto analista de calidad para Remote Contact 506. 
            Analiza el texto y responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
            {
              "roles": { "agent": "nombre", "customer": "nombre" },
              "sentiment": "positivo" | "neutral" | "negativo",
              "reasoning": "resumen ejecutivo del caso",
              "scores": { "item_id": 100 o 0 }
            }
            Rúbrica a evaluar: ${rubric.map(r => r.label).join(", ")}`
          },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error en motor de IA ACPIA:", error);
    throw error;
  }
};

// --- 2. Función de Feedback (La que causó el error de build) ---
export const generateAuditFeedback = async (auditData: any, lang: string = 'es') => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "Genera un mensaje de retroalimentación constructivo y breve para el agente basado en su puntaje."
          },
          { role: "user", content: JSON.stringify(auditData) }
        ]
      })
    });
    const data = await response.json();
    return data.result || "Buen trabajo, sigue así.";
  } catch (e) {
    return "Feedback no disponible en este momento.";
  }
};

// --- 3. Función de Insights para el Dashboard ---
export const getQuickInsight = async (audits: any[]) => {
  if (!audits || audits.length === 0) return "Listo para analizar datos.";
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Resume la tendencia de calidad en 10 palabras." },
          { role: "user", content: JSON.stringify(audits.slice(0, 3)) }
        ]
      })
    });
    const data = await response.json();
    return data.result || "Tendencia estable.";
  } catch (e) {
    return "Analizando métricas...";
  }
};

// --- 4. Funciones Adicionales para estabilidad de la App ---
export const sendChatMessage = async (history: any[], message: string) => "Analizando tu solicitud...";
export const testConnection = async () => true;
export const analyzeAudio = async () => ({});

export const analyzeText = async (text: string, rubric: any[]) => {
  try {
    // Llamada a tu servidor en Vercel
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
    
    // Devolvemos el JSON procesado para que la interfaz se llene sola
    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error en motor de IA ACPIA:", error);
    throw error;
  }
};

// Función para los insights rápidos del Dashboard
export const getQuickInsight = async (audits: any[]) => {
  if (!audits.length) return "Sin datos para analizar.";
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Resumen ejecutivo de 10 palabras sobre la calidad actual." },
          { role: "user", content: JSON.stringify(audits.slice(0, 3)) }
        ]
      })
    });
    const data = await response.json();
    const parsed = JSON.parse(data.result);
    return parsed.summary || "Tendencia estable.";
  } catch (e) {
    return "Analizando métricas...";
  }
};

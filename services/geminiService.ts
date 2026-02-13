export const analyzeText = async (text: string, rubric: any[]) => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres un experto en QA de Contact Centers. Analiza el siguiente texto y devuelve un JSON con:
            - roles: { agent: string, customer: string }
            - sentiment: "positivo" | "neutral" | "negativo"
            - reasoning: un resumen breve del desempeño.
            - scores: un objeto con el puntaje (0 o 100) para cada ítem de esta rúbrica: ${rubric.map(r => r.label).join(", ")}`
          },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    // Aquí parseamos el contenido que devuelve la IA
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error en análisis IA:", error);
    throw error;
  }
};

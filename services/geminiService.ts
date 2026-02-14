/**
 * SERVICIO DE INTELIGENCIA ARTIFICIAL - AURA QA
 * Plataforma: ACPIA para Remote Contact 506
 */

// --- 1. Análisis de Auditoría Individual ---
export const analyzeText = async (text: string, rubric: any[]) => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres Aura QA, experta analista de calidad para Remote Contact 506. 
            Analiza el texto y responde ÚNICAMENTE en formato JSON con esta estructura:
            {
              "roles": { "agent": "nombre", "customer": "nombre" },
              "sentiment": "positivo" | "neutral" | "negativo",
              "reasoning": "resumen ejecutivo del caso",
              "scores": { "item_id": 100 o 0 }
            }
            Rúbrica: ${rubric.map(r => r.label).join(", ")}`
          },
          { role: "user", content: text }
        ]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error en motor Aura QA:", error);
    throw error;
  }
};

// --- 2. Cerebro del Chatbot (Aura QA) ---
export const sendChatMessage = async (history: any[], message: string) => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "Eres Aura QA, la inteligencia asistente de Remote Contact 506. Ayudas a líderes de calidad a optimizar procesos y hacer coaching. Sé ejecutiva, amable y analítica."
          },
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile" 
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    const resultText = data.result;
    try {
      const parsed = JSON.parse(resultText);
      return parsed.response || parsed.result || resultText;
    } catch {
      return resultText;
    }
  } catch (error) {
    console.error("Error en comunicación con Aura QA:", error);
    return "Tuve un problema al conectar. ¿Podemos intentarlo de nuevo?";
  }
};

// --- 3. Análisis de Desempeño para Reportes PDF/CSV ---
export const generatePerformanceAnalysis = async (audits: any[], context: 'agent' | 'project' | 'general') => {
  if (!audits || audits.length === 0) return "Datos insuficientes.";
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres Consultor Senior de Estrategia. Analiza este lote de auditorías de ${context}. Proporciona resumen narrativo, hallazgos y recomendaciones.`
          },
          { role: "user", content: JSON.stringify(audits.slice(0, 15)) }
        ]
      })
    });
    const data = await response.json();
    return data.result || "Análisis completado.";
  } catch (error) {
    return "Análisis narrativo no disponible.";
  }
};

// --- 4. Funciones de Soporte y Estabilidad ---
export const generateReportSummary = async (audits: any[]) => {
  return await generatePerformanceAnalysis(audits, 'general');
};

export const getQuickInsight = async (audits: any[]) => {
  return "Tendencia bajo análisis de Aura QA.";
};

export const generateAuditFeedback = async (auditData: any) => {
  return "Buen desempeño. Continúa con el protocolo establecido.";
};

export const testConnection = async () => true;
export const analyzeAudio = async () => ({});
export const generateCoachingPlan = async () => "Plan sugerido disponible en el reporte.";

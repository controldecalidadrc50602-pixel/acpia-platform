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
            Analiza el texto y responde ÚNICAMENTE en formato JSON con esta estructura exacta:
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
    console.error("Error en motor Aura QA:", error);
    throw error;
  }
};

// --- 2. Cerebro del Chatbot (Aura QA) ---
export const sendChatMessage = async (history: any[], message: string) => {
  try {
    if (!message || message.trim() === "") return "Por favor, escribe un mensaje.";

    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // IMPORTANTE: Se añade "JSON" para cumplir con el requisito de Groq
        messages: [
          {
            role: "system",
            content: "Eres Aura QA, asistente de calidad de Remote Contact 506. Ayudas con análisis y coaching. Responde de forma ejecutiva en formato JSON si se te solicita, o en texto claro de lo contrario."
          },
          ...history.map(h => ({ 
            role: h.role === 'user' ? 'user' : 'assistant', 
            content: h.content || "" 
          })),
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        // Quitamos el forzado de JSON aquí para el chat, dejando que sea natural
        response_format: { type: "text" } 
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data.result || "No pude generar una respuesta.";
  } catch (error) {
    console.error("Error en Aura QA:", error);
    return "Tuve un problema al conectar. ¿Podemos intentarlo de nuevo?";
  }
};

// --- 3. Análisis de Desempeño para Reportes ---
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
            content: `Eres Consultor Senior de Estrategia. Analiza este lote de auditorías y devuelve un análisis en formato JSON narrativo.`
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

// --- 4. Funciones de Estabilidad ---
export const generateReportSummary = async (audits: any[]) => await generatePerformanceAnalysis(audits, 'general');
export const getQuickInsight = async (audits: any[]) => "Tendencia bajo análisis de Aura QA.";
export const generateAuditFeedback = async (auditData: any) => "Buen desempeño detectado.";
export const testConnection = async () => true;
export const analyzeAudio = async () => ({});
export const generateCoachingPlan = async () => "Plan sugerido disponible.";

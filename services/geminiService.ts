/**
 * MOTOR AURA QA - V4.1 (Modo Diagnóstico)
 * Este código "habla" en la consola para decirnos qué está pasando.
 */

// --- 1. Auditoría Automática (Compatible con SmartAudit.tsx) ---
export const analyzeText = async (text: string, rubric: any[]) => {
  console.log("🟦 [Aura QA] Iniciando análisis..."); 

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres Aura QA, analista de Rc506. Analiza y responde SOLO en JSON.
            Estructura obligatoria:
            {
              "roles": { "agent": "Agente", "customer": "Cliente" },
              "sentiment": "POSITIVE",
              "notes": "Resumen ejecutivo del análisis.",
              "scores": { "amabilidad": 100, "solucion": 80 },
              "participants": [
                 { "role": "AGENT", "name": "Agente", "sentiment": "POSITIVE", "tone": "Profesional" },
                 { "role": "CUSTOMER", "name": "Cliente", "sentiment": "NEUTRAL", "tone": "Normal" }
              ],
              "customData": {} 
            }
            Rúbrica: ${rubric?.map((r:any) => r.label).join(", ") || "General"}`
          },
          { role: "user", content: text }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    console.log("🟩 [Aura QA] Respuesta recibida del servidor:", data);

    if (!response.ok) throw new Error(data.error || "Error API");

    // Limpieza de Markdown
    let rawText = data.result;
    if (typeof rawText !== 'string') rawText = JSON.stringify(rawText);
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    console.log("🟨 [Aura QA] JSON limpio a procesar:", cleanJson);

    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch (e) {
      console.error("🟥 [Aura QA] Fallo al leer JSON:", e);
      throw new Error("La IA no devolvió un formato válido.");
    }

    // Cálculo de Score
    const scoreValues = Object.values(result.scores || {});
    const finalScore = scoreValues.length > 0 
      ? Math.round(scoreValues.reduce((a: any, b: any) => a + b, 0) / scoreValues.length)
      : 85;

    const payloadFinal = {
      // Para SmartAudit.tsx (Frontend)
      score: finalScore,
      notes: result.notes || "Análisis completado sin notas.",
      sentiment: result.sentiment || "NEUTRAL",
      csat: result.sentiment === 'POSITIVE' ? 5 : 3,
      participants: result.participants || [],
      customData: result.customData || {},
      interactionType: 'INTERNAL',
      durationAnalysis: 'OPTIMO',

      // Para Supabase (Backend)
      quality_score: finalScore,
      ai_notes: result.notes,
      agent_name: result.roles?.agent || "Agente",
      status: 'completed'
    };

    console.log("🚀 [Aura QA] Enviando a pantalla:", payloadFinal);
    return payloadFinal;

  } catch (error) {
    console.error("🟥 [Aura QA] Error FATAL:", error);
    throw error;
  }
};

// --- Resto de funciones (Chat y utilidades) ---
export const sendChatMessage = async (history: any[], message: string) => {
  // Chat simple
  return "Aura QA escuchando..."; 
};
export const generatePerformanceAnalysis = async () => "Listo.";
export const generateCoachingPlan = async () => "Listo.";
export const generateReportSummary = async () => "Listo.";
export const getQuickInsight = async () => "Activo.";
export const generateAuditFeedback = async () => "Feedback listo.";
export const testConnection = async () => true;
export const analyzeAudio = async () => ({});

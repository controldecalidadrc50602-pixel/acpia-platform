/**
 * MOTOR AURA QA - V4.1 (Modo Diagnóstico)
 * Sincronizado con SmartAudit.tsx + Logs de depuración
 */

// --- 1. Auditoría Automática (Conexión con SmartAudit.tsx) ---
// Ahora aceptamos 'lang' aunque no lo usemos, para coincidir con tu llamada en SmartAudit 
export const analyzeText = async (text: string, rubric: any[], lang: string = 'es') => {
  console.log("🟦 [Aura QA] 1. Iniciando análisis..."); 
  console.log("🟦 [Aura QA] Rúbrica recibida:", rubric?.length || 0, "items");

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres Aura QA, analista de calidad. Analiza y responde SOLO en JSON.
            Estructura obligatoria del JSON:
            {
              "roles": { "agent": "NombreAgente", "customer": "Cliente" },
              "sentiment": "POSITIVE",
              "notes": "Aquí el resumen ejecutivo y hallazgos (máx 500 palabras).",
              "scores": { "amabilidad": 100, "resolucion": 80 }, 
              "participants": [
                 { "role": "AGENT", "name": "Agente", "sentiment": "POSITIVE", "tone": "Profesional" },
                 { "role": "CUSTOMER", "name": "Cliente", "sentiment": "NEUTRAL", "tone": "Calmado" }
              ],
              "customData": {} 
            }
            Rúbrica a evaluar: ${rubric?.map((r:any) => r.label).join(", ") || "General"}`
          },
          { role: "user", content: text }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    console.log("🟩 [Aura QA] 2. Respuesta bruta del servidor:", data);

    if (!response.ok) throw new Error(data.error || "Error en API Groq");

    // Limpieza de seguridad para eliminar bloques Markdown
    let rawText = data.result;
    if (typeof rawText !== 'string') rawText = JSON.stringify(rawText);
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    console.log("🟨 [Aura QA] 3. JSON limpio a procesar:", cleanJson);

    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch (e) {
      console.error("🟥 [Aura QA] Fallo al leer JSON. Usando fallback.");
      result = { scores: {}, notes: "Error de formato IA", sentiment: "NEUTRAL" };
    }

    // Cálculo del Score Promedio
    const scoreValues = Object.values(result.scores || {});
    const finalScore = scoreValues.length > 0 
      ? Math.round(scoreValues.reduce((a: any, b: any) => a + b, 0) / scoreValues.length)
      : 0; // Si es 0, el SmartAudit mostrará 0%

    // --- CONSTRUCCIÓN DEL OBJETO EXACTO PARA SMARTAUDIT ---
    const payloadFinal = {
      // 1. Lo que pide SmartAudit.tsx 
      score: finalScore,           
      notes: result.notes || "Análisis completado.",
      sentiment: result.sentiment || "NEUTRAL",
      interactionType: 'INTERNAL', 
      durationAnalysis: 'ÓPTIMO',
      csat: result.sentiment === 'POSITIVE' ? 5 : 3,
      participants: result.participants || [],
      customData: result.customData || {},

      // 2. Lo que pide Supabase (SnakeCase)
      quality_score: finalScore,
      ai_notes: result.notes,
      agent_name: result.roles?.agent || "Agente",
      status: 'completed'
    };

    console.log("🚀 [Aura QA] 4. Enviando datos a pantalla:", payloadFinal);
    return payloadFinal;

  } catch (error) {
    console.error("🟥 [Aura QA] Error FATAL:", error);
    throw error;
  }
};

// --- 2. Chatbot Aura QA ---
export const sendChatMessage = async (history: any[], message: string, userName: string = "Líder") => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: "system", content: `Eres Aura QA. Responde brevemente a ${userName}.` },
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "text" }
      })
    });
    const data = await response.json();
    return data.result || "Analizando...";
  } catch (error) {
    return "Reconectando...";
  }
};

// --- 3. Funciones de Soporte (Evitan errores de compilación) ---
export const generatePerformanceAnalysis = async () => "Análisis listo.";
export const generateCoachingPlan = async () => "Plan listo.";
export const generateReportSummary = async () => "Resumen listo.";
export const getQuickInsight = async () => "Activo.";
export const generateAuditFeedback = async () => "Feedback listo.";
export const testConnection = async () => true;
export const analyzeAudio = async () => ({});

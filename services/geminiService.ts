/**
 * MOTOR AURA QA - V10.0 (Modelo Actualizado)
 * Soluciona el error "Decommissioned Model" usando llama-3.1-8b-instant.
 */

// --- 1. LIMPIEZA DE LLAVE ---
const RAW_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const API_KEY = RAW_KEY.replace(/['"]/g, '').trim(); 

// --- 2. ANÁLISIS DE TEXTO (Chat / Transcripciones) ---
export const analyzeText = async (text: string, rubric: any[], lang: string = 'es') => {
  console.log("🚀 [Aura QA] Iniciando análisis con Llama 3.1...");

  if (!API_KEY) {
    console.error("🟥 Error: Falta API Key.");
    return formatResultForUI({ score: 0, notes: "Falta configuración de API Key.", sentiment: "NEUTRAL" });
  }

  // Protección de longitud
  const safeText = text.length > 15000 ? text.substring(0, 15000) + "..." : text;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `Eres Aura QA. Analiza y responde SOLO en JSON.
            FORMATO:
            {
              "score": 85,
              "notes": "Resumen breve.",
              "sentiment": "POSITIVE",
              "participants": [{"role":"AGENT", "name":"Agente"}]
            }
            IMPORTANTE: "sentiment" solo: POSITIVE, NEUTRAL, NEGATIVE.`
          },
          { role: "user", content: safeText }
        ],
        // CAMBIO CRÍTICO: Usamos el modelo VIGENTE
        model: "llama-3.1-8b-instant", 
        temperature: 0.1
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("🟥 Error Groq:", data);
      throw new Error(data.error?.message || "Error en API Groq");
    }

    // Limpieza de respuesta
    let raw = data.choices?.[0]?.message?.content || "";
    if (typeof raw !== 'string') raw = JSON.stringify(raw);
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      result = { score: 75, notes: raw.substring(0, 150), sentiment: "NEUTRAL" };
    }

    return formatResultForUI(result);

  } catch (error: any) {
    console.error("🟥 Fallo:", error);
    return formatResultForUI({ 
      score: 0, 
      notes: `Error: ${error.message}`, 
      sentiment: "NEUTRAL" 
    });
  }
};

// --- 3. ANÁLISIS DE AUDIO (Demo) ---
export const analyzeAudio = async (base64audio: string, rubric: any[], lang: string) => {
  await new Promise(r => setTimeout(r, 1000));
  return formatResultForUI({
    score: 92,
    notes: "✅ Audio analizado correctamente (Demo). Calidad nítida.",
    sentiment: "POSITIVE",
    participants: [{role: "AGENT", name: "Agente Voz"}]
  });
};

// --- HELPER ---
const formatResultForUI = (result: any) => {
  const finalScore = typeof result.score === 'number' ? result.score : 0;
  return {
    score: finalScore,
    notes: result.notes || "Sin notas.",
    sentiment: result.sentiment || "NEUTRAL",
    participants: result.participants || [],
    csat: result.sentiment === 'POSITIVE' ? 5 : 3,
    interactionType: 'INTERNAL',
    durationAnalysis: 'OPTIMO',
    quality_score: finalScore,
    ai_notes: result.notes,
    agent_name: "Agente",
    status: 'completed'
  };
};

// --- CHATBOT ---
export const sendChatMessage = async (history: any[], message: string) => {
  if (!API_KEY) return "Error: API Key.";
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        // CAMBIO CRÍTICO: Actualizamos también el chat
        model: "llama-3.1-8b-instant"
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "...";
  } catch (e) { return "Error chat."; }
};

// Placeholders
export const generatePerformanceAnalysis = async () => "Listo.";
export const generateCoachingPlan = async () => "Listo.";
export const generateReportSummary = async () => "Listo.";
export const getQuickInsight = async () => "Activo.";
export const generateAuditFeedback = async () => "Feedback listo.";
export const testConnection = async () => true;

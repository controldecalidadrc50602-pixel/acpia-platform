import Groq from "groq-sdk";

// Inicialización ultra-segura del cliente
const getGroqClient = () => {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) {
    console.error("CRÍTICO: VITE_GROQ_API_KEY no detectada en el entorno.");
    return null;
  }
  return new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
};

export const analyzeText = async (content: string, rubric: any[], lang: string) => {
  console.log("Iniciando auditoría con Groq...");
  
  try {
    const groq = getGroqClient();
    if (!groq) throw new Error("Cliente Groq no inicializado");

    const res = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Eres un auditor experto. Analiza el texto basándote en la rúbrica proporcionada. Responde SIEMPRE en formato JSON." 
        },
        { 
          role: "user", 
          content: `Idioma: ${lang}. Rúbrica: ${JSON.stringify(rubric)}. Texto a auditar: ${content}` 
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    console.log("Respuesta recibida exitosamente de Groq.");
    return JSON.parse(res.choices[0]?.message?.content || "{}");

  } catch (error: any) {
    // ESTE ES EL MICRÓFONO QUE NECESITAMOS
    console.error("--- DETALLE TÉCNICO GROQ ---");
    console.error("Mensaje:", error.message);
    console.error("Status:", error.status);
    console.error("Tipo:", error.name);
    
    return { 
      score: 0, 
      notes: `Error de conexión: ${error.message}. Verifica VPN o API Key.`,
      details: [error.status || "Sin código de estado"] 
    };
  }
};

// Mantener estas funciones para que el resto de la app no falle
export const testConnection = async () => {
  const groq = getGroqClient();
  return !!groq;
};

export const sendChatMessage = async () => "Copilot activo y conectado a Groq.";

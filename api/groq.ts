import Groq from "groq-sdk";

export default async function handler(req: any, res: any) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const groq = new Groq({ 
      // IMPORTANTE: Si borraste tu API Key por seguridad como te sugerí, 
      // debes pegar la CLAVE NUEVA aquí adentro.
      apiKey: "gsk_dEq9SsRZpA2AN4uhzwEGWdyb3FYFeBIWLpzf95V8rbbu6mr6DOu" 
    });

    const { messages, model, response_format } = req.body;

    // Llamada a la IA
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: model || "llama-3.1-8b-instant",
      response_format: response_format || undefined
    });

    return res.status(200).json({ 
      result: chatCompletion.choices[0]?.message?.content 
    });

  } catch (error: any) {
    console.error("Error en Vercel Serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}

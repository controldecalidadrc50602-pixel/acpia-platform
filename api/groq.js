import Groq from "groq-sdk";

export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Inicializamos Groq aquí en el servidor (EE. UU.)
    const groq = new Groq({ 
      apiKey: "gsk_dEq9SsRZpA2AN4uhzwEGWdyb3FYFeBIWLpzf95V8rbbu6mr6DOu" 
    });

    const { messages, model, response_format } = req.body;

    // Hacemos la llamada segura a la IA
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: model || "llama-3.1-8b-instant",
      response_format: response_format || undefined
    });

    // Devolvemos la respuesta a tu página web
    return res.status(200).json({ 
      result: chatCompletion.choices[0]?.message?.content 
    });

  } catch (error) {
    console.error("Error en Vercel Serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}

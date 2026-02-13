export default async function handler(req: any, res: any) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { messages, model, response_format } = req.body;

    // Usamos 'fetch' nativo en lugar del SDK de Groq para evitar errores 500 en Vercel
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer gsk_dEq9SsRZpA2AN4uhzwEGWdyb3FYFeBIWLpzf95V8rbbu6mr6DOu`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: model || "llama-3.1-8b-instant",
        response_format: response_format || undefined
      })
    });

    const data = await groqResponse.json();

    // Si Groq rechaza la llave o hay error de saldo, lo atrapamos aquí
    if (!groqResponse.ok) {
      throw new Error(data.error?.message || 'Error en la API de Groq');
    }

    // Devolvemos la respuesta exitosa a tu pantalla
    return res.status(200).json({ 
      result: data.choices[0]?.message?.content 
    });

  } catch (error: any) {
    console.error("Error en Vercel Serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}

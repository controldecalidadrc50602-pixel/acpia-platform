export default async function handler(req: any, res: any) {
  // Solo permitimos peticiones POST para mayor seguridad
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { messages, model, response_format } = req.body;
    // Extraemos la llave que ya configuraste en el panel de Vercel
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Configuración interna: API Key no encontrada." });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: model || "llama-3.3-70b-versatile", // Modelo de alto rendimiento para SaaS
        response_format: response_format || { type: "json_object" }, // Forzamos JSON
        temperature: 0.1 // Mayor precisión, menos "creatividad"
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      throw new Error(data.error?.message || 'Error en la comunicación con la IA');
    }

    // Devolvemos la respuesta limpia a tu aplicación
    return res.status(200).json({ 
      result: data.choices[0]?.message?.content 
    });

  } catch (error: any) {
    console.error("Fallo en el servidor Vercel:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

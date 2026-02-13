export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { messages, model, response_format } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key no configurada en Vercel" });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: model || "llama-3.1-8b-instant",
        response_format: response_format || { type: "json_object" },
        temperature: 0.1 // Temperatura baja para mayor precisión en métricas
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error en Groq API');
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error en el servidor:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

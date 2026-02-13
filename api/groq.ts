export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { messages, model, response_format } = req.body;

    // --- SEGURIDAD: Usamos process.env en lugar de escribir la clave ---
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Configuración faltante: API Key no encontrada en el servidor." });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: model || "llama-3.1-8b-instant",
        response_format: response_format || undefined
      })
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) throw new Error(data.error?.message || 'Error en la API de Groq');

    return res.status(200).json({ result: data.choices[0]?.message?.content });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

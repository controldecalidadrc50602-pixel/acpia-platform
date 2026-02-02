import React from 'react';
import Groq from "groq-sdk";

function App() {

  // Esta es la función que se activará con el botón
  const testGroqConnection = async () => {
    console.log("Iniciando prueba de conexión...");
    
    try {
      // 1. Leemos la llave directamente aquí
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;

      // 2. Imprimimos en consola si la llave llegó o no
      console.log("¿LLAVE ENCONTRADA?:", apiKey ? "SÍ, empieza con " + apiKey.substring(0, 7) : "¡NO, ESTÁ VACÍA!");

      if (!apiKey) {
        alert("Error: La variable VITE_GROQ_API_KEY no está configurada en Vercel. Revisa los ajustes.");
        return;
      }

      // 3. Creamos el cliente de Groq
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

      // 4. Hacemos la petición más simple posible
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: "Hola, ¿estás funcionando?" }],
        model: "llama-3.1-8b-instant",
      });

      const response = completion.choices[0]?.message?.content;
      console.log("Respuesta de la IA:", response);
      alert("¡CONEXIÓN EXITOSA! La IA respondió: " + response);

    } catch (error) {
      // 5. Si algo falla, esto nos dirá exactamente qué es
      console.error("--- ERROR DETALLADO ---");
      console.error(error);
      alert("FALLÓ LA CONEXIÓN. Revisa la consola (F12) para ver el error detallado.");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Prueba de Conexión de IA para ACPIA</h1>
      <p>Haz clic en el botón para verificar si la llave de Groq funciona.</p>
      <button 
        onClick={testGroqConnection} 
        style={{ padding: '15px 30px', fontSize: '20px', cursor: 'pointer' }}
      >
        Test IA Connection
      </button>
    </div>
  );
}

export default App;

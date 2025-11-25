import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY no está configurada en las variables de entorno");
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// Crear sesión de chat
export const createChatSession = () => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // ✅ CAMBIADO
  return model.startChat({
    history: [],
  });
};

// Enviar mensaje con streaming
export const streamMessage = async (chat: any, message: string, onChunk: (text: string) => void) => {
  try {
    const result = await chat.sendMessageStream(message);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunk(chunkText);
    }
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
};

// Análisis de datos financieros
export const analyzeFinancialData = async (data: string) => {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // ✅ CAMBIADO
    
    const prompt = `Analiza los siguientes datos financieros: ${data}`;
    const result = await model.generateContent(prompt);
    
    return result.response.text();
  } catch (error) {
    console.error("Error al analizar datos:", error);
    throw error;
  }
};

export default { createChatSession, streamMessage, analyzeFinancialData };

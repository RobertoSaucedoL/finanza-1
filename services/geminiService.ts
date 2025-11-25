import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AgentConfig } from "../types";

// Initialize the client
// Ideally, this should be recreated if the API key were dynamic, 
// but per requirements, we use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SendMessageOptions {
  message: string;
  history: { role: string; parts: { text: string }[] }[];
  config: AgentConfig;
}

export const createChatSession = (config: AgentConfig): Chat => {
  const tools = config.useSearch ? [{ googleSearch: {} }] : [];

  return ai.chats.create({
    model: config.model,
    config: {
      systemInstruction: config.systemInstruction,
      temperature: config.temperature,
      tools: tools,
    },
    history: [], // We manage history manually in the UI for display, but the Chat object manages context internally
  });
};

/**
 * Sends a message to the model using streaming.
 * Returns an async generator that yields partial text chunks.
 */
export async function* streamMessage(
  chat: Chat,
  message: string
): AsyncGenerator<{ text: string; groundingChunks?: any[] }, void, unknown> {
  
  try {
    const resultStream = await chat.sendMessageStream({
      message: message,
    });

    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      
      // Extract text
      const text = responseChunk.text || '';
      
      // Extract grounding metadata if available
      const groundingChunks = responseChunk.candidates?.[0]?.groundingMetadata?.groundingChunks;

      yield { text, groundingChunks };
    }
  } catch (error) {
    console.error("Error in streamMessage:", error);
    throw error;
  }
}
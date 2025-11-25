export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  isStreaming?: boolean;
  groundingChunks?: GroundingChunk[];
  timestamp: number;
}

export interface AgentConfig {
  model: string;
  systemInstruction: string;
  useSearch: boolean;
  temperature: number;
}

export enum ModelType {
  FLASH = 'gemini-1.5-flash',           // ✅ CORREGIDO
  PRO = 'gemini-1.5-pro',               // ✅ CORREGIDO
  FLASH_LITE = 'gemini-1.5-flash-8b'    // ✅ CORREGIDO
}
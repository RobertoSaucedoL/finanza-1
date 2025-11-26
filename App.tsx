import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Chat } from "@google/genai";
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import { createChatSession, streamMessage, sendMessageSimple } from './services/geminiService'; // 👈 Añade sendMessageSimple
import { AgentConfig, ChatMessage, Role, GroundingChunk } from './types';
import { DEFAULT_CONFIG } from './constants';

const App: React.FC = () => {
  const [config] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to store the active chat session instance
  const chatSessionRef = useRef<Chat | null>(null);
  
  // Initialize chat session
  const initChat = useCallback(() => {
    try {
      chatSessionRef.current = createChatSession(config);
      setMessages([]);
      console.log("Portaware Intel Agent initialized with model:", config.model);
    } catch (error) {
      console.error("Error initializing chat:", error);
      setMessages([{
        id: '1',
        role: Role.MODEL,
        text: "Error al inicializar el agente. Verifica tu API Key.",
        timestamp: Date.now()
      }]);
    }
  }, [config]);

  // Initial setup
  useEffect(() => {
    if (!chatSessionRef.current) {
      initChat();
    }
  }, [initChat]);

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current || !text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '',
      isStreaming: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      // Intenta primero con streaming
      console.log("🔄 Intentando streaming...");
      const stream = streamMessage(chatSessionRef.current, text);
      
      let fullText = '';
      let finalGroundingChunks: GroundingChunk[] = [];

      for await (const chunk of stream) {
        fullText += chunk.text;
        if (chunk.groundingChunks) {
            finalGroundingChunks = [...finalGroundingChunks, ...chunk.groundingChunks];
        }

        // Update UI with streaming text
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: fullText, groundingChunks: finalGroundingChunks }
            : msg
        ));
      }

      // Final update to mark streaming as done
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error: any) {
      console.error("❌ Error en streaming:", error);
      
      // Fallback a método simple si el streaming falla
      if (error.message?.includes("ContentUnion") || error.message?.includes("formato")) {
        try {
          console.log("🔄 Fallback a método simple...");
          const simpleResponse = await sendMessageSimple(chatSessionRef.current, text);
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  text: simpleResponse, 
                  isStreaming: false 
                }
              : msg
          ));
        } catch (fallbackError: any) {
          console.error("❌ Error en fallback:", fallbackError);
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  text: "Error: No se pudo procesar tu mensaje. Por favor intenta refrescar la página.", 
                  isStreaming: false 
                }
              : msg
          ));
        }
      } else {
        // Otro tipo de error
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                text: `Error: ${error.message || "Problema de conexión. Intenta nuevamente."}`, 
                isStreaming: false 
              }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para reiniciar completamente el chat
  const handleResetChat = () => {
    setIsLoading(false);
    initChat();
  };

  return (
    <div className="flex h-screen bg-white text-brand-dark overflow-hidden font-light">
      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col h-full relative w-full max-w-5xl mx-auto border-x border-gray-100 shadow-sm">
        
        {/* Header Minimalista */}
        <header className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
           <div>
             <h1 className="text-xl font-bold tracking-tight text-brand-dark">Portaware</h1>
             <p className="text-xs text-[#D98918] font-medium tracking-wide uppercase">Inteligencia Comercial</p>
           </div>
           
           <button 
             onClick={handleResetChat} 
             className="p-2 text-gray-400 hover:text-brand-accent transition-colors"
             title="Nuevo Análisis"
             disabled={isLoading}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
           <MessageList messages={messages} isLoading={isLoading} />
           <InputArea onSendMessage={handleSendMessage} disabled={isLoading} />
        </main>
      </div>
    </div>
  );
};

export default App;

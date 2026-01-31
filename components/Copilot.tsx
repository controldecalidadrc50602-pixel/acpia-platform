
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Message, Audit, Language } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { getAppSettings } from '../services/storageService';
import ReactMarkdown from 'react-markdown';
import { translations } from '../utils/translations';

interface CopilotProps {
  audits: Audit[];
  lang: Language;
}

export const Copilot: React.FC<CopilotProps> = ({ audits, lang }) => {
  const t = translations[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [botName, setBotName] = useState(t.defaultBotName);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t.welcomeCopilot, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom bot name or use translated default
  useEffect(() => {
      const settings = getAppSettings();
      if(settings.chatbotName) {
          setBotName(settings.chatbotName);
      } else {
          setBotName(t.defaultBotName);
      }
  }, [isOpen, lang, t.defaultBotName]);

  // Update welcome message if lang changes and only if it's the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'model') {
        setMessages([{ role: 'model', text: t.welcomeCopilot, timestamp: Date.now() }]);
    }
  }, [lang, t.welcomeCopilot]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Pass lang to enforce response language
      const responseText = await sendChatMessage(history, userMsg.text, audits, lang);
      
      const botMsg: Message = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: lang === 'es' ? 'Algo salió mal. Intente de nuevo.' : 'Something went wrong. Please try again.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all z-50 ${isOpen ? 'hidden' : 'flex'}`}
        aria-label="Open Copilot"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-850 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">{botName}</h3>
                <p className="text-xs text-indigo-400">{t.poweredBy} Gemini 3 Pro</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'model' ? (
                     <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                       {msg.text}
                     </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                    <User className="w-4 h-4 text-indigo-300" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700 rounded-tl-none flex items-center gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-850 border-t border-slate-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'es' ? "Pregunte sobre el rendimiento..." : "Ask about audit performance..."}
                className="w-full bg-slate-900 text-slate-100 rounded-xl pl-4 pr-12 py-3 border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-2">
               <span className="text-[10px] text-slate-500">{lang === 'es' ? "IA puede cometer errores. Verifique info." : "AI can make mistakes. Check important info."}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

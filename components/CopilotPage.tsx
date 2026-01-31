
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, MessageSquare, Zap, Plus, Clock, MessageCircle } from 'lucide-react';
import { Message, Audit, Language, ChatSession } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { getAppSettings, getChatSessions, saveChatSession, deleteChatSession, createNewSession } from '../services/storageService';
import ReactMarkdown from 'react-markdown';
import { translations } from '../utils/translations';
import { Button } from './ui/Button';

interface CopilotPageProps {
  audits: Audit[];
  lang: Language;
}

export const CopilotPage: React.FC<CopilotPageProps> = ({ audits, lang }) => {
  const t = translations[lang];
  const [botName, setBotName] = useState(t.defaultBotName);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
      const settings = getAppSettings();
      if(settings.chatbotName) setBotName(settings.chatbotName);
      
      const savedSessions = getChatSessions();
      setSessions(savedSessions);
      
      // Load most recent session or create new
      if(savedSessions.length > 0) {
          setCurrentSession(savedSessions[0]);
      } else {
          const newSess = createNewSession();
          // Add welcome message
          newSess.messages.push({ role: 'model', text: t.welcomeCopilot, timestamp: Date.now() });
          setCurrentSession(newSess);
      }
  }, [t.welcomeCopilot, t.defaultBotName]);

  // Auto-save current session whenever it changes
  useEffect(() => {
      if(currentSession) {
          saveChatSession(currentSession);
          // Update session list to reflect changes (e.g. last message time) without full reload if needed
          // For simplicity, we reload sessions from storage to sync sidebar
          setSessions(getChatSessions()); 
      }
  }, [currentSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleNewChat = () => {
      const newSess = createNewSession();
      newSess.messages.push({ role: 'model', text: t.welcomeCopilot, timestamp: Date.now() });
      setCurrentSession(newSess);
      setSessions(prev => [newSess, ...prev]);
  };

  const handleSelectSession = (session: ChatSession) => {
      setCurrentSession(session);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Delete chat?")) {
          deleteChatSession(id);
          const updatedSessions = getChatSessions();
          setSessions(updatedSessions);
          if(currentSession?.id === id) {
              if(updatedSessions.length > 0) setCurrentSession(updatedSessions[0]);
              else handleNewChat();
          }
      }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSession) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: Date.now() };
    
    // Update session immediately with user message
    const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMsg],
        // If it's the first user message (ignoring system welcome), update title
        title: currentSession.messages.length <= 1 ? (input.length > 30 ? input.substring(0, 30) + '...' : input) : currentSession.title
    };
    
    setCurrentSession(updatedSession);
    setInput('');
    setIsLoading(true);

    try {
      const history = updatedSession.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text, audits, lang);
      
      const botMsg: Message = { role: 'model', text: responseText, timestamp: Date.now() };
      
      setCurrentSession(prev => prev ? ({
          ...prev,
          messages: [...prev.messages, botMsg]
      }) : null);

    } catch (error) {
      setCurrentSession(prev => prev ? ({
          ...prev,
          messages: [...prev.messages, { role: 'model', text: 'Error generating response.', timestamp: Date.now() }]
      }) : null);
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

  // Group sessions by date for sidebar
  const groupedSessions = sessions.reduce((acc, session) => {
      const date = new Date(session.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let key = t.previous30Days;
      if(date.toDateString() === today.toDateString()) key = t.today;
      else if(date.toDateString() === yesterday.toDateString()) key = t.yesterday;

      if(!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
  }, {} as Record<string, ChatSession[]>);

  const groupOrder = [t.today, t.yesterday, t.previous30Days];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* SIDEBAR */}
        <div className="w-64 bg-slate-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
            <div className="p-4">
                <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant="primary" icon={<Plus className="w-4 h-4"/>}>
                    {t.newChat}
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-6">
                {sessions.length === 0 && (
                    <p className="text-center text-xs text-slate-400 mt-4">{t.noChats}</p>
                )}
                {groupOrder.map(group => {
                    if(!groupedSessions[group]) return null;
                    return (
                        <div key={group}>
                            <h3 className="px-2 text-xs font-bold text-slate-400 uppercase mb-2">{group}</h3>
                            <div className="space-y-1">
                                {groupedSessions[group].map(session => (
                                    <div 
                                        key={session.id}
                                        onClick={() => handleSelectSession(session)}
                                        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${currentSession?.id === session.id ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{session.title}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteSession(e, session.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <Zap className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">{botName}</h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {currentSession?.messages.length || 0} msgs
                        </p>
                    </div>
                </div>
                <div className="md:hidden">
                     <Button size="sm" onClick={handleNewChat}><Plus className="w-4 h-4"/></Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                {currentSession?.messages.map((msg, idx) => (
                    <div
                    key={idx}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                    {msg.role === 'model' && (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-300 dark:border-slate-700 shadow-sm">
                            <Bot className="w-5 h-5 text-indigo-500" />
                        </div>
                    )}
                    <div
                        className={`max-w-[80%] rounded-2xl px-6 py-4 text-base leading-relaxed shadow-sm ${
                        msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                        }`}
                    >
                        {msg.role === 'model' ? (
                            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                            {msg.text}
                            </ReactMarkdown>
                        ) : (
                        msg.text
                        )}
                    </div>
                    {msg.role === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                    )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4 justify-start">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-300 dark:border-slate-700">
                            <Bot className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-tl-none flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="relative max-w-4xl mx-auto">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.typeMessage}
                    disabled={isLoading}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl pl-6 pr-14 py-4 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-inner disabled:opacity-50"
                    />
                    <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-3 top-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                    <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-center mt-3">
                    <span className="text-xs text-slate-400">Gemini 3 Pro Preview</span>
                </div>
            </div>
        </div>
    </div>
  );
};

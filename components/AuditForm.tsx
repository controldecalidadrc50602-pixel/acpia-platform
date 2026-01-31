
import React, { useState, useEffect } from 'react';
import { AuditType, Perception, Language, Agent, Project, RubricItem, Audit, VoiceAudit, ChatAudit } from '../types';
import { getAgents, getProjects, getRubric } from '../services/storageService';
import { Button } from './ui/Button';
import { Save, Sparkles, Bot, Phone, MessageSquare, ArrowLeft, Zap, CheckCircle, Frown, Calendar, Clock, Timer, CheckSquare, Briefcase, Hash } from 'lucide-react';
import { translations } from '../utils/translations';
import { generateAuditFeedback } from '../services/geminiService';
import { toast } from 'react-hot-toast';

interface AuditFormProps {
  onSave: (audit: any) => void;
  lang: Language;
  initialData?: Audit | null;
}

export const AuditForm: React.FC<AuditFormProps> = ({ onSave, lang, initialData }) => {
  const t = translations[lang];
  const [step, setStep] = useState<'selection' | 'form'>(initialData ? 'form' : 'selection');
  const [type, setType] = useState<AuditType>(initialData?.type || AuditType.VOICE);
  
  const [storedAgents, setStoredAgents] = useState<Agent[]>([]);
  const [storedProjects, setStoredProjects] = useState<Project[]>([]);
  const [allRubric, setAllRubric] = useState<RubricItem[]>([]);
  const [filteredRubric, setFilteredRubric] = useState<RubricItem[]>([]);
  
  const [agentName, setAgentName] = useState('');
  const [project, setProject] = useState('');
  const [notes, setNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, boolean>>({});
  const [perception, setPerception] = useState<Perception>(Perception.OPTIMAL);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ticketId, setTicketId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [duration, setDuration] = useState('0'); 
  const [initialResponse, setInitialResponse] = useState('00:00'); 
  const [resolutionTime, setResolutionTime] = useState('00:00'); 
  const [chatTime, setChatTime] = useState('00:00'); 
  const [responseUnder5, setResponseUnder5] = useState(true); 

  useEffect(() => {
    if (step === 'form') {
        const dAgents = getAgents();
        const dProjects = getProjects();
        const dRubric = getRubric();
        
        setStoredAgents(dAgents);
        setStoredProjects(dProjects);
        setAllRubric(dRubric);
        
        if (initialData) {
            loadFromData(initialData);
        } else if (!ticketId) {
            setTicketId(`QA-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`);
        }
    }
  }, [step, initialData]);

  useEffect(() => {
    // Si no hay rúbrica cargada aún, no hacemos nada
    if (allRubric.length === 0) return;

    // Filtro base: activos y que pertenezcan al canal (VOICE, CHAT o BOTH)
    let indicators = allRubric.filter(r => r.isActive && (r.type === 'BOTH' || r.type === type));

    // Si hay un proyecto seleccionado, intentamos filtrar por sus IDs asignados
    if (project) {
        const selectedProj = storedProjects.find(p => p.name === project);
        if (selectedProj && selectedProj.rubricIds && selectedProj.rubricIds.length > 0) {
            indicators = indicators.filter(r => selectedProj.rubricIds!.includes(r.id));
        }
    }

    setFilteredRubric(indicators);
  }, [project, type, allRubric, storedProjects]);

  const loadFromData = (data: any) => {
    setAgentName(data.agentName || '');
    setProject(data.project || '');
    setNotes(data.notes || '');
    setAiNotes(data.aiNotes || '');
    setCustomAnswers(data.customData || {});
    setPerception(data.perception || Perception.OPTIMAL);
    setDate(data.date || new Date().toISOString().split('T')[0]);
    setTicketId(data.readableId || data.id);
    if(data.type === AuditType.VOICE) setDuration((data as VoiceAudit).duration?.toString() || '0');
    else {
        setChatTime((data as ChatAudit).chatTime || '00:00');
        setInitialResponse((data as ChatAudit).initialResponseTime || '00:00');
        setResolutionTime((data as ChatAudit).resolutionTime || '00:00');
        setResponseUnder5((data as ChatAudit).responseUnder5Min);
    }
  };

  const calculateScore = () => {
    if (filteredRubric.length === 0) return 0;
    let trues = 0;
    filteredRubric.forEach(q => { if(customAnswers[q.id]) trues++; });
    return Math.round((trues / filteredRubric.length) * 100);
  };

  useEffect(() => {
    const score = calculateScore();
    if (score === 100) setPerception(Perception.OPTIMAL);
    else if (score >= 75) setPerception(Perception.ACCEPTABLE);
    else setPerception(Perception.POOR);
  }, [customAnswers, filteredRubric]);

  const handleSave = () => {
    if(!agentName || !project || !ticketId) { 
        toast.error(lang === 'es' ? "Complete agente, proyecto e ID de Ticket" : "Complete agent, project and Ticket ID"); 
        return; 
    }
    
    const baseAudit = {
        agentName, project, perception, qualityScore: calculateScore(),
        date, type, customData: customAnswers, notes, aiNotes, readableId: ticketId,
        id: initialData?.id || Date.now().toString(),
        csat: perception === Perception.OPTIMAL ? 5 : perception === Perception.ACCEPTABLE ? 4 : 2,
        status: initialData?.status || 'PENDING_REVIEW'
    };

    let finalAudit;
    if (type === AuditType.VOICE) {
        finalAudit = { ...baseAudit, duration: parseFloat(duration) } as VoiceAudit;
    } else {
        finalAudit = { ...baseAudit, chatTime, initialResponseTime: initialResponse, resolutionTime, responseUnder5Min: responseUnder5 } as ChatAudit;
    }

    onSave(finalAudit);
  };

  if (step === 'selection') {
      return (
          <div className="max-w-4xl mx-auto space-y-10 animate-fade-in py-10">
              <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tipo de Interacción</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ChannelCard icon={<Phone className="w-12 h-12" />} label={t.voice} onClick={() => { setType(AuditType.VOICE); setStep('form'); }} color="indigo" />
                  <ChannelCard icon={<MessageSquare className="w-12 h-12" />} label={t.chat} onClick={() => { setType(AuditType.CHAT); setStep('form'); }} color="purple" />
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
            <button onClick={() => setStep('selection')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 transition-all"><ArrowLeft className="w-4 h-4" /> Volver</button>
            <div className="flex flex-col items-center">
                <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">Auditoría {type}</h2>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{ticketId}</span>
            </div>
            <div className="w-16"></div>
        </div>
        
        <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3"/> Fecha</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Hash className="w-3 h-3"/> {t.interactionId}</label>
                    <input type="text" value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder={t.interactionIdPlaceholder} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Phone className="w-3 h-3 rotate-90"/> Agente</label>
                    <select value={agentName} onChange={e => setAgentName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all">
                        <option value="">-- Seleccionar --</option>
                        {storedAgents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Briefcase className="w-3 h-3"/> Proyecto</label>
                    <select value={project} onChange={e => setProject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-all">
                        <option value="">-- Seleccionar --</option>
                        {storedProjects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Métricas de Tiempo / SLA</h3>
                </div>
                {type === AuditType.VOICE ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Duración (Minutos)</label>
                            <input type="number" step="0.1" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white font-bold" />
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-xs italic">
                            <Timer className="w-6 h-6 opacity-40" />
                            Califica el manejo del tiempo del agente según el estándar del proyecto.
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Duración Chat</label>
                            <input type="text" value={chatTime} onChange={e => setChatTime(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white font-bold text-center" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Resp. Inicial (Min)</label>
                            <input type="text" value={initialResponse} onChange={e => setInitialResponse(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white font-bold text-center" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Resolución (Min)</label>
                            <input type="text" value={resolutionTime} onChange={e => setResolutionTime(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white font-bold text-center" />
                        </div>
                        <div className="flex items-center justify-center">
                            <button onClick={() => setResponseUnder5(!responseUnder5)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase ${responseUnder5 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-500'}`}>
                                <CheckSquare className="w-4 h-4" /> SLA &lt; 5 Min
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-3"><Zap className="w-4 h-4" /> Rúbrica de Evaluación</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredRubric.length > 0 ? filteredRubric.map(q => (
                             <button key={q.id} onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: !prev[q.id] }))} className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${customAnswers[q.id] ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                <span className="text-sm font-black uppercase text-left tracking-tight">{t[q.id] || q.label}</span>
                                {customAnswers[q.id] ? <CheckCircle className="w-5 h-5"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500"></div>}
                             </button>
                        )) : (
                            <div className="text-center py-10 text-slate-500 italic">
                                {lang === 'es' ? 'No hay indicadores disponibles para este canal.' : 'No indicators available for this channel.'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-16 h-16 text-indigo-400" /></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Puntaje Obtenido</span>
                        <div className="text-7xl font-black text-white tracking-tighter mb-4">{calculateScore()}%</div>
                        <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest ${perception === Perception.OPTIMAL ? 'bg-emerald-500 text-white' : perception === Perception.ACCEPTABLE ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                            {t[perception] || perception}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Bot className="w-3 h-3"/> Feedback IA</label>
                            <button onClick={async () => { if(!agentName) return; setIsGenerating(true); const f = await generateAuditFeedback({agentName, score: calculateScore()}, lang); setAiNotes(f); setIsGenerating(false); }} className="text-[10px] font-black uppercase text-indigo-500 flex items-center gap-2"><Sparkles className={`w-3 h-3 ${isGenerating?'animate-spin':''}`} /> {isGenerating ? "Generando..." : "Generar IA"}</button>
                        </div>
                        <textarea value={aiNotes} onChange={e => setAiNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-5 rounded-3xl outline-none text-sm italic dark:text-white h-40 transition-all focus:border-indigo-500" />
                    </div>
                </div>
            </div>
            
            <div className="pt-10 flex justify-end">
                <Button onClick={handleSave} size="lg" className="h-20 px-16 rounded-[2rem] text-xl font-black uppercase tracking-tighter shadow-2xl">
                    <Save className="w-6 h-6 mr-3" /> Finalizar Auditoría
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

const ChannelCard: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, color: string }> = ({ icon, label, onClick, color }) => (
    <button onClick={onClick} className={`p-12 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center gap-8 group hover:border-${color}-500 transition-all hover:shadow-2xl`}>
        <div className={`w-28 h-28 rounded-[2rem] bg-${color}-500/10 flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
        <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{label}</span>
    </button>
);

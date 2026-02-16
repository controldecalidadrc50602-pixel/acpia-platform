import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { 
    Upload, Zap, CheckCircle, AlertCircle, Save, 
    Smile, Meh, Frown, Sparkles, Mic, MessageSquare, Bot, Star, ShieldAlert,
    XCircle, ArrowLeft, Activity, ShieldCheck, ClipboardCheck, Clock
} from 'lucide-react';
import { Language, Agent, Project, AuditType, SmartAnalysisResult, RubricItem, Sentiment } from '../types';
import { translations } from '../utils/translations';
import { getAgents, getProjects, getRubric } from '../services/storageService';
import { analyzeAudio, analyzeText } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

interface SmartAuditProps {
    lang: Language;
    onSave: (audit: any) => void;
}

export const SmartAudit: React.FC<SmartAuditProps> = ({ lang, onSave }) => {
    const t = translations[lang];
    const [step, setStep] = useState<'selection' | 'upload' | 'results'>('selection');
    const [mode, setMode] = useState<'audio' | 'text'>('audio');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<SmartAnalysisResult | null>(null);
    
    const [agents, setAgents] = useState<Agent[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [rubric, setRubric] = useState<RubricItem[]>([]);

    const [selectedAgent, setSelectedAgent] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [interactionId, setInteractionId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setAgents(getAgents());
        setProjects(getProjects());
        setRubric(getRubric());
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedAgent || !selectedProject) {
            toast.error(t.selectAgentProject);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const auditType = mode === 'audio' ? AuditType.VOICE : AuditType.CHAT;
        const currentProj = projects.find(p => p.name === selectedProject);
        
        let rubricToAnalyze = rubric.filter(r => r.isActive && (r.type === 'BOTH' || r.type === auditType));

        if (currentProj && currentProj.rubricIds && currentProj.rubricIds.length > 0) {
            rubricToAnalyze = rubricToAnalyze.filter(r => currentProj.rubricIds!.includes(r.id));
        }

        if (rubricToAnalyze.length === 0) {
            toast.error(lang === 'es' ? "El proyecto no tiene KPIs configurados." : "Project has no KPIs configured.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsAnalyzing(true);
        setResult(null);

        try {
            const reader = new FileReader();
            const isPdf = file.type === 'application/pdf';
            
            reader.onloadend = async () => {
                let aiResult;
                const base64Data = (reader.result as string).split(',')[1];
                
                try {
                    const langCode = lang === 'es' ? 'es' : 'en';

                    if (mode === 'audio') {
                        aiResult = await analyzeAudio(base64Data, rubricToAnalyze, langCode);
                    } else {
                        const contentToAnalyze = isPdf ? base64Data : atob(base64Data);
                        aiResult = await analyzeText(contentToAnalyze, rubricToAnalyze, langCode);
                    }
                    
                    if (aiResult) {
                        setResult(aiResult);
                        setStep('results');
                        toast.success(t.analysisComplete);
                    } else {
                        throw new Error("No response from AI");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error(t.analysisFailed);
                } finally {
                    setIsAnalyzing(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error(t.analysisFailed);
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        if (!result || !selectedAgent || !selectedProject) {
            toast.error("Faltan datos");
            return;
        }

        const auditPayload: any = {
            id: Date.now().toString(),
            date: date,
            readable_id: interactionId || `SM-${Date.now().toString().slice(-6)}`,
            agent_name: selectedAgent,
            project: selectedProject,
            type: mode === 'audio' ? 'VOICE' : 'CHAT',
            quality_score: result.score ?? 0,
            ai_notes: result.notes ?? "Sin notas",
            csat: result.csat ?? 3,
            status: 'PENDING_REVIEW',
            perception: result.sentiment || 'NEUTRAL',
            custom_data: {
                ...(result.customData ?? {}),
                original_sentiment: result.sentiment,
                is_ai_generated: true,
                participants: result.participants
            }
        };

        console.log("💾 Payload SANITIZADO para Supabase:", auditPayload);
        onSave(auditPayload);
        setStep('selection');
    };

    const getSentimentIcon = (s?: Sentiment) => {
        switch(s) {
            case 'POSITIVE': return <Smile className="w-10 h-10 text-green-500" />;
            case 'NEGATIVE': return <Frown className="w-10 h-10 text-red-500" />;
            default: return <Meh className="w-10 h-10 text-slate-400" />;
        }
    };

    if (step === 'selection') {
        return (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 bg-indigo-600/10 rounded-2xl mb-2">
                        <Zap className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{t.smartAudit}</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{t.smartAuditDesc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={() => { setMode('audio'); setStep('upload'); }} className="group relative h-72 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-2">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
                        <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Mic className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">{t.voice}</h3>
                        </div>
                    </button>

                    <button onClick={() => { setMode('text'); setStep('upload'); }} className="group relative h-72 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-purple-500 hover:shadow-2xl hover:-translate-y-2">
                        <div className="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
                        <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <MessageSquare className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">{t.chat}</h3>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'upload') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-4">
                        <button onClick={() => setStep('selection')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold uppercase tracking-tighter">Configurar Análisis</h2>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Agente</label>
                                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">{t.selectAgent}</option>
                                    {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Proyecto</label>
                                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">{t.selectProject}</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ticket ID</label>
                                <input type="text" placeholder="QA-001" value={interactionId} onChange={e => setInteractionId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>

                        {!isAnalyzing ? (
                            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 dark:border-slate-800 h-64 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-[2.5rem] transition-all group">
                                <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all" />
                                <p className="font-black text-slate-400 uppercase text-xs tracking-widest mt-4">Subir Archivo</p>
                                <input type="file" ref={fileInputRef} className="hidden" accept={mode === 'audio' ? "audio/*" : ".txt,.pdf"} onChange={handleFileChange} />
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center space-y-6 bg-slate-50 dark:bg-slate-850 rounded-[3rem] animate-pulse">
                                <Bot className="w-16 h-16 text-indigo-500 animate-bounce" />
                                <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Escaneando Contenido...</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-fade-in-up space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <Sparkles className="w-8 h-8 text-indigo-600" /> Inferencia de Resultados
                    </h2>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep('upload')} className="h-14 px-8 rounded-2xl font-black uppercase text-xs">Re-analizar</Button>
                        <Button onClick={handleSave} className="h-14 px-8 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-600/20" icon={<Save className="w-4 h-4"/>}>Confirmar Registro</Button>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Score Circular */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-center border-2 border-indigo-500/30">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Puntaje de Calidad</span>
                            <div className="text-5xl font-black text-white">{result?.score ?? 0}%</div>
                        </div>

                        {/* Sentimiento */}
                        <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sentimiento Global</span>
                            <div className="flex flex-col items-center justify-center gap-1">
                                {getSentimentIcon(result?.sentiment)}
                                <span className="font-black text-slate-900 dark:text-white uppercase text-xs">{result?.sentiment || 'NEUTRAL'}</span>
                            </div>
                        </div>

                        {/* Canal */}
                        <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Canal / Entorno</span>
                            <div className="flex items-center justify-center gap-2">
                                <Zap className="w-5 h-5 text-emerald-500" />
                                <span className="font-black text-slate-900 dark:text-white uppercase text-xs">{mode === 'audio' ? 'VOZ' : 'CHAT'}</span>
                            </div>
                        </div>

                        {/* CSAT Estrellas */}
                        <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">CSAT Estimado</span>
                            <div className="flex justify-center gap-1">
                                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= (result?.csat || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}/>)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Lado Izquierdo: Rúbricas */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><ClipboardCheck className="w-5 h-5 text-indigo-500" /> Validación de Rúbrica</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {rubric.map(r => {
                                    const val = !!(result?.customData && result.customData[r.id]);
                                    return (
                                        <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
                                            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{t[r.id] || r.label}</span>
                                            {val ? <CheckCircle className="text-emerald-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Lado Derecho: Informe Detallado */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Bot className="w-6 h-6" /> Informe de Razonamiento ACPIA
                            </h3>
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden min-h-[500px]">
                                {result?.notes ? (
                                    <ReactMarkdown className="prose dark:prose-invert max-w-none ai-feedback-markdown prose-p:text-slate-300">
                                        {String(result.notes)}
                                    </ReactMarkdown>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
                                        <Activity className="w-12 h-12 mb-4 opacity-20" />
                                        <p>Esperando inferencia de datos...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

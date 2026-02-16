import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { 
    Upload, Zap, CheckCircle, AlertCircle, Save, 
    Smile, Meh, Frown, Sparkles, Mic, MessageSquare, Bot, Star,
    XCircle, ArrowLeft, Activity, ShieldCheck, ClipboardCheck, Clock, BrainCircuit
} from 'lucide-react';
import { Language, Agent, Project, AuditType, SmartAnalysisResult, RubricItem, Sentiment } from '../types';
import { translations } from '../utils/translations';
import { getAgents, getProjects, getRubric } from '../services/storageService';
import { analyzeAudio, analyzeText } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const SelectionCard = ({ icon, title, desc, onClick, color }: any) => (
    <button onClick={onClick} className={`p-12 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center text-center gap-6 group hover:border-${color}-500 transition-all hover:shadow-2xl hover:-translate-y-2`}>
        <div className={`w-24 h-24 rounded-[2rem] bg-${color}-500/10 flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>{icon}</div>
        <div>
            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{title}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">{desc}</p>
        </div>
    </button>
);

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
            toast.error(lang === 'es' ? "Seleccione Agente y Proyecto primero" : "Select Agent and Project first");
            return;
        }

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
                const auditType = mode === 'audio' ? AuditType.VOICE : AuditType.CHAT;
                const rubricToAnalyze = rubric.filter(r => r.isActive && (r.type === 'BOTH' || r.type === auditType));
                
                let aiResult;
                if (mode === 'audio') {
                    aiResult = await analyzeAudio(base64Data, rubricToAnalyze, lang);
                } else {
                    const decodedContent = atob(base64Data);
                    aiResult = await analyzeText(decodedContent, rubricToAnalyze, lang);
                }

                if (aiResult) {
                    setResult(aiResult);
                    setStep('results');
                }
            } catch (err) {
                toast.error("Error en el análisis");
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!result) return;
        onSave({
            id: Date.now().toString(),
            agent_name: selectedAgent,
            project: selectedProject,
            quality_score: result.score,
            ai_notes: result.notes,
            date: date,
            type: mode === 'audio' ? 'VOICE' : 'CHAT',
            status: 'PENDING_REVIEW'
        });
        setStep('selection');
    };

    const getSentimentIcon = (sentiment: any) => {
        const s = typeof sentiment === 'string' ? sentiment.toUpperCase() : 'NEUTRAL';
        if (s.includes('POS')) return <Smile className="w-12 h-12 text-emerald-500" />;
        if (s.includes('NEG')) return <Frown className="w-12 h-12 text-red-500" />;
        return <Meh className="w-12 h-12 text-slate-400" />;
    };

    if (step === 'selection') {
        return (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in py-10">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-4 bg-indigo-600/10 rounded-3xl mb-4 border border-indigo-500/20">
                        <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Inferencia de Calidad</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">Análisis basado en sentimientos, roles y rúbricas reales.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectionCard icon={<Mic className="w-10 h-10" />} title={t.voice} desc="Auditoría de Voz con Inferencia de Roles" onClick={() => { setMode('audio'); setStep('upload'); }} color="indigo" />
                    <SelectionCard icon={<MessageSquare className="w-10 h-10" />} title={t.chat} desc="Auditoría de Chats y Transcripciones" onClick={() => { setMode('text'); setStep('upload'); }} color="purple" />
                </div>
            </div>
        );
    }

    if (step === 'upload') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="p-8 border-b bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setStep('selection')} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </button>
                            <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">Configuración de Entrada</h2>
                        </div>
                    </div>
                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 p-4 rounded-2xl font-bold">
                                <option value="">Seleccionar Agente</option>
                                {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                            </select>
                            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 p-4 rounded-2xl font-bold">
                                <option value="">Seleccionar Proyecto</option>
                                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                            <input type="text" value={interactionId} onChange={e => setInteractionId(e.target.value)} placeholder="Ticket ID" className="bg-slate-50 dark:bg-slate-800 border-2 p-4 rounded-2xl font-bold" />
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer border-slate-200 dark:border-slate-800 hover:border-indigo-500">
                            <Upload className="w-16 h-16 text-slate-400" />
                            <p className="font-black text-slate-400 uppercase text-xs tracking-widest mt-4">Subir Archivo</p>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-fade-in-up space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-8 border-b bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
                    <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                        <Sparkles className="w-8 h-8 text-indigo-600" /> Inferencia de Resultados
                    </h2>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep('upload')} className="h-14 px-8 rounded-2xl font-black uppercase text-xs">Re-analizar</Button>
                        <Button onClick={handleSave} className="h-14 px-8 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-600/20">Confirmar Registro</Button>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-slate-900 rounded-3xl p-6 text-center border-2 border-indigo-500/30">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Puntaje de Calidad</span>
                            <div className="text-5xl font-black text-white">{result?.score ?? 0}%</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sentimiento Global</span>
                            <div className="flex flex-col items-center justify-center gap-1">
                                {getSentimentIcon(result?.sentiment)}
                                <span className="font-black text-slate-900 dark:text-white uppercase text-xs">{result?.sentiment || 'NEUTRAL'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Canal / Entorno</span>
                            <div className="flex items-center justify-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                <span className="font-black text-slate-900 dark:text-white uppercase text-xs">{mode === 'audio' ? "VOZ" : "CHAT"}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-6 text-center border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">CSAT Estimado</span>
                            <div className="flex justify-center gap-1">
                                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= (result?.csat || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}/>)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-indigo-500" /> Validación de Rúbrica</h3>
                            {rubric.map(r => (
                                <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
                                    <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{r.label}</span>
                                    {result?.customData?.[r.id] ? <CheckCircle className="text-emerald-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}
                                </div>
                            ))}
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-3"><Bot className="w-6 h-6" /> Informe de Razonamiento ACPIA</h3>
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner min-h-[500px] overflow-hidden">
                                {result?.notes ? (
                                    <ReactMarkdown className="prose dark:prose-invert max-w-none ai-feedback-markdown prose-p:text-slate-300 prose-p:leading-relaxed">
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
``` [cite: 1, 6, 11, 44, 45, 102, 103, 104]

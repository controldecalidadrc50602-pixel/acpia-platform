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
                            <p className="font-black text-

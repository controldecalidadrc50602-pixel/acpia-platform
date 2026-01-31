
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { 
    Upload, FileAudio, FileText, Zap, CheckCircle, AlertCircle, Save, 
    Smile, Meh, Frown, Hash, User, Briefcase, File, ArrowLeft, 
    Sparkles, Mic, MessageSquare, BarChart, ClipboardCheck, Bot, Star
} from 'lucide-react';
import { Language, Agent, Project, AuditType, SmartAnalysisResult, RubricItem, Sentiment } from '../types';
import { translations } from '../utils/translations';
import { getAgents, getProjects, getRubric } from '../services/storageService';
import { analyzeAudio, analyzeText } from '../services/geminiService';
import { toast } from 'react-hot-toast';

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
        
        // Filtramos la rúbrica basada exclusivamente en lo que el proyecto tiene configurado
        let rubricToAnalyze = rubric.filter(r => r.isActive && (r.type === 'BOTH' || r.type === auditType));

        if (currentProj && currentProj.rubricIds && currentProj.rubricIds.length > 0) {
            rubricToAnalyze = rubricToAnalyze.filter(r => currentProj.rubricIds!.includes(r.id));
        }

        if (rubricToAnalyze.length === 0) {
            toast.error(lang === 'es' ? "El proyecto no tiene KPIs configurados para este canal." : "Project has no KPIs configured for this channel.");
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
                    if (mode === 'audio') {
                        aiResult = await analyzeAudio(base64Data, rubricToAnalyze, lang, selectedAgent, selectedProject);
                    } else {
                        if (isPdf) {
                            aiResult = await analyzeText(base64Data, rubricToAnalyze, lang, selectedAgent, selectedProject, true);
                        } else {
                            const text = atob(base64Data);
                            aiResult = await analyzeText(text, rubricToAnalyze, lang, selectedAgent, selectedProject, false);
                        }
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
        if (!result || !selectedAgent || !selectedProject) return;

        const audit = {
            id: Date.now().toString(),
            type: mode === 'audio' ? AuditType.VOICE : AuditType.CHAT,
            agentName: selectedAgent,
            project: selectedProject,
            interactionId,
            date,
            csat: result.csat,
            qualityScore: result.score,
            aiNotes: result.notes, 
            customData: result.customData,
            sentiment: result.sentiment || 'NEUTRAL',
            isAiGenerated: true 
        };
        onSave(audit);
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
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t.smartAudit}</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{t.smartAuditDesc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button 
                        onClick={() => { setMode('audio'); setStep('upload'); }}
                        className="group relative h-72 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
                        <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Mic className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t.uploadAudio}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Análisis nativo de voz y audio</p>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={() => { setMode('text'); setStep('upload'); }}
                        className="group relative h-72 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
                        <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <FileText className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t.uploadText} / PDF</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Procesamiento de chats y documentos</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'upload') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center gap-4">
                        <button onClick={() => setStep('selection')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {mode === 'audio' ? <Mic className="w-5 h-5 text-indigo-500" /> : <FileText className="w-5 h-5 text-purple-500" />}
                            {lang === 'es' ? 'Configurar Análisis' : 'Setup Analysis'}
                        </h2>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.agent}</label>
                                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                                    <option value="">{t.selectAgent}</option>
                                    {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.project}</label>
                                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                                    <option value="">{t.selectProject}</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.interactionId}</label>
                                <input type="text" placeholder="Ej: T-9912" value={interactionId} onChange={e => setInteractionId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                            </div>
                        </div>

                        {!isAnalyzing ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()} 
                                className="border-4 border-dashed border-slate-100 dark:border-slate-800 h-64 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-3xl transition-all group"
                            >
                                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
                                    <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg text-slate-700 dark:text-slate-300">{mode === 'audio' ? t.dragDrop : (lang === 'es' ? 'Arrastra archivos TXT o PDF' : 'Drop TXT or PDF files')}</p>
                                    <p className="text-sm text-slate-400 mt-1">Haga click para explorar archivos locales</p>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept={mode === 'audio' ? "audio/*" : ".txt,.pdf"} onChange={handleFileChange} />
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-pulse bg-slate-50 dark:bg-slate-850 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-ping"></div>
                                    <Bot className="w-16 h-16 text-indigo-500 relative z-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.analyzing}</h3>
                                    <p className="text-sm text-slate-500 mt-1 italic">{t.processingFile}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-32 animate-fade-in-up">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-indigo-500" />
                        {t.analysisComplete}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setStep('upload'); setResult(null); }}>Re-analizar</Button>
                        <Button onClick={handleSave} icon={<Save className="w-4 h-4"/>}>{t.saveToCrm}</Button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{t.score}</p>
                                <div className="relative inline-block">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                            strokeDasharray={364.4}
                                            strokeDashoffset={364.4 - (364.4 * (result?.score || 0)) / 100}
                                            className="text-indigo-600 transition-all duration-1000 ease-out" 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-black">{result?.score}%</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className={`w-5 h-5 ${i <= (result?.csat || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{t.sentimentAnalysis}</p>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-2">
                                    {getSentimentIcon(result?.sentiment)}
                                </div>
                                <span className={`font-black uppercase text-sm ${result?.sentiment === 'POSITIVE' ? 'text-green-500' : result?.sentiment === 'NEGATIVE' ? 'text-red-500' : 'text-slate-500'}`}>
                                    {t[result?.sentiment || 'NEUTRAL']}
                                </span>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4" /> {t.rubricBreakdown}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(result?.customData || {}).map(([id, val]) => {
                                        const rItem = rubric.find(r => r.id === id);
                                        return (
                                            <div key={id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {rItem ? (t[rItem.id] || rItem.label) : id}
                                                </span>
                                                {val ? <CheckCircle className="text-green-500 w-5 h-5" /> : <AlertCircle className="text-red-500 w-5 h-5" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                    <Bot className="w-4 h-4" /> {t.aiFeedback}
                                </h3>
                                <div className="bg-indigo-50/30 dark:bg-slate-850 p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 text-sm leading-relaxed italic text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {result?.notes}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

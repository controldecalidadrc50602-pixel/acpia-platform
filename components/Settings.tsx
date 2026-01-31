
import React, { useRef, useState, useEffect } from 'react';
import { exportData, importData, clearAllData, getAppSettings, saveAppSettings, getTheme, saveTheme } from '../services/storageService';
import { checkCloudConnection } from '../services/supabaseClient';
import { testConnection } from '../services/geminiService';
import { Button } from './ui/Button';
import { 
    Database, ImageIcon, Sun, Moon, 
    Wallet, Cpu, Activity, PhoneCall, Settings2, 
    Download, Upload, ShieldCheck, Zap, Plus, Globe, Image as LucideImage, Cloud, CloudOff, Link, RefreshCw, Sparkles, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Language, AppSettings, Theme } from '../types';
import { translations } from '../utils/translations';

export const Settings: React.FC<{ lang: Language, setLang: (l: Language) => void, onDataChange: () => void }> = ({ lang, setLang, onDataChange }) => {
    const t = translations[lang];
    const logoInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [settings, setSettings] = useState<AppSettings>(getAppSettings());
    const [theme, setThemeState] = useState<Theme>(getTheme());
    const [isCloudConnected, setIsCloudConnected] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isAiValidating, setIsAiValidating] = useState(false);
    const [aiStatus, setAiStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        setSettings(getAppSettings());
        verifyCloud();
    }, []);

    const verifyCloud = async () => {
        setIsValidating(true);
        const connected = await checkCloudConnection();
        setIsCloudConnected(connected);
        setIsValidating(false);
    };

    const handleTestAi = async () => {
        setIsAiValidating(true);
        setAiStatus('idle');
        const ok = await testConnection();
        setIsAiValidating(false);
        if (ok) {
            setAiStatus('success');
            toast.success(lang === 'es' ? "Conexión con Gemini Exitosa" : "Gemini API Connection Successful");
        } else {
            setAiStatus('error');
            toast.error(lang === 'es' ? "Error de API Key o cuota excedida" : "API Key error or quota exceeded");
        }
    };

    const handleSaveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        saveAppSettings(newSettings);
        onDataChange();
    };

    const handleThemeChange = (newTheme: Theme) => {
        setThemeState(newTheme);
        saveTheme(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        onDataChange();
        toast.success(lang === 'es' ? `Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado` : `${newTheme === 'dark' ? 'Dark' : 'Light'} mode active`);
    };

    const handleLanguageChange = (newLang: Language) => {
        setLang(newLang);
        handleSaveSettings({ ...settings, preferredLanguage: newLang });
        toast.success(newLang === 'es' ? "Idioma: Español" : "Language: English");
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            handleSaveSettings({ ...settings, logoBase64: base64 });
            toast.success(lang === 'es' ? "Logo actualizado" : "Logo updated");
        };
        reader.readAsDataURL(file);
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target?.result as string;
            if (importData(json)) {
                toast.success(lang === 'es' ? "Datos importados correctamente" : "Data imported successfully");
                onDataChange();
            } else {
                toast.error(lang === 'es' ? "Error al importar datos" : "Error importing data");
            }
        };
        reader.readAsText(file);
    };

    const usage = settings.usage || { aiAuditsCount: 0, estimatedTokens: 0, estimatedCost: 0 };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-fade-in">
            
            {/* CLOUD CONNECTION CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isCloudConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {isCloudConnected ? <Cloud className="w-8 h-8" /> : <CloudOff className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                    {isCloudConnected ? 'Cloud Sync Activo' : 'Habilitar Modo Colaborativo'}
                                </h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {isCloudConnected ? 'Sincronización en tiempo real con Supabase habilitada' : 'Configura tu base de datos para auditar con otros usuarios'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={verifyCloud} disabled={isValidating} variant="secondary" className="rounded-xl h-12">
                        {isValidating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isValidating ? 'Validando...' : 'Probar Conexión'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Supabase Project URL</label>
                        <div className="relative">
                            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input 
                                type="text" 
                                value={settings.supabaseUrl || ''}
                                onChange={(e) => handleSaveSettings({ ...settings, supabaseUrl: e.target.value.trim() })}
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                                placeholder="https://xyz.supabase.co"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Supabase Anon Key</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input 
                                type="password" 
                                value={settings.supabaseKey || ''}
                                onChange={(e) => handleSaveSettings({ ...settings, supabaseKey: e.target.value.trim() })}
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI HEALTH CHECK CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${aiStatus === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : aiStatus === 'error' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {aiStatus === 'success' ? <CheckCircle2 className="w-8 h-8" /> : aiStatus === 'error' ? <AlertTriangle className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Motor de Inteligencia Artificial</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Verifica el estado del API de Gemini para auditorías automáticas</p>
                    </div>
                </div>
                <Button 
                    onClick={handleTestAi} 
                    disabled={isAiValidating} 
                    className={`rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest transition-all ${aiStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                    {isAiValidating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {isAiValidating ? 'Verificando...' : aiStatus === 'success' ? 'IA Operativa' : 'Probar Motor IA'}
                </Button>
            </div>

            {/* IDENTIDAD CORPORATIVA */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10">
                <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[2rem] border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden flex items-center justify-center">
                            {settings.logoBase64 ? (
                                <img src={settings.logoBase64} className="w-full h-full object-cover" alt="Logo" />
                            ) : (
                                <LucideImage className="w-12 h-12 text-slate-300" />
                            )}
                        </div>
                        <button onClick={() => logoInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></button>
                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">Nombre de la Empresa</label>
                            <input type="text" value={settings.companyName} onChange={(e) => handleSaveSettings({ ...settings, companyName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500 font-black text-xl text-slate-900 dark:text-white transition-all" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">Idioma</label>
                                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex">
                                    <button onClick={() => handleLanguageChange('es')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${lang === 'es' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Español</button>
                                    <button onClick={() => handleLanguageChange('en')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>English</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2">Interfaz</label>
                                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex">
                                    <button onClick={() => handleThemeChange('light')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><Sun className="w-4 h-4" /> Claro</button>
                                    <button onClick={() => handleThemeChange('dark')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400'}`}><Moon className="w-4 h-4" /> Oscuro</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI USAGE DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Infraestructura de IA</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-850 rounded-3xl border border-slate-700/50">
                            <span className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Tokens Globales</span>
                            <span className="text-4xl font-black text-white">{(usage.estimatedTokens / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="p-6 bg-slate-850 rounded-3xl border border-slate-700/50">
                            <span className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Auditorías Smart</span>
                            <span className="text-4xl font-black text-white">{usage.aiAuditsCount}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between">
                    <div>
                        <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1 block">Costo Estimado</span>
                        <h3 className="text-4xl font-black tracking-tighter">${usage.estimatedCost.toFixed(5)}</h3>
                        <p className="text-[10px] mt-2 font-bold opacity-60">USD • PAY-AS-YOU-GO</p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/20 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase">Sistema Operativo</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Database className="w-6 h-6 text-indigo-500" />
                        <h3 className="font-black dark:text-white uppercase tracking-tighter">Backup de Seguridad</h3>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase" onClick={() => exportData()} icon={<Download className="w-4 h-4" />}>Exportar</Button>
                        <Button variant="secondary" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase" onClick={() => importInputRef.current?.click()} icon={<Upload className="w-4 h-4" />}>Importar</Button>
                    </div>
                    <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportJson} />
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-500/10 rounded-[3rem] p-10 flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <ShieldCheck className="w-6 h-6 text-red-500" />
                        <h3 className="text-red-600 font-black uppercase tracking-tighter">Purga de Datos</h3>
                    </div>
                    <Button variant="danger" className="w-full h-12 rounded-xl font-black uppercase tracking-widest" onClick={() => { if(confirm("¿Borrar todo el sistema?")) { clearAllData(); window.location.reload(); } }}>Eliminar Todo</Button>
                </div>
            </div>
        </div>
    );
};

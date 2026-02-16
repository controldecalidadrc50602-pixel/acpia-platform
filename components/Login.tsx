import React, { useState, useEffect } from 'react';
import { getUsers, authenticate, initAuth, getAppSettings } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { User, Language, UserRole } from '../types';
import { Button } from './ui/Button';
import { Lock, User as UserIcon, LogIn, ChevronRight, Mail, Cloud, Database, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { translations } from '../utils/translations';

interface LoginProps {
    onLogin: (user: User) => void;
    lang: Language;
    setLang: (lang: Language) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang }) => {
    const t = translations[lang];
    const [mode, setMode] = useState<'LOCAL' | 'CLOUD'>('LOCAL');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(false);
    const [logo, setLogo] = useState<string | undefined>(undefined);
    const [companyName, setCompanyName] = useState('Rc506 | Gestion de Calidad');

    useEffect(() => {
        initAuth();
        setUsers(getUsers());
        const settings = getAppSettings();
        if (settings.logoBase64) setLogo(settings.logoBase64);
    }, []);

    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = authenticate(selectedUserId, pin);
        if (user) {
            onLogin(user);
        } else {
            setError(true);
            toast.error(t.invalidPin);
            setPin('');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-6 relative font-sans">
             {/* Glow de fondo */}
             <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

             <div className="w-full max-w-[480px] bg-[#161b2c]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden z-10">
                 
                 {/* Header con Logo Protegido */}
                 <div className="p-10 pb-6 text-center">
                      <div className="flex justify-center mb-6">
                         {logo ? (
                             <img src={logo} alt="Rc506 Logo" className="h-28 w-auto object-contain drop-shadow-2xl" />
                         ) : (
                             <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl flex items-center justify-center">
                                <span className="text-4xl font-black text-white">Rc</span>
                             </div>
                         )}
                      </div>
                      <h1 className="text-2xl font-bold text-white tracking-tight">{companyName}</h1>
                 </div>

                 {/* Selector de Modo (Tabs) */}
                 <div className="px-10 mb-6">
                    <div className="flex p-1.5 bg-black/20 rounded-2xl border border-white/5">
                        <button onClick={() => setMode('LOCAL')} className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'LOCAL' ? 'bg-[#2a3145] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <Database className="w-4 h-4" /> Local Mode
                        </button>
                        <button onClick={() => setMode('CLOUD')} className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'CLOUD' ? 'bg-[#2a3145] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <Cloud className="w-4 h-4" /> Cloud SaaS
                        </button>
                    </div>
                 </div>

                 <div className="px-10 pb-10">
                    <form onSubmit={handleLocalSubmit} className="space-y-6">
                        {/* Selector de Usuario */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <UserIcon className="w-3 h-3" /> Seleccionar Perfil
                            </label>
                            <div className="grid gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {users.map(u => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => { setSelectedUserId(u.id); setError(false); }}
                                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${selectedUserId === u.id ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-[#1c2336] border-white/5 text-slate-400 hover:border-white/20'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedUserId === u.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-sm">{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PIN */}
                        {selectedUserId && (
                            <div className="animate-fade-in-up">
                                <input 
                                    type="password" 
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength={4}
                                    placeholder="PIN de Acceso"
                                    className={`w-full bg-black/20 border-2 rounded-2xl p-5 text-center text-3xl font-black tracking-[0.5em] text-white focus:outline-none transition-all ${error ? 'border-red-500' : 'border-white/5 focus:border-indigo-500'}`}
                                />
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={!selectedUserId || !pin} 
                            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-tighter shadow-2xl shadow-indigo-600/20"
                        >
                            <LogIn className="w-6 h-6" />
                        </Button>
                    </form>
                 </div>
             </div>

             <div className="mt-10 text-center space-y-2 opacity-40">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Admin PIN: 1234</p>
                 <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">© 2024 AuditCenter Intelligence Platform</p>
             </div>
        </div>
    );
};

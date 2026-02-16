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
            toast.success(`Bienvenido, ${user.name}`);
        } else {
            setError(true);
            toast.error(t.invalidPin);
            setPin('');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
             {/* Luces de fondo decorativas */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

             <div className="w-full max-w-[450px] bg-[#161b2c]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 relative">
                 
                 {/* Header con Logo Protegido */}
                 <div className="p-10 pb-6 text-center">
                      <div className="flex justify-center mb-6">
                         {logo ? (
                             <img src={logo} alt="Logo" className="h-24 w-auto object-contain drop-shadow-2xl" />
                         ) : (
                             <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl flex items-center justify-center shadow-xl">
                                <span className="text-3xl font-black text-white italic">Rc</span>
                             </div>
                         )}
                      </div>
                      <h1 className="text-xl font-bold text-white tracking-tight uppercase">{companyName}</h1>
                 </div>

                 {/* Selector de Modo */}
                 <div className="px-10 mb-8">
                    <div className="flex p-1.5 bg-black/20 rounded-2xl border border-white/5">
                        <button onClick={() => setMode('LOCAL')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'LOCAL' ? 'bg-[#2a3145] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <Database className="w-3 h-3" /> Local Mode
                        </button>
                        <button onClick={() => setMode('CLOUD')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'CLOUD' ? 'bg-[#2a3145] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <Cloud className="w-3 h-3" /> Cloud SaaS
                        </button>
                    </div>
                 </div>

                 <div className="px-10 pb-12">
                    <form onSubmit={handleLocalSubmit} className="space-y-6">
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
                                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedUserId === u.id ? 'bg-indigo-600/10 border-indigo-500/50 text-white' : 'bg-[#1c2336] border-white/5 text-slate-400 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${selectedUserId === u.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                {u.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-xs uppercase">{u.name}</span>
                                        </div>
                                        {selectedUserId === u.id && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedUserId && (
                            <div className="animate-fade-in-up space-y-3">
                                <input 
                                    type="password" 
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength={4}
                                    placeholder="PIN"
                                    className={`w-full bg-black/20 border-2 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.5em] text-white focus:outline-none transition-all ${error ? 'border-red-500' : 'border-white/5 focus:border-indigo-500'}`}
                                    autoFocus
                                />
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={!selectedUserId || !pin} 
                            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30"
                        >
                            <LogIn className="w-5 h-5 mr-2" /> Entrar
                        </Button>
                    </form>
                 </div>
             </div>

             <div className="mt-10 text-center space-y-2 opacity-30">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Default Admin PIN: 1234</p>
                 <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">© 2024 AuditCenter Intelligence Platform</p>
             </div>
        </div>
    );
};

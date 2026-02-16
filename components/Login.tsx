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
    const [companyName, setCompanyName] = useState('ACPIA');

    useEffect(() => {
        initAuth();
        setUsers(getUsers());
        const settings = getAppSettings();
        if (settings.logoBase64) setLogo(settings.logoBase64);
        if (settings.companyName) setCompanyName(settings.companyName);
    }, []);

    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
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

    const handleCloudSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!supabase) {
            toast.error("Cloud no configurado.");
            setIsSubmitting(false);
            return;
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) {
                const appUser: User = {
                    id: data.user.id,
                    name: data.user.email?.split('@')[0] || 'Cloud User',
                    email: data.user.email,
                    role: UserRole.ADMIN,
                    pin: '',
                    supabaseId: data.user.id
                };
                onLogin(appUser);
            }
        } catch (err: any) {
            toast.error(err.message || "Fallo de autenticación");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
             {/* Efectos de Luces de Fondo */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

             {/* Selector de Idioma */}
             <div className="absolute top-6 right-6 flex gap-2 z-20">
                 {['en', 'es'].map((l) => (
                     <button 
                        key={l}
                        onClick={() => setLang(l as Language)} 
                        className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all ${lang === l ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
                     >
                         {l.toUpperCase()}
                     </button>
                 ))}
             </div>

             <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden z-10 relative">
                 <div className="p-10 pb-8 text-center border-b border-slate-800/50 bg-slate-900/20">
                      <div className="w-full flex justify-center mb-6">
                         {logo ? (
                             <img src={logo} alt="Logo" className="h-20 w-auto object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]" />
                         ) : (
                             <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 transform rotate-3">
                                <span className="text-3xl font-black text-white">A</span>
                             </div>
                         )}
                      </div>
                      <h1 className="text-3xl font-black text-white mb-1 tracking-tighter uppercase">{companyName}</h1>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{t.loginTitle}</p>
                 </div>

                 {/* Selector de Modo */}
                 <div className="flex p-1.5 bg-slate-950/50 mx-10 mt-8 rounded-2xl border border-slate-800/50">
                     <button onClick={() => setMode('LOCAL')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'LOCAL' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
                         <Database className="w-3 h-3" /> Local
                     </button>
                     <button onClick={() => setMode('CLOUD')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'CLOUD' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}>
                         <Cloud className="w-3 h-3" /> Cloud
                     </button>
                 </div>

                 <div className="p-10 pt-8">
                    {mode === 'LOCAL' ? (
                        <form onSubmit={handleLocalSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <UserIcon className="w-3 h-3" /> {t.selectUser}
                                </label>
                                <div className="grid gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => { setSelectedUserId(u.id); setError(false); }}
                                            className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedUserId === u.id ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-inner' : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            <span className="font-bold text-sm uppercase tracking-tight">{u.name}</span>
                                            {selectedUserId === u.id && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedUserId && (
                                <div className="space-y-3 animate-fade-in-up">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> {t.enterPin}
                                    </label>
                                    <input 
                                        type="password" 
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        maxLength={6}
                                        placeholder="••••"
                                        className={`w-full bg-slate-950 border-2 rounded-2xl p-4 text-center text-4xl font-black tracking-[0.4em] text-white focus:outline-none transition-all ${error ? 'border-red-500' : 'border-slate-800 focus:border-indigo-500'}`}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <Button type="submit" disabled={!selectedUserId || !pin} className="w-full h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20" icon={<LogIn className="w-5 h-5" />}>
                                {t.login}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleCloudSubmit} className="space-y-5">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none" placeholder="Email corporativo" />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none" placeholder="Contraseña" />
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-white text-slate-900">
                                {isSubmitting ? 'Verificando...' : 'Iniciar Sesión Cloud'}
                            </Button>
                        </form>
                    )}
                 </div>
             </div>

             <div className="mt-10 text-center space-y-2">
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{mode === 'LOCAL' ? 'Default Admin PIN: 1234' : 'Secured by Supabase Auth'}</p>
                 <p className="text-[9px] font-medium text-slate-700 uppercase tracking-widest">© 2024 AuditCenter Intelligence Platform</p>
             </div>
        </div>
    );
};

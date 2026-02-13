
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
    
    // Local State
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [pin, setPin] = useState('');
    
    // Cloud State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Common State
    const [error, setError] = useState(false);
    const [logo, setLogo] = useState<string | undefined>(undefined);
    const [companyName, setCompanyName] = useState('ACPIA');

    useEffect(() => {
        initAuth(); // Ensure at least admin exists
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
            toast.success(`Welcome back, ${user.name}`);
        } else {
            setError(true);
            toast.error(t.invalidPin);
            setPin('');
        }
    };

    const handleCloudSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const supabase = getSupabase();
        if (!supabase) {
            toast.error("Cloud not configured. Please use Local Mode or configure API keys.");
            setIsSubmitting(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Map Cloud User to App User
                const appUser: User = {
                    id: data.user.id,
                    name: data.user.email?.split('@')[0] || 'Cloud User',
                    email: data.user.email,
                    role: UserRole.ADMIN, // Defaulting to Admin for SaaS owner
                    pin: '',
                    supabaseId: data.user.id
                };
                onLogin(appUser);
                toast.success("Authenticated via Cloud");
            }
        } catch (err: any) {
            toast.error(err.message || "Authentication failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]"></div>

             {/* Language Toggle */}
             <div className="absolute top-6 right-6 flex gap-2 z-20">
                 <button onClick={() => setLang('en')} className={`text-xs px-3 py-1 rounded-full border border-slate-700 transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>EN</button>
                 <button onClick={() => setLang('es')} className={`text-xs px-3 py-1 rounded-full border border-slate-700 transition-colors ${lang === 'es' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>ES</button>
             </div>

             <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 relative">
                 {/* Top Glow Line */}
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

                 <div className="p-8 pb-6 text-center border-b border-slate-800 bg-slate-900/50">
                      <div className="w-full flex justify-center mb-4">
                         {logo ? (
                             <img 
                                src={logo} 
                                alt="Company Logo" 
                                className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-fade-in-up" 
                             />
                         ) : (
                             <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                                <span className="text-3xl font-bold text-white">A</span>
                             </div>
                         )}
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">{companyName}</h1>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{t.loginTitle}</p>
                 </div>

                 {/* MODE TOGGLE */}
                 <div className="flex p-2 bg-slate-950/50 mx-8 mt-6 rounded-xl border border-slate-800">
                     <button 
                        onClick={() => setMode('LOCAL')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'LOCAL' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                         <Database className="w-3 h-3" /> Local Mode
                     </button>
                     <button 
                        onClick={() => setMode('CLOUD')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'CLOUD' ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                         <Cloud className="w-3 h-3" /> Cloud SaaS
                     </button>
                 </div>

                 <div className="p-8 pt-6">
                    {mode === 'LOCAL' ? (
                        <form onSubmit={handleLocalSubmit} className="space-y-6 animate-fade-in-up">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <UserIcon className="w-3 h-3" />
                                    {t.selectUser}
                                </label>
                                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => { setSelectedUserId(u.id); setError(false); }}
                                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all group ${selectedUserId === u.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedUserId === u.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                    {u.name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{u.name}</span>
                                            </div>
                                            {selectedUserId === u.id && <ChevronRight className="w-5 h-5 text-white/80" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedUserId && (
                                <div className="space-y-2 animate-fade-in-up">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        {t.enterPin}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            maxLength={6}
                                            placeholder="••••"
                                            className={`w-full bg-slate-950 border rounded-xl p-4 text-center text-3xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 transition-all placeholder-slate-800 ${error ? 'border-red-500 ring-red-500/20' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                                            autoFocus
                                        />
                                    </div>
                                    {error && <p className="text-xs text-center text-red-400 mt-2 font-bold animate-pulse">{t.invalidPin}</p>}
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                disabled={!selectedUserId || !pin} 
                                className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/20"
                                icon={<LogIn className="w-5 h-5" />}
                            >
                                {t.login}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleCloudSubmit} className="space-y-5 animate-fade-in-up">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Corporate Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !email || !password} 
                                className="w-full py-3 font-bold bg-white text-slate-900 hover:bg-slate-200"
                            >
                                {isSubmitting ? 'Authenticating...' : 'Sign In'}
                            </Button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-800"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-600 text-xs uppercase">Or continue with</span>
                                <div className="flex-grow border-t border-slate-800"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors">
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                    <span className="text-sm font-medium text-white">Google</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors">
                                    <img src="https://www.svgrepo.com/show/452263/microsoft.svg" className="w-5 h-5" alt="Microsoft" />
                                    <span className="text-sm font-medium text-white">Microsoft</span>
                                </button>
                            </div>
                            
                            <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                Secure Enterprise SSO ready
                            </p>
                        </form>
                    )}
                 </div>
             </div>

             <div className="mt-8 text-center text-slate-500 text-xs">
                 <p className="opacity-50 hover:opacity-100 transition-opacity">
                     {mode === 'LOCAL' ? 'Default Admin PIN: 1234' : 'Powered by Supabase Auth'}
                 </p>
                 <p className="mt-2">© 2024 AuditCenter Intelligence Platform</p>
             </div>
        </div>
    );
};

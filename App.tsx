
import React, { useState, useEffect, useRef } from 'react';
import { View, UserRole, Audit, User, Language, Theme } from './types';
import { getAudits, saveAudit, getRubric, getAppSettings, getTheme, fullCloudPull } from './services/storageService';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AuditForm } from './components/AuditForm';
import { SmartAudit } from './components/SmartAudit';
import { CRM } from './components/CRM';
import { Reports } from './components/Reports';
import { Management } from './components/Management';
import { Settings } from './components/Settings';
import { AgentScorecard } from './components/AgentScorecard';
import { ProjectScorecard } from './components/ProjectScorecard';
import { Subscription } from './components/Subscription';
import { CopilotPage } from './components/CopilotPage';
import { Copilot } from './components/Copilot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { translations } from './utils/translations';
import { toast, Toaster } from 'react-hot-toast';
import { LogOut, Shield, Sparkles, BarChart, PlusSquare, FileText, Settings as SettingsIcon, MessageSquare, Database, ChevronLeft, ChevronRight, Maximize, RefreshCw, Monitor, Smartphone, Tablet, ShieldCheck, Zap } from 'lucide-react';

type DeviceView = 'desktop' | 'tablet' | 'mobile';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<View>(View.DASHBOARD);
    const [lang, setLang] = useState<Language>('es');
    const [audits, setAudits] = useState<Audit[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
    
    const [appLogo, setAppLogo] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('Rc506 | Gestion de Calidad');

    const t = translations[lang] || translations['es'];

    const refreshData = async () => {
        try {
            // Si hay sesión y configuración de nube, intentar bajar datos frescos
            const settings = getAppSettings();
            if (currentUser && settings.supabaseUrl) {
                await fullCloudPull();
            }
            
            setAudits(getAudits() || []);
            if (settings) {
                setAppLogo(settings.logoBase64 || null);
                setCompanyName(settings.companyName || 'Rc506 | Gestion de Calidad');
                if (settings.preferredLanguage && settings.preferredLanguage !== lang) {
                    setLang(settings.preferredLanguage as Language);
                }
            }
            const theme = getTheme();
            document.documentElement.classList.toggle('dark', theme === 'dark');
        } catch (e) {
            console.error("Error refreshing global data", e);
        }
    };

    useEffect(() => {
        refreshData();
        window.addEventListener('storage', refreshData);
        return () => window.removeEventListener('storage', refreshData);
    }, [currentUser]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                toast.error("Error al activar Full Screen");
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        refreshData();
    };

    const handleLogout = () => setCurrentUser(null);

    const handleSaveAudit = (audit: Audit) => {
        saveAudit(audit);
        refreshData();
        setView(View.CRM);
        toast.success(t.saved);
        setEditingAudit(null);
    };

    const handleEditAudit = (audit: Audit) => {
        setEditingAudit(audit);
        setView(View.NEW_AUDIT);
    };

    const handleViewProfile = (agentName: string) => {
        setSelectedAgent(agentName);
        setView(View.AGENT_PROFILE);
    };

    const handleViewProject = (projectName: string) => {
        setSelectedProject(projectName);
        setView(View.PROJECT_PROFILE);
    };

    if (!currentUser) {
        return <Login onLogin={handleLogin} lang={lang} setLang={setLang} />;
    }

    return (
        <ErrorBoundary t={t}>
            <Toaster position="top-right" />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-all duration-300 overflow-hidden">
                
                <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-24' : 'w-full md:w-72'} h-screen`}>
                    <div className={`p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center ${isSidebarCollapsed ? 'px-2' : 'px-8'}`}>
                        <div className={`transition-all duration-500 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden flex items-center justify-center ${isSidebarCollapsed ? 'w-14 h-14' : 'w-24 h-24 mb-4'}`}>
                            {appLogo ? (
                                <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ShieldCheck className="w-10 h-10 text-indigo-500" />
                            )}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="text-center animate-fade-in">
                                <h1 className="font-black text-xl tracking-tighter truncate max-w-[200px] leading-tight text-slate-900 dark:text-white uppercase">{companyName}</h1>
                                <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-[0.3em] mt-2">Quality Platform</p>
                            </div>
                        )}
                    </div>
                    
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                        <NavItem collapsed={isSidebarCollapsed} icon={<BarChart className="w-5 h-5"/>} label={t.dashboard} active={view === View.DASHBOARD} onClick={() => setView(View.DASHBOARD)} />
                        <NavItem collapsed={isSidebarCollapsed} icon={<Database className="w-5 h-5"/>} label={t.crm} active={view === View.CRM} onClick={() => setView(View.CRM)} />
                        <NavItem collapsed={isSidebarCollapsed} icon={<PlusSquare className="w-5 h-5"/>} label={t.newAudit} active={view === View.NEW_AUDIT} onClick={() => { setView(View.NEW_AUDIT); setEditingAudit(null); }} />
                        <NavItem collapsed={isSidebarCollapsed} icon={<Sparkles className="w-5 h-5"/>} label={t.smartAudit} active={view === View.SMART_AUDIT} onClick={() => setView(View.SMART_AUDIT)} />
                        <NavItem collapsed={isSidebarCollapsed} icon={<FileText className="w-5 h-5"/>} label={t.reports} active={view === View.REPORTS} onClick={() => setView(View.REPORTS)} />
                        <NavItem collapsed={isSidebarCollapsed} icon={<MessageSquare className="w-5 h-5"/>} label={t.copilot} active={view === View.COPILOT_PAGE} onClick={() => setView(View.COPILOT_PAGE)} />
                        {currentUser.role === UserRole.ADMIN && (
                            <>
                                <NavItem collapsed={isSidebarCollapsed} icon={<Shield className="w-5 h-5"/>} label={t.management} active={view === View.MANAGEMENT} onClick={() => setView(View.MANAGEMENT)} />
                                <NavItem collapsed={isSidebarCollapsed} icon={<SettingsIcon className="w-5 h-5"/>} label={t.settings} active={view === View.SETTINGS} onClick={() => setView(View.SETTINGS)} />
                            </>
                        )}
                    </nav>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        {!isSidebarCollapsed && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                                <div className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white text-sm font-black flex-shrink-0 bg-indigo-600`}>
                                    {currentUser.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{currentUser.name}</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{currentUser.role}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className={`flex items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700 shadow-sm ${isSidebarCollapsed ? 'w-full' : 'flex-1'}`}
                            >
                                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            </button>
                            {!isSidebarCollapsed && (
                                <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/10">
                                    <LogOut className="w-4 h-4" /> {t.logout}
                                </button>
                            )}
                        </div>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
                    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{view}</span>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                            <ToolbarBtn onClick={refreshData} icon={<RefreshCw className="w-4 h-4" />} title="Refresh/Sync Cloud" />
                            <ToolbarBtn onClick={toggleFullScreen} icon={<Maximize className="w-4 h-4" />} title="FullScreen" />
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar scroll-smooth flex justify-center">
                        <div className={`transition-all duration-500 w-full ${
                            deviceView === 'mobile' ? 'max-w-[375px] border-x-8 border-t-8 border-slate-800 rounded-t-[3rem] shadow-2xl h-fit bg-white dark:bg-slate-900' : 
                            deviceView === 'tablet' ? 'max-w-[768px] border-x-8 border-t-8 border-slate-800 rounded-t-[2.5rem] shadow-2xl h-fit bg-white dark:bg-slate-900' : 
                            'max-w-7xl'
                        }`}>
                            {view === View.DASHBOARD && <Dashboard audits={audits} lang={lang} />}
                            {view === View.CRM && (
                                <CRM 
                                    lang={lang} 
                                    onEdit={handleEditAudit} 
                                    onViewProfile={handleViewProfile} 
                                    onViewProject={handleViewProject}
                                    onDataChange={refreshData}
                                />
                            )}
                            {view === View.NEW_AUDIT && <AuditForm onSave={handleSaveAudit} lang={lang} initialData={editingAudit} />}
                            {view === View.SMART_AUDIT && <SmartAudit lang={lang} onSave={handleSaveAudit} />}
                            {view === View.REPORTS && <Reports lang={lang} />}
                            {view === View.MANAGEMENT && currentUser.role === UserRole.ADMIN && (
                                <Management 
                                    lang={lang} 
                                    onViewProfile={handleViewProfile} 
                                    onViewProject={handleViewProject}
                                    currentUser={currentUser}
                                    onDataChange={refreshData}
                                />
                            )}
                            {view === View.SETTINGS && currentUser.role === UserRole.ADMIN && <Settings lang={lang} setLang={setLang} onDataChange={refreshData} />}
                            {view === View.AGENT_PROFILE && selectedAgent && (
                                <AgentScorecard agentName={selectedAgent} audits={audits} rubric={getRubric()} lang={lang} onBack={() => setView(View.CRM)} />
                            )}
                            {view === View.PROJECT_PROFILE && selectedProject && (
                                <ProjectScorecard projectName={selectedProject} audits={audits} rubric={getRubric()} lang={lang} onBack={() => setView(View.CRM)} />
                            )}
                            {view === View.COPILOT_PAGE && <CopilotPage audits={audits} lang={lang} />}
                        </div>
                    </main>
                    <Copilot audits={audits} lang={lang} />
                </div>
            </div>
        </ErrorBoundary>
    );
};

const ToolbarBtn: React.FC<{ icon: React.ReactNode, onClick: () => void, active?: boolean, title: string }> = ({ icon, onClick, active, title }) => (
    <button 
        onClick={onClick} 
        title={title}
        className={`p-2.5 rounded-xl transition-all ${active ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
    >
        {icon}
    </button>
);

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed?: boolean }> = ({ icon, label, active, onClick, collapsed }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-4 transition-all ${collapsed ? 'justify-center p-4 rounded-2xl' : 'px-6 py-4 rounded-2xl'} text-sm font-black uppercase tracking-widest ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 translate-x-1' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title={collapsed ? label : undefined}
    >
        {icon} {!collapsed && <span className="truncate">{label}</span>}
    </button>
);

export default App;

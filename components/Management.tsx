
import React, { useState, useEffect } from 'react';
import { Agent, Project, User, UserRole, Language, RubricItem, AuditType } from '../types';
import { 
    getAgents, saveAgent, deleteAgent, 
    getProjects, saveProject, deleteProject, 
    getUsers, saveUser, deleteUser, 
    getRubric, saveRubricItem, deleteRubricItem, toggleRubricItem, getOrgId 
} from '../services/storageService';
import { Button } from './ui/Button';
import { 
    Plus, Trash2, Users, Briefcase, Shield, ClipboardCheck, 
    Globe, Share2, ShieldCheck, CheckCircle, XCircle, 
    X, Edit3, Save, Sliders, Target, Star, Lock, UserPlus, Fingerprint, Power, Eye, Phone, MessageSquare, Monitor
} from 'lucide-react';
import { translations } from '../utils/translations';
import { toast } from 'react-hot-toast';

interface ManagementProps {
  lang: Language;
  onViewProfile?: (agentId: string) => void;
  onViewProject?: (projectId: string) => void;
  onDataChange?: () => void;
  currentUser: User | null;
}

export const Management: React.FC<ManagementProps> = ({ lang, onDataChange, currentUser, onViewProject }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'agents' | 'projects' | 'users' | 'rubric'>('projects');
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rubric, setRubric] = useState<RubricItem[]>([]);

  // Project Form State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectScore, setNewProjectScore] = useState('90');
  const [newProjectCsat, setNewProjectCsat] = useState('4.5');
  const [selectedRubricIds, setSelectedRubricIds] = useState<string[]>([]);
  
  // Agent Form State
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [agentProjectId, setAgentProjectId] = useState('');
  const [agentAuditChannel, setAgentAuditChannel] = useState<'VOICE' | 'CHAT' | 'BOTH'>('BOTH');

  // User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.AUDITOR);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Rubric Edit State
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);
  const [editRubricLabel, setEditRubricLabel] = useState('');
  const [isAddingKPI, setIsAddingKPI] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setAgents(getAgents());
    setProjects(getProjects());
    setUsers(getUsers());
    setRubric(getRubric());
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    saveProject(
        editingProjectId || Date.now().toString(),
        newProjectName.trim(), 
        { score: parseInt(newProjectScore), csat: parseFloat(newProjectCsat) },
        selectedRubricIds.length > 0 ? selectedRubricIds : undefined
    );
    
    setNewProjectName('');
    setNewProjectScore('90');
    setNewProjectCsat('4.5');
    setSelectedRubricIds([]);
    setEditingProjectId(null);
    loadData();
    toast.success(editingProjectId ? (lang === 'es' ? "Proyecto actualizado" : "Project updated") : t.added);
    if(onDataChange) onDataChange();
  };

  const handleEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setNewProjectName(p.name);
    setNewProjectScore(p.targets?.score.toString() || '90');
    setNewProjectCsat(p.targets?.csat.toString() || '4.5');
    setSelectedRubricIds(p.rubricIds || []);
    toast(lang === 'es' ? `Editando proyecto: ${p.name}` : `Editing project: ${p.name}`);
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    saveAgent({
        id: editingAgentId || Date.now().toString(),
        name: newAgentName.trim(),
        projectId: agentProjectId || undefined,
        auditChannel: agentAuditChannel
    });

    setNewAgentName('');
    setAgentProjectId('');
    setAgentAuditChannel('BOTH');
    setEditingAgentId(null);
    loadData();
    toast.success(editingAgentId ? (lang === 'es' ? "Agente actualizado" : "Agent updated") : t.added);
    if(onDataChange) onDataChange();
  };

  const handleEditAgent = (a: Agent) => {
      setEditingAgentId(a.id);
      setNewAgentName(a.name);
      setAgentProjectId(a.projectId || '');
      setAgentAuditChannel(a.auditChannel || 'BOTH');
      toast(lang === 'es' ? `Editando agente: ${a.name}` : `Editing agent: ${a.name}`);
  };

  const handleToggleKPI = (id: string) => {
      toggleRubricItem(id);
      loadData();
      toast.success(t.saved);
      if(onDataChange) onDataChange();
  };

  const handleAddKPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRubricLabel.trim()) return;
    saveRubricItem({
      id: editingRubricId || `custom_${Date.now()}`,
      label: editRubricLabel.trim(),
      category: 'soft',
      isActive: true,
      type: 'BOTH'
    });
    setEditRubricLabel('');
    setEditingRubricId(null);
    setIsAddingKPI(false);
    loadData();
    toast.success(t.added);
    if(onDataChange) onDataChange();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) {
        toast.error(lang === 'es' ? "Complete nombre y PIN" : "Complete name and PIN");
        return;
    }
    
    saveUser({
        id: editingUserId || Date.now().toString(),
        name: newUserName.trim(),
        pin: newUserPin.trim(),
        role: newUserRole,
        organizationId: getOrgId(currentUser)
    });
    
    setNewUserName('');
    setNewUserPin('');
    setEditingUserId(null);
    loadData();
    toast.success(editingUserId ? (lang === 'es' ? "Usuario actualizado" : "User updated") : t.added);
    if(onDataChange) onDataChange();
  };

  const handleEditUser = (user: User) => {
    setNewUserName(user.name);
    setNewUserPin(user.pin);
    setNewUserRole(user.role);
    setEditingUserId(user.id);
    toast(lang === 'es' ? `Modificando a ${user.name}` : `Modifying ${user.name}`);
  };

  const handleCancelEditUser = () => {
    setNewUserName('');
    setNewUserPin('');
    setEditingUserId(null);
  };

  const handleDeleteProject = (id: string) => {
      if(confirm(lang === 'es' ? "¿Eliminar proyecto?" : "Delete project?")) {
          deleteProject(id);
          loadData();
          toast.success(t.removed);
          if(onDataChange) onDataChange();
      }
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30"><Globe className="w-8 h-8" /></div>
              <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Workspace: {getOrgId(currentUser)}</h2>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest opacity-60">Arquitectura de Datos Maestra</p>
              </div>
          </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-850 rounded-3xl w-fit border border-slate-200 dark:border-slate-800 shadow-inner">
          <ManagementTab active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Briefcase className="w-4 h-4" />} label={t.manageProjects} />
          <ManagementTab active={activeTab === 'rubric'} onClick={() => setActiveTab('rubric')} icon={<ClipboardCheck className="w-4 h-4" />} label={t.manageRubric} />
          <ManagementTab active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Shield className="w-4 h-4" />} label={t.manageUsers} />
          <ManagementTab active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={<Users className="w-4 h-4" />} label={t.manageAgents} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
            <div className="p-10 space-y-12 animate-fade-in-up">
                <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-10 text-white">
                        {editingProjectId ? <Edit3 className="w-8 h-8 text-indigo-400" /> : <Briefcase className="w-8 h-8 text-indigo-400" />}
                        <h3 className="text-3xl font-black uppercase tracking-tighter">{editingProjectId ? "Editar Proyecto" : "Configurar Proyecto"}</h3>
                    </div>
                    <form onSubmit={handleAddProject} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre Proyecto</label>
                                <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold focus:border-indigo-600 transition-all outline-none" placeholder="Ej: Servicio VIP" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Meta Score (%)</label>
                                <input type="number" value={newProjectScore} onChange={e => setNewProjectScore(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold text-center" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Meta CSAT</label>
                                <input step="0.1" type="number" value={newProjectCsat} onChange={e => setNewProjectCsat(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold text-center" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-2"><Sliders className="w-4 h-4" /> KPIs específicos (opcional)</h4>
                            <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {rubric.filter(r => r.isActive).map(item => (
                                    <div key={item.id} onClick={() => setSelectedRubricIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedRubricIds.includes(item.id) ? 'border-indigo-600 bg-indigo-600/10' : 'border-slate-800 opacity-40 hover:opacity-100'}`}>
                                        <span className="text-xs font-black text-white uppercase">{t[item.id] || item.label}</span>
                                        {selectedRubricIds.includes(item.id) ? <CheckCircle className="w-4 h-4 text-indigo-400" /> : <div className="w-4 h-4 border-2 border-slate-700 rounded-full" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit" className="flex-1 h-16 rounded-2xl font-black uppercase text-lg">
                                {editingProjectId ? "Guardar Cambios" : "Guardar Configuración"}
                            </Button>
                            {editingProjectId && (
                                <Button variant="secondary" type="button" onClick={() => { setEditingProjectId(null); setNewProjectName(''); setNewProjectScore('90'); setNewProjectCsat('4.5'); setSelectedRubricIds([]); }} className="h-16 px-8 rounded-2xl">Cancelar</Button>
                            )}
                        </div>
                    </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                    {projects.map(p => (
                        <div key={p.id} className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] group transition-all hover:border-indigo-500/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600"><Briefcase className="w-6 h-6" /></div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditProject(p)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</h4>
                            <div className="flex gap-4 mt-2">
                                <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Target Score</span><span className="text-xs font-bold text-indigo-500">{p.targets?.score || 90}%</span></div>
                                <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Target CSAT</span><span className="text-xs font-bold text-emerald-500">{p.targets?.csat || 4.5}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB: AGENTS */}
        {activeTab === 'agents' && (
            <div className="p-10 space-y-10 animate-fade-in-up">
                 <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-8 text-white">
                        {editingAgentId ? <Edit3 className="w-8 h-8 text-indigo-400" /> : <UserPlus className="w-8 h-8 text-indigo-400" />}
                        <h3 className="text-2xl font-black uppercase tracking-tighter">{editingAgentId ? "Modificar Agente" : "Registrar Agente"}</h3>
                    </div>
                    <form onSubmit={handleAddAgent} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre del Agente</label>
                                <input value={newAgentName} onChange={e => setNewAgentName(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold focus:border-indigo-600 transition-all outline-none" placeholder="Nombre completo" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Proyecto Asignado</label>
                                <select value={agentProjectId} onChange={e => setAgentProjectId(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-600">
                                    <option value="">Sin Proyecto</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Canal a Auditar</label>
                                <div className="flex bg-slate-850 p-1.5 rounded-2xl border border-slate-700">
                                    <button type="button" onClick={() => setAgentAuditChannel('VOICE')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${agentAuditChannel === 'VOICE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Phone className="w-3 h-3" /> Voz</button>
                                    <button type="button" onClick={() => setAgentAuditChannel('CHAT')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${agentAuditChannel === 'CHAT' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}><MessageSquare className="w-3 h-3" /> Chat</button>
                                    <button type="button" onClick={() => setAgentAuditChannel('BOTH')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${agentAuditChannel === 'BOTH' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}><Monitor className="w-3 h-3" /> Ambos</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit" className="flex-1 h-14 font-black uppercase">
                                {editingAgentId ? "Confirmar Cambios" : "Registrar Agente"}
                            </Button>
                            {editingAgentId && (
                                <Button variant="secondary" type="button" onClick={() => { setEditingAgentId(null); setNewAgentName(''); setAgentProjectId(''); setAgentAuditChannel('BOTH'); }} className="h-14 px-8">Cancelar</Button>
                            )}
                        </div>
                    </form>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {agents.map(a => {
                        const proj = projects.find(p => p.id === a.projectId);
                        return (
                            <div key={a.id} className="p-6 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center group relative hover:border-indigo-500/50 transition-all">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => handleEditAgent(a)} className="p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => { if(confirm("¿Eliminar agente?")) { deleteAgent(a.id); loadData(); } }} className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 group-hover:scale-110 transition-transform">{a.name.charAt(0)}</div>
                                <span className="font-black text-xs uppercase dark:text-white text-center line-clamp-1">{a.name}</span>
                                <div className="mt-2 flex flex-col items-center gap-1">
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">{proj ? proj.name : 'Sin Proyecto'}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${a.auditChannel === 'VOICE' ? 'bg-indigo-500/10 text-indigo-500' : a.auditChannel === 'CHAT' ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {a.auditChannel || 'BOTH'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>
        )}

        {/* TAB: RUBRIC */}
        {activeTab === 'rubric' && (
            <div className="p-10 space-y-10 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Biblioteca de KPIs</h3>
                    {!isAddingKPI && <Button onClick={() => setIsAddingKPI(true)} icon={<Plus className="w-5 h-5"/>}>Nuevo Indicador</Button>}
                </div>
                {isAddingKPI && (
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 animate-fade-in max-w-2xl mx-auto">
                        <form onSubmit={handleAddKPI} className="flex gap-4">
                            <input autoFocus value={editRubricLabel} onChange={e => setEditRubricLabel(e.target.value)} className="flex-1 bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold" placeholder="Nombre del KPI" />
                            <Button type="submit">{editingRubricId ? 'Guardar' : 'Agregar'}</Button>
                            <Button variant="secondary" onClick={() => { setIsAddingKPI(false); setEditingRubricId(null); setEditRubricLabel(''); }}><X className="w-4 h-4"/></Button>
                        </form>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rubric.map(item => (
                        <div key={item.id} className={`p-6 rounded-3xl border-2 flex justify-between items-center transition-all ${item.isActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                             <div className="flex flex-col">
                                <span className={`font-black text-sm uppercase tracking-tight ${item.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{t[item.id] || item.label}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase mt-1">{item.category} • {item.type}</span>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => handleToggleKPI(item.id)} className={`p-3 rounded-xl transition-all ${item.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}><Power className="w-4 h-4" /></button>
                                <button onClick={() => { setEditingRubricId(item.id); setEditRubricLabel(item.label); setIsAddingKPI(true); }} className="p-3 text-slate-400 hover:text-indigo-500 rounded-xl"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => { if(confirm("¿Eliminar?")) { deleteRubricItem(item.id); loadData(); } }} className="p-3 text-slate-400 hover:text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && (
            <div className="p-10 space-y-10 animate-fade-in-up">
                <div className="max-w-3xl bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 mx-auto">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                        {editingUserId ? <Edit3 className="w-8 h-8 text-indigo-400" /> : <UserPlus className="w-8 h-8 text-indigo-500" />}
                        {editingUserId ? 'Actualizar Datos Auditor' : 'Registrar Nuevo Auditor'}
                    </h3>
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Nombre</label>
                            <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">PIN Acceso (6 digitos)</label>
                            <input maxLength={6} value={newUserPin} onChange={e => setNewUserPin(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold text-center tracking-widest focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Rol</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="w-full bg-slate-800 border-2 border-slate-700 p-4 rounded-xl text-white font-bold outline-none">
                                <option value={UserRole.AUDITOR}>{t.auditorRole}</option>
                                <option value={UserRole.ADMIN}>{t.adminRole}</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-3">
                            <Button type="submit" className={`flex-1 h-14 font-black uppercase ${editingUserId ? 'bg-indigo-500' : ''}`}>
                                {editingUserId ? 'Confirmar Cambios' : 'Registrar Auditor'}
                            </Button>
                            {editingUserId && <Button variant="secondary" type="button" onClick={handleCancelEditUser} className="h-14 font-black">Cancelar</Button>}
                        </div>
                    </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {users.map(u => (
                        <div key={u.id} className="p-6 bg-slate-50 dark:bg-slate-850 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center group transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white ${u.role === UserRole.ADMIN ? 'bg-indigo-600' : 'bg-emerald-500'}`}>{u.name.charAt(0)}</div>
                                <div>
                                    <span className="font-black text-sm uppercase dark:text-white">{u.name}</span>
                                    <p className="text-[8px] font-black text-slate-500 uppercase">PIN: {u.pin.replace(/./g, '•')}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditUser(u)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                {u.id !== 'admin' && <button onClick={() => { if(confirm("¿Eliminar?")) { deleteUser(u.id); loadData(); } }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const ManagementTab: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`px-8 py-4 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${active ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
        {icon} <span>{label}</span>
    </button>
);

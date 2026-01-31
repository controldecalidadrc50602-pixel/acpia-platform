
import React, { useState, useEffect } from 'react';
import { Audit, AuditType, AuditStatus, Language, Agent, Project } from '../types';
import { getAudits, deleteAudit, saveAudit, getAgents, getProjects, downloadCSV } from '../services/storageService';
import { AuditCard } from './AuditCard';
import { AuditModal } from './AuditModal';
import { translations } from '../utils/translations';
import { 
    Search, Filter, Database, LayoutGrid, List, AlertCircle, 
    Users, Briefcase, Star, Trash2, CheckCircle, FileDown,
    Zap, Calendar, ChevronRight, CheckSquare, Square, X, Target, TrendingUp, User as UserIcon,
    BarChart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Button';

interface CRMProps {
  lang: Language;
  onEdit: (audit: Audit) => void;
  onViewProfile?: (agentName: string) => void;
  onViewProject?: (projectName: string) => void;
  onDataChange?: () => void;
}

type CRMTab = 'audits' | 'agents' | 'projects';

export const CRM: React.FC<CRMProps> = ({ lang, onEdit, onViewProfile, onViewProject, onDataChange }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<CRMTab>('audits');
  const [audits, setAudits] = useState<Audit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AuditStatus | 'ALL'>('ALL');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setAudits(getAudits());
    setAgents(getAgents());
    setProjects(getProjects());
    setSelectedIds(new Set());
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      deleteAudit(id);
      loadAllData();
      if(onDataChange) onDataChange();
      toast.success(t.removed);
    }
  };

  const handleBulkExport = () => {
      const toExport = audits.filter(a => selectedIds.has(a.id));
      if (toExport.length === 0) return;
      downloadCSV(toExport);
      toast.success(lang === 'es' ? "Exportación lista" : "Export ready");
  };

  const filteredAudits = audits.filter(a => {
    const matchesSearch = 
        a.agentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.readableId && a.readableId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchesDates = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
    return matchesSearch && matchesStatus && matchesDates;
  });

  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const avgCsatVal = filteredAudits.length > 0 ? (filteredAudits.reduce((acc, c) => acc + c.csat, 0) / filteredAudits.length).toFixed(1) : "0.0";
  const avgQualityVal = filteredAudits.length > 0 ? Math.round(filteredAudits.reduce((acc, c) => acc + (c.qualityScore || 0), 0) / filteredAudits.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20">
                <Database className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                    {activeTab === 'audits' ? t.crm : activeTab === 'agents' ? t.manageAgents : t.manageProjects}
                </h2>
                <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">RC506 Quality Hub</p>
            </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-850 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
            <TabBtn active={activeTab === 'audits'} onClick={() => { setActiveTab('audits'); setSearchTerm(''); }} icon={<Database className="w-4 h-4" />} label={lang === 'es' ? 'Auditorías' : 'Audits'} />
            <TabBtn active={activeTab === 'agents'} onClick={() => { setActiveTab('agents'); setSearchTerm(''); }} icon={<Users className="w-4 h-4" />} label={lang === 'es' ? 'Agentes' : 'Agents'} />
            <TabBtn active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSearchTerm(''); }} icon={<Briefcase className="w-4 h-4" />} label={lang === 'es' ? 'Proyectos' : 'Projects'} />
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox label={t.totalAudits} value={filteredAudits.length} icon={<Zap className="w-6 h-6" />} color="indigo" />
          <StatBox label={t.score} value={`${avgQualityVal}%`} icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
          <StatBox label={t.avgCsat} value={avgCsatVal} icon={<Star className="w-6 h-6" />} color="orange" />
      </div>

      {/* FILTROS INTELIGENTES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest">
                <Filter className="w-4 h-4" /> {t.filters}
            </div>
            {selectedIds.size > 0 && (
                <Button variant="secondary" size="sm" onClick={handleBulkExport} icon={<FileDown className="w-4 h-4" />}>
                    Export ({selectedIds.size})
                </Button>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Búsqueda (ID de Ticket, Agente...)</label>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={t.typeToSearch}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold text-sm text-slate-900 dark:text-slate-100"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">{t.startDate}</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-4 py-3.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-900 dark:text-slate-100"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">{t.endDate}</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-4 py-3.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-900 dark:text-slate-100"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">{t.status}</label>
                <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-4 py-3.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                    <option value="ALL">TODOS LOS ESTADOS</option>
                    <option value={AuditStatus.APPROVED}>{t.APPROVED || 'APROBADAS'}</option>
                    <option value={AuditStatus.PENDING_REVIEW}>{t.PENDING_REVIEW || 'PENDIENTES'}</option>
                    <option value={AuditStatus.REJECTED}>{t.REJECTED || 'RECHAZADAS'}</option>
                </select>
            </div>
        </div>
      </div>

      <div className="animate-fade-in min-h-[400px]">
          {activeTab === 'audits' && (
              <div className="space-y-6">
                  {filteredAudits.length > 0 ? (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {filteredAudits.map(audit => (
                            <AuditCard 
                                key={audit.id}
                                audit={audit} 
                                lang={lang} 
                                onView={setSelectedAudit} 
                                onDelete={handleDelete}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                          <AlertCircle className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6" />
                          <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lang === 'es' ? 'No se encontraron registros' : 'No records found'}</p>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                  {filteredAgents.map(agent => (
                      <div key={agent.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-indigo-500/50 transition-all group flex flex-col items-center">
                          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4 group-hover:scale-105 transition-transform">
                              {agent.name.charAt(0)}
                          </div>
                          <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-6">{agent.name}</h3>
                          <Button 
                            className="w-full rounded-xl"
                            onClick={() => onViewProfile && onViewProfile(agent.name)}
                          >
                            Ver Perfil QA
                          </Button>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                  {filteredProjects.map(project => (
                      <div key={project.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-purple-500/50 transition-all flex flex-col">
                          <div className="flex items-center gap-4 mb-6">
                              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white"><Briefcase className="w-6 h-6" /></div>
                              <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{project.name}</h3>
                          </div>
                          <Button 
                            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700"
                            onClick={() => onViewProject && onViewProject(project.name)}
                          >
                            Dashboard de Proyecto
                          </Button>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {selectedAudit && (
          <AuditModal audit={selectedAudit} lang={lang} onClose={() => setSelectedAudit(null)} onDelete={handleDelete} onEdit={onEdit} />
      )}
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick} 
        className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${active ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
    >
        {icon} <span>{label}</span>
    </button>
);

const StatBox: React.FC<{ label: string, value: any, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl flex items-center justify-between group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform`}></div>
        <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
            <p className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-${color}-50 dark:bg-${color}-900/30 rounded-2xl flex items-center justify-center text-${color}-500`}>{icon}</div>
    </div>
);

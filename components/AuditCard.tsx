
import React from 'react';
import { Audit, AuditType, AuditStatus, Language } from '../types';
import { Phone, MessageSquare, Eye, Trash2, Smile, Frown, Meh, User, Tag, Hash, Zap, Bot, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { translations } from '../utils/translations';

interface AuditCardProps {
  audit: Audit;
  onView: (audit: Audit) => void;
  onDelete: (id: string) => void;
  onViewProfile?: (agentName: string) => void;
  lang: Language;
}

export const AuditCard: React.FC<AuditCardProps> = ({ audit, onView, onDelete, onViewProfile, lang }) => {
  const isVoice = audit.type === AuditType.VOICE;
  const t = translations[lang];
  
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: AuditStatus) => {
      switch(status) {
          case AuditStatus.APPROVED: return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20"><CheckCircle className="w-3 h-3"/> {lang === 'es' ? 'Aprobada' : 'Approved'}</span>;
          case AuditStatus.REJECTED: return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20"><XCircle className="w-3 h-3"/> {lang === 'es' ? 'Rechazada' : 'Rejected'}</span>;
          default: return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20"><Clock className="w-3 h-3"/> {lang === 'es' ? 'Pendiente' : 'Pending'}</span>;
      }
  };

  const qualityScore = audit.qualityScore || 0;

  return (
    <div className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-500/30`}>
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
          {getStatusBadge(audit.status || AuditStatus.PENDING_REVIEW)}
          {audit.isAiGenerated && (
             <div className="bg-emerald-500/10 text-emerald-500 rounded-lg p-1.5 flex items-center gap-1 border border-emerald-500/20" title="AI Generated">
                 <Bot className="w-3 h-3" />
             </div>
          )}
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="pl-6"> {/* Espacio para el selector masivo */}
          {audit.readableId && (
            <div className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] text-slate-500 font-black mb-2 uppercase tracking-widest">
                #{audit.readableId}
            </div>
          )}

          <button 
                onClick={() => onViewProfile && onViewProfile(audit.agentName)}
                className="font-black text-slate-900 dark:text-white text-lg hover:text-indigo-600 transition-colors block text-left"
          >
                {audit.agentName}
          </button>
          
          <p className="text-xs font-bold text-slate-400 mt-0.5">{audit.project}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
         <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Score</span>
            <span className={`text-xl font-black ${getQualityColor(qualityScore)}`}>{qualityScore}%</span>
         </div>
         <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CSAT</span>
            <div className="flex items-center gap-1">
                <span className="text-xl font-black text-slate-900 dark:text-white">{audit.csat}</span>
                <Smile className={`w-4 h-4 ${audit.csat >= 4 ? 'text-green-500' : 'text-slate-400'}`} />
            </div>
         </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="secondary" size="sm" className="flex-1 bg-slate-50 dark:bg-slate-800 border-none hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" onClick={() => onView(audit)}>
            <Eye className="w-4 h-4 mr-2" /> {t.details}
        </Button>
        <button 
            onClick={() => onDelete(audit.id)}
            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
        >
            <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

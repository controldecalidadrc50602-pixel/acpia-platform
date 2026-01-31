
import React, { useState, useEffect } from 'react';
import { Audit, Language, Agent, Project, AuditType, VoiceAudit } from '../types';
import { getAudits, getAgents, getProjects, getAppSettings, downloadCSV } from '../services/storageService';
import { Button } from './ui/Button';
import { FileDown, Sparkles, Filter, Calendar, FileText, Code } from 'lucide-react';
import { translations } from '../utils/translations';
import { generateReportSummary } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import { toast } from 'react-hot-toast';

interface ReportsProps {
    lang: Language;
}

export const Reports: React.FC<ReportsProps> = ({ lang }) => {
    const t = translations[lang];
    const [audits, setAudits] = useState<Audit[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    // Insights
    const [aiSummary, setAiSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setAudits(getAudits());
        setAgents(getAgents());
        setProjects(getProjects());
    }, []);

    const filteredAudits = audits.filter(a => {
        const dateMatch = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
        const agentMatch = !selectedAgent || a.agentName === selectedAgent;
        const projectMatch = !selectedProject || a.project === selectedProject;
        return dateMatch && agentMatch && projectMatch;
    });

    // Helper: Set Date Ranges
    const setRange = (type: 'week' | 'month') => {
        const end = new Date();
        const start = new Date();
        if(type === 'week') start.setDate(end.getDate() - 7);
        if(type === 'month') start.setMonth(end.getMonth() - 1);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        const summary = await generateReportSummary(filteredAudits, lang);
        setAiSummary(summary);
        setIsGenerating(false);
    };

    const formatDuration = (minutes: number) => {
        if(!minutes) return "-";
        const m = Math.floor(minutes);
        const s = Math.round((minutes - m) * 60);
        return `${m}m ${s}s`;
    };

    const handleExportPDF = () => {
        if (filteredAudits.length === 0) {
            toast.error(t.noAudits);
            return;
        }

        try {
            const doc = new jsPDF();
            const settings = getAppSettings();
            
            // Title
            doc.setFontSize(18);
            doc.text(settings.companyName || t.reportSummary, 14, 20);
            
            doc.setFontSize(10);
            doc.text(`${t.date}: ${new Date().toLocaleDateString()}`, 14, 28);
            doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 14, 33);
            if(selectedAgent) doc.text(`${t.agent}: ${selectedAgent}`, 14, 38);
            if(selectedProject) doc.text(`${t.project}: ${selectedProject}`, 14, 43);

            // Summary
            if(aiSummary) {
                doc.setFontSize(14);
                doc.text(t.reportSummary, 14, 55);
                doc.setFontSize(10);
                const splitSummary = doc.splitTextToSize(aiSummary, 180);
                doc.text(splitSummary, 14, 62);
            }

            const startY = aiSummary ? 100 : 50;

            // Table using autoTable plugin
            autoTable(doc, {
                startY: startY,
                head: [[t.date, t.agent, t.project, 'Type', 'CSAT', t.score]],
                body: filteredAudits.map(a => [
                    a.date,
                    a.agentName,
                    a.project,
                    a.type,
                    a.csat.toString(),
                    (a.qualityScore || 0) + '%'
                ]),
            });

            doc.save(`ACPIA_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("PDF Exported successfully");
        } catch (e) {
            console.error("PDF Export Error:", e);
            toast.error("Failed to generate PDF");
        }
    };

    const handleExportCSV = () => {
        if (filteredAudits.length === 0) {
            toast.error(t.noAudits);
            return;
        }
        downloadCSV(filteredAudits);
        toast.success("CSV Exported successfully");
    }

    const handleExportJSON = () => {
        if (filteredAudits.length === 0) {
            toast.error(t.noAudits);
            return;
        }

        const reportData = {
            metadata: {
                generator: "ACPIA AuditCenter",
                exportDate: new Date().toISOString(),
                totalRecords: filteredAudits.length,
                filtersApplied: {
                    startDate: startDate || 'all',
                    endDate: endDate || 'all',
                    agent: selectedAgent || 'all',
                    project: selectedProject || 'all'
                }
            },
            data: filteredAudits
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ACPIA_Report_DATA_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("JSON Exported successfully");
    };

    // Metrics
    const avgScore = filteredAudits.length > 0 
        ? Math.round(filteredAudits.reduce((a, b) => a + (b.qualityScore || 0), 0) / filteredAudits.length) 
        : 0;
    const avgDuration = filteredAudits.filter(a => a.type === AuditType.VOICE).length > 0
        ? (filteredAudits.filter(a => a.type === AuditType.VOICE) as any[]).reduce((a,b) => a + b.duration, 0) / filteredAudits.filter(a => a.type === AuditType.VOICE).length
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                    <Filter className="w-5 h-5" />
                    {t.filters}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white" />
                     <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white" />
                     
                     <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white">
                         <option value="">{t.allAgents}</option>
                         {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                     </select>
                     
                     <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white">
                         <option value="">{t.allProjects}</option>
                         {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                     </select>
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={() => setRange('week')} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">{t.thisWeek}</button>
                    <button onClick={() => setRange('month')} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">{t.thisMonth}</button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm text-center">
                    <p className="text-slate-500 text-sm">{t.totalAudited}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{filteredAudits.length}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm text-center">
                    <p className="text-slate-500 text-sm">{t.score}</p>
                    <h3 className={`text-3xl font-bold ${avgScore >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{avgScore}%</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm text-center">
                    <p className="text-slate-500 text-sm">{t.avgDuration}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{formatDuration(avgDuration)}</h3>
                </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 border border-indigo-100 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.reportSummary}</h3>
                    </div>
                    <Button onClick={handleGenerateSummary} disabled={isGenerating} size="sm">
                        {isGenerating ? t.generating : t.generateSummary}
                    </Button>
                </div>
                <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[100px] text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {aiSummary || <span className="text-slate-400 italic">{t.noSummary}</span>}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
                     <h3 className="font-bold text-slate-900 dark:text-white">{t.rawData}</h3>
                     <div className="flex flex-wrap gap-2">
                        <Button onClick={handleExportJSON} variant="secondary" size="sm" icon={<Code className="w-4 h-4 text-blue-500" />}>
                            {t.exportJson}
                        </Button>
                        <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={<FileText className="w-4 h-4 text-green-500" />}>
                            {t.exportCsv}
                        </Button>
                        <Button onClick={handleExportPDF} variant="secondary" size="sm" icon={<FileDown className="w-4 h-4 text-red-500" />}>
                            {t.exportPdf}
                        </Button>
                     </div>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs">
                             <tr>
                                 <th className="px-6 py-3">{t.date}</th>
                                 <th className="px-6 py-3">{t.agent}</th>
                                 <th className="px-6 py-3">{t.project}</th>
                                 <th className="px-6 py-3">Type</th>
                                 <th className="px-6 py-3">{t.duration}</th>
                                 <th className="px-6 py-3">CSAT</th>
                                 <th className="px-6 py-3">{t.score}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {filteredAudits.map(a => (
                                 <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                                     <td className="px-6 py-4">{a.date}</td>
                                     <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{a.agentName}</td>
                                     <td className="px-6 py-4">{a.project}</td>
                                     <td className="px-6 py-4">{a.type}</td>
                                     <td className="px-6 py-4">
                                         {a.type === AuditType.VOICE 
                                            ? formatDuration((a as VoiceAudit).duration) 
                                            : formatDuration((a as any).duration || 0)
                                         }
                                     </td>
                                     <td className="px-6 py-4">{a.csat}</td>
                                     <td className={`px-6 py-4 font-bold ${(a.qualityScore || 0) >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{a.qualityScore}%</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};



import React, { useState } from 'react';
import { Audit, Language, RubricItem, AuditType } from '../types';
import { translations } from '../utils/translations';
import { getProjects } from '../services/storageService';
import { generatePerformanceAnalysis } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, Target, TrendingUp, AlertTriangle, Users, ArrowLeft, Phone, MessageSquare, BarChart2, Zap } from 'lucide-react';
import { Button } from './ui/Button';

interface ProjectScorecardProps {
    projectName: string;
    audits: Audit[];
    rubric: RubricItem[];
    lang: Language;
    onBack: () => void;
}

export const ProjectScorecard: React.FC<ProjectScorecardProps> = ({ projectName, audits, rubric, lang, onBack }) => {
    const t = translations[lang];
    const projectAudits = audits.filter(a => a.project === projectName);
    const projects = getProjects();
    const currentProjectConfig = projects.find(p => p.name === projectName);
    
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    // Stats
    const totalAudits = projectAudits.length;
    const avgScore = totalAudits > 0 ? Math.round(projectAudits.reduce((a,b) => a + (b.qualityScore || 0), 0) / totalAudits) : 0;
    const avgCsat = totalAudits > 0 ? (projectAudits.reduce((a,b) => a + b.csat, 0) / totalAudits).toFixed(1) : "0.0";
    
    // Channel Stats
    const voiceAudits = projectAudits.filter(a => a.type === AuditType.VOICE);
    const chatAudits = projectAudits.filter(a => a.type === AuditType.CHAT);
    const voiceAvg = voiceAudits.length > 0 ? Math.round(voiceAudits.reduce((a,b) => a + (b.qualityScore || 0), 0) / voiceAudits.length) : 0;
    const chatAvg = chatAudits.length > 0 ? Math.round(chatAudits.reduce((a,b) => a + (b.qualityScore || 0), 0) / chatAudits.length) : 0;

    // Targets
    const targetScore = currentProjectConfig?.targets?.score || 90;
    const targetCsat = currentProjectConfig?.targets?.csat || 4.5;

    // Weakness Analysis (Count only)
    const failures: Record<string, number> = {};
    projectAudits.forEach(a => {
        if(a.customData) {
            Object.entries(a.customData).forEach(([key, val]) => {
                if(val === false) failures[key] = (failures[key] || 0) + 1;
            });
        }
    });

    // Full Rubric Breakdown (Average %)
    const rubricStats = rubric.map(item => {
        let total = 0;
        let pass = 0;
        projectAudits.forEach(a => {
            if(a.customData && a.customData[item.id] !== undefined) {
                total++;
                if(a.customData[item.id]) pass++;
            }
        });
        return {
            ...item,
            avg: total > 0 ? Math.round((pass / total) * 100) : 0,
            count: total
        };
    }).filter(i => i.count > 0).sort((a,b) => a.avg - b.avg);

    const topWeaknesses = Object.entries(failures)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
            const rItem = rubric.find(r => r.id === id);
            return {
                name: rItem ? (t[rItem.id] || rItem.label) : id,
                count,
                percentage: Math.round((count / totalAudits) * 100)
            };
        });

    // Radar Data
    const categories = Array.from(new Set(rubric.map(r => r.category))) as string[];
    const radarData = categories.map(cat => {
        const catItems = rubric.filter(r => r.category === cat);
        const catItemIds = catItems.map(r => r.id);
        
        let projPass = 0;
        let projTotal = 0;
        projectAudits.forEach(a => {
            if(a.customData) {
                catItemIds.forEach(id => {
                    if(a.customData![id] !== undefined) {
                        projTotal++;
                        if(a.customData![id]) projPass++;
                    }
                });
            }
        });
        
        let compPass = 0;
        let compTotal = 0;
        audits.forEach(a => {
             if(a.customData) {
                catItemIds.forEach(id => {
                    if(a.customData![id] !== undefined) {
                        compTotal++;
                        if(a.customData![id]) compPass++;
                    }
                });
            }
        });

        return {
            subject: cat.toUpperCase(),
            A: projTotal > 0 ? Math.round((projPass / projTotal) * 100) : 0,
            B: compTotal > 0 ? Math.round((compPass / compTotal) * 100) : 0,
            fullMark: 100
        };
    });

    // Top Agents in Project
    const agentScores: Record<string, { total: number; count: number }> = {};
    projectAudits.forEach(a => {
        if (!agentScores[a.agentName]) agentScores[a.agentName] = { total: 0, count: 0 };
        agentScores[a.agentName].total += (a.qualityScore || 0);
        agentScores[a.agentName].count++;
    });
    
    const topAgents = Object.entries(agentScores)
        .map(([name, data]) => ({ name, score: Math.round(data.total / data.count) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const handleGenerateAnalysis = async () => {
        setIsGeneratingAnalysis(true);
        const stats = {
            avgScore,
            avgCsat,
            totalAudits,
            voiceAvg,
            voiceCount: voiceAudits.length,
            chatAvg,
            chatCount: chatAudits.length,
            topWeakness: rubricStats[0]?.label
        };
        const analysis = await generatePerformanceAnalysis(projectName, 'PROJECT', stats, lang);
        setAiAnalysis(analysis);
        setIsGeneratingAnalysis(false);
    };

    const getProgressColor = (score: number) => {
        if(score >= 90) return 'bg-green-500';
        if(score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <Button onClick={onBack} variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4"/>}>Back</Button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-purple-500" />
                    {t.projectDashboard}: {projectName}
                </h1>
            </div>

            {/* AI HEADER */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                    <h3 className="font-bold flex items-center gap-2 mb-2 text-lg">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        {t.performanceSummary}
                    </h3>
                    <div className="bg-black/20 rounded-lg p-4 text-sm leading-relaxed min-h-[60px]">
                         {aiAnalysis || (isGeneratingAnalysis ? t.generatingAnalysis : <span className="opacity-60 italic">AI Analysis pending...</span>)}
                    </div>
                </div>
                {!aiAnalysis && (
                    <Button onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis} className="mt-2 bg-white/10 hover:bg-white/20 border-white/20">
                        {isGeneratingAnalysis ? t.generatingAnalysis : t.generateAnalysis}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-slate-500 text-sm">Total Audits</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAudits}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                     <p className="text-slate-500 text-sm">{t.score}</p>
                     <div className="flex items-end gap-2">
                         <p className={`text-3xl font-bold ${avgScore >= targetScore ? 'text-green-500' : 'text-red-500'}`}>{avgScore}%</p>
                         <p className="text-xs text-slate-400 mb-1">Target: {targetScore}%</p>
                     </div>
                     {avgScore >= targetScore && <div className="absolute top-4 right-4 text-green-500/20"><Target className="w-12 h-12"/></div>}
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                     <p className="text-slate-500 text-sm">CSAT</p>
                     <div className="flex items-end gap-2">
                        <p className={`text-3xl font-bold ${parseFloat(avgCsat) >= targetCsat ? 'text-green-500' : 'text-yellow-500'}`}>{avgCsat}</p>
                        <p className="text-xs text-slate-400 mb-1">Target: {targetCsat}</p>
                     </div>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-slate-500 text-sm">Active Agents</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white">{Object.keys(agentScores).length}</p>
                 </div>
            </div>

            {/* CHANNEL BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                     <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase font-bold">{t.voiceStats}</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{voiceAvg}%</span>
                            <span className="text-xs text-slate-400">({voiceAudits.length})</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                         <Phone className="w-5 h-5 text-indigo-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                         <span className="text-xs text-slate-500 uppercase font-bold">{t.chatStats}</span>
                         <div className="flex items-baseline gap-2 mt-1">
                             <span className="text-2xl font-bold text-slate-900 dark:text-white">{chatAvg}%</span>
                             <span className="text-xs text-slate-400">({chatAudits.length})</span>
                         </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* RUBRIC BREAKDOWN (New) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1">
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-slate-500" />
                        {t.rubricBreakdown}
                    </h3>
                     <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {rubricStats.map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t[item.id] || item.label}</span>
                                        <span className={`font-bold ${item.avg >= 90 ? 'text-green-500' : item.avg >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {item.avg}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${getProgressColor(item.avg)}`} 
                                            style={{ width: `${item.avg}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                     </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        {t.projectPerformance}
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Project" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.5} />
                                <Radar name="Company" dataKey="B" stroke="#94a3b8" strokeWidth={1} fill="#94a3b8" fillOpacity={0.1} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                         <div className="flex justify-center gap-4 text-xs mt-2">
                            <span className="text-purple-500">● {projectName}</span>
                            <span className="text-slate-500">● {t.teamAvg}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1">
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        {t.topWeaknesses}
                    </h3>
                    <div className="space-y-4">
                        {topWeaknesses.map((w, i) => (
                            <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-lg flex items-center justify-between">
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">{w.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{w.count} fails</span>
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{w.percentage}%</span>
                                </div>
                            </div>
                        ))}
                        {topWeaknesses.length === 0 && <p className="text-slate-500 italic text-center py-8">No significant weaknesses detected. Great job!</p>}
                    </div>

                     <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                         <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-500" />
                            {t.topAgents}
                        </h3>
                        <div className="space-y-3">
                            {topAgents.map((agent, i) => (
                                <div key={i} className="flex items-center justify-between p-2">
                                     <div className="flex items-center gap-3">
                                         <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                                         <span className="font-bold text-slate-900 dark:text-white text-sm">{agent.name}</span>
                                     </div>
                                     <span className="text-green-500 font-bold text-sm">{agent.score}%</span>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

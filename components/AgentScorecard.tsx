

import React, { useState } from 'react';
import { Audit, Language, Badge, CoachingPlan, RubricItem, AuditType } from '../types';
import { translations } from '../utils/translations';
import { generateCoachingPlan, generatePerformanceAnalysis } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Trophy, Flame, Star, Target, Shield, Zap, BookOpen, Brain, Phone, MessageSquare, BarChart2 } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from 'react-hot-toast';

interface AgentScorecardProps {
    agentName: string;
    audits: Audit[]; // All audits in system, filter inside
    rubric: RubricItem[];
    lang: Language;
    onBack: () => void;
}

export const AgentScorecard: React.FC<AgentScorecardProps> = ({ agentName, audits, rubric, lang, onBack }) => {
    const t = translations[lang];
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [coachingPlans, setCoachingPlans] = useState<CoachingPlan[]>([]); 

    const agentAudits = audits.filter(a => a.agentName === agentName);
    const recentAudits = [...agentAudits].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    // Stats Calculation
    const totalAudits = agentAudits.length;
    const avgScore = totalAudits > 0 ? Math.round(agentAudits.reduce((a,b) => a + (b.qualityScore || 0), 0) / totalAudits) : 0;
    const avgCsat = totalAudits > 0 ? (agentAudits.reduce((a,b) => a + b.csat, 0) / totalAudits).toFixed(1) : "0.0";

    // Channel Stats
    const voiceAudits = agentAudits.filter(a => a.type === AuditType.VOICE);
    const chatAudits = agentAudits.filter(a => a.type === AuditType.CHAT);
    
    const voiceAvg = voiceAudits.length > 0 ? Math.round(voiceAudits.reduce((a,b) => a + (b.qualityScore || 0), 0) / voiceAudits.length) : 0;
    const chatAvg = chatAudits.length > 0 ? Math.round(chatAudits.reduce((a,b) => a + (b.qualityScore || 0), 0) / chatAudits.length) : 0;

    // Rubric Breakdown
    const rubricStats = rubric.map(item => {
        let total = 0;
        let pass = 0;
        agentAudits.forEach(a => {
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
    }).filter(i => i.count > 0).sort((a,b) => a.avg - b.avg); // Sort by lowest score first (weaknesses top)

    // Streak Logic (Consecutive > 90%)
    let currentStreak = 0;
    for(const a of recentAudits) {
        if((a.qualityScore || 0) >= 90) currentStreak++;
        else break;
    }

    // Badge Logic
    const badges: Badge[] = [];
    if(currentStreak >= 3) badges.push({ id: 'fire', name: t.badge_fire, icon: 'Flame', description: "3+ audits > 90%", color: "text-orange-500" });
    if(parseFloat(avgCsat) >= 4.8) badges.push({ id: 'star', name: t.badge_star, icon: 'Star', description: "Avg CSAT > 4.8", color: "text-yellow-400" });
    if(avgScore >= 95) badges.push({ id: 'sniper', name: t.badge_sniper, icon: 'Target', description: "Avg Quality > 95%", color: "text-red-500" });
    if(totalAudits >= 10) badges.push({ id: 'shield', name: t.badge_shield, icon: 'Shield', description: "Veteran: 10+ Audits", color: "text-blue-400" });

    // Radar Data Preparation
    const categories = Array.from(new Set(rubric.map(r => r.category))) as string[];
    const radarData = categories.map(cat => {
        const catItems = rubric.filter(r => r.category === cat);
        const catItemIds = catItems.map(r => r.id);
        
        let agentPass = 0;
        let agentTotal = 0;
        
        agentAudits.forEach(a => {
            if(a.customData) {
                catItemIds.forEach(id => {
                    if(a.customData![id] !== undefined) {
                        agentTotal++;
                        if(a.customData![id]) agentPass++;
                    }
                });
            }
        });
        
        let teamPass = 0;
        let teamTotal = 0;
        audits.forEach(a => {
             if(a.customData) {
                catItemIds.forEach(id => {
                    if(a.customData![id] !== undefined) {
                        teamTotal++;
                        if(a.customData![id]) teamPass++;
                    }
                });
            }
        });

        return {
            subject: cat.toUpperCase(),
            A: agentTotal > 0 ? Math.round((agentPass / agentTotal) * 100) : 0,
            B: teamTotal > 0 ? Math.round((teamPass / teamTotal) * 100) : 0,
            fullMark: 100
        };
    });

    const handleGeneratePlan = async () => {
        setIsGeneratingPlan(true);
        const plan = await generateCoachingPlan(agentName, recentAudits, lang);
        if(plan) {
            setCoachingPlans(prev => [plan, ...prev]);
            toast.success("Plan Generated!");
        } else {
            toast.error("Could not generate plan (insufficient data).");
        }
        setIsGeneratingPlan(false);
    };

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
            topWeakness: rubricStats[0]?.label // Since we sorted rubricStats by lowest avg
        };
        const analysis = await generatePerformanceAnalysis(agentName, 'AGENT', stats, lang);
        setAiAnalysis(analysis);
        setIsGeneratingAnalysis(false);
    };

    const renderIcon = (iconName: string, colorClass: string) => {
        const props = { className: `w-6 h-6 ${colorClass}` };
        switch(iconName) {
            case 'Flame': return <Flame {...props} />;
            case 'Star': return <Star {...props} />;
            case 'Target': return <Target {...props} />;
            case 'Shield': return <Shield {...props} />;
            default: return <Trophy {...props} />;
        }
    };

    const getProgressColor = (score: number) => {
        if(score >= 90) return 'bg-green-500';
        if(score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <Button onClick={onBack} variant="secondary" size="sm">← Back</Button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    {t.playerCard}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: PROFILE CARD */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] relative overflow-hidden text-center text-white">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/50 to-transparent"></div>
                        
                        <div className="relative inline-block mb-4">
                            <div className="w-32 h-32 rounded-full border-4 border-indigo-500 bg-slate-800 flex items-center justify-center text-4xl font-bold text-indigo-300 shadow-xl relative z-10">
                                {agentName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-900 font-black text-xl w-12 h-12 flex items-center justify-center rounded-full border-2 border-slate-900 z-20 shadow-lg">
                                {avgScore}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold mb-1">{agentName}</h2>
                        <p className="text-indigo-300 text-sm font-medium mb-6">Quality Agent</p>

                        <div className="grid grid-cols-3 gap-2 mb-6 border-t border-b border-slate-700 py-4">
                            <div>
                                <p className="text-xs text-slate-400 uppercase">CSAT</p>
                                <p className="text-xl font-bold text-green-400">{avgCsat}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">{t.streak}</p>
                                <p className="text-xl font-bold text-orange-400 flex items-center justify-center gap-1">
                                    <Flame className="w-4 h-4" /> {currentStreak}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Audits</p>
                                <p className="text-xl font-bold text-blue-400">{totalAudits}</p>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <p className="text-xs text-slate-500 mb-2 uppercase">{t.skillRadar}</p>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Agent" dataKey="A" stroke="#818cf8" strokeWidth={2} fill="#818cf8" fillOpacity={0.5} />
                                    <Radar name="Team" dataKey="B" stroke="#94a3b8" strokeWidth={1} fill="#94a3b8" fillOpacity={0.1} />
                                </RadarChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 text-xs mt-[-20px]">
                                <span className="text-indigo-400">● {agentName}</span>
                                <span className="text-slate-500">● {t.teamAvg}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI PERFORMANCE SUMMARY */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-300" />
                                {t.performanceSummary}
                            </h3>
                            {!aiAnalysis && (
                                <button 
                                    onClick={handleGenerateAnalysis} 
                                    disabled={isGeneratingAnalysis}
                                    className="bg-white/20 hover:bg-white/30 rounded-full p-2 disabled:opacity-50 transition-colors"
                                >
                                    <Zap className={`w-4 h-4 ${isGeneratingAnalysis ? 'animate-pulse' : ''}`} />
                                </button>
                            )}
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 text-sm leading-relaxed min-h-[100px]">
                            {aiAnalysis || (isGeneratingAnalysis ? t.generatingAnalysis : <span className="opacity-60 italic text-xs">Click icon to generate analysis...</span>)}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: STATS & DETAILS */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* CHANNEL STATS ROW */}
                    <div className="grid grid-cols-2 gap-4">
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

                    {/* RUBRIC BREAKDOWN */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-slate-500" />
                            {t.rubricBreakdown}
                        </h3>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {rubricStats.map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t[item.id] || item.label}</span>
                                        <span className={`font-bold ${item.avg >= 90 ? 'text-green-500' : item.avg >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {item.avg}% <span className="text-xs text-slate-400 font-normal">({item.count})</span>
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
                            {rubricStats.length === 0 && <p className="text-center text-slate-500 italic py-4">No data available for breakdown.</p>}
                        </div>
                    </div>

                    {/* TROPHY CABINET */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            {t.trophyCabinet}
                        </h3>
                        {badges.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {badges.map(badge => (
                                    <div key={badge.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:scale-105 transition-transform">
                                        <div className={`p-3 rounded-full bg-slate-200 dark:bg-slate-800 mb-2 ${badge.color}`}>
                                            {renderIcon(badge.icon, badge.color)}
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{badge.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{badge.description}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm italic">No badges earned yet.</p>
                        )}
                    </div>

                    {/* COACHING PLANS */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-500" />
                                {t.coachingPlan}
                            </h3>
                            <Button size="sm" onClick={handleGeneratePlan} disabled={isGeneratingPlan} icon={<Zap className="w-3 h-3"/>}>
                                {isGeneratingPlan ? t.generatingPlan : t.generatePlan}
                            </Button>
                        </div>

                        {coachingPlans.length > 0 ? (
                            <div className="space-y-4">
                                {coachingPlans.map(plan => (
                                    <div key={plan.id} className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-indigo-700 dark:text-indigo-300">{plan.topic}</h4>
                                            <span className="text-xs text-indigo-500">{plan.date}</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {plan.tasks.map((task, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                                                    {task}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>{t.noPlans}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

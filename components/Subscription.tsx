
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Check, Star, Zap, Info, ShieldCheck, TrendingUp } from 'lucide-react';
import { Language, SubscriptionPlan } from '../types';
import { translations } from '../utils/translations';
import { toast } from 'react-hot-toast';

interface SubscriptionProps {
    lang: Language;
}

export const Subscription: React.FC<SubscriptionProps> = ({ lang }) => {
    const t = translations[lang];
    const [isAnnual, setIsAnnual] = useState(true);

    const plans: SubscriptionPlan[] = [
        {
            id: 'STANDARD',
            name: t.plan_standard,
            price: isAnnual ? 39 : 49,
            color: 'bg-white dark:bg-slate-900',
            aiLimit: '0 Smart Audits',
            features: ['feature_manual', 'feature_reports']
        },
        {
            id: 'AI_PRO',
            name: t.plan_ai_pro,
            price: isAnnual ? 79 : 99,
            color: 'bg-white dark:bg-slate-900',
            aiLimit: '1,000 Smart Audits /mo',
            features: ['feature_manual', 'feature_smart', 'feature_feedback', 'feature_sentiment']
        },
        {
            id: 'PERFORMANCE',
            name: t.plan_performance,
            price: isAnnual ? 119 : 149,
            color: 'bg-indigo-950 text-white',
            recommended: true,
            aiLimit: '5,000 Smart Audits /mo',
            features: ['feature_manual', 'feature_smart', 'feature_feedback', 'feature_coaching', 'feature_alerts', 'feature_connectors']
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-32 space-y-20 animate-fade-in">
            <div className="text-center space-y-6 pt-10">
                <h1 className="text-5xl font-black dark:text-white tracking-tighter">
                    {lang === 'es' ? 'Precios Transparentes' : 'Transparent Pricing'}
                </h1>
                <p className="text-lg text-slate-500 max-w-xl mx-auto italic">
                    {lang === 'es' ? 'Infraestructura de IA Enterprise a una fracción del costo.' : 'Enterprise AI infrastructure at a fraction of the cost.'}
                </p>
                
                <div className="flex items-center justify-center gap-4 mt-8">
                    <span className="text-sm font-bold opacity-60">{t.monthly}</span>
                    <button onClick={() => setIsAnnual(!isAnnual)} className="w-14 h-7 bg-indigo-600 rounded-full relative">
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isAnnual ? 'left-8' : 'left-1'}`}></div>
                    </button>
                    <span className="text-sm font-bold">{t.yearly} <span className="text-green-500">(-20%)</span></span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                {plans.map(plan => (
                    <div key={plan.id} className={`relative flex flex-col p-10 rounded-[2.5rem] border-2 transition-all ${plan.recommended ? 'scale-105 border-indigo-500 shadow-2xl bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                        {plan.recommended && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">Recomendado</div>}
                        
                        <h3 className="text-xl font-black mb-2 uppercase">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-5xl font-black">${plan.price}</span>
                            <span className="text-sm opacity-60">/{t.month}</span>
                        </div>

                        <div className="mb-8 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase mb-1">
                                <Zap className="w-3 h-3" /> IA Included
                            </div>
                            <p className="text-lg font-bold">{plan.aiLimit}</p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <Check className={`w-4 h-4 mt-0.5 ${plan.recommended ? 'text-indigo-400' : 'text-green-500'}`} />
                                    <span className="opacity-80">{t[feat] || feat}</span>
                                </li>
                            ))}
                        </ul>

                        <Button className={`h-14 font-black rounded-xl ${plan.recommended ? 'bg-white text-indigo-900' : 'bg-indigo-600 text-white'}`} onClick={() => toast.success("Plan seleccionado")}>
                            {t.upgrade}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <h4 className="font-bold dark:text-white">Costo de IA Eficiente</h4>
                    <p className="text-sm text-slate-500">Optimizamos los tokens usando Gemini Flash, permitiéndote ofrecer auditorías masivas a un costo operativo de centavos.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                    <h4 className="font-bold dark:text-white">ROI Inmediato</h4>
                    <p className="text-sm text-slate-500">Un auditor manual procesa 4 llamadas/hora. Nuestra IA procesa 400. Recuperas la inversión el primer día.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                        <Info className="w-6 h-6 text-purple-500" />
                    </div>
                    <h4 className="font-bold dark:text-white">Escalabilidad Sin Límites</h4>
                    <p className="text-sm text-slate-500">Si excedes tu cuota mensual, puedes comprar packs adicionales de IA directamente desde el panel de facturación.</p>
                </div>
            </div>
        </div>
    );
};

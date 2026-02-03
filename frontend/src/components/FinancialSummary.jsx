import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Wallet, Receipt, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function FinancialSummary({ data, loading }) {
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 h-32 animate-pulse">
                        <div className="h-4 w-20 bg-slate-700 rounded mb-4"></div>
                        <div className="h-8 w-32 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 w-24 bg-slate-700/50 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const { ocupacao, financeiro } = data;
    const lucroPositivo = financeiro.lucro >= 0;

    const cards = [
        {
            title: 'Ocupação',
            value: `${ocupacao.taxa}%`,
            subtitle: `${ocupacao.alugadas} de ${ocupacao.total} kitnets`,
            icon: Users,
            color: 'blue',
            badges: [
                { label: `${ocupacao.alugadas} Alugadas`, color: 'emerald' },
                { label: `${ocupacao.livres} Livres`, color: 'slate' },
            ]
        },
        {
            title: 'Receita Mês',
            value: formatCurrency(financeiro.realizado),
            subtitle: `Meta: ${formatCurrency(financeiro.potencial)}`,
            icon: DollarSign,
            color: 'emerald',
            progress: financeiro.potencial > 0 ? (financeiro.realizado / financeiro.potencial) * 100 : 0,
            trend: financeiro.realizado >= financeiro.potencial * 0.8 ? 'up' : null
        },
        {
            title: 'Despesas Mês',
            value: formatCurrency(financeiro.despesas),
            subtitle: 'Total de gastos',
            icon: Receipt,
            color: 'rose',
            trend: financeiro.despesas > financeiro.realizado * 0.5 ? 'warning' : null
        },
        {
            title: 'Lucro Líquido',
            value: formatCurrency(financeiro.lucro),
            subtitle: lucroPositivo ? 'Resultado positivo' : 'Resultado negativo',
            icon: lucroPositivo ? PiggyBank : Wallet,
            color: lucroPositivo ? 'emerald' : 'red',
            highlight: true,
            trend: lucroPositivo ? 'up' : 'down'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const TrendIcon = card.trend === 'up' ? ArrowUpRight : card.trend === 'down' ? ArrowDownRight : null;

                return (
                    <div
                        key={index}
                        className={`relative bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 overflow-hidden group transition-all duration-300 hover:border-${card.color}-500/30 ${card.highlight ? `ring-1 ring-${card.color}-500/20` : ''}`}
                    >
                        {/* Background Icon */}
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Icon className={`w-16 h-16 text-${card.color}-400`} />
                        </div>

                        {/* Content */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.title}</p>
                                {TrendIcon && (
                                    <div className={`p-1 rounded-full ${card.trend === 'up' ? 'bg-emerald-500/10' : card.trend === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                                        <TrendIcon className={`w-3 h-3 ${card.trend === 'up' ? 'text-emerald-400' : card.trend === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />
                                    </div>
                                )}
                            </div>

                            <h3 className={`text-2xl font-bold mb-2 ${card.color === 'red' ? 'text-red-400' : 'text-white'}`}>
                                {card.value}
                            </h3>

                            {/* Badges */}
                            {card.badges && (
                                <div className="flex gap-2 text-xs flex-wrap">
                                    {card.badges.map((badge, i) => (
                                        <span
                                            key={i}
                                            className={`px-2 py-1 bg-${badge.color}-500/10 text-${badge.color}-400 rounded-md border border-${badge.color}-500/20`}
                                        >
                                            {badge.label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Progress Bar */}
                            {card.progress !== undefined && (
                                <div className="mt-2">
                                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`bg-${card.color}-500 h-full rounded-full transition-all duration-500`}
                                            style={{ width: `${Math.min(card.progress, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">{card.subtitle}</p>
                                </div>
                            )}

                            {/* Simple Subtitle */}
                            {!card.badges && card.progress === undefined && (
                                <p className="text-[10px] text-slate-500">{card.subtitle}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default FinancialSummary;

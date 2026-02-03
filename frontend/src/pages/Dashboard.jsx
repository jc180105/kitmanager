import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LayoutDashboard, Receipt, FileText, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import FinancialSummary from '../components/FinancialSummary';
import CashFlowChart from '../components/CashFlowChart';
import ExpenseManager from '../components/ExpenseManager';
import { API_URL } from '../utils/config';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [trigger, setTrigger] = useState(0);
    const [data, setData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch Stats
            const statsRes = await fetch(`${API_URL}/dashboard/stats`);
            const statsJson = await statsRes.json();
            setData(statsJson);

            // Fetch Notifications (Vencimentos)
            const notifRes = await fetch(`${API_URL}/kitnets/vencimentos`);
            if (notifRes.ok) {
                const notifJson = await notifRes.json();
                setNotifications(notifJson);
            }
        } catch (err) {
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, trigger]);

    const handleRefresh = () => {
        setTrigger(t => t + 1);
    };

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'expenses', label: 'Despesas', icon: Receipt },
        { id: 'reports', label: 'Relatório', icon: FileText },
    ];

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Finanças</h2>
                    <p className="text-slate-400 text-sm">Controle financeiro do seu negócio</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors border border-slate-700/50 disabled:opacity-50"
                    title="Atualizar Dashboard"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-800/30 p-1 rounded-xl border border-slate-700/30 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* KPI Cards */}
                        <FinancialSummary data={data} loading={loading} />

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Cash Flow Chart */}
                            <div className="lg:col-span-2">
                                <CashFlowChart refreshTrigger={trigger} />
                            </div>

                            {/* Notifications */}
                            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden flex flex-col h-full">
                                <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-medium text-slate-300">Atenção / Vencimentos</span>
                                    </div>
                                </div>

                                <div className="flex-1 p-0 overflow-y-auto max-h-[250px] lg:max-h-[280px] custom-scrollbar">
                                    {loading ? (
                                        <div className="p-8 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                            <Calendar className="w-10 h-10 text-slate-700 mb-2" />
                                            <p className="text-sm text-slate-500">Nenhum vencimento próximo.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-700/30">
                                            {notifications.map((item) => {
                                                const days = item.daysUntilDue;
                                                let style;
                                                if (days < 0) {
                                                    style = { text: 'text-red-500 font-bold', bg: 'bg-red-500/20', border: 'border-red-500/30', label: `Atrasado (${Math.abs(days)}d)` };
                                                } else if (days === 0) {
                                                    style = { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Vence Hoje!' };
                                                } else if (days === 1) {
                                                    style = { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Amanhã' };
                                                } else if (days <= 3) {
                                                    style = { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: `${days} dias` };
                                                } else {
                                                    style = { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: `${days} dias` };
                                                }

                                                return (
                                                    <div key={item.id} className="p-3 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-white text-sm">Kitnet {item.numero}</span>
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                                                    {style.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 truncate w-32 sm:w-40">
                                                                {item.inquilino_nome || 'Inquilino'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-emerald-400 font-bold text-sm">{formatCurrency(item.valor)}</p>
                                                            <p className="text-[10px] text-slate-500">Dia {item.dia_vencimento}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-slate-800/50 text-[10px] text-slate-500 text-center border-t border-slate-700/30">
                                    Próximos 7 dias e pendências
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <ExpenseManager onUpdate={handleRefresh} />
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        {/* Monthly Report Card */}
                        <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                            <div className="p-4 border-b border-slate-700/30 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-slate-300">Resumo do Mês Atual</span>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : data ? (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Receitas */}
                                        <div className="text-center p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Receitas</p>
                                            <p className="text-3xl font-bold text-white">{formatCurrency(data.financeiro.realizado)}</p>
                                            <p className="text-xs text-slate-500 mt-1">de {formatCurrency(data.financeiro.potencial)} potencial</p>
                                        </div>

                                        {/* Despesas */}
                                        <div className="text-center p-4 bg-rose-500/5 rounded-xl border border-rose-500/20">
                                            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">Despesas</p>
                                            <p className="text-3xl font-bold text-white">{formatCurrency(data.financeiro.despesas)}</p>
                                            <p className="text-xs text-slate-500 mt-1">gastos no período</p>
                                        </div>

                                        {/* Lucro */}
                                        <div className={`text-center p-4 rounded-xl border ${data.financeiro.lucro >= 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${data.financeiro.lucro >= 0 ? 'text-blue-400' : 'text-red-400'}`}>Lucro Líquido</p>
                                            <p className={`text-3xl font-bold ${data.financeiro.lucro >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                {formatCurrency(data.financeiro.lucro)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {data.financeiro.lucro >= 0 ? 'resultado positivo' : 'resultado negativo'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Additional Stats */}
                                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-white">{data.ocupacao.taxa}%</p>
                                            <p className="text-xs text-slate-400">Taxa de Ocupação</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-emerald-400">{data.ocupacao.alugadas}</p>
                                            <p className="text-xs text-slate-400">Kitnets Alugadas</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-slate-300">{data.ocupacao.livres}</p>
                                            <p className="text-xs text-slate-400">Kitnets Livres</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-amber-400">{formatCurrency(data.financeiro.pendente)}</p>
                                            <p className="text-xs text-slate-400">A Receber</p>
                                        </div>
                                    </div>

                                    {/* Margin Indicator */}
                                    <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-slate-400">Margem de Lucro</span>
                                            <span className={`text-sm font-bold ${data.financeiro.realizado > 0 ? (data.financeiro.lucro / data.financeiro.realizado * 100) >= 50 ? 'text-emerald-400' : 'text-amber-400' : 'text-slate-400'}`}>
                                                {data.financeiro.realizado > 0 ? Math.round((data.financeiro.lucro / data.financeiro.realizado) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${data.financeiro.lucro >= 0 ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.max(0, Math.min(100, data.financeiro.realizado > 0 ? (data.financeiro.lucro / data.financeiro.realizado) * 100 : 0))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400">
                                    Erro ao carregar dados
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

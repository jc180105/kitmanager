import { useEffect, useState } from 'react';
import { X, TrendingUp, Users, DollarSign, Loader2, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { api } from '../utils/api';

function DashboardModal({ onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const { ocupacao, financeiro, grafico } = data;

    // Configuração do Gráfico
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-300 mb-1 text-sm font-medium">{label}</p>
                    <p className="text-emerald-400 font-bold text-lg">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl my-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
                            <p className="text-slate-400">Visão geral do negócio</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Receita Card */}
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">Receita Realizada (Mês)</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(financeiro.realizado)}</h3>
                                </div>
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(financeiro.realizado / (financeiro.potencial || 1)) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Meta: <span className="text-slate-300">{formatCurrency(financeiro.potencial)}</span>
                            </p>
                        </div>

                        {/* Ocupação Card */}
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">Taxa de Ocupação</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">{ocupacao.taxa}%</h3>
                                </div>
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex gap-2 text-sm">
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                                    {ocupacao.alugadas} Alugadas
                                </span>
                                <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-md">
                                    {ocupacao.livres} Livres
                                </span>
                            </div>
                        </div>

                        {/* Pendente Card */}
                        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">A Receber</p>
                                    <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(financeiro.pendente)}</h3>
                                </div>
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Wallet className="w-5 h-5 text-amber-400" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                Valor pendente de recebimento neste mês.
                            </p>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-6">Histórico de Receita (6 Meses)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={grafico}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis
                                        dataKey="mes_referencia"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickLine={false}
                                        tickFormatter={(value) => `R$ ${value}`}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                        {grafico.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#10b981" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardModal;

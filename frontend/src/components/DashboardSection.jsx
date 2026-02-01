import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Loader2, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

function DashboardSection() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true); // Controlar visibilidade do gráfico?

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            // Em Vercel/Prod, getApiUrl deve ser resolvido. Aqui uso fallback simples ou window.location logic se necessario
            // Mas posso copiar a logica do App.jsx ou assumir que o fetch relative funciona se configured proxy, 
            // ou usar VITE_API_URL.
            const API_URL = import.meta.env.VITE_API_URL ||
                (window.location.hostname.includes('vercel') ? 'https://kitmanager-production.up.railway.app' : 'http://localhost:3001');

            const res = await fetch(`${API_URL}/dashboard/stats`);
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
            <div className="p-8 flex justify-center items-center bg-slate-800/30 rounded-2xl border border-slate-700/30 mb-6">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const { ocupacao, financeiro, grafico } = data;

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
        <div className="mb-6 animate-fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Ocupação Card */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ocupação</p>
                        <h3 className="text-2xl font-bold text-white mb-2">{ocupacao.taxa}%</h3>
                        <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                                {ocupacao.alugadas} Alugadas
                            </span>
                            <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-md">
                                {ocupacao.livres} Livres
                            </span>
                        </div>
                    </div>
                </div>

                {/* Receita Card */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-16 h-16 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Receita (Mês)</p>
                        <h3 className="text-2xl font-bold text-white mb-2">{formatCurrency(financeiro.realizado)}</h3>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden max-w-[150px]">
                            <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${Math.min((financeiro.realizado / (financeiro.potencial || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Meta: {formatCurrency(financeiro.potencial)}
                        </p>
                    </div>
                </div>

                {/* Pendente Card */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-16 h-16 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">A Receber</p>
                        <h3 className="text-2xl font-bold text-white mb-2">{formatCurrency(financeiro.pendente)}</h3>
                        <p className="text-[10px] text-slate-500">
                            Falta entrar esse valor para bater a meta.
                        </p>
                    </div>
                </div>
            </div>

            {/* Collapsible Chart Section */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">Evolução da Receita (6 Meses)</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isExpanded && (
                    <div className="p-4 pt-0 h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={grafico}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="mes_referencia"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {grafico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#10b981" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardSection;

import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Wallet, ChevronDown, ChevronUp, AlertCircle, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

function DashboardSection({ refreshTrigger, apiUrl }) {
    const [data, setData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = apiUrl || (window.location.hostname.includes('vercel') ? 'https://kitmanager-production.up.railway.app' : 'http://localhost:3001');

                // Fetch Stats
                const statsRes = await fetch(`${baseUrl}/dashboard/stats`);
                const statsJson = await statsRes.json();
                setData(statsJson);

                // Fetch Notifications (Vencimentos)
                const notifRes = await fetch(`${baseUrl}/kitnets/vencimentos`);
                if (notifRes.ok) {
                    const notifJson = await notifRes.json();
                    setNotifications(notifJson);
                }
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger, apiUrl]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const calculateDays = (diaVencimento) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let dueDate = new Date(currentYear, currentMonth, diaVencimento);

        // If due date is earlier than today (e.g. today 25, due 10), 
        // it might mean it's due next month (if paid) OR overdue (if not paid).
        // But the backend endpoint '/kitnets/vencimentos' typically returns upcoming due dates logic.
        // However, purely based on date comparison:
        if (dueDate < today) {
            dueDate = new Date(currentYear, currentMonth + 1, diaVencimento);
        }

        const diffTime = dueDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getUrgencyStyle = (days) => {
        if (days <= 0) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Vence Hoje!' };
        if (days === 1) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Amanhã' };
        if (days <= 3) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: `${days} dias` };
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: `${days} dias` };
    };

    if (loading) {
        return (
            <div className="mb-6 animate-pulse">
                {/* Skeleton Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 h-32 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                            <div className="h-4 w-20 bg-slate-700 rounded mb-4"></div>
                            <div className="h-8 w-32 bg-slate-700 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-slate-700/50 rounded"></div>
                        </div>
                    ))}
                </div>
                {/* Skeleton Chart */}
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 h-[240px] p-4">
                    <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
                    <div className="flex items-end justify-between h-[160px] gap-2 px-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-full bg-slate-700/30 rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                        ))}
                    </div>
                </div>
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
        <div className="mb-6 animate-fade-in space-y-4">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Ocupação Card */}
                <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
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
                <div className="col-span-2 md:col-span-1 bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-16 h-16 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">A Receber</p>
                        <h3 className="text-2xl font-bold text-white mb-2">{formatCurrency(financeiro.pendente)}</h3>
                        <p className="text-[10px] text-slate-500">
                            Falta entrar esse valor.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid: Chart + Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* 1. Chart Section (Takes 2 columns on large screens) */}
                <div className="lg:col-span-2 bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden flex flex-col">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-slate-300">Evolução da Receita</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {isExpanded && (
                        <div className="p-4 pt-0 min-h-[200px] flex-1 w-full flex items-center justify-center">
                            {grafico && grafico.length > 0 ? (
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={grafico}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis
                                                dataKey="mes_referencia"
                                                stroke="#94a3b8"
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(val) => {
                                                    const [year, month] = val.split('-');
                                                    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                                    return `${months[parseInt(month) - 1]}`;
                                                }}
                                            />
                                            <YAxis hide domain={[0, 'auto']} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={40}>
                                                {grafico.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill="#10b981" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                    <TrendingUp className="w-12 h-12 mb-2 text-slate-500" />
                                    <p className="text-sm text-slate-400">Sem dados históricos.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Future Notifications / Alerts List */}
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-slate-300">Atenção / Vencimentos</span>
                        </div>
                    </div>

                    <div className="flex-1 p-0 overflow-y-auto max-h-[250px] lg:max-h-[300px] custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                <Calendar className="w-10 h-10 text-slate-700 mb-2" />
                                <p className="text-sm text-slate-500">Nenhum vencimento ou pendência.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/30">
                                {notifications.map((item) => {
                                    // Use backend provided daysUntilDue if available, else calc (fallback)
                                    const days = item.daysUntilDue !== undefined ? item.daysUntilDue : calculateDays(item.dia_vencimento);

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
                    {/* Tiny Footer */}
                    <div className="p-2 bg-slate-800/50 text-[10px] text-slate-500 text-center border-t border-slate-700/30">
                        Mostrando pendências e próximos 7 dias
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardSection;

import { useState, useEffect } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart, Area } from 'recharts';
import { API_URL } from '../utils/config';

function CashFlowChart({ refreshTrigger }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch revenue data
                const statsRes = await fetch(`${API_URL}/dashboard/stats`);
                const stats = await statsRes.json();

                // Fetch expenses for each month in the chart
                const chartData = [];
                const months = stats.grafico || [];

                for (const month of months) {
                    // Fetch expenses for this month
                    const expRes = await fetch(`${API_URL}/despesas?mes=${month.mes_referencia}`);
                    const expenses = await expRes.json();
                    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.valor), 0);

                    chartData.push({
                        mes_referencia: month.mes_referencia,
                        receita: parseFloat(month.total) || 0,
                        despesas: totalExpenses,
                        lucro: (parseFloat(month.total) || 0) - totalExpenses
                    });
                }

                setData(chartData);
            } catch (err) {
                console.error('Error fetching cash flow data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const [year, month] = label.split('-');
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const monthName = months[parseInt(month) - 1];

            return (
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl">
                    <p className="text-slate-300 mb-2 text-sm font-medium border-b border-slate-700 pb-2">
                        {monthName} {year}
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-emerald-400 text-xs">Receita</span>
                            <span className="text-emerald-400 font-bold text-sm">
                                {formatCurrency(payload.find(p => p.dataKey === 'receita')?.value || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-rose-400 text-xs">Despesas</span>
                            <span className="text-rose-400 font-bold text-sm">
                                {formatCurrency(payload.find(p => p.dataKey === 'despesas')?.value || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-700">
                            <span className="text-white text-xs">Lucro</span>
                            <span className={`font-bold text-sm ${(payload.find(p => p.dataKey === 'lucro')?.value || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(payload.find(p => p.dataKey === 'lucro')?.value || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                <div className="p-4">
                    <div className="h-6 w-48 bg-slate-700 rounded mb-6 animate-pulse"></div>
                    <div className="flex items-end justify-between h-[200px] gap-2 px-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-1 w-full items-end">
                                <div className="w-1/2 bg-emerald-700/30 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                                <div className="w-1/2 bg-rose-700/30 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 40 + 10}%` }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">Fluxo de Caixa</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded">Receita vs Despesas</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {isExpanded && (
                <div className="p-4 pt-0">
                    {data.length > 0 ? (
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                            return months[parseInt(month) - 1];
                                        }}
                                    />
                                    <YAxis
                                        hide
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span className="text-xs text-slate-400 ml-1">
                                                {value === 'receita' ? 'Receita' : value === 'despesas' ? 'Despesas' : 'Lucro'}
                                            </span>
                                        )}
                                    />
                                    <Bar
                                        dataKey="receita"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                    <Bar
                                        dataKey="despesas"
                                        fill="#f43f5e"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="lucro"
                                        stroke="#60a5fa"
                                        strokeWidth={2}
                                        dot={{ fill: '#60a5fa', strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 6, fill: '#60a5fa' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                            <BarChart3 className="w-12 h-12 mb-2 text-slate-500" />
                            <p className="text-sm text-slate-400">Sem dados históricos.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CashFlowChart;

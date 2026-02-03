import { useState, useEffect } from 'react';
import { History as HistoryIcon, ArrowRight, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { API_URL } from '../utils/config';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'pagamento', 'alteracao'
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/historico?limit=50`);
                if (!response.ok) throw new Error('Erro ao buscar histórico');
                const data = await response.json();
                setHistory(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <HistoryIcon className="w-6 h-6 text-purple-400" />
                            Histórico
                        </h2>
                        <p className="text-slate-400 text-sm">Registro de atividades e pagamentos</p>
                    </div>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-xl self-start md:self-auto">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('pagamento')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pagamento'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        Pagamentos
                    </button>
                    <button
                        onClick={() => setFilter('alteracao')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'alteracao'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        Status
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="p-6 text-center">
                        <div className="inline-block p-3 bg-red-500/10 rounded-lg mb-2">
                            <span className="text-red-400 font-medium whitespace-pre-wrap">{error}</span>
                        </div>
                    </div>
                )}

                {!loading && !error && history.length === 0 && (
                    <div className="text-center py-16 px-4">
                        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Nenhum histórico registrado ainda.</p>
                    </div>
                )}

                {!loading && !error && history.length > 0 && (
                    <div className="divide-y divide-slate-700/50">
                        {history
                            .filter(item => filter === 'all' || item.tipo === filter)
                            .map((item) => (
                                <div key={`${item.tipo}-${item.id}`} className="p-4 sm:p-5 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                            {/* Ícone baseado no tipo */}
                                            <div className={`p-2 rounded-lg ${item.tipo === 'pagamento'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-indigo-500/10 text-indigo-400'
                                                }`}>
                                                {item.tipo === 'pagamento' ? (
                                                    <span className="font-bold text-lg">R$</span>
                                                ) : (
                                                    <HistoryIcon className="w-5 h-5" />
                                                )}
                                            </div>

                                            <div>
                                                <span className="text-white font-medium text-lg block">
                                                    {item.titulo}
                                                    <span className="text-slate-400 text-base font-normal ml-2">
                                                        - Kitnet {item.kitnet_numero || '?'}
                                                    </span>
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {formatDate(item.data)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-12 flex items-center gap-3 text-sm mt-2 sm:mt-0">
                                        {item.tipo === 'pagamento' ? (
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase">Referência</span>
                                                    <span className="text-slate-300 font-medium">{item.detalhe_1}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase">Valor</span>
                                                    <span className="text-emerald-400 font-bold">
                                                        {Number(item.detalhe_2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 w-full">
                                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.detalhe_1 === 'livre'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {item.detalhe_1?.toUpperCase() || 'N/A'}
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
                                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.detalhe_2 === 'livre'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {item.detalhe_2?.toUpperCase() || 'N/A'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

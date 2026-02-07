import { useState, useEffect } from 'react';
import { History as HistoryIcon, ArrowRight, Loader2, ArrowLeft, Calendar, ChevronDown, ChevronUp, User, DollarSign, Home, ChevronRight } from 'lucide-react';
import { API_URL } from '../utils/config';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selectedKitnet, setSelectedKitnet] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/historico?limit=100`);
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
        if (!dateString) return '-';
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(dateString));
        } catch (e) {
            return '-';
        }
    };

    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredHistory = history.filter(item => {
        const typeMatch = filter === 'all' || item.tipo === filter;
        const kitnetMatch = selectedKitnet === 'all' ||
            Number(item.kitnet_numero || 0) === Number(selectedKitnet);
        return typeMatch && kitnetMatch;
    });

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex md:items-center justify-between gap-4">
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
                            <p className="text-slate-400 text-sm">
                                {filteredHistory.length} registro{filteredHistory.length !== 1 ? 's' : ''} encontrado{filteredHistory.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <select
                            value={selectedKitnet}
                            onChange={(e) => setSelectedKitnet(e.target.value)}
                            className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="all">Todas as Kitnets</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Kitnet {i + 1}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex bg-slate-800/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'all'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('pagamento')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'pagamento'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Pagamentos
                        </button>
                        <button
                            onClick={() => setFilter('alteracao')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'alteracao'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Status
                        </button>
                    </div>

                    <div className="md:hidden w-full">
                        <select
                            value={selectedKitnet}
                            onChange={(e) => setSelectedKitnet(e.target.value)}
                            className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="all">Todas as Kitnets</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Kitnet {i + 1}</option>
                            ))}
                        </select>
                    </div>
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
                            <span className="text-red-400 font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {!loading && !error && history.length === 0 && (
                    <div className="text-center py-16 px-4">
                        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Nenhum histórico registrado ainda.</p>
                    </div>
                )}

                {!loading && !error && filteredHistory.length > 0 && (
                    <div className="divide-y divide-slate-700/50">
                        {filteredHistory.map((item) => {
                            const itemId = `${item.tipo}-${item.id}`;
                            const isExpanded = expandedId === itemId;

                            return (
                                <div
                                    key={itemId}
                                    className={`transition-colors cursor-pointer ${isExpanded ? 'bg-slate-700/30' : 'hover:bg-slate-800/50'}`}
                                    onClick={() => item.tipo === 'pagamento' ? navigate(`/pagamento/${item.id}`) : toggleExpand(itemId)}
                                >
                                    {/* Main Row */}
                                    <div className="p-4 sm:p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {/* Icon */}
                                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${item.tipo === 'pagamento'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-indigo-500/10 text-indigo-400'
                                                    }`}>
                                                    {item.tipo === 'pagamento' ? (
                                                        <DollarSign className="w-5 h-5" />
                                                    ) : (
                                                        <Home className="w-5 h-5" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-white font-semibold">
                                                            {item.tipo === 'pagamento' ? 'Pagamento Registrado' : 'Alteração de Status'}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                                                            Kitnet {item.kitnet_numero || '?'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {formatDate(item.data || item.data_alteracao)}
                                                    </p>
                                                    {item.tipo === 'pagamento' && item.detalhe_3 && (
                                                        <p className="text-[10px] text-emerald-400/80 mt-1">
                                                            💳 {item.detalhe_3}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick Info + Expand */}
                                            <div className="flex items-center gap-3">
                                                {item.tipo === 'pagamento' ? (
                                                    <span className="text-emerald-400 font-bold text-lg">
                                                        {formatCurrency(item.detalhe_2)}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.detalhe_1 === 'livre'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {item.detalhe_1}
                                                        </span>
                                                        <ArrowRight className="w-3 h-3 text-slate-500" />
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.detalhe_2 === 'livre'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {item.detalhe_2}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.tipo === 'pagamento' ? (
                                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                                ) : isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 animate-fade-in">
                                            <div className="ml-12 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                                {item.tipo === 'pagamento' ? (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mês Referência</p>
                                                            <p className="text-white font-medium">{item.detalhe_1 || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Valor Pago</p>
                                                            <p className="text-emerald-400 font-bold">{formatCurrency(item.detalhe_2)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Data Registro</p>
                                                            <p className="text-slate-300">{formatDate(item.data)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">ID Registro</p>
                                                            <p className="text-slate-400 font-mono text-xs">#{item.id}</p>
                                                        </div>
                                                        {item.detalhe_3 && (
                                                            <div className="col-span-2 sm:col-span-4">
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Forma de Pagamento</p>
                                                                <p className="text-emerald-400 font-medium text-sm">{item.detalhe_3}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status Anterior</p>
                                                            <p className={`font-bold ${item.detalhe_1 === 'livre' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {item.detalhe_1?.toUpperCase() || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Novo Status</p>
                                                            <p className={`font-bold ${item.detalhe_2 === 'livre' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {item.detalhe_2?.toUpperCase() || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Data Alteração</p>
                                                            <p className="text-slate-300">{formatDate(item.data)}</p>
                                                        </div>
                                                        {item.detalhe_2 === 'alugada' && (
                                                            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-700/50">
                                                                <p className="text-xs text-slate-400">
                                                                    <User className="w-3 h-3 inline mr-1" />
                                                                    Kitnet foi alugada para um novo inquilino
                                                                </p>
                                                            </div>
                                                        )}
                                                        {item.detalhe_2 === 'livre' && (
                                                            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-700/50">
                                                                <p className="text-xs text-slate-400">
                                                                    <Home className="w-3 h-3 inline mr-1" />
                                                                    Kitnet foi liberada e está disponível para aluguel
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

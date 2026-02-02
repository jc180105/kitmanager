import { useState, useEffect } from 'react';
import { History as HistoryIcon, ArrowRight, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { API_URL } from '../utils/config';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <HistoryIcon className="w-6 h-6 text-purple-400" />
                        Histórico de Alterações
                    </h2>
                    <p className="text-slate-400 text-sm">Registro de atividades recentes</p>
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
                        {history.map((item) => (
                            <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-800/50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <span className="text-white font-medium text-lg">
                                        Kitnet {item.kitnet_numero}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                                        {formatDate(item.data_alteracao)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.status_anterior === 'livre'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {item.status_anterior?.toUpperCase() || 'N/A'}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.status_novo === 'livre'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {item.status_novo?.toUpperCase() || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { X, History, ArrowRight, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function HistoryModal({ onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
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
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-modal-title"
            >
                <div className="animate-fade-in w-full max-w-lg max-h-[80vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <History className="w-5 h-5 text-purple-400" aria-hidden="true" />
                            </div>
                            <h2 id="history-modal-title" className="text-lg font-semibold text-white">
                                Histórico de Alterações
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {loading && (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                                {error}
                            </div>
                        )}

                        {!loading && !error && history.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                Nenhum histórico disponível
                            </div>
                        )}

                        {!loading && !error && history.length > 0 && (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-4 bg-slate-700/30 rounded-xl"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium text-sm">
                                                    {item.titulo} - Kitnet {item.kitnet_numero}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {item.tipo === 'pagamento' ? `Ref: ${item.detalhe_1}` : 'Mudança de Status'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(item.data)}
                                            </span>
                                        </div>

                                        {item.tipo === 'alteracao' ? (
                                            <div className="flex items-center gap-2 text-sm mt-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.detalhe_1 === 'livre'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {item.detalhe_1?.toUpperCase()}
                                                </span>
                                                <ArrowRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.detalhe_2 === 'livre'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {item.detalhe_2?.toUpperCase()}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-semibold">
                                                    {item.detalhe_2}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-700 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors font-medium"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HistoryModal;

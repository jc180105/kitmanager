import { useEffect, useState } from 'react';
import { Calendar, DollarSign, Loader2, Trash2 } from 'lucide-react';
import MobileDrawer from './MobileDrawer';

function PaymentHistoryModal({ kitnet, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [kitnet.id]);

    const fetchHistory = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/pagamentos/${kitnet.id}`);
            const data = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este registro de pagamento?')) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/pagamentos/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
            } else {
                console.error('Erro ao excluir');
                alert('Erro ao excluir pagamento. Verifique se o backend foi atualizado.');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Format date
    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '-';
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...(includeTime && { hour: '2-digit', minute: '2-digit' })
        };
        return new Intl.DateTimeFormat('pt-BR', options).format(new Date(dateString));
    };

    return (
        <MobileDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </span>
                    Histórico de Pagamentos
                </span>
            }
        >
            <div className="space-y-4">
                {/* Info Header */}
                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-slate-300">
                        Histórico financeiro da <span className="text-white font-medium">Kitnet {kitnet.numero}</span>
                    </p>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Nenhum pagamento registrado.</p>
                        </div>
                    ) : (
                        history.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-emerald-500 text-xs font-bold">✓</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{formatCurrency(record.valor)}</p>
                                        <p className="text-xs text-slate-400">
                                            Ref: {record.mes_referencia || '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Data</p>
                                        <p className="text-xs text-slate-300">
                                            {formatDate(record.data_pagamento)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                                        title="Excluir pagamento"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </MobileDrawer>
    );
}

export default PaymentHistoryModal;

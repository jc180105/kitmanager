import { useEffect, useState } from 'react';
import { X, User, Phone, Calendar, CreditCard, History, FileText, MessageCircle, Edit } from 'lucide-react';
import { generateContract } from '../utils/generateContract';

function KitnetDetailsModal({ kitnet, onClose, onEdit, onTogglePayment }) {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

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
            setLoadingHistory(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '-';

    const handleWhatsApp = () => {
        if (!kitnet.inquilino_telefone) return;
        const phone = kitnet.inquilino_telefone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl my-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            Kitnet {kitnet.numero}
                            <span className={`text-sm px-3 py-1 rounded-full border ${kitnet.status === 'livre'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {kitnet.status === 'livre' ? 'Livre' : 'Alugada'}
                            </span>
                        </h2>
                        <p className="text-slate-400 mt-1">{kitnet.descricao || 'Sem descrição'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {/* Left Column: Tenant Info */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-400" />
                                    Inquilino
                                </h3>
                                <button
                                    onClick={() => { onClose(); onEdit(); }}
                                    className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
                                >
                                    <Edit className="w-3 h-3" /> Editar
                                </button>
                            </div>

                            {kitnet.status === 'alugada' ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Nome</p>
                                        <p className="text-white font-medium text-lg">{kitnet.inquilino_nome || '-'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> Contato
                                            </p>
                                            <p className="text-slate-200">{kitnet.inquilino_telefone || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" /> Valor
                                            </p>
                                            <p className="text-emerald-400 font-bold">{formatCurrency(kitnet.valor)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Entrada
                                            </p>
                                            <p className="text-slate-200">{formatDate(kitnet.data_entrada)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Dia Venc.</p>
                                            <p className="text-slate-200">Dia {kitnet.dia_vencimento || '?'}</p>
                                        </div>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleWhatsApp}
                                            disabled={!kitnet.inquilino_telefone}
                                            className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
                                        >
                                            <MessageCircle className="w-4 h-4" /> WhatsApp
                                        </button>
                                        <button
                                            onClick={() => generateContract(kitnet)}
                                            className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                                        >
                                            <FileText className="w-4 h-4" /> Contrato
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Kitnet Livre</p>
                                    <button
                                        onClick={() => { onClose(); onEdit(); }}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                    >
                                        Adicionar Inquilino
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50 flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <History className="w-5 h-5 text-purple-400" />
                            Histórico Recente
                        </h3>

                        <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-2 custom-scrollbar">
                            {loadingHistory ? (
                                <p className="text-slate-500 text-center py-10">Carregando...</p>
                            ) : history.length === 0 ? (
                                <p className="text-slate-500 text-center py-10">Nenhum pagamento registrado.</p>
                            ) : (
                                history.map(rec => (
                                    <div key={rec.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div>
                                            <p className="text-white font-medium">{formatCurrency(rec.valor)}</p>
                                            <p className="text-xs text-slate-400">Ref: {rec.mes_referencia}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">{formatDate(rec.data_pagamento)}</p>
                                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Pago</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KitnetDetailsModal;

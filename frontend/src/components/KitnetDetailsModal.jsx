import { useEffect, useState } from 'react';
import { User, Phone, Calendar, CreditCard, History, FileText, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { generateContract } from '../utils/generateContract';
import { toast } from 'sonner';
import MobileDrawer from './MobileDrawer';

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

    const deletePayment = async (paymentId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/pagamentos/${paymentId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setHistory(prev => prev.filter(p => p.id !== paymentId));
                toast.success('Pagamento removido!');
            } else {
                toast.error('Erro ao remover pagamento');
            }
        } catch (error) {
            console.error('Erro ao deletar pagamento:', error);
            toast.error('Erro ao remover pagamento');
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
        <MobileDrawer
            isOpen={true}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    Kitnet {kitnet.numero}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${kitnet.status === 'livre'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        {kitnet.status === 'livre' ? 'Livre' : 'Alugada'}
                    </span>
                </span>
            }
        >
            <div className="space-y-3 sm:space-y-4">
                {/* Description */}
                <p className="text-slate-400 text-xs sm:text-sm">{kitnet.descricao || 'Sem descrição'}</p>

                {/* Tenant Section */}
                <div className="bg-slate-700/30 p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            Inquilino
                        </h3>
                        <button
                            onClick={() => { onClose(); onEdit(); }}
                            className="text-[10px] sm:text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10"
                        >
                            <Edit className="w-3 h-3" /> Editar
                        </button>
                    </div>

                    {kitnet.status === 'alugada' ? (
                        <div className="space-y-2 sm:space-y-3">
                            {/* Name */}
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nome</p>
                                <p className="text-white font-medium text-sm sm:text-base">{kitnet.inquilino_nome || '-'}</p>
                            </div>

                            {/* Contact & Value - Side by Side */}
                            <div className="flex gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> Contato
                                    </p>
                                    <p className="text-slate-200 text-xs sm:text-sm truncate">{kitnet.inquilino_telefone || '-'}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <CreditCard className="w-3 h-3" /> Valor
                                    </p>
                                    <p className="text-emerald-400 font-bold text-sm sm:text-base">{formatCurrency(kitnet.valor)}</p>
                                </div>
                            </div>

                            {/* Entry Date & Due Day - Side by Side */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Entrada
                                    </p>
                                    <p className="text-slate-200 text-xs sm:text-sm">{formatDate(kitnet.data_entrada)}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dia Venc.</p>
                                    <p className="text-slate-200 text-xs sm:text-sm">Dia {kitnet.dia_vencimento || '?'}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5 mt-1">
                                <button
                                    onClick={handleWhatsApp}
                                    disabled={!kitnet.inquilino_telefone}
                                    className="flex-1 min-w-[100px] py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 active:bg-emerald-600/40 text-emerald-400 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                </button>
                                <button
                                    onClick={() => generateContract(kitnet)}
                                    className="flex-1 min-w-[100px] py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-400 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                                >
                                    <FileText className="w-3.5 h-3.5" /> Contrato
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-slate-500">
                            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm mb-3">Kitnet Livre</p>
                            <button
                                onClick={() => { onClose(); onEdit(); }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm"
                            >
                                Adicionar Inquilino
                            </button>
                        </div>
                    )}
                </div>

                {/* Payment History */}
                <div className="bg-slate-700/30 p-3 sm:p-4 rounded-xl">
                    <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2 mb-2">
                        <History className="w-3.5 h-3.5 text-purple-400" />
                        Histórico Recente
                    </h3>

                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {loadingHistory ? (
                            <p className="text-slate-500 text-center py-2 text-xs">Carregando...</p>
                        ) : history.length === 0 ? (
                            <p className="text-slate-500 text-center py-2 text-xs">Nenhum pagamento registrado.</p>
                        ) : (
                            history.slice(0, 5).map(rec => (
                                <div key={rec.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg text-xs group">
                                    <div>
                                        <p className="text-white font-medium">{formatCurrency(rec.valor)}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-slate-500">Ref: {rec.mes_referencia}</p>
                                            {rec.forma_pagamento && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 border border-slate-600">
                                                    {rec.forma_pagamento}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400">{formatDate(rec.data_pagamento)}</p>
                                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">Pago</span>
                                        </div>
                                        {/* Delete Button */}
                                        <button
                                            onClick={() => deletePayment(rec.id)}
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-50 hover:opacity-100"
                                            title="Remover pagamento"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </MobileDrawer>
    );
}

export default KitnetDetailsModal;

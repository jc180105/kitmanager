import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, Calendar, CreditCard, History,
    FileText, MessageCircle, Edit, Loader2, DollarSign, CheckCircle, Pencil, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../utils/config';
import { generateContract } from '../utils/generateContract';

export default function KitnetDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [kitnet, setKitnet] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        fetchKitnet();
        fetchHistory();
    }, [id]);

    const fetchKitnet = async () => {
        try {
            const response = await fetch(`${API_URL}/kitnets`);
            const data = await response.json();
            const found = data.find(k => k.id === parseInt(id));
            if (found) {
                setKitnet(found);
            } else {
                toast.error('Kitnet não encontrada');
                navigate('/');
            }
        } catch (error) {
            toast.error('Erro ao carregar kitnet');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/pagamentos/${id}`);
            const data = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const togglePayment = async () => {
        try {
            const response = await fetch(`${API_URL}/kitnets/${id}/pagamento`, {
                method: 'PUT',
            });
            if (!response.ok) throw new Error('Erro ao atualizar pagamento');
            const updated = await response.json();
            setKitnet(updated);
            fetchHistory();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const deletePayment = async (paymentId) => {
        try {
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
            toast.error('Erro ao remover pagamento');
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const formatDate = (date) =>
        date ? new Date(date).toLocaleDateString('pt-BR') : '-';

    const handleWhatsApp = () => {
        if (!kitnet?.inquilino_telefone) return;
        const phone = kitnet.inquilino_telefone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!kitnet) return null;

    const isLivre = kitnet.status === 'livre';
    const isPago = kitnet.pago_mes;

    return (
        <div className="animate-fade-in pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Kitnet {kitnet.numero}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isLivre
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}>
                            {isLivre ? 'Livre' : 'Alugada'}
                        </span>
                        {!isLivre && (
                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${isPago
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                <DollarSign className="w-3 h-3" />
                                {isPago ? 'Pago' : 'Pendente'}
                            </span>
                        )}
                    </div>
                </div>
                <p className={`text-2xl font-bold ${isLivre ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(kitnet.valor)}
                </p>
            </div>

            {/* Descrição + Botão Editar */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-white/5">
                <div className="flex justify-between items-start">
                    <p className="text-slate-400 text-sm flex-1">{kitnet.descricao || 'Sem descrição'}</p>
                    <Link
                        to={`/kitnet/${id}/editar`}
                        className="ml-3 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar valor e descrição"
                    >
                        <Pencil className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Inquilino Section */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        Inquilino
                    </h2>
                    <Link
                        to={`/kitnet/${id}/inquilino`}
                        className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10"
                    >
                        <Edit className="w-3 h-3" /> Editar
                    </Link>
                </div>

                {!isLivre ? (
                    <div className="space-y-3">
                        {/* Nome */}
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Nome</p>
                            <p className="text-white font-medium">{kitnet.inquilino_nome || '-'}</p>
                        </div>

                        {/* Contato e Valor */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Contato
                                </p>
                                <p className="text-slate-200 text-sm">{kitnet.inquilino_telefone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Entrada
                                </p>
                                <p className="text-slate-200 text-sm">{formatDate(kitnet.data_entrada)}</p>
                            </div>
                        </div>

                        {/* Vencimento */}
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Dia de Vencimento</p>
                            <p className="text-slate-200 text-sm">Dia {kitnet.dia_vencimento || '?'} de cada mês</p>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                            <button
                                onClick={handleWhatsApp}
                                disabled={!kitnet.inquilino_telefone}
                                className="flex-1 py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 active:bg-emerald-600/40 text-emerald-400 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                            </button>
                            <button
                                onClick={() => generateContract(kitnet)}
                                className="flex-1 py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-400 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                            >
                                <FileText className="w-4 h-4" /> Contrato
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-500">
                        <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm mb-4">Kitnet Livre</p>
                        <Link
                            to={`/kitnet/${id}/inquilino`}
                            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium"
                        >
                            Adicionar Inquilino
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagamento */}
            {!isLivre && (
                <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-white/5">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        Pagamento do Mês
                    </h2>

                    <button
                        onClick={togglePayment}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isPago
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            }`}
                    >
                        {isPago ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Pago - Clique para marcar como pendente
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4" />
                                Pendente - Clique para marcar como pago
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Histórico */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-purple-400" />
                    Histórico de Pagamentos
                </h2>

                <div className="space-y-2">
                    {loadingHistory ? (
                        <p className="text-slate-500 text-center py-4 text-sm">Carregando...</p>
                    ) : history.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 text-sm">Nenhum pagamento registrado.</p>
                    ) : (
                        history.slice(0, 10).map(rec => (
                            <div key={rec.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                    <p className="text-white font-medium text-sm">{formatCurrency(rec.valor)}</p>
                                    <p className="text-xs text-slate-500">Ref: {rec.mes_referencia}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{formatDate(rec.data_pagamento)}</p>
                                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                            Pago
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deletePayment(rec.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        title="Remover pagamento"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

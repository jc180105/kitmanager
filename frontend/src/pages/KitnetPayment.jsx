import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Wallet, Banknote, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

export default function KitnetPayment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [kitnet, setKitnet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [method, setMethod] = useState('');
    const [account, setAccount] = useState('');

    useEffect(() => {
        fetchKitnet();
    }, [id]);

    const fetchKitnet = async () => {
        try {
            const response = await api.get('/kitnets');
            if (!response.ok) throw new Error('Erro ao carregar kitnets');
            const data = await response.json();
            const found = data.find(k => k.id === parseInt(id));

            if (found) {
                setKitnet(found);
            } else {
                toast.error('Kitnet não encontrada');
                navigate('/');
            }
        } catch (error) {
            toast.error('Erro ao carregar dados da kitnet');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!method || (method === 'Pix' && !account)) {
            toast.error('Selecione a forma de pagamento');
            return;
        }

        setProcessing(true);
        try {
            const finalMethod = method === 'Pix' ? `${method} - ${account}` : method;

            const response = await api.put(`/kitnets/${id}/pagamento`, {
                forma_pagamento: finalMethod
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao processar pagamento');
            }

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([10, 30, 20]);
            }

            toast.success('Pagamento registrado com sucesso!');
            navigate('/', { replace: true });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!kitnet) return null;

    const isConfirmDisabled = !method || (method === 'Pix' && !account) || processing;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-safe-area-bottom">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
                <div className="flex items-center gap-3 px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">Registrar Pagamento</h1>
                        <p className="text-sm text-slate-400">Kitnet {kitnet.numero}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 pb-32 space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="p-4 bg-emerald-500/20 rounded-full">
                        <DollarSign className="w-12 h-12 text-emerald-400" />
                    </div>
                </div>

                {/* Message */}
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Confirmar Pagamento
                    </h2>
                    <p className="text-slate-400">
                        Registrar pagamento da Kitnet {kitnet.numero}?
                    </p>
                    {kitnet.inquilino_nome && (
                        <p className="text-sm text-slate-500 mt-1">
                            Inquilino: {kitnet.inquilino_nome}
                        </p>
                    )}
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                        Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setMethod('Dinheiro'); setAccount(''); }}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${method === 'Dinheiro'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-800 border-slate-600 text-slate-400 active:bg-slate-700'
                                }`}
                        >
                            <Banknote className="w-5 h-5" />
                            <span className="font-medium">Dinheiro</span>
                        </button>
                        <button
                            onClick={() => setMethod('Pix')}
                            className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${method === 'Pix'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-800 border-slate-600 text-slate-400 active:bg-slate-700'
                                }`}
                        >
                            <Wallet className="w-5 h-5" />
                            <span className="font-medium">Pix</span>
                        </button>
                    </div>
                </div>

                {/* Account Selection for Pix */}
                {method === 'Pix' && (
                    <div className="space-y-3 animate-fade-in">
                        <label className="block text-sm font-medium text-slate-300">
                            Conta de Destino
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setAccount('Nubank')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${account === 'Nubank'
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                    : 'bg-slate-800 border-slate-600 text-slate-400 active:bg-slate-700'
                                    }`}
                            >
                                <span className="font-medium">Nubank</span>
                            </button>
                            <button
                                onClick={() => setAccount('Bradesco')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${account === 'Bradesco'
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-slate-800 border-slate-600 text-slate-400 active:bg-slate-700'
                                    }`}
                            >
                                <span className="font-medium">Bradesco</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 safe-area-inset-bottom">
                <div className="max-w-2xl mx-auto flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={processing}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-slate-300 rounded-xl transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            'Confirmar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, DollarSign, User, FileText, CheckCircle2, Home, CreditCard } from 'lucide-react';
import { API_URL } from '../utils/config';

export default function PaymentReceipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            console.log(`Fetching payment ${id} from ${API_URL}`);
            try {
                const response = await fetch(`${API_URL}/pagamentos/detalhes/${id}`);
                if (!response.ok) throw new Error('Pagamento não encontrado');
                const data = await response.json();
                setPayment(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '-';
        const options = {
            day: '2-digit',
            month: '2-digit', // Numeric month for screen
            year: 'numeric',
            ...(includeTime && { hour: '2-digit', minute: '2-digit' })
        };
        return new Intl.DateTimeFormat('pt-BR', options).format(new Date(dateString));
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
                <div className="text-red-400 mb-4">{error}</div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-slate-400 hover:text-white flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pb-20 md:pb-0">
            {/* ====================================================================================
                SCREEN LAYOUT (Dark Mode - Restricted to Screen)
               ==================================================================================== */}
            <div className="print:hidden">
                {/* Header */}
                <div className="p-4 md:p-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Voltar</span>
                    </button>
                </div>

                {/* Receipt Card */}
                <div className="max-w-2xl mx-auto p-4 md:p-0">
                    <div className="bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden">
                        {/* Top Accent */}
                        <div className="h-4 bg-emerald-500 w-full"></div>

                        <div className="p-8 md:p-12">
                            {/* Receipt Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Recibo de Pagamento</h1>
                                    <p className="text-slate-500 text-sm">Comprovante gerado eletronicamente</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium text-sm border border-emerald-200">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Pago
                                    </div>
                                    <p className="text-slate-400 text-xs mt-2">#{payment.id}</p>
                                </div>
                            </div>

                            {/* Amount Section */}
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 mb-12">
                                <p className="text-slate-500 uppercase tracking-widest text-xs font-semibold mb-1">Valor Recebido</p>
                                <div className="text-5xl font-bold text-slate-900 tracking-tight">
                                    {formatCurrency(payment.valor)}
                                </div>
                                {payment.forma_pagamento && (
                                    <div className="flex items-center justify-center gap-2 mt-3 text-slate-600">
                                        <span className="text-sm px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
                                            via {payment.forma_pagamento}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-12">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                                        <User className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider font-semibold">Pagador</span>
                                    </div>
                                    <p className="font-medium text-lg text-slate-900">{payment.inquilino_nome || 'Inquilino não identificado'}</p>
                                    {payment.inquilino_cpf && <p className="text-sm text-slate-500">CPF: {payment.inquilino_cpf}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                                        <Home className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider font-semibold">Referência</span>
                                    </div>
                                    <p className="font-medium text-lg text-slate-900">Kitnet {payment.kitnet_numero}</p>
                                    <p className="text-sm text-slate-500">Mês: {payment.mes_referencia}</p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider font-semibold">Data do Pagamento</span>
                                    </div>
                                    <p className="font-medium text-lg text-slate-900">{formatDate(payment.data_pagamento, true)}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 pt-8 text-center">
                                <p className="font-bold text-slate-900 mb-1">Agente Kitnets</p>
                                <p className="text-slate-500 text-sm">Sistema de Gestão de Aluguéis</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-1"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimir Comprovante
                        </button>
                    </div>
                </div>
            </div>

            {/* ====================================================================================
                PRINT LAYOUT (Nubank Style - Hidden on screen)
               ==================================================================================== */}
            <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999] print:p-8">
                <div className="max-w-md mx-auto">
                    {/* Header Icon */}
                    <div className="flex flex-col items-center mb-8 pt-4">
                        {/* We use inline SVG for print reliability or text */}
                        <h2 className="text-xl font-semibold text-center text-black mb-1">
                            Pagamento realizado
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {formatShortDate(payment.data_pagamento, true)}
                        </p>
                    </div>

                    {/* Amount */}
                    <div className="text-center mb-10">
                        <span className="text-gray-500 text-lg font-medium align-top mr-1">R$</span>
                        <span className="text-4xl font-bold text-black tracking-tight">
                            {formatCurrency(payment.valor).replace(/^R\$\s?/, '').trim()}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200 mb-6" />

                    {/* Details List */}
                    <div className="space-y-6">
                        {/* Destino */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Destino</p>
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="font-semibold text-black">Kitnet {payment.kitnet_numero}</p>
                                    <p className="text-sm text-gray-500">Mês Ref: {payment.mes_referencia}</p>
                                </div>
                            </div>
                        </div>

                        {/* Origem */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Origem</p>
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="font-semibold text-black">
                                        {payment.inquilino_nome || 'Inquilino não identificado'}
                                    </p>
                                    {payment.inquilino_cpf && (
                                        <p className="text-sm text-gray-500">CPF: {payment.inquilino_cpf}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Forma de Pagamento */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pagamento via</p>
                            <p className="font-medium text-black capitalize">
                                {payment.forma_pagamento || 'Dinheiro'}
                            </p>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>ID da transação:</span>
                            <span className="font-mono">{payment.id}</span>
                        </div>
                        <div className="text-center mt-4 text-xs text-gray-300">
                            Agente Kitnets
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles Global Override */}
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white !important; }
                    /* Ensure print container visible and properly sized */
                    .print\\:block { display: block !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}

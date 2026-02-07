import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Download, Home, User, Calendar, CreditCard } from 'lucide-react';
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
        return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    };

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '-';
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            ...(includeTime && { hour: '2-digit', minute: '2-digit' })
        };
        const date = new Date(dateString);
        // Format like "7 fev 2026"
        return date.toLocaleDateString('pt-BR', options).replace('.', '');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-4">
                <div className="text-red-500 mb-4 font-medium">{error}</div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-600 hover:text-black flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-20 md:pb-0 flex flex-col items-center print:bg-white pt-8 print:pt-0">
            {/* Header - Hidden on Print */}
            <div className="w-full max-w-md px-4 mb-6 print:hidden flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800">Comprovante</h1>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Receipt Card */}
            <div id="receipt" className="w-full max-w-md bg-white print:shadow-none print:w-full">

                {/* Content */}
                <div className="p-6 md:p-8">
                    {/* Header Icon */}
                    <div className="flex flex-col items-center mb-8 pt-4">
                        <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-4 print:hidden">
                            <CreditCard className="w-6 h-6 text-black" />
                        </div>
                        <h2 className="text-xl font-semibold text-center text-black mb-1">
                            Pagamento realizado
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {formatDate(payment.data_pagamento, true)}
                        </p>
                    </div>

                    {/* Amount */}
                    <div className="text-center mb-10">
                        <span className="text-gray-500 text-lg font-medium align-top mr-1">R$</span>
                        <span className="text-4xl font-bold text-black tracking-tight">
                            {formatCurrency(payment.valor)}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-6" />

                    {/* Details List */}
                    <div className="space-y-6">
                        {/* Destino / Kitnet */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Destino</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Home className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-black">Kitnet {payment.kitnet_numero}</p>
                                    <p className="text-sm text-gray-500">Mês Ref: {payment.mes_referencia}</p>
                                </div>
                            </div>
                        </div>

                        {/* Origem / Pagador */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Origem</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-black">
                                        {payment.inquilino_nome || 'Inquilino não identificado'}
                                    </p>
                                    {payment.inquilino_cpf && (
                                        <p className="text-sm text-gray-500">CPF ***.{payment.inquilino_cpf.slice(3, 6)}.{payment.inquilino_cpf.slice(6, 9)}-**</p>
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
                    <div className="mt-12 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>ID da transação:</span>
                            <span className="font-mono">{payment.id}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Print Button - Mobile Style */}
            <div className="fixed bottom-6 left-0 right-0 px-4 print:hidden flex justify-center">
                <button
                    onClick={handlePrint}
                    className="bg-black text-white px-6 py-3 rounded-full font-medium shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Imprimir Comprovante
                </button>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #receipt, #receipt * {
                        visibility: visible;
                    }
                    #receipt {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 40px;
                        z-index: 9999;
                        background: white;
                    }
                    /* Hide rounded corners and shadows for print */
                    .rounded-2xl, .rounded-xl, .rounded-full {
                        border-radius: 0 !important;
                    }
                    .shadow-xl, .shadow-lg {
                        box-shadow: none !important;
                    }
                    .bg-gray-100 {
                        background-color: transparent !important;
                        border: 1px solid #eee !important;
                    }
                }
            `}</style>
        </div>
    );
}

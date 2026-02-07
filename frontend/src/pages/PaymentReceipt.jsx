import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, DollarSign, User, FileText, CheckCircle2, Home, CreditCard, Share2, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import html2canvas from 'html2canvas';

export default function PaymentReceipt() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sharing, setSharing] = useState(false);
    const receiptRef = useRef(null);

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            try {
                const response = await api.get(`/pagamentos/detalhes/${id}`);
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

    const handleShare = async () => {
        if (!receiptRef.current) return;
        setSharing(true);

        try {
            // Generate image from the receipt element
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // Higher resolution
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('Erro ao gerar imagem para compartilhamento.');
                    setSharing(false);
                    return;
                }

                const file = new File([blob], `Recibo_Kitnet_${payment.kitnet_numero}_${payment.mes_referencia}.png`, { type: 'image/png' });

                // Check if Web Share API is supported and can share files
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Recibo de Pagamento',
                            text: `Recibo de pagamento da Kitnet ${payment.kitnet_numero} - Referência ${payment.mes_referencia}`
                        });
                    } catch (shareError) {
                        if (shareError.name !== 'AbortError') {
                            console.error('Erro ao compartilhar:', shareError);
                        }
                    }
                } else {
                    // Fallback: Download the image or simple WhatsApp text link
                    // Prefer text link for fallback on desktop/unsupported browsers
                    const text = `🧾 *RECIBO DE PAGAMENTO*\n\n` +
                        `*Valor:* R$ ${Number(payment.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                        `*Kitnet:* ${payment.kitnet_numero}\n` +
                        `*Pagador:* ${payment.inquilino_nome || 'N/A'}\n` +
                        `*Data:* ${new Date(payment.data_pagamento).toLocaleDateString('pt-BR')}\n\n` +
                        `_Gerado por Agente Kitnets_`;

                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank');
                }
                setSharing(false);
            }, 'image/png');

        } catch (err) {
            console.error('Erro ao gerar imagem:', err);
            setSharing(false);
            alert('Não foi possível gerar a imagem para compartilhamento.');
        }
    };

    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
                SCREEN LAYOUT (Dark Mode)
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

                {/* Receipt Card Wrapper */}
                <div className="max-w-2xl mx-auto p-4 md:p-0">
                    <div ref={receiptRef} className="bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden relative">
                        {/* Top Accent */}
                        <div className="h-4 bg-emerald-500 w-full"></div>

                        <div className="p-8 md:p-12">
                            {/* Receipt Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Recibo de Pagamento</h1>
                                    <p className="text-slate-500 text-sm">Comprovante gerado eletronicamente</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium text-sm border border-emerald-200">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Pago
                                    </div>
                                    <p className="text-slate-400 text-xs mt-2">#{payment.id}</p>
                                </div>
                            </div>

                            {/* Mobile Badge (Visible only on small screens) */}
                            <div className="sm:hidden mb-8 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium text-sm border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Pago
                                </div>
                            </div>

                            {/* Amount Section */}
                            <div className="text-center py-6 md:py-8 bg-slate-50 rounded-xl border border-slate-100 mb-8 md:mb-12">
                                <p className="text-slate-500 uppercase tracking-widest text-xs font-semibold mb-1">Valor Recebido</p>
                                <div className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-4 mb-8 md:mb-12">
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
                            <div className="border-t border-slate-100 pt-6 md:pt-8 text-center text-slate-400 text-xs">
                                <p className="font-bold text-slate-900 mb-1">Agente Kitnets</p>
                                <p>Sistema de Gestão de Aluguéis</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handleShare}
                            disabled={sharing}
                            className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {sharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                            {sharing ? 'Gerando...' : 'Compartilhar no WhatsApp'}
                        </button>

                        <div className="hidden sm:block">
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================================================================
                PRINT LAYOUT (Updated for Mobile & Desktop - Hidden on screen)
               ==================================================================================== */}
            <div className="hidden print:block" id="print-area">
                <div className="p-8 max-w-[100%] mx-auto bg-white text-black">
                    {/* Simplified Print Layout for Browser Printing */}
                    <div className="flex flex-col items-center mb-8 border-b pb-8">
                        <h1 className="text-2xl font-bold mb-2">RECIBO DE PAGAMENTO</h1>
                        <p className="text-sm text-gray-500">Agente Kitnets - Sistema de Gestão</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Pagador</p>
                            <p className="text-lg font-bold">{payment.inquilino_nome || 'N/A'}</p>
                            {payment.inquilino_cpf && <p className="text-sm">{payment.inquilino_cpf}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase">Valor</p>
                            <p className="text-3xl font-bold">{formatCurrency(payment.valor)}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Detalhes</p>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-2 text-gray-600">Referência</td>
                                    <td className="py-2 text-right font-medium">Kitnet {payment.kitnet_numero} - {payment.mes_referencia}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 text-gray-600">Data de Pagamento</td>
                                    <td className="py-2 text-right font-medium">{formatDate(payment.data_pagamento, true)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 text-gray-600">Forma de Pagamento</td>
                                    <td className="py-2 text-right font-medium capitalize">{payment.forma_pagamento || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 text-gray-600">ID da Transação</td>
                                    <td className="py-2 text-right font-mono text-xs">{payment.id}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="text-center pt-8 text-xs text-gray-400">
                        <p>Este recibo serve como comprovante de pagamento para todos os fins legais.</p>
                    </div>
                </div>
            </div>

            {/* Print Styles Global Override */}
            <style>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { 
                        background-color: white !important; 
                        color: black !important;
                    }
                    /* Hide everything that is NOT the print block */
                    body > *:not(#root) { display: none !important; }
                    #root > *:not(.min-h-screen) { display: none !important; }
                    
                    /* Reset main container */
                    .min-h-screen { 
                        min-height: auto !important; 
                        background: white !important;
                        padding: 0 !important;
                    }

                    /* Hide screen elements */
                    .print\\:hidden { display: none !important; }

                    /* Show print elements */
                    .print\\:block { 
                        display: block !important; 
                    }
                }
            `}</style>
        </div>
    );
}

import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, DollarSign, User, MessageCircle } from 'lucide-react';

function KitnetCard({ kitnet, onToggle, onSelect, onTogglePayment, onEditTenant }) {
    const navigate = useNavigate();
    const isLivre = kitnet.status === 'livre';
    const isLoading = kitnet._loading;
    const isPago = kitnet.pago_mes;

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Helper to get WhatsApp link
    const getWhatsAppLink = () => {
        if (!kitnet.inquilino_telefone) return '#';

        const phone = kitnet.inquilino_telefone.replace(/\D/g, '');
        let message = '';

        if (!isLivre && !isPago) {
            const today = new Date();
            const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
            message = `Olá ${kitnet.inquilino_nome || 'Inquilino'}, lembrete do aluguel da Kitnet ${kitnet.numero} referente a ${monthName}.\nValor: ${formatCurrency(kitnet.valor)}\nVencimento dia ${kitnet.dia_vencimento || '10'}.\n\nSe já pagou, favor desconsiderar.`;
        }

        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    };

    // Handle card click - navigate on mobile, modal on desktop
    const handleCardClick = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            navigate(`/kitnet/${kitnet.id}`);
        } else if (onSelect) {
            onSelect();
        }
    };

    return (
        <article
            onClick={handleCardClick}
            className={`kitnet-card relative bg-slate-800/50 backdrop-blur border-2 rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl h-full flex flex-col ${isLivre
                ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 hover:border-emerald-400'
                : 'border-red-500/50 shadow-lg shadow-red-500/10 hover:border-red-400'
                }`}
            role="listitem"
        >
            {/* Status Badge - Top Right */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                <div
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${isLivre
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                >
                    {isLivre ? 'LIVRE' : 'ALUGADA'}
                </div>
                {/* Payment Badge - Below status when rented */}
                {!isLivre && (
                    <div
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 border ${isPago
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                    >
                        <DollarSign className="w-3 h-3" />
                        {isPago ? 'PAGO' : 'PENDENTE'}
                    </div>
                )}
            </div>

            {/* Kitnet Number and Price */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${isLivre ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                >
                    {String(kitnet.numero).padStart(2, '0')}
                </div>
                <div>
                    <h3 className="text-white font-semibold">Kitnet {kitnet.numero}</h3>
                    <p className={`text-lg font-bold ${isLivre ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(kitnet.valor)}
                    </p>
                </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                {kitnet.descricao || 'Sem descrição'}
            </p>

            {/* Tenant Info (if rented) */}
            {!isLivre && kitnet.inquilino_nome && (
                <div className="mb-3 p-2 bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-400">Inquilino:</p>
                    <p className="text-sm text-white font-medium truncate">{kitnet.inquilino_nome}</p>
                    {kitnet.dia_vencimento && (
                        <p className="text-xs text-slate-400">Vencimento: dia {kitnet.dia_vencimento}</p>
                    )}
                </div>
            )}

            {/* Actions Footer */}
            <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                {/* Toggle Switch (Left Side) */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggle?.();
                    }}
                    disabled={isLoading}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 ${isLivre ? 'bg-emerald-500' : 'bg-red-500'
                        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                    aria-label={isLivre ? 'Marcar como alugada' : 'Marcar como livre'}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${isLivre ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                    {isLoading && (
                        <Loader2 className="w-3 h-3 text-white animate-spin absolute left-1/2 -translate-x-1/2" />
                    )}
                </button>

                {/* 3 Action Buttons (Right Side) - Only when rented */}
                {!isLivre && (
                    <div className="flex items-center gap-1.5">
                        {/* Payment Toggle Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/kitnet/${kitnet.id}/pagamento`);
                            }}
                            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${isPago
                                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                                }`}
                            title={isPago ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                            <DollarSign className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Button */}
                        {kitnet.inquilino_telefone && (
                            <a
                                href={getWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center w-9 h-9 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                                title="Enviar WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        )}

                        {/* Tenant Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const isMobile = window.innerWidth < 768;
                                if (isMobile) {
                                    navigate(`/kitnet/${kitnet.id}/inquilino`);
                                } else {
                                    onEditTenant?.(e);
                                }
                            }}
                            className="flex items-center justify-center w-9 h-9 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            title="Editar Inquilino"
                        >
                            <User className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* When free - just show hint */}
                {isLivre && (
                    <span className="text-xs text-slate-500">
                        Clique para detalhes
                    </span>
                )}
            </div>
        </article>
    );
}

export default memo(KitnetCard);

import { Pencil, User, Loader2, MessageCircle, DollarSign, History } from 'lucide-react';

function KitnetCard({ kitnet, onToggle, onEdit, onEditTenant, onTogglePayment, onShowHistory, onSelect }) {
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

        // If pending payment, add billing message
        if (!isLivre && !isPago) {
            const today = new Date();
            const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
            message = `Olá ${kitnet.inquilino_nome || 'Inquilino'}, lembrete do aluguel da Kitnet ${kitnet.numero} referente a ${monthName}.\nValor: ${formatCurrency(kitnet.valor)}\nVencimento dia ${kitnet.dia_vencimento || '10'}.\n\nSe já pagou, favor desconsiderar.`;
        }

        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    };

    // Handle button clicks with event stop propagation for mobile
    const handleButtonClick = (e, callback) => {
        e.preventDefault();
        e.stopPropagation();
        if (callback) callback();
    };

    // Handle card click for showing details
    const handleCardClick = (e) => {
        // Only trigger if clicking the card area, not buttons
        if (e.target.closest('button') || e.target.closest('a')) {
            return;
        }
        if (onSelect) onSelect();
    };

    return (
        <article
            onClick={handleCardClick}
            className={`kitnet-card relative bg-slate-800/50 backdrop-blur border-2 rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform ${isLivre
                ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'border-red-500/50 shadow-lg shadow-red-500/10'
                }`}
            role="listitem"
            aria-label={`Kitnet ${kitnet.numero}, ${isLivre ? 'livre' : 'alugada'}, ${formatCurrency(kitnet.valor)}`}
        >
            {/* Status Badge */}
            <div
                className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold ${isLivre ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}
                aria-hidden="true"
            >
                {isLivre ? 'LIVRE' : 'ALUGADA'}
            </div>

            {/* Payment Badge (only when rented) */}
            {!isLivre && (
                <div
                    className={`absolute -top-2 left-3 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isPago
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-500 text-white'
                        }`}
                    aria-label={isPago ? 'Pagamento em dia' : 'Pagamento pendente'}
                >
                    <DollarSign className="w-3 h-3" />
                    {isPago ? 'PAGO' : 'PENDENTE'}
                </div>
            )}

            {/* Kitnet Number and Price */}
            <div className="flex items-center gap-3 mb-4">
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

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 mt-4">
                {/* Toggle Switch */}
                <button
                    onClick={(e) => handleButtonClick(e, onToggle)}
                    disabled={isLoading}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 ${isLivre ? 'bg-emerald-500' : 'bg-red-500'
                        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                    aria-label={isLivre ? 'Marcar como alugada' : 'Marcar como livre'}
                    aria-pressed={!isLivre}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isLivre ? 'translate-x-7' : 'translate-x-1'
                            }`}
                    />
                    {isLoading && (
                        <Loader2 className="w-4 h-4 text-white animate-spin absolute left-1/2 -translate-x-1/2" />
                    )}
                </button>

                <div className="flex gap-1.5">
                    {/* Payment Toggle (only when rented) */}
                    {!isLivre && (
                        <button
                            onClick={(e) => handleButtonClick(e, onTogglePayment)}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${isPago
                                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 active:bg-green-500/40'
                                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 active:bg-amber-500/40'
                                }`}
                            aria-label={isPago ? 'Marcar como pendente' : 'Marcar como pago'}
                            title={isPago ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                            <DollarSign className="w-5 h-5" aria-hidden="true" />
                        </button>
                    )}

                    {/* WhatsApp Button (only when rented with phone) */}
                    {!isLivre && kitnet.inquilino_telefone && (
                        <a
                            href={getWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${!isPago
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 active:bg-amber-500/40'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 active:bg-emerald-500/40'
                                }`}
                            aria-label={!isPago ? "Cobrar no WhatsApp" : "Enviar WhatsApp"}
                            title={!isPago ? "Cobrar no WhatsApp" : "Enviar WhatsApp"}
                        >
                            <MessageCircle className="w-5 h-5" aria-hidden="true" />
                        </a>
                    )}

                    {/* Tenant Button (only when rented) */}
                    {!isLivre && (
                        <button
                            onClick={(e) => handleButtonClick(e, onEditTenant)}
                            className="flex items-center justify-center w-10 h-10 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-400 rounded-xl transition-colors"
                            aria-label="Editar dados do inquilino"
                            title="Editar Inquilino"
                        >
                            <User className="w-5 h-5" aria-hidden="true" />
                        </button>
                    )}

                    {/* History Button (only when rented) */}
                    {!isLivre && (
                        <button
                            onClick={(e) => handleButtonClick(e, onShowHistory)}
                            className="flex items-center justify-center w-10 h-10 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-xl transition-colors"
                            aria-label="Ver histórico de pagamentos"
                            title="Histórico de Pagamentos"
                        >
                            <History className="w-5 h-5" aria-hidden="true" />
                        </button>
                    )}

                    {/* Edit Button */}
                    <button
                        onClick={(e) => handleButtonClick(e, onEdit)}
                        className="flex items-center justify-center w-10 h-10 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-xl transition-colors"
                        aria-label="Editar valor e descrição"
                        title="Editar Detalhes"
                    >
                        <Pencil className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </article>
    );
}

export default KitnetCard;

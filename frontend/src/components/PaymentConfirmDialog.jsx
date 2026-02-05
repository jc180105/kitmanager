import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Banknote } from 'lucide-react';

function PaymentConfirmDialog({ title, message, onConfirm, onCancel, triggerRect }) {
    const [method, setMethod] = useState('');
    const [account, setAccount] = useState('');

    const handleConfirm = () => {
        let finalMethod = method;
        if (method === 'Pix') {
            if (!account) return;
            finalMethod = `${method} - ${account}`;
        }
        onConfirm(finalMethod);
    };

    const isConfirmDisabled = !method || (method === 'Pix' && !account);

    // Simplified positioning - just center it relative to container
    const dialogStyle = {};
    const hasCustomPosition = false;

    return (
        <div className="fixed inset-0 z-[160] animate-fade-in" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-y-auto custom-scrollbar fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-emerald-500/20 rounded-full">
                        <DollarSign className="w-8 h-8 text-emerald-400" aria-hidden="true" />
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-white text-center mb-2">
                    {title}
                </h3>
                <p className="text-sm text-slate-400 text-center mb-6">
                    {message}
                </p>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setMethod('Dinheiro'); setAccount(''); }}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${method === 'Dinheiro'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            <Banknote className="w-4 h-4" />
                            <span className="text-sm">Dinheiro</span>
                        </button>
                        <button
                            onClick={() => setMethod('Pix')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${method === 'Pix'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm">Pix</span>
                        </button>
                    </div>
                </div>

                {/* Account Selection for Pix */}
                {method === 'Pix' && (
                    <div className="space-y-3 mb-6 animate-fade-in">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Conta de Destino
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setAccount('Nubank')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${account === 'Nubank'
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <span className="text-sm">Nubank</span>
                            </button>
                            <button
                                onClick={() => setAccount('Bradesco')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${account === 'Bradesco'
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <span className="text-sm">Bradesco</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-300 rounded-xl transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium text-sm hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98]"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentConfirmDialog;

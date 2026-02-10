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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm overflow-y-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/20">
                        <DollarSign className="w-8 h-8 text-emerald-500" aria-hidden="true" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white text-center mb-2">
                    {title}
                </h3>
                <p className="text-slate-400 text-center mb-8 leading-relaxed">
                    {message}
                </p>

                {/* Options */}
                <div className="space-y-4 mb-8">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setMethod('Dinheiro'); setAccount(''); }}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 ${method === 'Dinheiro'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600'
                                }`}
                        >
                            <Banknote className="w-6 h-6" />
                            <span className="text-sm font-medium">Dinheiro</span>
                        </button>
                        <button
                            onClick={() => setMethod('Pix')}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200 ${method === 'Pix'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600'
                                }`}
                        >
                            <Wallet className="w-6 h-6" />
                            <span className="text-sm font-medium">Pix</span>
                        </button>
                    </div>
                </div>

                {/* Account Selection for Pix */}
                {method === 'Pix' && (
                    <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Conta de Destino
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setAccount('Nubank')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${account === 'Nubank'
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                                    }`}
                            >
                                <span className="text-sm font-medium">Nubank</span>
                            </button>
                            <button
                                onClick={() => setAccount('Bradesco')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${account === 'Bradesco'
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                                    }`}
                            >
                                <span className="text-sm font-medium">Bradesco</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium text-sm border border-slate-700"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl transition-all font-medium text-sm hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 shadow-lg shadow-emerald-900/20"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentConfirmDialog;

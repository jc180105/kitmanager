import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({ title, message, confirmText, confirmColor, onConfirm, onCancel }) {
    const colorClasses = {
        emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
        red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <div className="animate-fade-in w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-full">
                            <AlertTriangle className="w-8 h-8 text-amber-400" aria-hidden="true" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3
                        id="confirm-dialog-title"
                        className="text-lg font-semibold text-white text-center mb-2"
                    >
                        {title}
                    </h3>

                    {/* Message */}
                    <p
                        id="confirm-dialog-message"
                        className="text-slate-400 text-center mb-6"
                    >
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 bg-gradient-to-r ${colorClasses[confirmColor] || colorClasses.blue} text-white rounded-xl transition-all font-medium`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ConfirmDialog;

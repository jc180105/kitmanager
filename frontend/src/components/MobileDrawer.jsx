import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// --- SUB-COMPONENTES ---

const Backdrop = ({ onClose }) => (
    <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100]"
        onClick={onClose}
        aria-hidden="true"
    />
);

const Header = ({ title, onClose }) => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-800 shrink-0">
        <h2 className="text-lg font-bold text-white truncate pr-4">
            {title}
        </h2>
        <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Fechar"
        >
            <X className="w-5 h-5" />
        </button>
    </div>
);

const Footer = ({ content }) => {
    if (!content) return null;
    return (
        <div className="p-5 border-t border-white/10 bg-slate-800 shrink-0 pb-safe-area-bottom">
            {content}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

function MobileDrawer({ isOpen, onClose, title, children, footer }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <Backdrop onClose={onClose} />

            {/* ========== MOBILE: Bottom Sheet ========== */}
            <div
                className="fixed inset-x-0 bottom-0 z-[110] md:hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                    {/* Handle para arrastar */}
                    <div
                        className="w-full flex justify-center py-3 shrink-0 cursor-pointer"
                        onClick={onClose}
                    >
                        <div className="w-10 h-1 bg-slate-600 rounded-full" />
                    </div>

                    <Header title={title} onClose={onClose} />

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {children}
                    </div>

                    <Footer content={footer} />
                </div>
            </div>

            {/* ========== DESKTOP: Modal Centralizado ========== */}
            <div
                className="hidden md:flex fixed inset-0 z-[110] items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-xl max-h-[85vh] flex flex-col bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Header title={title} onClose={onClose} />

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {children}
                    </div>

                    <Footer content={footer} />
                </div>
            </div>
        </>
    );
}

export default MobileDrawer;

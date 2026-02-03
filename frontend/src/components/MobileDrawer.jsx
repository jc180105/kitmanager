import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function MobileDrawer({ isOpen, onClose, title, children, footer }) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    // Common Content to avoid duplication
    const Content = ({ isMobile }) => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className={`flex items-center justify-between px-5 ${isMobile ? 'py-3' : 'py-4'} border-b border-slate-700/50 shrink-0`}>
                <div className="font-semibold text-white truncate pr-4 text-lg w-full">
                    {title}
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 overscroll-contain">
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800 shrink-0 pb-safe-area-bottom">
                    {footer}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex justify-center">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Mobile Bottom Sheet (Visible only on mobile) */}
            <div
                className={`md:hidden fixed inset-x-0 bottom-0 z-[70] transform transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] pb-safe-area-bottom">
                    {/* Handle */}
                    <div className="w-full flex justify-center pt-3 pb-1 shrink-0 bg-slate-800 rounded-t-2xl" onClick={onClose}>
                        <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
                    </div>
                    <Content isMobile={true} />
                </div>
            </div>

            {/* Desktop Modal (Visible only on desktop) */}
            <div
                className={`hidden md:flex fixed inset-0 z-[70] items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={onClose}
            >
                <div
                    className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Content isMobile={false} />
                </div>
            </div>
        </div>
    );
}

export default MobileDrawer;

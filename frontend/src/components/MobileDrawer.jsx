import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function MobileDrawer({ isOpen, onClose, title, children, footer }) {
    // Show only if open
    if (!isOpen) return null;

    useEffect(() => {
        // Prevent body scroll when open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const Content = ({ isMobile }) => (
        <div className="flex flex-col h-full overflow-hidden bg-slate-800 rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-700">
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-700/50 shrink-0`}>
                <div className="font-semibold text-white truncate pr-4 text-lg flex-1">
                    {title}
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800 shrink-0 pb-8 md:pb-4">
                    {footer}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Mobile Layout (Bottom Sheet) */}
            <div
                className="md:hidden fixed inset-x-0 bottom-0 z-[110] flex flex-col max-h-[85vh] animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Visual Handle */}
                <div className="w-full flex justify-center pb-2 pointer-events-none">
                    <div className="w-12 h-1.5 bg-slate-500/50 rounded-full" />
                </div>

                <Content isMobile={true} />
            </div>

            {/* Desktop Layout (Center Modal) */}
            <div
                className="hidden md:flex fixed inset-0 z-[110] items-center justify-center p-4 pointer-events-none"
            >
                <div
                    className="w-full max-w-lg max-h-[85vh] pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Content isMobile={false} />
                </div>
            </div>
        </div>
    );
}

export default MobileDrawer;

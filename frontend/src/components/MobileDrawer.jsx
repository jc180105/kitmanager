import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * A responsive component that renders as a Bottom Sheet (Drawer) on mobile
 * and a centered Modal on desktop.
 * 
 * @param {boolean} isOpen - Whether the drawer is open
 * @param {function} onClose - Function to close the drawer
 * @param {string} title - Title of the drawer
 * @param {React.ReactNode} children - Content of the drawer
 * @param {React.ReactNode} footer - Optional footer content
 * @param {string} variant - 'adaptive' (default), 'bottom', or 'center'
 */
function MobileDrawer({ isOpen, onClose, title, children, footer, variant = 'adaptive' }) {
    const [isClosing, setIsClosing] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);
    const contentRef = useRef(null);

    // Determine effective mode
    const isBottom = variant === 'bottom' || (variant === 'adaptive' && isMobileScreen);

    // Handle window resize to switch between mobile/desktop modes
    useEffect(() => {
        const handleResize = () => {
            setIsMobileScreen(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') handleClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300); // Match animation duration
    };

    if (!isOpen && !isClosing) return null;

    const animationClass = isClosing
        ? (isBottom ? 'animate-slide-down' : 'animate-fade-out')
        : (isBottom ? 'animate-slide-up' : 'animate-fade-in');

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* Drawer/Modal Container */}
            <div
                className={`fixed z-50 transition-all duration-300 ${isBottom
                    ? 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl'
                    : 'inset-0 flex items-center justify-center p-4'
                    }`}
                onClick={handleClose}
            >

                {/* Content Card */}
                <div
                    ref={contentRef}
                    className={`${animationClass} bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden flex flex-col ${isBottom
                        ? 'w-full h-full rounded-t-2xl pb-safe-area-bottom'
                        : 'w-full max-w-lg rounded-2xl max-h-[85vh]'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile Handle */}
                    {isBottom && (
                        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" onClick={handleClose}>
                            <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
                        </div>
                    )}

                    {/* Header */}
                    <div className={`flex items-center justify-between px-5 ${isBottom ? 'py-3' : 'py-5'} border-b border-slate-700/50 shrink-0`}>
                        <h2 className="text-lg font-semibold text-white truncate pr-4">
                            {title}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body (Scrollable) */}
                    <div className="p-5 overflow-y-auto overscroll-contain flex-1">
                        {children}
                    </div>

                    {/* Footer (Optional) */}
                    {footer && (
                        <div className="p-4 bg-slate-800 border-t border-slate-700/50 shrink-0 pb-safe-area-bottom">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MobileDrawer;

import { Outlet, useLocation } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import NotificationBadge from './NotificationBadge';
import { Toaster } from 'sonner';

export default function Layout() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased text-slate-100 selection:bg-emerald-500/30">
            <Toaster richColors position="top-center" theme="dark" />

            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Header (Unified but adapted for desktop) */}
            <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 shrink-0 md:pl-64 transition-all duration-300">
                <div className="px-5 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
                    {/* Logo - Hidden on Desktop because Sidebar has it */}
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                            <HomeIcon className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-none">Kitnets</h1>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Gerenciamento</span>
                        </div>
                    </div>

                    {/* Desktop spacer to keep notifications aligned if needed, or just justify-end */}
                    <div className="hidden md:block flex-1" />

                    <NotificationBadge />
                </div>
            </header>

            {/* Main Content Area - Pushed by Sidebar on Desktop */}
            <main className="flex-1 w-full max-w-7xl mx-auto sm:px-4 md:pl-64 transition-all duration-300">
                <div className="md:p-6">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation spacer - Mobile Only */}
            <div className="h-24 md:hidden shrink-0" />

            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />
        </div>
    );
}

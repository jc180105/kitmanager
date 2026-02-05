import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LayoutDashboard, History, Database } from 'lucide-react';
import BottomNav from './BottomNav';
import NotificationBadge from './NotificationBadge';
import WhatsAppToggle from './WhatsAppToggle';
import { Toaster } from 'sonner';
import { API_URL } from '../utils/config';

export default function Layout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Toaster richColors position="top-center" theme="dark" />

            {/* Desktop Header */}
            <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 hidden md:block">
                <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                            <HomeIcon className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Kitnets</h1>
                            <p className="text-xs text-slate-400">Gerenciamento</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex items-center gap-1">
                        <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            Início
                        </Link>
                        <Link to="/dashboard" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/dashboard') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            Dashboard
                        </Link>
                        <Link to="/leads" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/leads') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            Leads
                        </Link>
                        <Link to="/history" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/history') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            Histórico
                        </Link>
                        <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/config') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                            Configurações
                        </Link>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <NotificationBadge />
                        <div className="h-6 w-px bg-slate-700/50"></div>
                        <a
                            href={`${API_URL}/backup`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
                            title="Backup do Banco de Dados"
                        >
                            <Database className="w-4 h-4" />
                            <span className="text-sm">Backup</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Mobile Header (Minimal) */}
            <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 md:hidden block">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg shadow-emerald-500/20">
                            <HomeIcon className="w-4 h-4 text-white" aria-hidden="true" />
                        </div>
                        <span className="font-bold text-white">Kitnets</span>
                    </div>
                    <NotificationBadge />
                </div>
            </header>

            {/* Main Content */}
            <main className="px-2 sm:px-4 py-4 max-w-7xl mx-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    );
}

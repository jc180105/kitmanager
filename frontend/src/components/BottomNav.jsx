import { Home, LayoutDashboard, History, Menu, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;

    const tabs = [
        { id: 'inicio', path: '/', icon: Home, label: 'Início', matchExact: true },
        { id: 'leads', path: '/leads', icon: User, label: 'Leads' },
        { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Finanças' },
        { id: 'historico', path: '/history', icon: History, label: 'Histórico' },
        { id: 'menu', path: '/menu', icon: Menu, label: 'Menu' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 pb-safe-area-bottom w-full">
            <div className="flex items-center justify-between px-6 h-16 md:h-20">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.matchExact
                        ? pathname === tab.path
                        : pathname.startsWith(tab.path);

                    return (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            className={`relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 w-full group ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute -top-[17px] left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-b-full shadow-[0_2px_12px_rgba(16,185,129,0.5)]" />
                            )}

                            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-500/10' : 'group-hover:bg-slate-800'
                                }`}>
                                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px] group-hover:scale-110'}`} />
                            </div>
                            <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 group-hover:opacity-100'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default BottomNav;

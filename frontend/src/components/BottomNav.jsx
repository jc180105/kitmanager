import { Home, LayoutDashboard, History, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;

    const tabs = [
        { id: 'inicio', path: '/', icon: Home, label: 'Início', matchExact: true },
        { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Finanças' },
        { id: 'historico', path: '/history', icon: History, label: 'Histórico' },
        { id: 'menu', path: '/menu', icon: Menu, label: 'Menu' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-safe-area-bottom md:hidden safe-area-padding-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.matchExact
                        ? pathname === tab.path
                        : pathname.startsWith(tab.path);

                    return (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-emerald-500/10 scale-110' : ''
                                }`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                            </div>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default BottomNav;

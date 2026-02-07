import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, Calendar } from 'lucide-react';
import { api } from '../utils/api';

function NotificationBadge() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch due rent notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/kitnets/vencimentos');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Erro ao buscar vencimentos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getDaysUntilDue = (diaVencimento) => {
        const today = new Date();
        const currentDate = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let dueDate = new Date(currentYear, currentMonth, diaVencimento);

        // If due date has passed this month, look at next month
        if (dueDate < today) {
            dueDate = new Date(currentYear, currentMonth + 1, diaVencimento);
        }

        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUrgencyColor = (days) => {
        if (days <= 0) return 'text-red-400 bg-red-500/20';
        if (days <= 3) return 'text-amber-400 bg-amber-500/20';
        return 'text-blue-400 bg-blue-500/20';
    };

    const getUrgencyText = (days) => {
        if (days <= 0) return 'Venceu hoje!';
        if (days === 1) return 'Vence amanhã';
        return `Vence em ${days} dias`;
    };

    const count = notifications.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                aria-label={`${count} notificações de vencimento`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                            <h3 className="font-semibold text-white">Vencimentos Próximos</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-700 rounded"
                            aria-label="Fechar notificações"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading && (
                            <div className="p-4 text-center text-slate-400">
                                Carregando...
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div className="p-6 text-center">
                                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-400">Nenhum vencimento próximo</p>
                                <p className="text-xs text-slate-500 mt-1">Tudo em dia! ✨</p>
                            </div>
                        )}

                        {!loading && notifications.map((item) => {
                            const days = getDaysUntilDue(item.dia_vencimento);
                            return (
                                <div
                                    key={item.id}
                                    className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">
                                                    Kitnet {item.numero}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(days)}`}>
                                                    Dia {item.dia_vencimento}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 truncate mt-1">
                                                {item.inquilino_nome || 'Sem inquilino'}
                                            </p>
                                            {item.inquilino_telefone && (
                                                <a
                                                    href={`https://wa.me/55${item.inquilino_telefone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-emerald-400 hover:underline"
                                                >
                                                    📱 {item.inquilino_telefone}
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${days <= 0 ? 'text-red-400' : days <= 3 ? 'text-amber-400' : 'text-slate-300'}`}>
                                                {getUrgencyText(days)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                            <p className="text-xs text-slate-400 text-center">
                                Mostrando vencimentos dos próximos 7 dias
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBadge;

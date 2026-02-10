import { useState, useEffect, useCallback, useMemo } from 'react';
import { Home as HomeIcon, RefreshCw, Search, X, ChevronDown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import KitnetCard from '../components/KitnetCard';
import EditModal from '../components/EditModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';

import ConfirmDialog from '../components/ConfirmDialog';
import KitnetSkeleton from '../components/KitnetSkeleton';
import ExportButton from '../components/ExportButton';
import WhatsAppButton from '../components/WhatsAppButton';
import { api } from '../utils/api';

export default function Home() {
    const navigate = useNavigate();
    const [kitnets, setKitnets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingKitnet, setEditingKitnet] = useState(null);
    const [historyKitnet, setHistoryKitnet] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [paymentFilter, setPaymentFilter] = useState('todos');
    const [sortBy, setSortBy] = useState('numero');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Haptic Feedback Helper
    const triggerHaptic = (style = 'medium') => {
        if (navigator.vibrate) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [40],
                success: [10, 30, 20],
                error: [30, 50, 30]
            };
            navigator.vibrate(patterns[style] || 20);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch kitnets
    const fetchKitnets = useCallback(async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (statusFilter !== 'todos') params.append('status', statusFilter);
            if (debouncedSearch) params.append('search', debouncedSearch);

            const queryString = params.toString() ? '?' + params.toString() : '';
            const response = await api.get(`/kitnets${queryString}`);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao buscar kitnets');
            }

            const data = await response.json();
            setKitnets(data);
        } catch (err) {
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                toast.error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            } else {
                // api.js handles 401 redirect, so we might just log or show generic error here
                // if not 401.
                if (err.message !== 'Sessão expirada') {
                    // toast.error(err.message); 
                    // Don't show toast for session expired as api.js might handle it or we redirect
                    console.error(err);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        fetchKitnets();
    }, [fetchKitnets]);

    // Pull to Refresh Logic
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let startY = 0;

        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            if (window.scrollY === 0 && startY > 0) {
                const pullDistance = e.touches[0].clientY - startY;
                if (pullDistance > 60) {
                    setIsPulling(true);
                }
            }
        };

        const handleTouchEnd = async (e) => {
            const endY = e.changedTouches[0].clientY;
            const pullDistance = endY - startY;
            startY = 0;
            setIsPulling(false);

            if (window.scrollY === 0 && pullDistance > 100 && !isRefreshing) {
                setIsRefreshing(true);
                triggerHaptic('success');
                await fetchKitnets();
                setIsRefreshing(false);
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [fetchKitnets, isRefreshing]);

    // Toggle status with confirmation
    const handleToggleClick = (kitnet) => {
        triggerHaptic('medium');
        const newStatus = kitnet.status === 'livre' ? 'alugada' : 'livre';
        const message = kitnet.status === 'livre'
            ? `Marcar Kitnet ${kitnet.numero} como ALUGADA?`
            : `Marcar Kitnet ${kitnet.numero} como LIVRE? Os dados do inquilino serão removidos.`;

        setConfirmDialog({
            title: 'Confirmar Alteração',
            message,
            confirmText: newStatus === 'livre' ? 'Liberar' : 'Alugar',
            confirmColor: newStatus === 'livre' ? 'emerald' : 'red',
            onConfirm: () => toggleStatus(kitnet.id, newStatus),
        });
    };

    const toggleStatus = async (id, newStatus) => {
        setConfirmDialog(null);
        triggerHaptic('success');

        setKitnets(prev => prev.map(k =>
            k.id === id ? { ...k, status: newStatus, _loading: true } : k
        ));

        try {
            const response = await api.put(`/kitnets/${id}/status`, { status: newStatus });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao atualizar status');
            }

            const updatedKitnet = await response.json();
            setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));
            toast.success(newStatus === 'livre' ? 'Kitnet liberada!' : 'Kitnet alugada!');
        } catch (err) {
            toast.error(err.message);
            fetchKitnets();
        }
    };

    const updateDetails = async (id, valor, descricao) => {
        triggerHaptic('medium');
        try {
            const response = await api.put(`/kitnets/${id}/detalhes`, { valor, descricao });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao atualizar detalhes');
            }

            const updatedKitnet = await response.json();
            setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));
            setEditingKitnet(null);
            triggerHaptic('success');
            toast.success('Detalhes atualizados com sucesso!');
        } catch (err) {
            toast.error(err.message);
        }
    };


    const togglePayment = (id, e = null) => {
        const kitnet = kitnets.find(k => k.id === id);
        if (!kitnet) return;

        // Se já está pago, apenas alterna para não pago
        if (kitnet.pago_mes) {
            executeTogglePayment(id);
            return;
        }

        // Se vai pagar, navega para a página de pagamento
        navigate(`/kitnet/${id}/pagamento`);
    };

    const executeTogglePayment = async (id, formaPagamento = null) => {
        triggerHaptic('medium');
        try {
            const response = await api.put(`/kitnets/${id}/pagamento`, { forma_pagamento: formaPagamento });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao atualizar pagamento');
            }

            const updatedKitnet = await response.json();
            setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));

            // Se estava selecionada nos detalhes, atualiza também
            // if (selectedKitnet && selectedKitnet.id === id) { // selectedKitnet also undefined in previous file?
            //     setSelectedKitnet(updatedKitnet);
            // }

            triggerHaptic('success');
            if (formaPagamento) {
                toast.success(`Pagamento registrado via ${formaPagamento}!`);
            } else {
                toast.success('Status de pagamento atualizado!');
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filteredKitnets = useMemo(() => {
        let result = [...kitnets];

        // Payment filter
        if (paymentFilter === 'pago') {
            result = result.filter(k => k.status === 'alugada' && k.pago_mes === true);
        } else if (paymentFilter === 'pendente') {
            result = result.filter(k => k.status === 'alugada' && !k.pago_mes);
        }

        // Sort
        switch (sortBy) {
            case 'valor_asc':
                result.sort((a, b) => parseFloat(a.valor) - parseFloat(b.valor));
                break;
            case 'valor_desc':
                result.sort((a, b) => parseFloat(b.valor) - parseFloat(a.valor));
                break;
            case 'status':
                result.sort((a, b) => a.status.localeCompare(b.status));
                break;
            default:
                result.sort((a, b) => a.numero - b.numero);
        }

        return result;
    }, [kitnets, paymentFilter, sortBy]);

    return (
        <div className="animate-fade-in pb-20 md:pb-0">

            {/* Pull to Refresh Indicator */}
            {(isPulling || isRefreshing) && (
                <div className="flex justify-center py-3 -mt-2 mb-2 animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/80 rounded-full border border-slate-700/50">
                        <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-xs text-slate-300">
                            {isRefreshing ? 'Atualizando...' : 'Solte para atualizar'}
                        </span>
                    </div>
                </div>
            )}

            {/* Top Controls: Search, Filters, and Quick Actions */}
            <div className="flex flex-col gap-4 mb-6">

                {/* Actions Row (Export/Whatsapp) - Visible on all screens in this page context */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Minhas Kitnets</h2>
                        <p className="text-slate-400 text-sm">Gerencie seus imóveis</p>
                    </div>
                    <div className="flex gap-2">
                        <WhatsAppButton kitnets={kitnets} />
                        <ExportButton kitnets={kitnets} />
                        <button
                            onClick={fetchKitnets}
                            disabled={loading}
                            className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                            title="Atualizar Lista"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4">
                    {/* Search */}
                    <div className="relative col-span-2 sm:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Buscar por número, inquilino..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative col-span-1">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-sm"
                        >
                            <option value="todos">Status: Todos</option>
                            <option value="livre">Livres</option>
                            <option value="alugada">Alugadas</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Payment Filter */}
                    <div className="relative col-span-1">
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-sm"
                        >
                            <option value="todos">Pgto: Todos</option>
                            <option value="pago">✓ Pagos</option>
                            <option value="pendente">⏳ Pendentes</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative col-span-2 sm:col-span-1 sm:w-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-sm"
                        >
                            <option value="numero">Ordem: Número</option>
                            <option value="valor_asc">Valor Crescente</option>
                            <option value="valor_desc">Valor Decrescente</option>
                            <option value="status">Status</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(8)].map((_, i) => (
                        <KitnetSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32 md:pb-10 items-start">
                    {filteredKitnets.map(kitnet => (
                        <KitnetCard
                            key={kitnet.id}
                            kitnet={kitnet}
                            onToggle={() => handleToggleClick(kitnet)}
                            onTogglePayment={(e) => togglePayment(kitnet.id, e)}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredKitnets.length === 0 && (
                <div className="text-center py-16 animate-fade-in bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <HomeIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-slate-400 text-sm">
                        {searchTerm || statusFilter !== 'todos' || paymentFilter !== 'todos'
                            ? 'Nenhuma kitnet encontrada com os filtros selecionados'
                            : 'Nenhuma kitnet cadastrada'}
                    </p>
                </div>
            )}

            {/* Modals */}
            {editingKitnet && (
                <EditModal
                    kitnet={editingKitnet}
                    onSave={updateDetails}
                    onClose={() => setEditingKitnet(null)}
                />
            )}

            {historyKitnet && (
                <PaymentHistoryModal
                    kitnet={historyKitnet}
                    onClose={() => setHistoryKitnet(null)}
                />
            )}

            {confirmDialog && (
                <ConfirmDialog
                    {...confirmDialog}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}



        </div>
    );
}

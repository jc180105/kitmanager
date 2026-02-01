import { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Loader2, RefreshCw, AlertCircle, Search, Filter, History, X, Database, Menu, ChevronDown, BarChart3 } from 'lucide-react';
import KitnetCard from './components/KitnetCard';
import EditModal from './components/EditModal';
import TenantModal from './components/TenantModal';
import PaymentHistoryModal from './components/PaymentHistoryModal';
import ConfirmDialog from './components/ConfirmDialog';
import HistoryModal from './components/HistoryModal';
import ExportButton from './components/ExportButton';
import NotificationBadge from './components/NotificationBadge';
import WhatsAppButton from './components/WhatsAppButton';
import KitnetSkeleton from './components/KitnetSkeleton';
import DashboardModal from './components/DashboardModal';
import KitnetDetailsModal from './components/KitnetDetailsModal';
import { generateContract } from './utils/generateContract';

// Determine API URL
const getApiUrl = () => {
  // 1. Env Var (Priority)
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // 2. Vercel Production Fallback
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://kitmanager-production.up.railway.app';
  }

  // 3. Localhost Fallback
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

function App() {
  const [kitnets, setKitnets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingKitnet, setEditingKitnet] = useState(null);
  const [tenantKitnet, setTenantKitnet] = useState(null);
  const [historyKitnet, setHistoryKitnet] = useState(null);
  const [selectedKitnet, setSelectedKitnet] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [paymentFilter, setPaymentFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('numero');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch kitnets
  const fetchKitnets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'todos') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const url = `${API_URL}/kitnets${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao buscar kitnets');
      }

      const data = await response.json();
      setKitnets(data);
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchKitnets();
  }, [fetchKitnets]);

  // Toggle status with confirmation
  const handleToggleClick = (kitnet) => {
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

    setKitnets(prev => prev.map(k =>
      k.id === id ? { ...k, status: newStatus, _loading: true } : k
    ));

    try {
      const response = await fetch(`${API_URL}/kitnets/${id}/status`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao atualizar status');
      }

      const updatedKitnet = await response.json();
      setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));

      if (newStatus === 'alugada') {
        setTenantKitnet(updatedKitnet);
      }
    } catch (err) {
      setError(err.message);
      fetchKitnets();
    }
  };

  const updateDetails = async (id, valor, descricao) => {
    try {
      const response = await fetch(`${API_URL}/kitnets/${id}/detalhes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, descricao }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao atualizar detalhes');
      }

      const updatedKitnet = await response.json();
      setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));
      setEditingKitnet(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTenant = async (id, tenantData) => {
    const response = await fetch(`${API_URL}/kitnets/${id}/inquilino`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao atualizar inquilino');
    }

    const updatedKitnet = await response.json();
    setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));
    setTenantKitnet(null);
  };

  // Toggle payment status
  const togglePayment = async (id) => {
    try {
      const response = await fetch(`${API_URL}/kitnets/${id}/pagamento`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao atualizar pagamento');
      }

      const updatedKitnet = await response.json();
      setKitnets(prev => prev.map(k => k.id === id ? updatedKitnet : k));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filter and sort kitnets
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

  // Stats
  const totalKitnets = kitnets.length;
  const livres = kitnets.filter(k => k.status === 'livre').length;
  const alugadas = kitnets.filter(k => k.status === 'alugada').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50">
        <div className="px-4 py-2">
          {/* Top Row - Logo and Menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Home className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Kitnets</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Gerenciamento</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <NotificationBadge />
              <WhatsAppButton kitnets={kitnets} />
              <ExportButton kitnets={kitnets} />
              <a
                href={`${API_URL}/backup`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                aria-label="Baixar backup"
              >
                <Database className="w-4 h-4" aria-hidden="true" />
                <span>Backup</span>
              </a>
              <button
                onClick={() => setShowDashboard(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                aria-label="Ver Dashboard Financeiro"
              >
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                aria-label="Ver histórico de alterações"
              >
                <History className="w-4 h-4" aria-hidden="true" />
                <span>Histórico</span>
              </button>
              <button
                onClick={fetchKitnets}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                aria-label="Atualizar lista de kitnets"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Mobile Actions Row */}
            <div className="flex md:hidden items-center gap-1">
              <NotificationBadge />
              <button
                onClick={fetchKitnets}
                disabled={loading}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                aria-label="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <WhatsAppButton kitnets={kitnets} />
                <ExportButton kitnets={kitnets} />
                <a
                  href={`${API_URL}/backup`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Database className="w-4 h-4" aria-hidden="true" />
                  <span>Backup</span>
                </a>
                <button
                  onClick={() => { setShowDashboard(true); setShowMobileMenu(false); }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setShowHistory(true); setShowMobileMenu(false); }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" aria-hidden="true" />
                  <span>Histórico</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Stats Bar - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-slate-400 text-xs sm:text-sm">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{totalKitnets}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-emerald-400 text-xs sm:text-sm">Livres</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">{livres}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-red-400 text-xs sm:text-sm">Alugadas</p>
            <p className="text-xl sm:text-2xl font-bold text-red-400">{alugadas}</p>
          </div>
        </div>

        {/* Search and Filters - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 mb-4">
          {/* Search - Full width on mobile */}
          <div className="relative col-span-2 sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              aria-label="Buscar kitnets"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                aria-label="Limpar busca"
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
              aria-label="Filtrar por status"
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
              aria-label="Filtrar por pagamento"
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
              aria-label="Ordenar por"
            >
              <option value="numero">Ordem: Número</option>
              <option value="valor_asc">Valor Crescente</option>
              <option value="valor_desc">Valor Decrescente</option>
              <option value="status">Status</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-500/20 rounded flex-shrink-0"
              aria-label="Fechar mensagem de erro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State - Skeleton */}
        {loading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
            role="status"
            aria-label="Carregando kitnets"
          >
            {[...Array(8)].map((_, i) => (
              <KitnetSkeleton key={i} />
            ))}
            <span className="sr-only">Carregando kitnets...</span>
          </div>
        )}

        {/* Kitnets Grid */}
        {!loading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
            role="list"
            aria-label="Lista de kitnets"
          >
            {filteredKitnets.map(kitnet => (
              <KitnetCard
                key={kitnet.id}
                kitnet={kitnet}
                onSelect={() => setSelectedKitnet(kitnet)}
                onToggle={() => handleToggleClick(kitnet)}
                onEdit={() => setEditingKitnet(kitnet)}
                onEditTenant={() => setTenantKitnet(kitnet)}
                onTogglePayment={() => togglePayment(kitnet.id)}
                onShowHistory={() => setHistoryKitnet(kitnet)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredKitnets.length === 0 && !error && (
          <div className="text-center py-16 animate-fade-in">
            <Home className="w-12 h-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
            <p className="text-slate-400 text-sm">
              {searchTerm || statusFilter !== 'todos' || paymentFilter !== 'todos'
                ? 'Nenhuma kitnet encontrada com os filtros selecionados'
                : 'Nenhuma kitnet cadastrada'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingKitnet && (
        <EditModal
          kitnet={editingKitnet}
          onSave={updateDetails}
          onClose={() => setEditingKitnet(null)}
        />
      )}

      {tenantKitnet && (
        <TenantModal
          kitnet={tenantKitnet}
          onSave={updateTenant}
          onClose={() => setTenantKitnet(null)}
        />
      )}

      {historyKitnet && (
        <PaymentHistoryModal
          kitnet={historyKitnet}
          onClose={() => setHistoryKitnet(null)}
        />
      )}

      {selectedKitnet && (
        <KitnetDetailsModal
          kitnet={selectedKitnet}
          onClose={() => setSelectedKitnet(null)}
          onEdit={() => { setSelectedKitnet(null); setTenantKitnet(selectedKitnet); }}
          onTogglePayment={() => togglePayment(selectedKitnet.id)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {showHistory && (
        <HistoryModal onClose={() => setShowHistory(false)} />
      )}

      {showDashboard && (
        <DashboardModal onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}

export default App;

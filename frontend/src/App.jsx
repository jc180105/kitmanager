import { useState, useEffect, useCallback } from 'react';
import { Home, Loader2, RefreshCw, AlertCircle, Search, Filter, History, X, Database } from 'lucide-react';
import KitnetCard from './components/KitnetCard';
import EditModal from './components/EditModal';
import TenantModal from './components/TenantModal';
import ConfirmDialog from './components/ConfirmDialog';
import HistoryModal from './components/HistoryModal';
import ExportButton from './components/ExportButton';
import NotificationBadge from './components/NotificationBadge';
import WhatsAppButton from './components/WhatsAppButton';
import KitnetSkeleton from './components/KitnetSkeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [kitnets, setKitnets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingKitnet, setEditingKitnet] = useState(null);
  const [tenantKitnet, setTenantKitnet] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
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
      // Better error message for connection issues
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

    // Optimistic update
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

      // If marked as rented, open tenant modal
      if (newStatus === 'alugada') {
        setTenantKitnet(updatedKitnet);
      }
    } catch (err) {
      setError(err.message);
      fetchKitnets(); // Rollback
    }
  };

  // Update details
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

  // Update tenant
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

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Stats
  const totalKitnets = kitnets.length;
  const livres = kitnets.filter(k => k.status === 'livre').length;
  const alugadas = kitnets.filter(k => k.status === 'alugada').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Home className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Kitnets Dashboard</h1>
                <p className="text-sm text-slate-400">Gerenciamento de unidades</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <span className="hidden lg:inline">Backup</span>
              </a>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                aria-label="Ver histórico de alterações"
              >
                <History className="w-4 h-4" aria-hidden="true" />
                <span className="hidden lg:inline">Histórico</span>
              </button>
              <button
                onClick={fetchKitnets}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Atualizar lista de kitnets"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="hidden lg:inline">Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por número ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label="Buscar kitnets"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Filtrar por status"
            >
              <option value="todos">Todos</option>
              <option value="livre">Livres</option>
              <option value="alugada">Alugadas</option>
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{totalKitnets}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 text-sm">Livres</p>
            <p className="text-2xl font-bold text-emerald-400">{livres}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm">Alugadas</p>
            <p className="text-2xl font-bold text-red-400">{alugadas}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-500/20 rounded"
              aria-label="Fechar mensagem de erro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State - Skeleton */}
        {loading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="list"
            aria-label="Lista de kitnets"
          >
            {kitnets.map(kitnet => (
              <KitnetCard
                key={kitnet.id}
                kitnet={kitnet}
                onToggle={() => handleToggleClick(kitnet)}
                onEdit={() => setEditingKitnet(kitnet)}
                onEditTenant={() => setTenantKitnet(kitnet)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && kitnets.length === 0 && !error && (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-slate-600 mx-auto mb-4" aria-hidden="true" />
            <p className="text-slate-400">
              {searchTerm || statusFilter !== 'todos'
                ? 'Nenhuma kitnet encontrada com esses filtros'
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

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {showHistory && (
        <HistoryModal onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

export default App;

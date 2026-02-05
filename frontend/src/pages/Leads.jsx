import { useState, useEffect } from 'react';
import { User, Phone, Search, Archive, MessageCircle, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// URL do Backend para leads (AJUSTE SE NECESSÁRIO, mas seguindo o padrão do Configuration.jsx)
// Como o backend de leads roda junto com o main server (não no bot), usamos API_URL normal
import { API_URL } from '../utils/config';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'novo', 'arquivado'

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${API_URL}/leads`);
            if (response.ok) {
                const data = await response.json();
                setLeads(data);
            } else {
                toast.error('Erro ao carregar leads');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
                toast.success(`Status atualizado para ${newStatus}`);
            }
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este lead?')) return;
        try {
            const response = await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setLeads(leads.filter(l => l.id !== id));
                toast.success('Lead removido');
            }
        } catch (error) {
            toast.error('Erro ao remover lead');
        }
    };

    const formatPhone = (phone) => {
        if (!phone) return '-';
        // Remove country code 55 if present for display, or format nicer
        let p = phone.replace(/\D/g, '');
        if (p.startsWith('55') && p.length > 11) p = p.substring(2);

        if (p.length === 11) return `(${p.substring(0, 2)}) ${p.substring(2, 7)}-${p.substring(7)}`;
        return phone;
    };

    const openWhatsApp = (phone) => {
        let p = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${p}`, '_blank');
    };

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (lead.telefone || '').includes(searchTerm);
        const matchesStatus = statusFilter === 'todos' ? true :
            (statusFilter === 'arquivado' ? lead.status === 'arquivado' : lead.status !== 'arquivado');

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads ({filteredLeads.length})</h1>
                    <p className="text-slate-400 text-sm">Pessoas interessadas que entraram em contato</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('todos')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter === 'todos' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStatusFilter('novo')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter === 'novo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => setStatusFilter('arquivado')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter === 'arquivado' ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                    >
                        Arquivados
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <User className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">Nenhum lead encontrado.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className={`bg-slate-800 border ${lead.status === 'arquivado' ? 'border-slate-700/50 opacity-75' : 'border-slate-700'} rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-600`}>

                            {/* Info */}
                            <div className="flex items-start gap-3">
                                <div className={`p-3 rounded-full ${lead.status === 'arquivado' ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{lead.nome || 'Desconhecido'}</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <Phone className="w-3.5 h-3.5" />
                                            {formatPhone(lead.telefone)}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {lead.data_contato ? new Date(lead.data_contato).toLocaleDateString() : '-'}
                                        </div>
                                    </div>
                                    {lead.kitnet_interesse && (
                                        <span className="inline-block mt-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                            Interesse na Kitnet ??
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button
                                    onClick={() => openWhatsApp(lead.telefone)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    WhatsApp
                                </button>

                                {lead.status !== 'arquivado' ? (
                                    <button
                                        onClick={() => handleStatusUpdate(lead.id, 'arquivado')}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Arquivar"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleStatusUpdate(lead.id, 'novo')}
                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Reativar"
                                    >
                                        <User className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDelete(lead.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

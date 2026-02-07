import { useState, useEffect } from 'react';
import { User, Phone, Search, Archive, MessageCircle, Trash2, Loader2, Calendar, CheckCircle, MapPin, ArrowRight, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import LeadModal from '../components/LeadModal';

// URL do Backend para leads
import { API_URL } from '../utils/config';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);

    // Tabs: 'interesse', 'visita', 'finalizada', 'arquivado'
    const [activeTab, setActiveTab] = useState('interesse');

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

    const handleSaveLead = async (leadData) => {
        const method = leadData.id ? 'PUT' : 'POST';
        const url = leadData.id ? `${API_URL}/leads/${leadData.id}` : `${API_URL}/leads`;

        // Se for novo, garante status 'novo'
        if (!leadData.id) leadData.status = 'novo';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
        });

        if (response.ok) {
            toast.success(leadData.id ? 'Lead atualizado!' : 'Lead criado!');
            fetchLeads();
            setIsModalOpen(false);
        } else {
            throw new Error('Falha ao salvar');
        }
    };

    const handleEditClick = (lead) => {
        setCurrentLead(lead);
        setIsModalOpen(true);
    };

    const handleNewClick = () => {
        setCurrentLead(null);
        setIsModalOpen(true);
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // Optimistic update
            setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));

            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast.success(`Leads movido para ${getStatusLabel(newStatus)}`);
            } else {
                // Revert on failure
                toast.error('Erro ao atualizar status');
                fetchLeads();
            }
        } catch (error) {
            toast.error('Erro ao atualizar status');
            fetchLeads();
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
        let p = phone.replace(/\D/g, '');

        // Remove 55 if likely country code
        if (p.startsWith('55') && p.length > 11) {
            p = p.substring(2);
        }

        // Handle numbers with trailing garbage (heuristic for small garbage)
        if (p.length > 11 && p.length <= 13) {
            const ddd = parseInt(p.substring(0, 2));
            if (ddd >= 11 && ddd <= 99) {
                const thirdDigit = parseInt(p.substring(2, 3));
                if (thirdDigit === 9) {
                    p = p.substring(0, 11);
                } else if (thirdDigit >= 2 && thirdDigit <= 5) {
                    p = p.substring(0, 10);
                }
            }
        }

        // If still too long, it's likely a WhatsApp LID or internal ID. 
        // Return raw to avoid misleading formatting (e.g. (18) ... for a LID)
        if (p.length > 11) return phone;

        // Format Mobile: (XX) XXXXX-XXXX
        if (p.length === 11) {
            return `(${p.substring(0, 2)}) ${p.substring(2, 7)}-${p.substring(7)}`;
        }

        // Format Landline: (XX) XXXX-XXXX
        if (p.length === 10) {
            return `(${p.substring(0, 2)}) ${p.substring(2, 6)}-${p.substring(6)}`;
        }

        return phone;
    };

    const openWhatsApp = (phone) => {
        let p = phone.replace(/\D/g, '');

        // Reuse truncation logic for cleaner link
        if (p.startsWith('55') && p.length > 13) p = p.substring(2);

        // If it's a LID (very long), we can't easily open a WA link.
        // But we try anyway with what we have, or maybe 55+LID won't work.
        // Best effort:
        if (p.length > 13) {
            // It's a LID. WA links don't work well with LIDs usually.
            // Just return cleaned number.
            return window.open(`https://wa.me/${p}`, '_blank');
        }

        if (p.length > 11) {
            const ddd = parseInt(p.substring(0, 2));
            if (ddd >= 11 && ddd <= 99) {
                const third = parseInt(p.substring(2, 3));
                if (third === 9) p = p.substring(0, 11);
                else if (third >= 2 && third <= 5) p = p.substring(0, 10);
            }
        }

        // Ensure country code 55
        if (!p.startsWith('55')) {
            p = '55' + p;
        }

        window.open(`https://wa.me/${p}`, '_blank');
    };

    // Helper to normalize status for the tabs
    const getNormalizedStatus = (status) => {
        if (!status) return 'interesse';
        const s = status.toLowerCase();
        if (s === 'novo') return 'interesse'; // Map legacy 'novo' to 'interesse'
        return s;
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'interesse': return 'Interesse';
            case 'visita': return 'Vai Fazer Visita';
            case 'finalizada': return 'Finalizada';
            case 'arquivado': return 'Arquivados';
            default: return status;
        }
    };

    // Filter Logic
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (lead.telefone || '').includes(searchTerm);

        const leadStatus = getNormalizedStatus(lead.status);
        const matchesTab = leadStatus === activeTab;

        return matchesSearch && matchesTab;
    });

    const tabs = [
        { id: 'interesse', label: 'Interesse', icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'visita', label: 'Vai fazer visita', icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { id: 'finalizada', label: 'Finalizada', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { id: 'arquivado', label: 'Arquivados', icon: Archive, color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' },
    ];

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads ({leads.length})</h1>
                    <p className="text-slate-400 text-sm">Gerenciamento de interessados</p>
                </div>
                <button
                    onClick={handleNewClick}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Novo Lead
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center justify-center gap-2 p-3 rounded-xl border transition-all
                            ${activeTab === tab.id
                                ? `${tab.bg} ${tab.color} ${tab.border} shadow-lg shadow-black/20`
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                        `}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{tab.label}</span>
                        <span className="ml-1 text-xs opacity-60 bg-black/20 px-1.5 py-0.5 rounded-full">
                            {leads.filter(l => getNormalizedStatus(l.status) === tab.id).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium">Nenhum lead nesta etapa.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-all hover:border-slate-600 group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                {/* Info */}
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full shrink-0 ${activeTab === 'arquivado' ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-inner'}`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight">{lead.nome || 'Sem nome'}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-slate-400 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-emerald-500/70" />
                                                {formatPhone(lead.telefone)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-500/70" />
                                                {lead.data_contato ? new Date(lead.data_contato).toLocaleDateString() : '-'}
                                            </div>
                                        </div>
                                        {lead.kitnet_interesse && (
                                            <div className="mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                                Interesse: Kitnet {lead.kitnet_interesse}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Ribbon */}
                                <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/50 w-full md:w-auto">

                                    <button
                                        onClick={() => openWhatsApp(lead.telefone)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="md:hidden lg:inline">WhatsApp</span>
                                    </button>

                                    {/* Action Buttons based on Tab */}
                                    {activeTab === 'interesse' && (
                                        <button
                                            onClick={() => handleStatusUpdate(lead.id, 'visita')}
                                            className="px-3 py-2 bg-slate-700 hover:bg-amber-500/20 hover:text-amber-400 border border-transparent hover:border-amber-500/30 rounded-lg transition-colors text-sm text-slate-300 flex items-center gap-2"
                                            title="Mover para Visita"
                                        >
                                            <span>Agendar Visita</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}

                                    {activeTab === 'visita' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStatusUpdate(lead.id, 'interesse')}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Voltar para Interesse"
                                            >
                                                <ArrowRight className="w-4 h-4 rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(lead.id, 'finalizada')}
                                                className="px-3 py-2 bg-slate-700 hover:bg-emerald-500/20 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 rounded-lg transition-colors text-sm text-slate-300 flex items-center gap-2"
                                                title="Mover para Finalizada"
                                            >
                                                <span>Finalizar Lead</span>
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {activeTab === 'finalizada' && (
                                        <button
                                            onClick={() => handleStatusUpdate(lead.id, 'visita')}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Voltar para Visita"
                                        >
                                            <ArrowRight className="w-4 h-4 rotate-180" />
                                        </button>
                                    )}

                                    <div className="w-px h-6 bg-slate-700 mx-1 hidden md:block"></div>

                                    {/* General Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditClick(lead)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        {activeTab !== 'arquivado' ? (
                                            <button
                                                onClick={() => handleStatusUpdate(lead.id, 'arquivado')}
                                                className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Arquivar"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate(lead.id, 'interesse')}
                                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Reativar"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(lead.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors group-hover:opacity-100 md:opacity-0 transition-opacity"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveLead}
                lead={currentLead}
            />
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Phone, Calendar, CreditCard, FileText,
    Loader2, Save, User
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { generateContract } from '../utils/generateContract';
import DocumentManager from '../components/DocumentManager';

// Format phone number as (XX) XXXXX-XXXX
const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);

    if (limited.length <= 2) return limited;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

// Format date for input
const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateValue.split('T')[0];
    }
    try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    } catch { return ''; }
    return '';
};

export default function KitnetTenant() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [kitnet, setKitnet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        inquilino_nome: '',
        inquilino_telefone: '',
        inquilino_cpf: '',
        inquilino_rg: '',
        data_entrada: '',
        dia_vencimento: '',
    });

    useEffect(() => {
        fetchKitnet();
    }, [id]);

    const fetchKitnet = async () => {
        try {
            const response = await api.get('/kitnets');
            const data = await response.json();
            const found = data.find(k => k.id === parseInt(id));

            if (found) {
                setKitnet(found);
                setFormData({
                    inquilino_nome: found.inquilino_nome || '',
                    inquilino_telefone: found.inquilino_telefone || '',
                    inquilino_cpf: found.inquilino_cpf || '',
                    inquilino_rg: found.inquilino_rg || '',
                    data_entrada: formatDateForInput(found.data_entrada),
                    dia_vencimento: found.dia_vencimento || '',
                });
            } else {
                toast.error('Kitnet não encontrada');
                navigate('/');
            }
        } catch (error) {
            toast.error('Erro ao carregar kitnet');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'inquilino_telefone') {
            setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.inquilino_nome.trim()) {
            setError('Nome do inquilino é obrigatório');
            return;
        }

        if (formData.dia_vencimento && (formData.dia_vencimento < 1 || formData.dia_vencimento > 31)) {
            setError('Dia de vencimento deve ser entre 1 e 31');
            return;
        }

        setSaving(true);
        try {
            const response = await api.put(`/kitnets/${id}/inquilino`, {
                inquilino_nome: formData.inquilino_nome.trim(),
                inquilino_telefone: formData.inquilino_telefone || null,
                inquilino_cpf: formData.inquilino_cpf || null,
                inquilino_rg: formData.inquilino_rg || null,
                data_entrada: formData.data_entrada || null,
                dia_vencimento: formData.dia_vencimento ? parseInt(formData.dia_vencimento) : null,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao salvar');
            }

            toast.success('Dados do inquilino salvos!');
            navigate(`/kitnet/${id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!kitnet) return null;

    return (
        <div className="animate-fade-in pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(`/kitnet/${id}`)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">Inquilino</h1>
                    <p className="text-slate-400 text-sm">Kitnet {kitnet.numero}</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Nome */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <label htmlFor="inquilino_nome" className="block text-sm font-medium text-slate-300 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Nome Completo *
                    </label>
                    <input
                        type="text"
                        id="inquilino_nome"
                        name="inquilino_nome"
                        value={formData.inquilino_nome}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: João da Silva"
                        required
                    />
                </div>

                {/* Telefone */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <label htmlFor="inquilino_telefone" className="block text-sm font-medium text-slate-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Telefone (WhatsApp)
                    </label>
                    <input
                        type="tel"
                        id="inquilino_telefone"
                        name="inquilino_telefone"
                        value={formData.inquilino_telefone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(48) 98843-8860"
                    />
                    <p className="mt-1 text-xs text-slate-500">Formata automaticamente</p>
                </div>

                {/* CPF e RG */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                        <label htmlFor="inquilino_cpf" className="block text-sm font-medium text-slate-300 mb-2">
                            CPF
                        </label>
                        <input
                            type="text"
                            id="inquilino_cpf"
                            name="inquilino_cpf"
                            value={formData.inquilino_cpf}
                            onChange={handleChange}
                            className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="000.000.000-00"
                        />
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                        <label htmlFor="inquilino_rg" className="block text-sm font-medium text-slate-300 mb-2">
                            RG
                        </label>
                        <input
                            type="text"
                            id="inquilino_rg"
                            name="inquilino_rg"
                            value={formData.inquilino_rg}
                            onChange={handleChange}
                            className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0.000.000"
                        />
                    </div>
                </div>

                {/* Data de Entrada */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <label htmlFor="data_entrada" className="block text-sm font-medium text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Data de Entrada
                    </label>
                    <input
                        type="date"
                        id="data_entrada"
                        name="data_entrada"
                        value={formData.data_entrada}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Dia Vencimento */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <label htmlFor="dia_vencimento" className="block text-sm font-medium text-slate-300 mb-2">
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Dia de Vencimento do Aluguel
                    </label>
                    <input
                        type="number"
                        id="dia_vencimento"
                        name="dia_vencimento"
                        min="1"
                        max="31"
                        value={formData.dia_vencimento}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 10"
                    />
                </div>

                {/* Documentos */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <DocumentManager kitnetId={kitnet.id} />
                </div>

                {/* Gerar Contrato */}
                <button
                    type="button"
                    onClick={() => generateContract({ ...kitnet, ...formData })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 border-dashed text-slate-300 hover:text-white rounded-xl transition-colors font-medium"
                >
                    <FileText className="w-5 h-5 text-blue-400" />
                    Gerar Contrato (PDF)
                </button>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate(`/kitnet/${id}`)}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-medium disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

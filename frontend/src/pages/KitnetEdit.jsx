import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Home, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';

export default function KitnetEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [kitnet, setKitnet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        valor: '',
        descricao: ''
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
                    valor: found.valor.toString(),
                    descricao: found.descricao || ''
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.valor || parseFloat(formData.valor) <= 0) {
            toast.error('Valor deve ser maior que zero');
            return;
        }

        setSaving(true);
        try {
            const response = await api.put(`/kitnets/${id}/detalhes`, {
                valor: parseFloat(formData.valor),
                descricao: formData.descricao.trim()
            });

            if (!response.ok) throw new Error('Erro ao salvar');

            toast.success('Kitnet atualizada!');
            navigate(`/kitnet/${id}`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
                    <h1 className="text-xl font-bold text-white">Editar Kitnet</h1>
                    <p className="text-slate-400 text-sm">Kitnet {kitnet.numero}</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Valor */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <label htmlFor="valor" className="block text-sm font-medium text-slate-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Valor do Aluguel (R$) *
                    </label>
                    <input
                        type="number"
                        id="valor"
                        step="0.01"
                        min="0"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                        placeholder="Ex: 850.00"
                        required
                    />
                </div>

                {/* Descrição */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <label htmlFor="descricao" className="block text-sm font-medium text-slate-300 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Descrição
                    </label>
                    <textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Descreva a kitnet (mobiliada, garagem, etc)..."
                    />
                </div>

                {/* Info Card */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-emerald-400" />
                        <div>
                            <p className="text-emerald-400 font-medium text-sm">Status Atual</p>
                            <p className="text-slate-300 text-sm">
                                {kitnet.status === 'livre' ? 'Kitnet livre' : `Alugada para ${kitnet.inquilino_nome || 'inquilino'}`}
                            </p>
                        </div>
                    </div>
                </div>

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
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all font-medium disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

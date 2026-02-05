import { useState, useEffect } from 'react';
import { Save, User, Phone, Home } from 'lucide-react';
import MobileDrawer from './MobileDrawer';
import { toast } from 'sonner';

export default function LeadModal({ lead, isOpen, onClose, onSave }) {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [kitnetInteresse, setKitnetInteresse] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (lead) {
            setNome(lead.nome || '');
            setTelefone(lead.telefone || '');
            setKitnetInteresse(lead.kitnet_interesse || '');
        } else {
            setNome('');
            setTelefone('');
            setKitnetInteresse('');
        }
    }, [lead, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                id: lead?.id,
                nome,
                telefone,
                kitnet_interesse: kitnetInteresse ? parseInt(kitnetInteresse) : null
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar lead');
        } finally {
            setSaving(false);
        }
    };

    return (
        <MobileDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={lead ? 'Editar Lead' : 'Novo Lead'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nome
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Nome do interessado"
                            required
                        />
                    </div>
                </div>

                {/* Telefone */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Telefone (WhatsApp)
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="tel"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Ex: 48999999999"
                            required
                        />
                    </div>
                </div>

                {/* Kitnet de Interesse */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Kitnet de Interesse (Opcional)
                    </label>
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            value={kitnetInteresse}
                            onChange={(e) => setKitnetInteresse(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Número da Kitnet"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
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
        </MobileDrawer>
    );
}

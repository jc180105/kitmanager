import { useState } from 'react';
import { Save } from 'lucide-react';
import MobileDrawer from './MobileDrawer';

function EditModal({ kitnet, onSave, onClose }) {
    const [valor, setValor] = useState(kitnet.valor);
    const [descricao, setDescricao] = useState(kitnet.descricao || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(kitnet.id, parseFloat(valor), descricao);
        setSaving(false);
    };

    return (
        <MobileDrawer
            isOpen={true}
            onClose={onClose}
            title={`Editar Kitnet ${kitnet.numero}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Valor */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Valor (R$)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Ex: 850.00"
                        required
                    />
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Descrição
                    </label>
                    <textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Descreva a kitnet..."
                    />
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

export default EditModal;


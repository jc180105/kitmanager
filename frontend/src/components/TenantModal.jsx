import { useState } from 'react';
import { X, UserPlus, Phone, Calendar, CreditCard } from 'lucide-react';

// Format phone number as (XX) XXXXX-XXXX
const formatPhone = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 11 digits
    const limited = digits.slice(0, 11);

    // Format based on length
    if (limited.length <= 2) {
        return limited;
    } else if (limited.length <= 7) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
};

// Format date for input (YYYY-MM-DD)
const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';

    // If already in YYYY-MM-DD format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateValue.split('T')[0];
    }

    // Try to parse and format
    try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch {
        return '';
    }

    return '';
};

function TenantModal({ kitnet, onSave, onClose }) {
    const [formData, setFormData] = useState({
        inquilino_nome: kitnet.inquilino_nome || '',
        inquilino_telefone: kitnet.inquilino_telefone || '',
        data_entrada: formatDateForInput(kitnet.data_entrada),
        dia_vencimento: kitnet.dia_vencimento || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Apply phone formatting
        if (name === 'inquilino_telefone') {
            setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate
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
            await onSave(kitnet.id, {
                inquilino_nome: formData.inquilino_nome.trim(),
                inquilino_telefone: formData.inquilino_telefone || null,
                data_entrada: formData.data_entrada || null,
                dia_vencimento: formData.dia_vencimento ? parseInt(formData.dia_vencimento) : null,
            });
        } catch (err) {
            setError(err.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tenant-modal-title"
            >
                <div className="animate-fade-in w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <UserPlus className="w-5 h-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <h2 id="tenant-modal-title" className="text-lg font-semibold text-white">
                                Inquilino - Kitnet {kitnet.numero}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Nome */}
                        <div>
                            <label htmlFor="inquilino_nome" className="block text-sm font-medium text-slate-300 mb-2">
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
                        <div>
                            <label htmlFor="inquilino_telefone" className="block text-sm font-medium text-slate-300 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" aria-hidden="true" />
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

                        {/* Data de Entrada */}
                        <div>
                            <label htmlFor="data_entrada" className="block text-sm font-medium text-slate-300 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
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

                        {/* Dia de Vencimento */}
                        <div>
                            <label htmlFor="dia_vencimento" className="block text-sm font-medium text-slate-300 mb-2">
                                <CreditCard className="w-4 h-4 inline mr-1" aria-hidden="true" />
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

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
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
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-medium disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default TenantModal;

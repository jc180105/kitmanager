import { useState, useEffect } from 'react';
import { Plus, Trash2, Receipt, Filter, X, Calendar, DollarSign, Tag, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../utils/config';

const CATEGORIES = [
    { value: 'Manutenção', label: 'Manutenção', color: 'amber' },
    { value: 'Taxas/Impostos', label: 'Taxas/Impostos', color: 'red' },
    { value: 'Utilidades', label: 'Utilidades', color: 'blue' },
    { value: 'Materiais', label: 'Materiais', color: 'purple' },
    { value: 'Outros', label: 'Outros', color: 'slate' },
];

function ExpenseManager({ onUpdate }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Form state
    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        categoria: 'Manutenção',
        data_despesa: new Date().toISOString().split('T')[0]
    });

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/despesas?mes=${selectedMonth}`);
            if (!response.ok) throw new Error('Erro ao buscar despesas');
            const data = await response.json();
            setExpenses(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [selectedMonth]);

    const resetForm = () => {
        setFormData({
            descricao: '',
            valor: '',
            categoria: 'Manutenção',
            data_despesa: new Date().toISOString().split('T')[0]
        });
        setEditingExpense(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (expense) => {
        setFormData({
            descricao: expense.descricao,
            valor: expense.valor.toString(),
            categoria: expense.categoria,
            data_despesa: expense.data_despesa.split('T')[0]
        });
        setEditingExpense(expense);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.descricao.trim() || !formData.valor) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const url = editingExpense
                ? `${API_URL}/despesas/${editingExpense.id}`
                : `${API_URL}/despesas`;

            const method = editingExpense ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    valor: parseFloat(formData.valor)
                })
            });

            if (!response.ok) throw new Error('Erro ao salvar despesa');

            toast.success(editingExpense ? 'Despesa atualizada!' : 'Despesa adicionada!');
            setShowModal(false);
            resetForm();
            fetchExpenses();
            onUpdate?.();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

        try {
            const response = await fetch(`${API_URL}/despesas/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao excluir despesa');

            toast.success('Despesa excluída!');
            fetchExpenses();
            onUpdate?.();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const getCategoryColor = (category) => {
        const cat = CATEGORIES.find(c => c.value === category);
        return cat?.color || 'slate';
    };

    const totalMonth = expenses.reduce((sum, e) => sum + parseFloat(e.valor), 0);

    // Generate month options (last 12 months)
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        monthOptions.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <Receipt className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Despesas</h3>
                        <p className="text-xs text-slate-400">Gerencie seus gastos</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Month Filter */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="pl-8 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nova Despesa</span>
                    </button>
                </div>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-rose-300 font-medium uppercase tracking-wider">Total do Mês</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalMonth)}</p>
                    </div>
                    <div className="p-3 bg-rose-500/20 rounded-full">
                        <DollarSign className="w-6 h-6 text-rose-400" />
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-400 text-sm mt-2">Carregando...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="p-8 text-center">
                        <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Nenhuma despesa neste mês</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {expenses.map((expense) => {
                            const color = getCategoryColor(expense.categoria);
                            return (
                                <div key={expense.id} className="p-3 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`p-2 bg-${color}-500/10 rounded-lg shrink-0`}>
                                            <Tag className={`w-4 h-4 text-${color}-400`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-white truncate">{expense.descricao}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] px-1.5 py-0.5 bg-${color}-500/10 text-${color}-400 rounded`}>
                                                    {expense.categoria}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(expense.data_despesa).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-rose-400 font-bold text-sm whitespace-nowrap">
                                            -{formatCurrency(expense.valor)}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(expense)}
                                                className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-rose-500/10 rounded-lg">
                                    {editingExpense ? <Pencil className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4 text-rose-400" />}
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                                </h3>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Descrição *
                                </label>
                                <input
                                    type="text"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Ex: Conserto da torneira"
                                    className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>

                            {/* Valor e Categoria */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Valor (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Categoria
                                    </label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Data */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Data
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.data_despesa}
                                        onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {editingExpense ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {editingExpense ? 'Salvar Alterações' : 'Adicionar Despesa'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExpenseManager;

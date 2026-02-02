import { useState, useEffect } from 'react';
import { Database, RefreshCw, Home, History } from 'lucide-react';
import { API_URL } from '../utils/config';
import WhatsAppButton from '../components/WhatsAppButton';
import ExportButton from '../components/ExportButton';
import { Link } from 'react-router-dom';

export default function MenuPage() {
    const [kitnets, setKitnets] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchKitnets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/kitnets`);
            if (response.ok) {
                const data = await response.json();
                setKitnets(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKitnets();
    }, []);

    return (
        <div className="animate-fade-in pb-20 md:pb-0 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Menu</h2>
                <p className="text-slate-400 text-sm">Opções adicionais</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Actions */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Ações Rápidas</p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Components handle their own disabled state if no kitnets */}
                        <WhatsAppButton kitnets={kitnets} />
                        <ExportButton kitnets={kitnets} />
                    </div>
                </div>

                {/* System */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Sistema</p>
                    <div className="grid grid-cols-1 gap-3">
                        <Link
                            to="/"
                            className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 rounded-xl transition-colors"
                        >
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <Home className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-medium">Início</span>
                                <span className="text-xs text-slate-500">Voltar para listagem</span>
                            </div>
                        </Link>

                        <a
                            href={`${API_URL}/backup`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 rounded-xl transition-colors"
                        >
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <Database className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-medium">Backup do Banco</span>
                                <span className="text-xs text-slate-500">Baixar cópia de segurança</span>
                            </div>
                        </a>

                        <Link
                            to="/history"
                            className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 rounded-xl transition-colors"
                        >
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <History className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-medium">Histórico</span>
                                <span className="text-xs text-slate-500">Ver alterações recentes</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

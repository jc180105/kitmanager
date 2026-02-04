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
                            to="/whatsapp"
                            className="flex items-center gap-3 px-4 py-3 bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 rounded-xl transition-colors"
                        >
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <span className="block font-medium">Bot WhatsApp</span>
                                <span className="text-xs text-slate-500">Gerenciar conexão</span>
                            </div>
                        </Link>

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

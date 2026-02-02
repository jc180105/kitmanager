import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import DashboardSection from '../components/DashboardSection';
import { API_URL } from '../utils/config';

export default function Dashboard() {
    const [trigger, setTrigger] = useState(0);

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
                    <p className="text-slate-400 text-sm">Visão geral do seu negócio</p>
                </div>
                <button
                    onClick={() => setTrigger(t => t + 1)}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors border border-slate-700/50"
                    title="Atualizar Dashboard"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <DashboardSection refreshTrigger={trigger} apiUrl={API_URL} />
        </div>
    );
}

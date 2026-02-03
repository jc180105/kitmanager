import { useState, useEffect } from 'react';
import { MessageCircle, Power, Loader2 } from 'lucide-react';
import { API_URL } from '../utils/config';
import { toast } from 'sonner';

export default function WhatsAppToggle() {
    const [ativo, setAtivo] = useState(false);
    const [conectado, setConectado] = useState(false);
    const [loading, setLoading] = useState(true);

    // Buscar status inicial
    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const [configRes, statusRes] = await Promise.all([
                fetch(`${API_URL}/config/whatsapp`),
                fetch(`${API_URL}/config/whatsapp/status`)
            ]);

            const config = await configRes.json();
            const status = await statusRes.json();

            setAtivo(config.ativo);
            setConectado(status.conectado);
        } catch (error) {
            console.error('Erro ao buscar status WhatsApp:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleWhatsApp = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/config/whatsapp`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ativo: !ativo })
            });

            const data = await res.json();
            setAtivo(data.ativo);

            toast.success(data.ativo ? '🤖 WhatsApp Bot ativado!' : '⏸️ WhatsApp Bot desativado');

            // Aguardar um pouco e verificar conexão
            if (data.ativo) {
                setTimeout(fetchStatus, 5000);
            }
        } catch (error) {
            toast.error('Erro ao alterar status do WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleWhatsApp}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${ativo
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
            title={ativo ? 'WhatsApp Bot Ativo - Clique para desativar' : 'WhatsApp Bot Inativo - Clique para ativar'}
        >
            <MessageCircle className="w-4 h-4" />
            <Power className={`w-4 h-4 ${ativo ? 'text-green-400' : 'text-gray-500'}`} />
            {conectado && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </button>
    );
}

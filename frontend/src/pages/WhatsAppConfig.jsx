import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Smartphone, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { API_URL } from '../utils/config';
import { toast } from 'sonner';

export default function WhatsAppConfig() {
    const navigate = useNavigate();
    const [qrCode, setQrCode] = useState('');
    const [manualInput, setManualInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('disconnected');

    const fetchQR = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/qr`);
            if (!response.ok) throw new Error('Erro ao buscar QR Code');
            const data = await response.json();

            if (data.qr) {
                setQrCode(data.qr);
                setStatus('waiting');
                toast.success('QR Code atualizado!');
            } else if (data.message?.includes('conectado')) {
                setStatus('connected');
                toast.success('WhatsApp já está conectado!');
            } else {
                toast.info(data.message || 'QR Code não disponível');
            }
        } catch (error) {
            console.error('Erro ao buscar QR:', error);
            toast.error('Erro ao buscar QR Code do servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            setQrCode(manualInput.trim());
            setStatus('waiting');
            toast.success('QR Code definido manualmente!');
        }
    };

    useEffect(() => {
        fetchQR();
        const interval = setInterval(fetchQR, 30000); // Atualiza a cada 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Bot WhatsApp</h1>
                        <p className="text-slate-400">Gerencie a conexão do assistente virtual</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Status Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Status da Conexão</h2>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${status === 'connected'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : status === 'waiting'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                            {status === 'connected' && '✓ Conectado'}
                            {status === 'waiting' && '⏳ Aguardando Conexão'}
                            {status === 'disconnected' && '○ Desconectado'}
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm">
                        {status === 'connected' && 'Seu WhatsApp está conectado e pronto para receber mensagens!'}
                        {status === 'waiting' && 'Escaneie o QR Code abaixo com seu WhatsApp para conectar.'}
                        {status === 'disconnected' && 'Clique em "Atualizar QR Code" para gerar uma nova conexão.'}
                    </p>
                </div>

                {/* QR Code Display */}
                {qrCode && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-semibold text-white mb-6">Escaneie o QR Code</h3>

                            <div className="bg-white p-6 rounded-2xl mb-6">
                                <QRCodeSVG
                                    value={qrCode}
                                    size={256}
                                    level="M"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="text-center text-slate-400 text-sm space-y-2">
                                <p>📱 Abra o WhatsApp no seu celular</p>
                                <p>⚙️ Vá em Configurações → Aparelhos conectados</p>
                                <p>📷 Toque em "Conectar um aparelho" e escaneie</p>
                            </div>

                            <button
                                onClick={fetchQR}
                                disabled={loading}
                                className="mt-6 flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-5 h-5" />
                                )}
                                Atualizar QR Code
                            </button>
                        </div>
                    </div>
                )}

                {/* Manual Input */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Entrada Manual de QR Code</h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Se você tem a string do QR Code dos logs do Railway, cole aqui:
                    </p>

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="2@X879RDNh..."
                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                            onClick={handleManualSubmit}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
                        >
                            Gerar QR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Power, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import QRCode from 'react-qr-code';

const FIXED_QR_CODE = "2@ZETXyrDUVQDXtCb9GgZSZwZCm5AX/EHD44sprgh6sxInA5Q4LiExpH3Jas9Y4eccPp8LwKzY+PD9WWgUiwK2yl3k7dJLBtfixyY=,A4vgx2ol9W3RypVLxlJNYJYPUd2H3u60D+UH7RWnMQ0=,4a7MAuL39liG3yoJx8FnjQQk7jP1dwpPbYCMz+8jXwQ=,Z9RmbYvr7fMl4vgC8A2+FhaCbo7GRgeMj30qOr03zJo=";

export default function Configuration({ apiUrl }) {
    const [botStatus, setBotStatus] = useState({ connected: false, qr: null, loading: true, ativo: false, manualQr: '' });
    const [loadingAction, setLoadingAction] = useState(false);

    const baseUrl = 'https://kitmanager-production.up.railway.app';

    const checkStatus = async () => {
        try {
            // Check config status (active/inactive)
            const configRes = await fetch(`${baseUrl}/config/whatsapp`);
            const configJson = await configRes.json();

            // Check connection status
            const statusRes = await fetch(`${baseUrl}/config/whatsapp/status`);
            const statusJson = await statusRes.json();

            let qrCode = null;
            if (configJson.ativo && !statusJson.conectado) {
                try {
                    const qrRes = await fetch(`${baseUrl}/config/whatsapp/qr`);
                    const qrJson = await qrRes.json();
                    qrCode = qrJson.qr;
                } catch (e) {
                    console.warn('Falha ao buscar QR, usando fixo/manual');
                }
            }

            setBotStatus(prev => ({
                ...prev,
                connected: statusJson.conectado,
                qr: qrCode || prev.manualQr || FIXED_QR_CODE,
                loading: false,
                ativo: configJson.ativo
            }));
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            setBotStatus(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleToggleBot = async () => {
        setLoadingAction(true);
        try {
            const novoEstado = !botStatus.ativo;
            await fetch(`${baseUrl}/config/whatsapp`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ativo: novoEstado })
            });
            await checkStatus();
        } catch (error) {
            alert('Erro ao alterar status do bot');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleResetConnection = async () => {
        if (!confirm('Isso irá desconectar o bot atual e gerar um novo QR Code. Continuar?')) return;
        setLoadingAction(true);
        try {
            await fetch(`${baseUrl}/config/whatsapp/reset`, { method: 'POST' });
            alert('Conexão resetada! Aguarde o novo QR Code.');
            await checkStatus();
        } catch (error) {
            alert('Erro ao resetar conexão');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Configurações</h1>

            {/* WhatsApp Bot Configuration Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Bot WhatsApp</h2>
                            <p className="text-slate-400 text-sm">Gerencie a conexão do assistente virtual</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${botStatus.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                            {botStatus.ativo ? 'Ativado' : 'Desativado'}
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Controls */}
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider">Status da Conexão</h3>

                            <div className="flex items-center gap-3 mb-4">
                                {botStatus.loading ? (
                                    <span className="flex items-center gap-2 text-slate-400">
                                        <RefreshCw className="w-4 h-4 animate-spin" /> Verificando...
                                    </span>
                                ) : botStatus.connected ? (
                                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-semibold">Conectado e Operante</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 w-fit">
                                        <AlertTriangle className="w-5 h-5" />
                                        <span className="font-semibold">Aguardando Conexão</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-slate-400 leading-relaxed">
                                {botStatus.connected
                                    ? 'O bot está online e respondendo mensagens automaticamente.'
                                    : 'Escaneie o QR Code ao lado para conectar.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleToggleBot}
                                disabled={loadingAction}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${botStatus.ativo
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                    }`}
                            >
                                <Power className="w-4 h-4" />
                                {botStatus.ativo ? 'Desativar Bot' : 'Ativar Bot'}
                            </button>

                            {botStatus.ativo && (
                                <button
                                    onClick={handleResetConnection}
                                    disabled={loadingAction}
                                    className="flex items-center justify-center gap-2 p-3 rounded-lg font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all border border-slate-600"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loadingAction ? 'animate-spin' : ''}`} />
                                    Reiniciar Sessão (Novo QR)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column: QR Code Area */}
                    <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl min-h-[300px]">
                        {!botStatus.ativo ? (
                            <div className="text-center text-slate-400">
                                <Power className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Bot desativado</p>
                            </div>
                        ) : botStatus.connected ? (
                            <div className="text-center animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-800 mb-1">Tudo Pronto!</h3>
                                <p className="text-slate-500 text-sm">Seu WhatsApp está conectado.</p>
                            </div>
                        ) : (
                            <div className="text-center animate-fade-in">
                                <div className="bg-white p-2 border-2 border-slate-100 rounded-lg mb-4 shadow-sm inline-block">
                                    <QRCode value={botStatus.manualQr || botStatus.qr || FIXED_QR_CODE} size={200} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">Escaneie para Conectar</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar Aparelho
                                </p>

                                <div className="mt-4 border-t border-slate-100 pt-4">
                                    <p className="text-xs text-slate-400 mb-2">Código/String do QR (Editável):</p>
                                    <input
                                        type="text"
                                        placeholder="Cole o código (2@...)"
                                        className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded mb-2 font-mono text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                                        value={botStatus.manualQr}
                                        onChange={(e) => setBotStatus(s => ({ ...s, manualQr: e.target.value }))}
                                    />
                                    <div className="text-[10px] text-slate-500 text-left">
                                        * A conexão pode demorar alguns segundos após escanear.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

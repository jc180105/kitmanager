import { useState } from 'react';
import { Users, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import MobileDrawer from './MobileDrawer';

// Group WhatsApp configuration
const WHATSAPP_GROUP_NAME = "Condomínio Porto Reis 🏬";

function WhatsAppButton({ kitnets }) {
    const [showBulkModal, setShowBulkModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors"
                aria-label="Mensagem para o Grupo"
            >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">WhatsApp Grupo</span>
                <span className="sm:hidden text-xs">Grupo</span>
            </button>

            {/* Bulk Message Modal */}
            {showBulkModal && (
                <GroupMessageModal
                    groupName={WHATSAPP_GROUP_NAME}
                    onClose={() => setShowBulkModal(false)}
                />
            )}
        </>
    );
}
// Group Message Modal Component
function GroupMessageModal({ groupName, onClose }) {
    const [message, setMessage] = useState('');
    const [useTemplate, setUseTemplate] = useState(null);
    const [copied, setCopied] = useState(false);

    const templates = [
        {
            id: 'lembrete',
            name: 'Lembrete Pgto',
            icon: '📅',
            text: 'Olá moradores! 🏠\n\nPassando para lembrar que o aluguel vence em breve.\nQualquer dúvida, estou à disposição.\n\nObrigado!',
        },
        {
            id: 'aviso',
            name: 'Aviso Geral',
            icon: '📢',
            text: 'Olá moradores! 🏠\n\nGostaria de informar que amanhã haverá manutenção no prédio.\nPor favor, fiquem atentos.\n\nObrigado!',
        },
        {
            id: 'agradecimento',
            name: 'Agradecimento',
            icon: '🙏',
            text: 'Olá moradores! 🏠\n\nObrigado a todos por serem ótimos inquilinos!\nQualquer necessidade, podem contar comigo.\n\nAbraços!',
        },
    ];

    const handleTemplateSelect = (template) => {
        setMessage(template.text);
        setUseTemplate(template.id);
    };

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    const openWhatsApp = () => {
        // Always copy to clipboard as backup/convenience
        navigator.clipboard.writeText(message);

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const encodedMessage = encodeURIComponent(message);

        if (isMobile) {
            // Mobile: Open App directly with pre-filled text
            window.location.href = `whatsapp://send?text=${encodedMessage}`;
        } else {
            // Desktop: Open Web
            window.open('https://web.whatsapp.com', '_blank');
        }
    };

    return (
        <MobileDrawer
            isOpen={true}
            onClose={onClose}
            variant="center"
            title={
                <div className="flex flex-col">
                    <span>Mensagem para o Grupo</span>
                    <span className="text-xs text-emerald-400 font-normal">{groupName}</span>
                </div>
            }
        >
            <div className="space-y-6">

                {/* Templates - Horizontal Scroll on Mobile */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Modelos Rápidos
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${useTemplate === template.id
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                                    }`}
                            >
                                <span className="text-2xl mb-1">{template.icon}</span>
                                <span className="text-[10px] font-medium text-center leading-tight">{template.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Message */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="group-message" className="block text-sm font-medium text-slate-300">
                            Mensagem
                        </label>
                        {message && (
                            <button
                                onClick={() => { setMessage(''); setUseTemplate(null); }}
                                className="text-xs text-slate-500 hover:text-white"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                    <textarea
                        id="group-message"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setUseTemplate(null);
                        }}
                        rows={6}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                        placeholder="Digite sua mensagem para o grupo..."
                    />
                </div>

                {/* Instructions & Actions */}
                <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-start">
                        <div className="p-1.5 bg-blue-500/20 rounded-full mt-0.5 shrink-0">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-300">
                                <b>Dica:</b> No celular, o app abrirá direto. No PC, abrirá o WhatsApp Web.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={copyMessage}
                            disabled={!message.trim()}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={openWhatsApp}
                            disabled={!message.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                            <span>Abrir WhatsApp</span>
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </MobileDrawer>
    );
}

export default WhatsAppButton;

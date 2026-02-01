import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users, X, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';

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
            name: '📅 Lembrete de Pagamento',
            text: 'Olá moradores! 🏠\n\nPassando para lembrar que o aluguel vence em breve.\nQualquer dúvida, estou à disposição.\n\nObrigado!',
        },
        {
            id: 'aviso',
            name: '📢 Aviso Geral',
            text: 'Olá moradores! 🏠\n\nGostaria de informar que amanhã haverá manutenção no prédio.\nPor favor, fiquem atentos.\n\nObrigado!',
        },
        {
            id: 'agradecimento',
            name: '🙏 Agradecimento',
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

    const openWhatsAppWeb = () => {
        // Copy message first
        navigator.clipboard.writeText(message).then(() => {
            // Open WhatsApp Web
            window.open('https://web.whatsapp.com', '_blank');
        });
    };

    return (
        <>
            <div
                className="modal-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="group-modal-title"
            >
                <div className="animate-fade-in w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 id="group-modal-title" className="text-lg font-semibold text-white">
                                    Mensagem para o Grupo
                                </h2>
                                <p className="text-sm text-emerald-400">
                                    {groupName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                        {/* Templates */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Modelos Prontos
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className={`text-left px-4 py-3 rounded-xl border transition-all ${useTemplate === template.id
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-600 hover:border-slate-500'
                                            }`}
                                    >
                                        <p className="text-white font-medium">{template.name}</p>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{template.text}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Message */}
                        <div>
                            <label htmlFor="group-message" className="block text-sm font-medium text-slate-300 mb-2">
                                Mensagem Personalizada
                            </label>
                            <textarea
                                id="group-message"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    setUseTemplate(null);
                                }}
                                rows={5}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                placeholder="Digite sua mensagem para o grupo..."
                            />
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <p className="text-sm text-blue-400 font-medium mb-2">
                                📋 Como enviar para o grupo:
                            </p>
                            <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
                                <li>Clique em "Copiar e Abrir WhatsApp"</li>
                                <li>No WhatsApp Web, abra o grupo "{groupName}"</li>
                                <li>Cole a mensagem (Ctrl+V) e envie</li>
                            </ol>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-5 border-t border-slate-700">
                        <button
                            onClick={copyMessage}
                            disabled={!message.trim()}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors font-medium disabled:opacity-50"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copiar
                                </>
                            )}
                        </button>
                        <button
                            onClick={openWhatsAppWeb}
                            disabled={!message.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all font-medium disabled:opacity-50"
                        >
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                            Copiar e Abrir WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default WhatsAppButton;

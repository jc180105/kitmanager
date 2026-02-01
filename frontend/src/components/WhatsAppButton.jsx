import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users, X, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';

// Group WhatsApp configuration
const WHATSAPP_GROUP_NAME = "Condomínio Porto Reis 🏬";

function WhatsAppButton({ kitnets }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const dropdownRef = useRef(null);

    // Get only rented kitnets with phone numbers
    const tenantsWithPhone = kitnets.filter(
        k => k.status === 'alugada' && k.inquilino_telefone && k.inquilino_nome
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Format phone number for WhatsApp (Brazil)
    const formatPhone = (phone) => {
        if (!phone) return null;
        // Remove non-digits
        const digits = phone.replace(/\D/g, '');
        // Add country code if not present
        if (digits.length === 11) {
            return `55${digits}`;
        } else if (digits.length === 10) {
            return `55${digits}`;
        }
        return digits;
    };

    // Open WhatsApp with pre-filled message
    const openWhatsApp = (phone, message = '') => {
        const formattedPhone = formatPhone(phone);
        if (!formattedPhone) return;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
        window.open(url, '_blank');
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={tenantsWithPhone.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar mensagem WhatsApp"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">WhatsApp</span>
                    {tenantsWithPhone.length > 0 && (
                        <span className="bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {tenantsWithPhone.length}
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {isOpen && (
                    <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden fixed left-4 sm:absolute sm:left-auto">
                        {/* Header */}
                        <div className="p-3 border-b border-slate-700 bg-emerald-500/10">
                            <p className="text-sm font-medium text-emerald-400">
                                📱 Enviar Mensagem
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="p-2 border-b border-slate-700">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowBulkModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                                <div>
                                    <p className="font-medium">Enviar no Grupo</p>
                                    <p className="text-xs text-slate-400">{WHATSAPP_GROUP_NAME}</p>
                                </div>
                            </button>
                        </div>

                        {/* Individual Tenants */}
                        <div className="max-h-60 overflow-y-auto">
                            <div className="px-3 py-2 text-xs text-slate-500 uppercase">
                                Mensagens Individuais
                            </div>
                            {tenantsWithPhone.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    onClick={() => {
                                        openWhatsApp(tenant.inquilino_telefone);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                                >
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">
                                        {tenant.numero}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {tenant.inquilino_nome}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {tenant.inquilino_telefone}
                                        </p>
                                    </div>
                                    <Send className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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

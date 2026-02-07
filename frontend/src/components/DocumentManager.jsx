import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, FileText, ImageIcon, Loader2 } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { api } from '../utils/api';
import { API_URL } from '../utils/config';

function DocumentManager({ kitnetId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (kitnetId) {
            fetchDocuments();
        }
    }, [kitnetId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/kitnets/${kitnetId}/documentos`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Erro ao buscar documentos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const handleCameraCapture = async (file) => {
        await uploadFile(file);
    };

    const uploadFile = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('kitnet_id', kitnetId);

        try {
            // api.js automatically handles Content-Type for FormData (leaves it undefined so browser sets it with boundary)
            const res = await api.post('/upload', formData);

            if (res.ok) {
                await fetchDocuments();
            } else {
                console.error("Erro ao enviar arquivo");
            }
        } catch (error) {
            console.error("Erro no upload:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return;

        try {
            const res = await api.delete(`/documentos/${id}`);

            if (res.ok) {
                setDocuments(prev => prev.filter(doc => doc.id !== id));
            }
        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
    };

    const getFileUrl = (path) => {
        // Fix path to be browser friendly
        const relativePath = path.replace(/\\/g, '/').split('uploads/').pop();
        return `${API_URL}/uploads/${relativePath}`;
    };

    const isImage = (filename) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Documentos (Contratos, RGs)</h3>

            {/* List */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {documents.map(doc => (
                    <div key={doc.id} className="relative group bg-slate-800 rounded-lg border border-slate-700 overflow-hidden aspect-square flex flex-col items-center justify-center p-2">
                        {isImage(doc.nome_arquivo) ? (
                            <img
                                src={getFileUrl(doc.caminho_arquivo)}
                                alt={doc.nome_arquivo}
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        ) : (
                            <FileText className="w-10 h-10 text-slate-500 mb-2" />
                        )}

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <a
                                href={getFileUrl(doc.caminho_arquivo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 ml-2 bg-slate-600/80 hover:bg-slate-500 rounded-full text-white"
                                title="Visualizar"
                            >
                                <FileText className="w-4 h-4" />
                            </a>
                        </div>

                        {!isImage(doc.nome_arquivo) && (
                            <span className="text-xs text-slate-400 truncate w-full text-center relative z-10 p-1 bg-black/50 rounded">
                                {doc.nome_arquivo}
                            </span>
                        )}
                    </div>
                ))}

                {/* Loading State or Empty State */}
                {!loading && documents.length === 0 && (
                    <div className="col-span-2 sm:col-span-3 py-6 flex flex-col items-center justify-center text-slate-500 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">Nenhum documento</span>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors text-sm font-medium"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Upload Arquivo</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 rounded-xl transition-colors text-sm font-medium"
                >
                    <Camera className="w-4 h-4" />
                    <span>Escanear (Câmera)</span>
                </button>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
}

export default DocumentManager;

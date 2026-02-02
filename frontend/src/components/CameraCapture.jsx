import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraMode, setCameraMode] = useState('environment'); // 'user' or 'environment'
    const [error, setError] = useState(null);

    const startCamera = async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: cameraMode
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Não foi possível acessar a câmera. Verifique as permissões.");
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraMode]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            if (cameraMode === 'user') {
                // Mirror if front camera
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to data URL
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageDataUrl);
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    const confirmPhoto = () => {
        // Convert Data URL to Blob
        fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                onCapture(file);
                onClose();
            });
    };

    const toggleCamera = () => {
        setCameraMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
                <button onClick={onClose} className="p-2 text-white">
                    <X className="w-6 h-6" />
                </button>
                <span className="text-white font-medium">Capturar Documento</span>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
                {error ? (
                    <div className="text-white text-center p-4">
                        <p className="text-red-400 mb-2">{error}</p>
                        <button onClick={startCamera} className="px-4 py-2 bg-slate-700 rounded-lg">
                            Tentar Novamente
                        </button>
                    </div>
                ) : capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`max-w-full max-h-full object-cover ${cameraMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="bg-black/80 p-6 pb-10 flex justify-around items-center">
                {capturedImage ? (
                    <>
                        <button
                            onClick={retakePhoto}
                            className="flex flex-col items-center gap-1 text-white"
                        >
                            <div className="p-3 rounded-full bg-slate-700">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <span className="text-xs">Tirar Outra</span>
                        </button>

                        <button
                            onClick={confirmPhoto}
                            className="flex flex-col items-center gap-1 text-white"
                        >
                            <div className="p-4 rounded-full bg-emerald-600">
                                <Check className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-bold">Usar Foto</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={toggleCamera}
                            className="p-3 rounded-full bg-slate-800 text-white"
                        >
                            <RefreshCw className="w-6 h-6" />
                        </button>

                        <button
                            onClick={capturePhoto}
                            className="p-1 rounded-full border-4 border-white"
                        >
                            <div className="w-14 h-14 bg-white rounded-full"></div>
                        </button>

                        <div className="w-12"></div> {/* Spacer to center shutter */}
                    </>
                )}
            </div>
        </div>
    );
};

export default CameraCapture;

'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QRScannerProps {
    onScanSuccess: (decodedText: string, snapshot?: string) => void;
    onScanError?: (error: string) => void;
    disabled?: boolean;
    autoStart?: boolean;
    compact?: boolean;
}

export default function QRScanner({
    onScanSuccess,
    onScanError,
    disabled = false,
    autoStart = false,
    compact = false
}: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasScannedRef = useRef(false);
    const transitionRef = useRef(false);

    useEffect(() => {
        let isCurrent = true;
        if (autoStart && !disabled) {
            startScanning();
        }
        return () => {
            isCurrent = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop()
                    .then(() => {
                        if (scannerRef.current) {
                            try { scannerRef.current.clear(); } catch (e) { }
                        }
                    })
                    .catch(() => { });
            }
        };
    }, [autoStart, disabled]);

    const captureFrame = (): string | null => {
        try {
            const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
            if (!video) return null;

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Draw current video frame
            ctx.drawImage(video, 0, 0);

            // Add timestamp watermark
            const timestamp = new Date().toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            ctx.font = 'bold 24px Inter, system-ui, sans-serif';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.strokeText(timestamp, 30, canvas.height - 40);
            ctx.fillText(timestamp, 30, canvas.height - 40);

            ctx.font = 'black 14px Inter, system-ui, sans-serif';
            ctx.strokeText('VOTER SCAN AUDIT - APRT2026', 30, canvas.height - 70);
            ctx.fillText('VOTER SCAN AUDIT - APRT2026', 30, canvas.height - 70);

            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (err) {
            console.error('Failed to capture frame:', err);
            return null;
        }
    };

    const startScanning = async () => {
        if (disabled || isScanning || isLoading || transitionRef.current) return;

        try {
            transitionRef.current = true;
            setIsLoading(true);
            setError(null);
            hasScannedRef.current = false;

            // Get available cameras
            const devices = await Html5Qrcode.getCameras();

            if (!devices || devices.length === 0) {
                throw new Error('Tidak ada kamera ditemukan. Pastikan browser memiliki akses ke kamera.');
            }

            // Prefer back camera (usually last in the list)
            const selectedCamera = devices[devices.length - 1];

            // Initialize scanner if not already initialized
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-reader');
            }

            // Start scanning with better config
            await scannerRef.current.start(
                selectedCamera.id,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    videoConstraints: {
                        facingMode: "environment" // Prefer back camera
                    }
                },
                (decodedText) => {
                    // Success callback - only process once
                    if (!hasScannedRef.current) {
                        hasScannedRef.current = true;

                        // Capture snapshot immediately
                        const snapshot = captureFrame();

                        onScanSuccess(decodedText, snapshot || undefined);

                        // Stop scanner after successful scan
                        setTimeout(() => {
                            stopScanning();
                        }, 500);
                    }
                },
                (errorMessage) => {
                    // Error callback - silent, happens constantly when no QR detected
                }
            );

            setIsScanning(true);
            setIsLoading(false);
            transitionRef.current = false;

        } catch (err: any) {
            transitionRef.current = false;
            console.error('Scanner error:', err);
            let errorMsg = 'Gagal memulai kamera';

            if (err.name === 'NotAllowedError') {
                errorMsg = 'Akses kamera ditolak. Silakan izinkan akses kamera di browser.';
            } else if (err.name === 'NotFoundError') {
                errorMsg = 'Kamera tidak ditemukan pada perangkat ini.';
            } else if (err.message) {
                errorMsg = err.message;
            }

            setError(errorMsg);
            setIsLoading(false);
            setIsScanning(false);
            onScanError?.(errorMsg);
        }
    };

    const stopScanning = async () => {
        if (transitionRef.current) return;
        try {
            transitionRef.current = true;
            if (scannerRef.current) {
                await scannerRef.current.stop();
                setIsScanning(false);
            }
            transitionRef.current = false;
        } catch (err) {
            transitionRef.current = false;
            console.error('Error stopping scanner:', err);
            setIsScanning(false);
        }
    };

    return (
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
            {/* Scanner Container */}
            <div className="relative">
                <div
                    id="qr-reader"
                    className={isScanning ? 'block' : 'hidden'}
                />

                {/* Placeholder when not scanning */}
                {!isScanning && (
                    <div className={`flex flex-col items-center justify-center bg-slate-900 ${compact ? 'p-4 min-h-[210px]' : 'p-12 min-h-[400px]'}`}>
                        <div className={`${compact ? 'w-24 h-24' : 'w-64 h-64'} border-4 border-dashed border-slate-800 rounded-2xl flex items-center justify-center mb-6`}>
                            {isLoading ? (
                                <Loader2 size={compact ? 32 : 64} className="text-primary animate-spin" />
                            ) : (
                                <CameraOff size={compact ? 32 : 64} className="text-slate-700" />
                            )}
                        </div>
                        {!compact && (
                            <>
                                <p className="text-slate-600 font-medium mb-2 text-center">
                                    {isLoading ? 'Memulai kamera...' : error || 'Kamera siap untuk scan QR code'}
                                </p>
                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
                                        <p className="text-sm text-red-700 text-center">
                                            {error}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                        {compact && error && (
                            <p className="text-xs text-red-600 text-center px-4">{error}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            {!autoStart && (
                <div className="p-6 border-t border-slate-200 bg-white">
                    {!isScanning ? (
                        <Button
                            onClick={startScanning}
                            size="lg"
                            className="w-full"
                            disabled={isLoading || disabled}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    Memulai Kamera...
                                </>
                            ) : (
                                <>
                                    <Camera size={20} className="mr-2" />
                                    Mulai Scanner
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-center text-sm text-slate-600 font-medium">
                                Arahkan kamera ke QR code pada undangan
                            </div>
                            <Button
                                onClick={stopScanning}
                                variant="outline"
                                size="lg"
                                className="w-full"
                            >
                                <CameraOff size={20} className="mr-2" />
                                Hentikan Scanner
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Add custom styles to fix video display */}
            <style jsx global>{`
                #qr-reader {
                    width: 100% !important;
                }
                #qr-reader video {
                    width: 100% !important;
                    height: auto !important;
                    border: none !important;
                }
                #qr-reader__dashboard {
                    display: none !important;
                }
            `}</style>
        </Card>
    );
}

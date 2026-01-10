'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Upload, X } from 'lucide-react';

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCropComplete: (croppedImage: Blob) => void;
}

export default function ImageCropModal({ isOpen, onClose, onCropComplete }: ImageCropModalProps) {
    const [image, setImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => setImage(reader.result as string));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onCropChange = (crop: any) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: any) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const handleSave = async () => {
        if (!image || !croppedAreaPixels) return;
        setLoading(true);
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
            setImage(null);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
                        Potong <span className="text-primary">Foto Profil</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 bg-white">
                    {!image ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 transition-colors hover:border-primary/50 hover:bg-slate-50">
                            <Upload className="text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-bold mb-4">Pilih foto untuk diunggah</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onSelectFile}
                                className="hidden"
                                id="photo-upload"
                            />
                            <Button asChild className="rounded-2xl font-black px-8">
                                <label htmlFor="photo-upload" className="cursor-pointer">Pilih File</label>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative h-[300px] w-full bg-slate-100 rounded-2xl overflow-hidden">
                                <Cropper
                                    image={image}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={onCropChange}
                                    onZoomChange={onZoomChange}
                                    onCropComplete={onCropCompleteInternal}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Zoom</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={(value) => setZoom(value[0])}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setImage(null)}
                                    className="flex-1 h-12 rounded-2xl font-black"
                                >
                                    Ganti Foto
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 h-12 rounded-2xl font-black shadow-lg shadow-primary/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Selesai & Simpan'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

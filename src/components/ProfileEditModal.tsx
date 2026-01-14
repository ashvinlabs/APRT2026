'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Loader2, UserCog } from 'lucide-react';
import ImageCropModal from './ImageCropModal';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/logger';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
    const { user, refreshUser } = useUser();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user, isOpen]);

    async function handlePhotoCrop(blob: Blob) {
        if (!user) return;

        setIsUploadingPhoto(true);
        try {
            const fileName = `staff-${user.id}-${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('staff-photos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('staff-photos')
                .getPublicUrl(fileName);

            // Update database
            const { error: dbError } = await supabase
                .from('staff')
                .update({ photo_url: publicUrl })
                .eq('user_id', user.user_id);

            if (dbError) throw dbError;

            await refreshUser();
            toast({
                title: 'Berhasil',
                description: 'Foto profil berhasil diperbarui',
            });
            logActivity('update_profile', 'manage_staff', { detail: 'Update Foto Profil Sendiri' });
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            toast({
                title: 'Gagal',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploadingPhoto(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('staff')
                .update({ name: name.trim() })
                .eq('user_id', user.user_id);

            if (error) throw error;

            await refreshUser();
            toast({
                title: 'Berhasil',
                description: 'Profil berhasil diperbarui',
            });
            logActivity('update_profile', 'manage_staff', { detail: `Update Nama Profil: ${name.trim()}` });
            onClose();
        } catch (error: any) {
            toast({
                title: 'Gagal',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    }

    if (!user) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-slate-900 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <UserCog size={100} />
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Edit <span className="text-blue-400">Profil Saya</span></DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold">Perbarui data diri Anda.</DialogDescription>
                    </DialogHeader>

                    <div className="p-8 pb-4 flex flex-col items-center justify-center bg-slate-50 border-b border-slate-100">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                                <AvatarImage src={user.photo_url || ''} className="object-cover" />
                                <AvatarFallback className="bg-slate-200 text-slate-400">
                                    <User size={40} />
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                size="icon"
                                onClick={() => setIsCropModalOpen(true)}
                                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-white shadow-lg border-2 border-white scale-110 active:scale-95 transition-transform"
                                disabled={isUploadingPhoto}
                            >
                                {isUploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            </Button>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Foto Profil</p>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email (ID)</Label>
                            <Input
                                value={user.email}
                                disabled
                                className="h-14 rounded-2xl bg-slate-100 border-slate-200 font-mono text-sm cursor-not-allowed"
                            />
                        </div>
                        <DialogFooter className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="flex-1 h-14 rounded-2xl font-black text-slate-400"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="flex-1 h-14 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100"
                            >
                                {isUpdating ? <Loader2 className="animate-spin" /> : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ImageCropModal
                isOpen={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                onCropComplete={handlePhotoCrop}
            />
        </>
    );
}

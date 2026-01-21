'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Image as ImageIcon, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { studioLogger } from '@/lib/logger';

interface MediaUploadProps {
    type: 'audio' | 'image';
    onUploadComplete: (url: string, hash: string) => void;
    currentUrl?: string;
}

export function MediaUpload({ type, onUploadComplete, currentUrl }: MediaUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const calculateHash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setProgress(10);

        try {
            // 1. Calculate Hash
            const hash = await calculateHash(file);
            setProgress(30);
            studioLogger.info(`Asset Engine: Hash calculated for ${file.name}`);

            // 2. Upload to Blossom (Simplified Mock)
            studioLogger.info(`Blossom Storage: Uploading ${file.name}...`);

            // Simulate upload progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mockUrl = `${process.env.NEXT_PUBLIC_BLOSSOM_URL}/files/${hash}.${file.name.split('.').pop()}`;

            setProgress(100);
            onUploadComplete(mockUrl, hash);
            studioLogger.success(`${type.toUpperCase()} Asset linked: ${file.name}`);
        } catch (err: any) {
            const msg = err.message || 'Upload failed';
            setError(msg);
            studioLogger.error(`Storage Error: ${msg}`);
        } finally {
            setIsUploading(false);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: type === 'audio'
            ? { 'audio/*': ['.mp3', '.wav', '.flac'] }
            : { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        multiple: false,
        disabled: isUploading
    });

    if (currentUrl) {
        return (
            <div className="relative group rounded-xl overflow-hidden border border-neutral-800 aspect-square flex items-center justify-center bg-neutral-900">
                {type === 'image' ? (
                    <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-emerald-500">
                        <Music size={48} />
                        <span className="text-xs font-bold uppercase tracking-widest">Audio Loaded</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        onClick={() => onUploadComplete('', '')}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-400 text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="absolute bottom-2 right-2">
                    <CheckCircle2 className="text-emerald-500 fill-black" size={20} />
                </div>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative aspect-square rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer p-6 text-center",
                isDragActive ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900",
                isUploading && "pointer-events-none opacity-50"
            )}
        >
            <input {...getInputProps()} />

            {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="text-emerald-500 animate-spin" size={40} />
                    <div className="text-sm font-bold text-neutral-300">Uploading... {progress}%</div>
                    <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-neutral-800 rounded-full text-neutral-400 group-hover:scale-110 transition-transform">
                        {type === 'audio' ? <Music size={32} /> : <ImageIcon size={32} />}
                    </div>
                    <div>
                        <div className="font-bold text-neutral-200">
                            {isDragActive ? "Drop to upload" : `Add ${type === 'audio' ? 'Audio' : 'Cover Art'}`}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1 uppercase tracking-tighter">
                            {type === 'audio' ? "WAV, FLAC, or MP3" : "JPG, PNG, or WebP"}
                        </div>
                    </div>
                    {error && <div className="text-xs text-red-500 font-bold mt-2">{error}</div>}
                </>
            )}
        </div>
    );
}

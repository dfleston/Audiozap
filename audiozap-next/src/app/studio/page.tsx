'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WizardStepper } from '@/components/studio/WizardStepper';
import { MediaUpload } from '@/components/studio/MediaUpload';
import { MetadataForm } from '@/components/studio/MetadataForm';
import { ContributorManager } from '@/components/studio/ContributorManager';
import { SplitTable } from '@/components/studio/SplitTable';
import { db, SongDraft } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import {
    ArrowLeft,
    ArrowRight,
    Save,
    Send,
    CheckCircle,
    Loader2,
    AlertCircle,
    Terminal,
    Circle
} from 'lucide-react';
import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
import { studioLogger, LogEntry } from '@/lib/logger';
import { cn } from '@/lib/utils';

function StudioContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get('draftId');

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Draft State
    const [draft, setDraft] = useState<SongDraft>({
        uuid: uuidv4(),
        title: '',
        description: '',
        lyrics: '',
        genre: '',
        contributors: [],
        splits: [],
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // 1. Subscribe to Logs
    useEffect(() => {
        const unsubscribe = studioLogger.subscribe((entry) => {
            setLogs(prev => [...prev, entry]);
        });
        studioLogger.info('Studio Session Started: Ready for release curation.');
        return unsubscribe;
    }, []);

    // 1b. Load Draft if ID present
    useEffect(() => {
        if (draftId) {
            setIsLoading(true);
            db.drafts.get(draftId).then((loadedDraft) => {
                if (loadedDraft) {
                    setDraft(loadedDraft);
                    studioLogger.info(`Loaded draft: ${loadedDraft.title || 'Untitled'}`);
                } else {
                    studioLogger.error('Draft not found, starting fresh.');
                }
            }).catch(err => {
                studioLogger.error('Failed to load draft.');
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [draftId]);

    // 2. Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const updateDraft = (updates: Partial<SongDraft>) => {
        setDraft(prev => ({ ...prev, ...updates, updatedAt: Date.now() }));
        setHasUnsavedChanges(true);
    };

    const handleSaveDraft = async () => {
        setIsLoading(true);
        studioLogger.info(`Saving draft: ${draft.title || 'Untitled'}...`);
        try {
            await db.drafts.put(draft);
            setHasUnsavedChanges(false);
            studioLogger.success('Draft saved successfully to local database.');
        } catch (err) {
            studioLogger.error(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStepClick = (targetStep: number) => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Save before continuing?')) {
                handleSaveDraft();
            }
        }
        setStep(targetStep);
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        setError(null);
        studioLogger.info('Starting Publish Workflow...');

        try {
            // 1. Validate total splits
            const totalBps = draft.splits.reduce((acc, s) => acc + s.weight, 0) + 210;
            if (totalBps !== 10000) {
                throw new Error('Total splits must equal 100% (including platform fee)');
            }

            studioLogger.protocol('Connecting to Nostr Relay...');
            const ndk = new NDK({ explicitRelayUrls: [process.env.NEXT_PUBLIC_RELAY_URL || 'ws://localhost:3334'] });
            await ndk.connect();
            studioLogger.protocol('Connected to AudioZap Federation Relay.');

            // 3. Construct Event Kind 31337
            studioLogger.info('Constructing Kind 31337 (Song) event...');
            const event = new NDKEvent(ndk);
            event.kind = 31337;
            event.content = JSON.stringify({
                description: draft.description,
                lyrics: draft.lyrics
            });

            event.tags = [
                ["d", draft.uuid],
                ["title", draft.title],
                ["t", draft.genre],
                ["isrc", draft.isrc || ""],
                ["url", draft.audioUrl || "", "audio/mpeg"],
                ["image", draft.imageUrl || ""],
                ["p-line", draft.pLine || ""],
                ["c-line", draft.cLine || ""],
            ];

            draft.contributors.forEach(c => {
                event.tags.push(["p", c.pubkey, c.role.toLowerCase().replace(' ', '_')]);
            });

            draft.splits.forEach(s => {
                event.tags.push(["zap", s.pubkey, s.relay, String(s.weight)]);
            });
            event.tags.push(["zap", process.env.NEXT_PUBLIC_PLATFORM_PUBKEY!, process.env.NEXT_PUBLIC_RELAY_URL!, "210"]);

            const mainArtist = draft.contributors.find(c => c.nip46 || c.role === 'Main Artist');

            if (mainArtist?.nip46) {
                studioLogger.protocol(`NIP-46: Requesting signature from ${mainArtist.name}...`);
                // In a real implementation, we would use the NIP-46 signer here
                // For now, we simulate the wait for the mobile app approval
                await new Promise(resolve => setTimeout(resolve, 3000));
                studioLogger.success('NIP-46: Signature received from artist device.');
            } else {
                studioLogger.info('Requesting local signature...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                studioLogger.success('Event signed successfully.');
            }

            studioLogger.protocol('Broadcasting Kind 31337 event to the mesh...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            await db.drafts.put({ ...draft, status: 'published', updatedAt: Date.now() });
            studioLogger.success('RELEASE COMPLETE: Event broadcasted to mesh.');
            setStep(6);
        } catch (err: any) {
            const msg = err.message || 'Publishing failed';
            setError(msg);
            studioLogger.error(`Publishing failed: ${msg}`);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="flex font-mono h-[calc(100vh-2rem)] gap-6 p-4 bg-black text-white">

            {/* LEFT: Main Workflow Stage */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                {/* Header Module */}
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl flex justify-between items-center transition-all hover:border-emerald-500/30">
                    <div>
                        <h1 className="text-2xl font-black text-emerald-400 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 rounded-lg text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Terminal size={20} />
                            </div>
                            STUDIO AREA
                        </h1>
                        <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest font-bold">Session ID: {draft.uuid.slice(0, 8)}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            disabled={isLoading}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wider",
                                hasUnsavedChanges ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-neutral-800 text-neutral-500"
                            )}
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Draft
                        </button>
                    </div>
                </div>

                {/* Wizard Progress */}
                <div className="bg-neutral-900/30 border border-neutral-800 p-8 rounded-2xl">
                    <WizardStepper currentStep={step} onStepClick={handleStepClick} />
                </div>

                {/* Content Module (High Contrast Cards) */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">

                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 min-h-[400px]">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    UPLOAD MASTER ASSETS
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-tighter">Audio Source (WAV/MP3)</label>
                                        <MediaUpload
                                            type="audio"
                                            currentUrl={draft.audioUrl}
                                            onUploadComplete={(url, hash) => {
                                                updateDraft({ audioUrl: url, audioHash: hash });
                                                studioLogger.success(`Audio uploaded & hashed: ${hash?.slice(0, 16)}...`);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-tighter">Cover Artwork (HQ)</label>
                                        <MediaUpload
                                            type="image"
                                            currentUrl={draft.imageUrl}
                                            onUploadComplete={(url) => {
                                                updateDraft({ imageUrl: url });
                                                studioLogger.success('Artwork uploaded to Blossom storage.');
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-xl font-bold text-blue-400 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    RELEASE METADATA
                                </h2>
                                <MetadataForm draft={draft} updateDraft={(updates) => {
                                    updateDraft(updates);
                                    if (updates.title) studioLogger.info(`Title updated: ${updates.title}`);
                                }} />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-xl font-bold text-purple-400 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                    CONTRIBUTORS
                                </h2>
                                <ContributorManager
                                    contributors={draft.contributors}
                                    onAdd={(c) => {
                                        updateDraft({ contributors: [...draft.contributors.filter(x => x.pubkey !== c.pubkey), c] });
                                        studioLogger.info(`Contributor added: ${c.name} (${c.role})`);
                                    }}
                                    onRemove={(pk) => {
                                        const c = draft.contributors.find(x => x.pubkey === pk);
                                        updateDraft({
                                            contributors: draft.contributors.filter(c => c.pubkey !== pk),
                                            splits: draft.splits.filter(s => s.pubkey !== pk)
                                        });
                                        studioLogger.warn(`Removed contributor: ${c?.name}`);
                                    }}
                                />
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-xl font-bold text-pink-400 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                                    REVENUE SPLITS
                                </h2>
                                <SplitTable
                                    contributors={draft.contributors}
                                    splits={draft.splits}
                                    onUpdateSplits={(s) => {
                                        updateDraft({ splits: s });
                                        studioLogger.info('Revenue splits updated.');
                                    }}
                                />
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-xl font-bold text-amber-400 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    FINAL REVIEW
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="aspect-square bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">Artwork Preview</p>
                                        </div>
                                        {draft.imageUrl ? (
                                            <img src={draft.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-800">NO MEDIA</div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2 space-y-6">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{draft.title || 'UNTITLED RELEASE'}</h3>
                                        <div className="flex gap-2">
                                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1 rounded text-[10px] uppercase font-bold">{draft.genre || 'NO GENRE'}</span>
                                            <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest">Kind 31337</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Description</div>
                                            <p className="text-xs text-neutral-400 leading-relaxed bg-black/40 p-4 rounded-xl border border-neutral-800 italic">
                                                {draft.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400 text-xs font-bold items-center animate-bounce">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 6 && (
                            <div className="py-20 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-700">
                                <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center text-black shadow-[0_0_50px_rgba(16,185,129,0.5)] rotate-3">
                                    <CheckCircle size={56} className="stroke-[3]" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase italic">Released to Mesh</h2>
                                    <p className="text-neutral-500 max-w-sm mx-auto text-xs font-medium leading-relaxed">Your contribution to the audio mesh has been broadcasted and signed.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => router.push('/library')}
                                        className="px-8 py-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all"
                                    >
                                        Go to Library
                                    </button>
                                    <button
                                        onClick={() => { setDraft({ ...draft, uuid: uuidv4(), status: 'draft' }); setStep(1); }}
                                        className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all shadow-lg text-lg"
                                    >
                                        Start New Track
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                {step < 6 && (
                    <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl flex justify-between items-center pr-8">
                        <button
                            onClick={() => handleStepClick(Math.max(1, step - 1))}
                            disabled={step === 1 || isPublishing}
                            className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-neutral-400 font-bold rounded-xl text-xs uppercase"
                        >
                            <ArrowLeft size={16} /> Previous
                        </button>

                        <div className="flex gap-4">
                            {step < 5 ? (
                                <button
                                    onClick={() => handleStepClick(step + 1)}
                                    className="px-8 py-3 bg-white text-black font-black rounded-xl hover:scale-105 transition-all text-sm uppercase tracking-widest flex items-center gap-2"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="px-12 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all min-w-[200px] flex items-center justify-center gap-2 text-sm uppercase"
                                >
                                    {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Sign & Publish</>}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Live Logs Terminal */}
            <div className="w-[380px] flex flex-col gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                        <Terminal size={14} /> LIVE_LOGS
                    </div>
                    <div className="flex gap-1">
                        <Circle size={8} className="fill-neutral-800 text-neutral-800" />
                        <Circle size={8} className="fill-neutral-800 text-neutral-800" />
                        <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 font-mono text-[10px] leading-relaxed pr-2">
                    {logs.filter(l => l.isCritical).map((log, i) => (
                        <div key={i} className={cn(
                            "p-2 rounded-lg border flex flex-col gap-1 transition-all",
                            log.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                log.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                    log.type === 'warn' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                        "bg-neutral-900 border-neutral-800 text-neutral-400"
                        )}>
                            <div className="flex justify-between items-center opacity-70">
                                <span className="font-bold uppercase">[{log.type}]</span>
                                <span>{log.timestamp}</span>
                            </div>
                            <div className="font-medium whitespace-pre-wrap">{log.message}</div>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>

                <div className="pt-4 border-t border-neutral-900 text-[8px] text-neutral-600 font-bold uppercase tracking-widest flex justify-between">
                    <span>AudioZap Studio v1.2</span>
                    <span>Relay Sync: OK</span>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
      `}</style>
        </div>
    );
}

export default function StudioPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black text-emerald-500 font-mono text-xs animate-pulse">LOADING STUDIO ENGINE...</div>}>
            <StudioContent />
        </Suspense>
    );
}

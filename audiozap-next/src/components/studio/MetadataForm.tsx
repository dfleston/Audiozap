'use client';

import React from 'react';
import { SongDraft } from '@/lib/storage';

interface MetadataFormProps {
    draft: SongDraft;
    updateDraft: (update: Partial<SongDraft>) => void;
}

export function MetadataForm({ draft, updateDraft }: MetadataFormProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Track Title</label>
                    <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => updateDraft({ title: e.target.value })}
                        placeholder="e.g. Nairobi Nights"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Description</label>
                    <textarea
                        rows={3}
                        value={draft.description}
                        onChange={(e) => updateDraft({ description: e.target.value })}
                        placeholder="Tell the story of this track..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Genre</label>
                        <select
                            value={draft.genre}
                            onChange={(e) => updateDraft({ genre: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select Genre</option>
                            <option value="afrobeat">Afrobeat</option>
                            <option value="hiphop">Hip Hop</option>
                            <option value="electronic">Electronic</option>
                            <option value="reggae">Reggae</option>
                            <option value="jazz">Jazz</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">ISRC (Optional)</label>
                        <input
                            type="text"
                            value={draft.isrc || ''}
                            onChange={(e) => updateDraft({ isrc: e.target.value })}
                            placeholder="e.g. US-RC1-23-45678"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Lyrics (Optional)</label>
                    <textarea
                        rows={6}
                        value={draft.lyrics}
                        onChange={(e) => updateDraft({ lyrics: e.target.value })}
                        placeholder="Paste your lyrics here..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-serif italic"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">ISWC</label>
                        <input
                            type="text"
                            value={draft.iswc || ''}
                            onChange={(e) => updateDraft({ iswc: e.target.value })}
                            placeholder="T-123.456.789-C"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">P-Line (Copyright)</label>
                        <input
                            type="text"
                            value={draft.pLine || ''}
                            onChange={(e) => updateDraft({ pLine: e.target.value })}
                            placeholder="℗ 2024 Studio A"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

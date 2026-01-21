'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/storage';
import {
    Music,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Play,
    Clock,
    CheckCircle2,
    Edit2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
    const drafts = useLiveQuery(() => db.drafts.reverse().sortBy('updatedAt'));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Library</h1>
                    <p className="text-neutral-400">Manage your releases and work-in-progress drafts.</p>
                </div>
                <Link
                    href="/studio"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Release
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search releases..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                </div>
                <button className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                    <Filter size={16} />
                    Filter
                </button>
            </div>

            {/* Releases Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-900/50">
                            <th className="px-6 py-4 font-semibold text-neutral-400">Release</th>
                            <th className="px-6 py-4 font-semibold text-neutral-400">Type</th>
                            <th className="px-6 py-4 font-semibold text-neutral-400">Status</th>
                            <th className="px-6 py-4 font-semibold text-neutral-400">Last Modified</th>
                            <th className="px-6 py-4 font-semibold text-neutral-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {drafts?.map((draft) => (
                            <tr key={draft.uuid} className="hover:bg-neutral-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform border border-neutral-700">
                                            {draft.imageUrl ? (
                                                <img src={draft.imageUrl} alt={draft.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Music className="text-neutral-500" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-neutral-100">{draft.title || 'Untitled Release'}</div>
                                            <div className="text-xs text-neutral-500">{draft.genre || 'No genre'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-neutral-400">
                                    Single
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        draft.status === 'published'
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    )}>
                                        {draft.status === 'published' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                        {draft.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-400">
                                    {new Date(draft.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/studio?draftId=${draft.uuid}`}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-neutral-700"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {(!drafts || drafts.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
                                    No releases found. Start by creating a <Link href="/studio" className="text-emerald-500 hover:underline">new one</Link>.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

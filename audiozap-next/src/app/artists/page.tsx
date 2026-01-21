'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ContributorManager } from '@/components/studio/ContributorManager';
import { db, Contributor } from '@/lib/storage';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPlus, Users } from 'lucide-react';

export default function ArtistsPage() {
    const contributors = useLiveQuery(() => db.contributors.toArray()) || [];

    const handleAdd = async (c: Contributor) => {
        try {
            await db.contributors.put(c);
            console.log("Artist saved:", c.name);
        } catch (error) {
            console.error("Failed to save artist:", error);
        }
    };

    const handleRemove = async (pubkey: string) => {
        try {
            await db.contributors.where('pubkey').equals(pubkey).delete();
        } catch (error) {
            console.error("Failed to delete artist:", error);
        }
    };

    return (
        <div className="flex bg-black min-h-screen font-sans selection:bg-emerald-500/30">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Artist <span className="text-emerald-500">Registry</span>
                        </h1>
                        <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
                            Manage identities, splits, and contributor profiles.
                        </p>
                    </div>
                    <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white leading-none">{contributors.length}</div>
                            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Registered Artists</div>
                        </div>
                    </div>
                </header>

                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <ContributorManager
                        contributors={contributors}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                    />
                </div>
            </main>
        </div>
    );
}

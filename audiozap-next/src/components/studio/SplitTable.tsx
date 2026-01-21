'use client';

import React, { useMemo } from 'react';
import { Contributor, Split } from '@/lib/storage';
import { Zap, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitTableProps {
    contributors: Contributor[];
    splits: Split[];
    onUpdateSplits: (splits: Split[]) => void;
}

const PLATFORM_FEE_BPS = 210; // 2.1%
const PLATFORM_PUBKEY = process.env.NEXT_PUBLIC_PLATFORM_PUBKEY || 'platform-pubkey';
const DEFAULT_RELAY = process.env.NEXT_PUBLIC_RELAY_URL || 'wss://relay.audiozap.com';

export function SplitTable({ contributors, splits, onUpdateSplits }: SplitTableProps) {
    // Total BPS across all splits (including platform)
    const totalBps = useMemo(() => {
        const sum = splits.reduce((acc, s) => acc + s.weight, 0);
        return sum + PLATFORM_FEE_BPS;
    }, [splits]);

    const isValid = totalBps === 10000;

    const updateWeight = (pubkey: string, weight: number) => {
        const newSplits = splits.map(s => s.pubkey === pubkey ? { ...s, weight } : s);
        onUpdateSplits(newSplits);
    };

    // Ensure every contributor has a split entry
    React.useEffect(() => {
        const existingPubkeys = splits.map(s => s.pubkey);
        const missing = contributors.filter(c => !existingPubkeys.includes(c.pubkey));

        if (missing.length > 0) {
            const remainingBps = Math.max(0, 10000 - totalBps);
            const sharePerNew = Math.floor(remainingBps / missing.length);

            const added: Split[] = missing.map(m => ({
                pubkey: m.pubkey,
                relay: DEFAULT_RELAY,
                weight: sharePerNew
            }));

            onUpdateSplits([...splits, ...added]);
        }
    }, [contributors, splits, onUpdateSplits, totalBps]);

    return (
        <div className="space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-6 py-4">Recipient</th>
                            <th className="px-6 py-4">Relay</th>
                            <th className="px-6 py-4 w-40 text-right">Percentage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {/* Platform Fee Row (Locked) */}
                        <tr className="bg-emerald-500/5">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-emerald-500 rounded text-black font-bold">
                                        <Zap size={14} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-emerald-400">Audio Federation Platform</div>
                                        <div className="text-[10px] text-neutral-500 font-mono">Service Fee (Locked)</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-neutral-500 font-mono text-[10px]">
                                {DEFAULT_RELAY}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="font-mono font-bold text-emerald-400">2.1%</div>
                            </td>
                        </tr>

                        {/* Contributor Rows */}
                        {splits.map((split) => {
                            const contributor = contributors.find(c => c.pubkey === split.pubkey);
                            return (
                                <tr key={split.pubkey} className="hover:bg-neutral-800/20">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-neutral-200">{contributor?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-neutral-500 font-mono">{split.pubkey.slice(0, 12)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={split.relay}
                                            onChange={(e) => {
                                                const newSplits = splits.map(s => s.pubkey === split.pubkey ? { ...s, relay: e.target.value } : s);
                                                onUpdateSplits(newSplits);
                                            }}
                                            className="bg-transparent border-none text-[10px] font-mono text-neutral-500 p-0 focus:ring-0 w-full"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="97.9"
                                                value={split.weight / 100}
                                                onChange={(e) => updateWeight(split.pubkey, Math.round(parseFloat(e.target.value) * 100))}
                                                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-right w-20 text-sm font-mono focus:ring-1 focus:ring-emerald-500/50"
                                            />
                                            <span className="text-neutral-500 font-bold">%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className={cn(
                            "border-t-2",
                            isValid ? "border-emerald-500/50 bg-emerald-500/5" : "border-red-500/50 bg-red-500/5"
                        )}>
                            <td colSpan={2} className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {isValid ? (
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                                            <ShieldCheck size={16} /> Ready to Publish
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                                            <AlertTriangle size={16} /> Total Must Equal 100%
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className={cn(
                                    "font-mono font-bold text-lg",
                                    isValid ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {(totalBps / 100).toFixed(1)}%
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {!isValid && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
                    <div className="text-xs text-red-200 leading-relaxed">
                        The total distribution (including the 2.1% platform fee) must be exactly 100%.
                        Currently, you are distributing <span className="font-bold underline">{(totalBps / 100).toFixed(1)}%</span>.
                        Please adjust the contributor percentages to continue.
                    </div>
                </div>
            )}
        </div>
    );
}

function ShieldCheck({ size, className }: { size: number, className: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

'use client';

import React, { useState } from 'react';
import { Wallet, Key, Shield, RefreshCw, LogIn, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WalletPage() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [remotePubkey, setRemotePubkey] = useState('');

    const handleConnect = async () => {
        setIsConnecting(true);
        // Simulate NIP-46 connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsConnecting(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Identity & Wallet</h1>
                <p className="text-neutral-400">Manage your Nostr keys and payment settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nostr Connect Section */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 text-blue-400">
                        <Shield size={24} />
                        <h2 className="text-xl font-bold">Nostr Connect (NIP-46)</h2>
                    </div>

                    <p className="text-sm text-neutral-500 leading-relaxed">
                        Connect your mobile vault (Amber, Alby, or Damus) to sign events without ever exposing your private key.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Remote Pubkey / Connection URI</label>
                            <input
                                type="text"
                                placeholder="npub... or bunker://..."
                                value={remotePubkey}
                                onChange={(e) => setRemotePubkey(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {isConnecting ? <RefreshCw className="animate-spin" size={18} /> : <LogIn size={18} />}
                            Connect remote vault
                        </button>
                    </div>
                </div>

                {/* LNBits Wallet Section */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 text-purple-400">
                        <Wallet size={24} />
                        <h2 className="text-xl font-bold">Lightning Wallet</h2>
                    </div>

                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Balance</div>
                        <div className="text-3xl font-mono font-bold text-white">0 <span className="text-sm text-neutral-500">sats</span></div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700 flex items-center gap-2 justify-center text-sm">
                            <ExternalLink size={16} />
                            Open LNBits Dashboard
                        </button>
                        <div className="text-[10px] text-center text-neutral-600 font-medium">
                            Powered by LNBits usermanager
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

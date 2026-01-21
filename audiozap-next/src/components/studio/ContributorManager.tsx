'use client';

import React, { useState, useEffect } from 'react';
import { Contributor } from '@/lib/storage';
import {
    Search,
    Trash2,
    ShieldCheck,
    Mail,
    Ghost,
    Loader2,
    User,
    QrCode,
    Copy,
    Check,
    UserPlus,
    ExternalLink,
    Smartphone,
    Zap,
    Users // Moved up
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NDK, { NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { studioLogger } from '@/lib/logger';
import { QRCodeSVG } from 'qrcode.react';
import { generateNostrConnectUri, waitForConnection } from '@/lib/ndk-connect';
import axios from 'axios';

interface ContributorManagerProps {
    contributors: Contributor[];
    onAdd: (c: Contributor) => void;
    onRemove: (pubkey: string) => void;
}

export function ContributorManager({ contributors, onAdd, onRemove }: ContributorManagerProps) {
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isGhostLoading, setIsGhostLoading] = useState(false);
    const [ndk, setNdk] = useState<NDK | null>(null);
    const [showClaimModal, setShowClaimModal] = useState<Contributor | null>(null);
    const [connectUri, setConnectUri] = useState<string | null>(null);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [ndkError, setNdkError] = useState<string | null>(null);

    const roles = ['Main Artist', 'Featured Artist', 'Producer', 'Songwriter', 'Engineer'];

    // Initialize NDK
    useEffect(() => {
        const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL || 'ws://localhost:3334';
        studioLogger.protocol(`Contributor Engine: Initiating relay pool connection to ${relayUrl}...`);

        const _ndk = new NDK({
            explicitRelayUrls: [relayUrl, 'wss://relay.damus.io', 'wss://nos.lol']
        });

        const connectPromise = _ndk.connect(5000);

        connectPromise.then(() => {
            console.log("NDK Connected Successfully");
            setNdk(_ndk);
            setNdkError(null);
            studioLogger.success('Contributor Engine: NDK connected and ready.');
        }).catch((err) => {
            console.error("NDK Connection Failed:", err);
            setNdkError(err.message || 'Connection timeout');
            studioLogger.error(`Contributor Engine: Relay pool connection failed: ${err.message}`);
            setNdk(_ndk);
        });
    }, []);

    const startNip46Onboarding = async () => {
        if (!ndk) {
            studioLogger.error('NIP-46: Contributor engine not initialized. Check relay connection.');
            setNdkError("NDK not initialized");
            return;
        }
        setIsOnboarding(true);
        studioLogger.protocol('NIP-46: Initializing Studio-Artist connection handshake...');

        try {
            studioLogger.info('NIP-46: Generating ephemeral session keys...');
            const localSigner = NDKPrivateKeySigner.generate();
            const studioUser = await localSigner.user();
            const relay = process.env.NEXT_PUBLIC_RELAY_URL || 'ws://localhost:3334';

            studioLogger.info(`NIP-46: Broadcasting handshake on relay: ${relay}`);
            const uri = generateNostrConnectUri(studioUser.pubkey, relay);
            setConnectUri(uri);

            studioLogger.success('NIP-46: Handshake ready. Waiting for artist scanner...');
            waitForConnection(ndk, studioUser.pubkey).then(async (artistPubkey) => {
                const artist = ndk.getUser({ pubkey: artistPubkey });
                await artist.fetchProfile();

                const name = artist.profile?.displayName || artist.profile?.name || `Artist_${artistPubkey.slice(0, 6)}`;

                onAdd({
                    pubkey: artistPubkey,
                    name,
                    image: artist.profile?.image,
                    role: 'Main Artist',
                    isGhost: false,
                    nip46: true
                });

                studioLogger.success(`Onboarding Workflow: Artist connected successfully via NIP-46 (${name}).`);
                setConnectUri(null);
                setIsOnboarding(false);
            });
        } catch (e) {
            studioLogger.error('NIP-46 Onboarding failed to initialize.');
            setIsOnboarding(false);
        }
    };

    const createGhostProfile = async () => {
        setIsGhostLoading(true);
        studioLogger.info('Identity Engine: Requesting backend-assisted onboarding...');
        try {
            // Call Backend API
            const response = await axios.post('/api/create-artist', {
                artistName: `Artist ${new Date().toLocaleTimeString()}`
            });

            if (!response.data.success) throw new Error("API returned failure");

            const { identity, wallet } = response.data;
            const pubkey = identity.pubkey || identity.npub;

            const ghost: Contributor = {
                pubkey: identity.pubkey || identity.npub,
                name: `Artist_${identity.npub.slice(0, 8)}`,
                role: 'Main Artist',
                isGhost: true,
                claimCode: identity.nsec,
                walletId: wallet?.id,
                walletData: wallet // Store full wallet data including LNURL
            };

            onAdd(ghost);
            studioLogger.success(`Onboarding Workflow: New artist provisioning complete (${ghost.name}).`);

            // Show modal with full data
            setShowClaimModal(ghost);
        } catch (e: any) {
            console.error(e);
            studioLogger.error(`Identity creation failed: ${e.response?.data?.error || e.message}`);
        } finally {
            setIsGhostLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!search) return;
        if (!ndk) {
            studioLogger.error('Search Engine: Contributor engine not initialized.');
            return;
        }
        setIsSearching(true);
        studioLogger.info(`Resolving profile for: ${search}...`);

        try {
            let user: NDKUser | undefined;
            if (search.includes('@')) {
                user = await NDKUser.fromNip05(search, ndk);
            } else {
                user = ndk.getUser({
                    npub: search.startsWith('npub') ? search : undefined,
                    pubkey: (!search.startsWith('npub') && search.length === 64) ? search : undefined
                });
            }

            if (user) {
                await user.fetchProfile();
                const name = user.profile?.displayName || user.profile?.name || `User_${user.pubkey.slice(0, 6)}`;
                onAdd({
                    pubkey: user.pubkey,
                    name,
                    image: user.profile?.image,
                    role: 'Featured Artist',
                    isGhost: false,
                    nip46: false
                });
                studioLogger.success(`Profile Resolved: ${name}`);
                setSearch('');
            } else {
                studioLogger.warn('Lookup Engine: Profile resolution returned no metadata matches.');
            }
        } catch (e) {
            studioLogger.error('Profile resolution engine encountered an error.');
        } finally {
            setIsSearching(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 relative">
            {!ndk && !ndkError && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 animate-pulse bg-neutral-900/50 p-2 rounded-lg border border-neutral-800">
                    <Loader2 size={12} className="animate-spin" />
                    Initializing Contributor Engine...
                </div>
            )}
            {ndkError && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    Engine Error: {ndkError}
                </div>
            )}

            {/* Actions: Search & Onboard & Generate */}
            <div className="space-y-4">
                {/* LINE 1: Search Existing */}
                <div className="bg-black/40 p-5 border border-neutral-800 rounded-2xl group transition-all hover:bg-black/60 shadow-inner">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Search size={14} className="text-emerald-500" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Search Existing Network</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by npub, NIP-05, or LNURL (e.g. user@domain)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full bg-neutral-950/80 border border-neutral-800/50 rounded-xl pl-5 pr-4 py-4 text-xs font-black uppercase tracking-widest text-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-neutral-800"
                            />
                            {search.length > 5 && (
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-emerald-500 text-black text-[9px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2 shadow-xl border border-emerald-400/50"
                                >
                                    {isSearching ? <Loader2 size={12} className="animate-spin" /> : 'RESOLVE IDENTITY'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* LINE 2: Remote Onboarding */}
                <div className="bg-black/40 p-5 border border-neutral-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-black/60 transition-all shadow-inner">
                    <div className="space-y-1 text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <UserPlus size={14} className="text-emerald-500" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Security Engine: Remote Onboarding</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 font-bold max-w-sm uppercase tracking-tight">Onboard a new artist via NIP-46 handshake. Keys stay on their device.</p>
                    </div>

                    <button
                        onClick={startNip46Onboarding}
                        disabled={isOnboarding}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-2xl group/btn"
                    >
                        <Smartphone size={18} className={cn("text-emerald-400 transition-transform group-hover/btn:scale-110", isOnboarding && "animate-pulse")} />
                        <span className="text-[10px] uppercase tracking-[0.2em]">Sign Artist Onboarding</span>
                    </button>
                </div>

                {/* LINE 3: Generate New (Backend Assisted) */}
                <div className="bg-black/40 p-5 border border-neutral-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-black/60 transition-all shadow-inner">
                    <div className="space-y-1 text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <Ghost size={14} className="text-emerald-500" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Identity Engine: Generate New</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 font-bold max-w-sm uppercase tracking-tight">Create a fresh artist identity on the server. Includes persistent keys.</p>
                    </div>

                    <button
                        onClick={createGhostProfile}
                        disabled={isGhostLoading}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-2xl group/btn"
                    >
                        {isGhostLoading ? <Loader2 size={18} className="animate-spin text-purple-400" /> : <Zap size={18} className="text-purple-400 group-hover/btn:fill-purple-400 transition-colors" />}
                        <span className="text-[10px] uppercase tracking-[0.2em]">Generate Identity</span>
                    </button>
                </div>
            </div>

            {/* Contributor Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contributors.map((c) => (
                    <div key={c.pubkey} className="bg-neutral-900/40 border-2 border-neutral-900 hover:border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4 group transition-all relative">
                        {/* High Contrast Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-black",
                                    c.isGhost ? "border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                )}>
                                    {c.image ? (
                                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                        c.isGhost ? <Ghost size={28} /> : <User size={28} />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-white text-md uppercase tracking-tighter">{c.name}</span>
                                        {c.isGhost && <span className="bg-purple-500/20 text-purple-400 text-[8px] uppercase px-2 py-0.5 rounded font-black border border-purple-500/30">Ghost Profile</span>}
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-neutral-600 font-mono font-bold">
                                        PUB: {c.pubkey.slice(0, 16)}...
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onRemove(c.pubkey)}
                                className="p-3 text-neutral-800 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Control Row */}
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
                            <select
                                value={c.role}
                                onChange={(e) => onAdd({ ...c, role: e.target.value })}
                                className="bg-neutral-900 border border-neutral-800 text-[10px] font-black uppercase tracking-widest text-emerald-500 cursor-pointer rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500/30"
                            >
                                {roles.map(r => <option key={r} value={r} className="bg-black text-white">{r}</option>)}
                            </select>

                            {c.isGhost && c.claimCode && (
                                <button
                                    onClick={() => setShowClaimModal(c)}
                                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-purple-500/20 transition-all"
                                >
                                    <QrCode size={14} /> Claim ID
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {contributors.length === 0 && (
                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 bg-neutral-950/50 border-2 border-dashed border-neutral-900 rounded-3xl group hover:border-neutral-800 transition-all">
                        <div className="p-4 bg-neutral-900 rounded-2xl text-neutral-700">
                            <Users size={40} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">No Contributors Initialized</p>
                            <p className="text-[10px] text-neutral-700 font-medium">Search for existing users or sign a new artist onboarding.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* NIP-46 ONBOARDING MODAL */}
            {connectUri && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-neutral-900 border border-neutral-800 w-full max-w-sm rounded-3xl p-8 relative shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                        <button
                            onClick={() => setConnectUri(null)}
                            className="absolute top-6 right-6 text-neutral-500 hover:text-white"
                        >
                            <Trash2 size={20} className="rotate-45" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="p-4 bg-emerald-500 rounded-2xl text-black">
                                <Smartphone size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase italic">Artist Handshake</h3>
                                <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest">Scan with Amber, Alby or Damus</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl shadow-2xl">
                                <QRCodeSVG
                                    value={connectUri}
                                    size={200}
                                    level="L"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="w-full space-y-4 pt-4">
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => copyToClipboard(connectUri)}
                                        className="w-full py-3 bg-neutral-800 text-neutral-300 text-[10px] font-black rounded-xl uppercase tracking-wider hover:bg-neutral-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Copy size={14} /> {copied ? 'Copied URI' : 'Copy Connection URI'}
                                    </button>

                                    <a
                                        href="https://nostrcheck.me/register/"
                                        target="_blank"
                                        className="text-[9px] text-emerald-500 font-bold uppercase underline flex items-center justify-center gap-1 opacity-70 hover:opacity-100"
                                    >
                                        No signer yet? Set up here <ExternalLink size={10} />
                                    </a>
                                </div>

                                <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left">
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase leading-relaxed">
                                        Waiting for artist to approve connection request on their mobile device...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CLAIM ID MODAL */}
            {showClaimModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-8 relative shadow-[0_0_100px_rgba(168,85,247,0.1)]">
                        <button
                            onClick={() => setShowClaimModal(null)}
                            className="absolute top-6 right-6 text-neutral-500 hover:text-white"
                        >
                            <Trash2 size={20} className="rotate-45" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400 border border-purple-500/30">
                                <Ghost size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase italic">Identity Generated</h3>
                                <p className="text-[10px] text-neutral-400 uppercase font-bold max-w-xs mx-auto">
                                    A new artist identity has been provisioned. Save these credentials securely.
                                </p>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Public Key (npub)</label>
                                    <div className="p-4 bg-black rounded-xl font-mono text-[10px] text-neutral-400 border border-neutral-800 break-all select-all">
                                        {showClaimModal.pubkey}
                                    </div>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={12} /> Private Key (nsec) - DO NOT SHARE
                                    </label>
                                    <div className="p-4 bg-purple-950/20 rounded-xl font-mono text-[10px] text-purple-300 border border-purple-500/30 break-all select-all relative group">
                                        <div className="blur-sm group-hover:blur-none transition-all duration-300">
                                            {showClaimModal.claimCode}
                                        </div>
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-purple-500 font-bold uppercase pointer-events-none group-hover:opacity-0">Hover to Reveal</span>
                                    </div>
                                </div>

                                {/* Wallet Info Section */}
                                {showClaimModal.walletData && (
                                    <div className="space-y-3 text-left pt-4 border-t border-neutral-800">
                                        <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={12} /> Wallet Provisioned
                                        </label>
                                        <div className="p-3 bg-amber-950/10 rounded-xl border border-amber-500/20 space-y-2">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-neutral-500">Wallet ID</span>
                                                <span className="text-amber-200 font-mono text-[9px]">{showClaimModal.walletData.id}</span>
                                            </div>
                                        </div>

                                        {/* LNURL QR Code */}
                                        {showClaimModal.walletData.lnurl && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                    <QrCode size={12} /> Lightning Address (LNURL)
                                                </label>
                                                <div className="bg-white p-3 rounded-xl shadow-lg">
                                                    <QRCodeSVG
                                                        value={showClaimModal.walletData.lnurl}
                                                        size={180}
                                                        level="M"
                                                        includeMargin={false}
                                                    />
                                                </div>
                                                <div className="p-2 bg-black rounded-lg border border-neutral-800">
                                                    <p className="text-[9px] text-emerald-400 font-mono break-all">{showClaimModal.walletData.lnurl}</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(showClaimModal.walletData?.lnurl || '')}
                                                    className="w-full py-2 bg-emerald-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Copy size={12} /> {copied ? 'Copied LNURL' : 'Copy LNURL'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => copyToClipboard(showClaimModal.claimCode || '')}
                                className="w-full py-3 bg-purple-600 text-white text-[10px] font-black rounded-xl uppercase tracking-wider hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                            >
                                <Copy size={14} /> {copied ? 'Copied Secret' : 'Copy Private Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

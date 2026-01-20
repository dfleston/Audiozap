'use client';

import React, { useState, useEffect } from 'react';
import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import axios from 'axios';
import { Wallet, Music, Zap, Terminal, UploadCloud } from 'lucide-react';

export default function AudioZapDash() {
  const [logs, setLogs] = useState<string[]>([]);
  const [ndk, setNdk] = useState<NDK | null>(null);

  // State
  const [user, setUser] = useState({ sk: '', npub: '' });
  const [wallet, setWallet] = useState({ id: '', invKey: '', lnurl: '' });
  const [fileUrl, setFileUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const log = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] [${type.toUpperCase()}] ${msg}`, ...prev]);
  };

  // 1. Init NDK (Client Side)
  useEffect(() => {
    const initNDK = async () => {
      const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL;
      if (!relayUrl) return log("Missing Relay URL in .env", "error");

      const _ndk = new NDK({ explicitRelayUrls: [relayUrl] });
      try {
        await _ndk.connect();
        log(`Connected to Relay: ${relayUrl}`, 'success');
        setNdk(_ndk);
      } catch (e: any) {
        log(`Relay Connection Failed: ${e.message}`, 'error');
      }
    };
    initNDK();
  }, []);

  // 2. Generate Identity
  const generateIdentity = async () => {
    const signer = NDKPrivateKeySigner.generate();
    const ndkUser = await signer.user();
    setUser({
      sk: signer.privateKey!,
      npub: ndkUser.npub
    });
    log(`Generated Identity: ${ndkUser.npub.slice(0, 12)}...`, 'success');
  };

  // 3. Create Wallet (CALLS NEXT.JS API, NOT LNBITS DIRECTLY)
  const createWallet = async () => {
    if (!user.npub) return log("Create an identity first", "error");

    try {
      log("Requesting Server to create LNBits wallet...");

      // We call our own API route
      const res = await axios.post('/api/create-artist', {
        artistName: `Artist_${user.npub.slice(0, 6)}`
      });

      if (res.data.success) {
        setWallet({
          id: res.data.walletId,
          invKey: res.data.invoiceKey,
          lnurl: res.data.lnurl
        });
        log(`Wallet Created! ID: ${res.data.walletId}`, 'success');
      }
    } catch (e: any) {
      log(`API Error: ${e.response?.data?.error || e.message}`, 'error');
    }
  };

  // 4. Publish Music Event
  const publishTrack = async (taxPercentage: number) => {
    const _ndk = ndk;
    if (!_ndk) return log("ERROR: Relay not connected (NDK null). Check console/logs.", "error");
    if (!user.sk) return log("ERROR: No identity found. Click '1. New Identity' first!", "error");
    if (!fileUrl) return log("Upload a file first", "error");

    const platformPubkey = process.env.NEXT_PUBLIC_PLATFORM_PUBKEY;
    const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL;

    if (!platformPubkey || !relayUrl) {
      return log("Missing platform configuration", "error");
    }

    setIsPublishing(true);
    try {
      const signer = new NDKPrivateKeySigner(user.sk);
      _ndk.signer = signer;

      const event = new NDKEvent(_ndk);
      event.kind = 31337; // Music Kind
      event.content = "Next.js AudioZap Test";

      // The Tags define the splits
      const artistShare = 100 - taxPercentage;
      event.tags = [
        ["url", fileUrl],
        ["zap", user.npub, relayUrl, String(artistShare)], // Artist Split
        ["zap", platformPubkey, relayUrl, String(taxPercentage)] // Platform Tax
      ];

      log(`Publishing with ${taxPercentage}% Platform Tax...`);
      await event.publish();
      log(`SUCCESS: Event accepted by Relay.`, 'success');

    } catch (e: any) {
      log(`FAILED: Relay rejected event. Reason: ${e.message}`, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-mono grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* LEFT: Dashboard */}
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
          <Zap className="fill-current" /> AudioZap <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">Next.js Edition</span>
        </h1>

        {/* STEP 1 */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2"><Wallet /> Identity & Wallet</h2>

          <div className="flex gap-2 mb-4">
            <button onClick={generateIdentity} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold">
              1. New Identity
            </button>
            <button onClick={createWallet} disabled={!user.sk || !!wallet.id} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded text-sm font-bold">
              2. Create Wallet (Server Proxy)
            </button>
          </div>

          {user.npub && (
            <div className="text-xs bg-black p-3 rounded mb-2 text-gray-400">
              USER: <span className="text-white">{user.npub}</span>
            </div>
          )}

          {wallet.id && (
            <div className="text-xs bg-emerald-900/30 border border-emerald-900 p-3 rounded text-emerald-400">
              WALLET ID: {wallet.id} <br />
              LNURL: {wallet.lnurl || "Generating..."}
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-pink-400 flex items-center gap-2"><Music /> Publish Track</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste MP3 URL (or simulate upload)"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
              <button onClick={() => setFileUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
                <UploadCloud size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => publishTrack(10)}
                disabled={isPublishing}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 rounded font-bold"
              >
                Publish (10% Tax)
              </button>
              <button
                onClick={() => publishTrack(0)}
                disabled={isPublishing}
                className="py-3 bg-red-900/50 border border-red-800 hover:bg-red-900 rounded font-bold text-red-200"
              >
                Try to Cheat (0% Tax)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Logs */}
      <div className="bg-black border border-neutral-800 rounded-xl p-4 flex flex-col h-[600px] overflow-hidden">
        <div className="pb-2 border-b border-neutral-800 mb-2 text-gray-500 flex items-center gap-2">
          <Terminal size={16} /> Live Logs
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
          {logs.length === 0 && <span className="text-gray-700">Ready...</span>}
          {logs.map((l, i) => (
            <div key={i} className={`
                    ${l.includes('ERROR') ? 'text-red-500' : ''}
                    ${l.includes('SUCCESS') ? 'text-emerald-500' : ''}
                    ${l.includes('INFO') ? 'text-gray-400' : ''}
                `}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

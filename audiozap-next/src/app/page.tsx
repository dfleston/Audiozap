'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Music2,
  Library,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Globe,
  Database
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center p-8">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="p-4 bg-emerald-500 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)]">
          <Zap className="text-black fill-black" size={40} />
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
          AUDIO<span className="text-emerald-500">ZAP</span>
        </h1>

        <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl font-medium leading-relaxed">
          The World's First Decentralized Audio Federation Studio.
          Controlled by Artists, Powered by the Nostr Mesh.
        </p>

        <div className="flex flex-col sm:row gap-4 pt-8">
          <Link
            href="/studio"
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-2 group"
          >
            Enter Studio
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/library"
            className="px-8 py-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white font-bold text-lg rounded-2xl transition-all"
          >
            View My Library
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <FeatureCard
            icon={<Music2 size={24} />}
            title="Studio-Grade Assets"
            description="Professional metadata management with ISRC support and Blossom server integration."
          />
          <FeatureCard
            icon={<Database size={24} />}
            title="Local-First Storage"
            description="Your work stays on your device. We use IndexedDB for local persistence of all drafts."
          />
          <FeatureCard
            icon={<ShieldCheck size={24} />}
            title="Nostr Core"
            description="Sign releases with NIP-46 or local keys. Full interoperability with the Nostr ecosystem."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all hover:bg-neutral-900/60 group text-left">
      <div className="p-3 bg-neutral-800 rounded-xl text-emerald-500 w-fit mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

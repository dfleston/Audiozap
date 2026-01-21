'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Library,
    Music2,
    Wallet,
    Settings,
    Zap,
    ChevronRight,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Library', href: '/library', icon: Library },
    { name: 'Studio', href: '/studio', icon: Music2 },
    { name: 'Artists', href: '/artists', icon: Users },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
                        <Zap className="text-black fill-black" size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-white">
                        AUDIO<span className="text-emerald-500">ZAP</span>
                    </span>
                </Link>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group text-sm font-medium",
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} className={cn(
                                    "transition-colors",
                                    isActive ? "text-emerald-400" : "text-neutral-500 group-hover:text-neutral-300"
                                )} />
                                {item.name}
                            </div>
                            {isActive && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-neutral-800">
                <div className="bg-neutral-900/50 rounded-xl p-3 border border-neutral-800">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">
                        System Status
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-neutral-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Relay Connected
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono truncate">
                            {process.env.NEXT_PUBLIC_RELAY_URL?.replace('ws://', '').replace('wss://', '') || 'localhost:3334'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

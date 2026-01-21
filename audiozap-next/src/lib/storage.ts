import Dexie, { type Table } from 'dexie';

export interface SongDraft {
    id?: number;
    uuid: string;
    title: string;
    description: string;
    lyrics: string;
    genre: string;
    isrc?: string;
    iswc?: string;
    pLine?: string;
    cLine?: string;
    audioUrl?: string;
    audioHash?: string;
    imageUrl?: string;
    contributors: Contributor[];
    splits: Split[];
    status: 'draft' | 'published';
    createdAt: number;
    updatedAt: number;
}

export interface WalletData {
    id: string;
    invoiceKey?: string;
    adminKey?: string;
    lnurl?: string;
}

export interface Contributor {
    pubkey: string;
    name?: string;
    image?: string;
    role: string;
    isGhost: boolean;
    claimCode?: string; // nsec for ghost profiles
    nip46?: boolean;    // NIP-46 connected
    walletId?: string;  // LNBits wallet ID (deprecated, use walletData)
    walletData?: WalletData; // Full wallet information
}

export interface Split {
    pubkey: string;
    relay: string;
    weight: number; // basis points (5790 = 57.9%)
}

export class AudioZapDB extends Dexie {
    drafts!: Table<SongDraft>;
    contributors!: Table<Contributor>;

    constructor() {
        super('AudioZapDB');
        this.version(1).stores({
            drafts: '++id, uuid, title, status, updatedAt',
            contributors: 'pubkey, name, role'
        });
        // Version 2: Added walletData field to Contributor
        this.version(2).stores({
            drafts: '++id, uuid, title, status, updatedAt',
            contributors: 'pubkey, name, role'
        });
    }
}

export const db = new AudioZapDB();

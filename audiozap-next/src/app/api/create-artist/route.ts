import { NextResponse } from 'next/server';
import axios from 'axios';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

// This API runs on the server.
// It orchestrates:
// 1. Nostr Identity Generation (nsec/npub)
// 2. LNBits Wallet Creation
// 3. (Todo) NWC Pairing Generation

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { artistName } = body;

        console.log(`[Onboarding] Starting for: ${artistName}`);

        if (!process.env.LNBITS_ADMIN_KEY) {
            return NextResponse.json({ error: "Server misconfigured: Missing LNBITS_ADMIN_KEY" }, { status: 500 });
        }

        // --- 1. Generate Nostr Identity ---
        const sk = generateSecretKey(); // Uint8Array
        const pk = getPublicKey(sk);    // string (hex)
        const nsec = nip19.nsecEncode(sk);
        const npub = nip19.npubEncode(pk);

        console.log(`[Onboarding] Generated Nostr ID: ${npub}`);


        // --- 2. Create LNBits Wallet ---
        console.log(`[Onboarding] Creating LNBits user...`);
        console.log(`[Onboarding] LNBITS_URL: ${process.env.LNBITS_URL}`);
        console.log(`[Onboarding] LNBITS_ADMIN_KEY: ${process.env.LNBITS_ADMIN_KEY}`);
        console.log(`[Onboarding] Request URL: ${process.env.LNBITS_URL}/usermanager/api/v1/users`);
        console.log(`[Onboarding] Request body:`, { user_name: artistName, wallet_name: "AudioZap Wallet" });

        const lnbitsResponse = await axios.post(
            `${process.env.LNBITS_URL}/usermanager/api/v1/users`,
            {
                user_name: artistName,
                wallet_name: "AudioZap Wallet"
            },
            {
                headers: {
                    'X-Api-Key': process.env.LNBITS_ADMIN_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );


        const walletData = lnbitsResponse.data.wallets[0]; // { id, adminkey, inkey, ... }
        console.log(`[Onboarding] Wallet created: ${walletData.id}`);

        // --- 3. Generate LNURL (Pay Link) ---
        // Try to create a permanent pay link if 'lnurlp' extension is active
        let lnurl = "";
        try {
            console.log(`[Onboarding] Creating LNURL pay link...`);
            const lnurlResponse = await axios.post(
                `${process.env.LNBITS_URL}/lnurlp/api/v1/links`,
                {
                    description: `Tips for ${artistName}`,
                    min: 10,
                    max: 10000000,
                    comment_chars: 50,
                    zaps: true
                },
                {
                    headers: {
                        'X-Api-Key': walletData.adminkey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            lnurl = lnurlResponse.data.lnurl;
            console.log(`[Onboarding] LNURL created: ${lnurl}`);
        } catch (e) {
            console.warn("[Onboarding] Failed to create LNURL (extension might be missing):", e.message);
            // Fallback: use generic lnurl if available or just skip
        }

        // Return everything to the client
        return NextResponse.json({
            success: true,
            identity: {
                npub,
                nsec, // Sent ONCE to the client for secure storage
                pubkey: pk
            },
            wallet: {
                id: walletData.id,
                invoiceKey: walletData.inkey,
                adminKey: walletData.adminkey, // Warning: handling admin key to client
                lnurl
            }
        });

    } catch (error: any) {
        console.error("[Onboarding] Error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: "Failed to onboard artist regarding backend services." },
            { status: 500 }
        );
    }
}

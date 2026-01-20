import { NextResponse } from 'next/server';
import axios from 'axios';

// This runs on the SERVER. Hidden from users.
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { artistName } = body;

        if (!process.env.LNBITS_ADMIN_KEY) {
            return NextResponse.json({ error: "Server misconfigured: Missing Admin Key" }, { status: 500 });
        }

        console.log(`Proxying request to LNBits: ${process.env.LNBITS_URL}. Key starts with: ${process.env.LNBITS_ADMIN_KEY.slice(0, 4)}`);

        // 1. Call LNBits to create a user/wallet
        const lnbitsResponse = await axios.post(
            `${process.env.LNBITS_URL}/usermanager/api/v1/users`,
            {
                user_name: artistName,
                wallet_name: "MusicWallet"
            },
            {
                headers: { 'X-Api-Key': process.env.LNBITS_ADMIN_KEY }
            }
        );

        // Extract newly created wallet
        const walletData = lnbitsResponse.data.wallets[0];

        // 2. Return ONLY what the frontend needs
        return NextResponse.json({
            success: true,
            walletId: walletData.id,
            invoiceKey: walletData.inkey,
            adminKey: walletData.adminkey,
            lnurl: `${process.env.LNBITS_URL}/lnurlp/api/v1/lnurl/${walletData.inkey}`
        });

    } catch (error: any) {
        console.error("LNBits Proxy Error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: "Failed to create wallet on backend" },
            { status: 500 }
        );
    }
}

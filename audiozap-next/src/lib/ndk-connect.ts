import NDK, { NDKNip46Signer, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';

export async function createNip46Signer(ndk: NDK, remotePubkey: string) {
    const localSigner = NDKPrivateKeySigner.generate();
    const nip46Signer = new NDKNip46Signer(ndk, remotePubkey, localSigner);

    nip46Signer.on('authUrl', (url) => {
        window.open(url, '_blank');
    });

    return nip46Signer;
}

export function generateNostrConnectUri(pubkey: string, relay: string) {
    const metadata = JSON.stringify({
        name: 'AudioZap Studio',
        description: 'Professional Audio Publishing & Revenue Splits',
        icons: ['https://audiozap.app/logo.png']
    });
    return `nostrconnect://${pubkey}?relay=${encodeURIComponent(relay)}&metadata=${encodeURIComponent(metadata)}`;
}

export async function waitForConnection(ndk: NDK, localPubkey: string): Promise<string> {
    return new Promise((resolve) => {
        const sub = ndk.subscribe({
            kinds: [24133 as any],
            "#p": [localPubkey]
        });

        sub.on('event', (event) => {
            // NIP-46: The artist response will be Kind 24133
            // In a full implementation we'd check if it's a 'connect' result
            // For onboarding, the first Kind 24133 from the artist usually carries their pubkey
            try {
                // If it's a valid NIP-46 response, the pubkey is the sender
                resolve(event.pubkey);
                sub.stop();
            } catch (e) {
                console.error("NIP-46 resolution error", e);
            }
        });
    });
}

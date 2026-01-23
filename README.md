# AudioZap

AudioZap is a containerized music platform integrating Bitcoin Lightning and Nostr. It features a decentralized relay for metadata, a Blossom server for media storage, and a Next.js dashboard for management.

The core problem we're solving is the friction and intermediation in music streaming. AudioZap enables:

- Direct-to-Artist Payments: "Zaps" settle instantly via LND, bypassing traditional aggregators.

- Protocol-Level Revenue Splits: We use a custom Khatru relay to enforce logic where splits (e.g., 90% Artist / 10% Platform or Producer) are validated before the content is even accepted by the network.

- Sovereign Identity: Artists own their audience via Nostr keys, removing platform lock-in.
- 
The infrastructure should serve to offere an decentralized alternative to music distribution and monetization.

- Studios-Radios as Nodes: home studios, recording facilities, and local radio stations run their own physical nodes (Or containerized servers). They become the sovereign music infrastructure, hosting the content that is created locally, facilitating decentralized distribution and enabling direct-2-artist payments.

- Immutable Splits at Creation: The production team (artist, producer, engineer) agrees on revenue terms during the creation process. These terms are cryptographically signed into the metadata upon upload. The "contract" is code, enabling instant, trustless settlement via LND every time a track is played or zapped. Incentive mechanisms and contracts can be set at song lever with specific broadcastesr or players/clients.

# Rationale

If this models gets going and is adopted, the overall music industry and specailly the creative part will benefit. New business models would be possible.
If this models adopted by the Music industry, a whole generation will be immediately onboarded in  

The core problem we're solving is the friction and intermediation in music streaming. AudioZap enables:



## Project Structure

The project is organized into several key components, all managed via Docker:

- **LND**: The Lightning Network node (Bitcoin Testnet, Neutrino mode).
- **LNBits**: Wallet management UI and API, integrated with LND.
- **Blossom Server**: A Blossom-compatible server for decentralized media storage.
- **Khatru Relay**: A custom Nostr relay for metadata and social events.
- **AudioZap Dashboard**: A Next.js web application for interacting with the platform.

### Directory Layout

```text
.
├── audiozap-next/        # Next.js Dashboard source code
├── blossom/              # Blossom server configuration/source
├── blossom_data/         # Persistent data for Blossom
├── khatru-relay/         # Custom Nostr relay (Go-based)
├── lnbits_data/          # Persistent data for LNBits
├── lnd/                  # LND configuration
├── lnd_data/             # Persistent data for LND
├── relay_db/             # Persistent data for the Nostr relay
└── docker-compose.yml    # Main orchestration file
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| **LND** | `10009` (gRPC), `8080` (REST) | Lightning Network Node |
| **LNBits** | `5000` | Wallet UI and Multi-custodial API |
| **Blossom** | `3000` | Media Storage Server |
| **Dashboard** | `3001` | Front-end Dashboard (Proxied to internal port 3000) |
| **Relay** | `3334` | Nostr Metadata Relay |

temp - lThe external IP address for this server is 34.35.7.115.
For internal networking, the server's private IP address on the primary interface (ens4) is 10.218.0.2

## Getting Started

0. **Ensure you can connect to the server**
   ```bash
   ssh root@3IP
   ```
   if not - gcloud compute config-ssh (to let glcoud terminal to handle the IAM)

1. **Launch the services**:
   ```bash
   docker compose up -d
   ```

## Accessing the Platform

### Local Access
If you are running this on your local machine:
- **Dashboard**: [http://localhost:3001](http://localhost:3001)
- **LNBits**: [http://localhost:5000](http://localhost:5000)

### External Access (Cloud)
If accessing via the external IP :
- **Dashboard**: [http://external IP:3001]
- **LNBits**: [http://external IP:5000]
- **Blossom**: [http://external IP:3000]
- **Relay**: `ws://external IP:3334`

> [!IMPORTANT]
> Ensure that ports `3000, 3001, 3334, 5000, 8080, 9735, 10009` are open in your Cloud Firewall (VPC Firewall Rules) for the instance.


## Development

- **Dashboard**: Source in `audiozap-next/`. Rebuild after changes.
- **Relay**: Source in `khatru-relay/`. Custom Go implementation using Khatru.
- **Blossom**: Standard Blossom server implementation.

---
*Created by [D.Leston]
(https://x.com/df_leston)
Nostr - npub1teprpsvpu8px6vqg4f4d7v5wz968yxkpw0yyr0q52m09ng48p2fq0h53xe

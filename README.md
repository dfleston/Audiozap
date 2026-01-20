# AudioZap

AudioZap is a containerized music platform integrating Bitcoin Lightning and Nostr. It features a decentralized relay for metadata, a Blossom server for media storage, and a Next.js dashboard for management.

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
   ssh root@34.35.7.115
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
If accessing via the external IP `34.35.41.34`:
- **Dashboard**: [http://34.35.41.34:3001](http://34.35.41.34:3001)
- **LNBits**: [http://34.35.41.34:5000](http://34.35.41.34:5000)
- **Blossom**: [http://34.35.41.34:3000](http://34.35.41.34:3000)
- **Relay**: `ws://34.35.41.34:3334`

> [!IMPORTANT]
> Ensure that ports `3000, 3001, 3334, 5000, 8080, 9735, 10009` are open in your Cloud Firewall (VPC Firewall Rules) for the instance.


## Development

- **Dashboard**: Source in `audiozap-next/`. Rebuild after changes.
- **Relay**: Source in `khatru-relay/`. Custom Go implementation using Khatru.
- **Blossom**: Standard Blossom server implementation.

---
*Created by AudioZap Team*

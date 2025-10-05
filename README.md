# VOID

![VOID Logo](public/favicon.png)

An open, on-chain creative playground on Solana. VOID lets creators mint interactive 3D cube NFTs, AI-generated pixel art, and music collectibles, then showcase and trade them in a unified experience.

---

## Features

- **NFT minting**: Mint 3D cube, pixel art, and music NFTs with rich metadata (Metaplex standard)
- **AI art**: Generate pixel art via in-app AI and mint directly
- **Music NFTs**: Upload or link audio, visualize, and mint music collectibles
- **3D rendering**: Real-time WebGL rendering of cube NFTs with material parameters preserved
- **Marketplace-ready**: Includes a Rust on-chain marketplace program and integration points
- **Wallet integration**: Phantom and Solana wallet adapters for seamless auth and signing
- **IPFS storage**: Upload assets and metadata to IPFS (Pinata helpers included)
- **Game and gallery**: Explore realms, play, and browse NFTs in an immersive UI

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Three.js
- **Audio/3D**: Tone.js, Howler, @react-three/fiber, postprocessing
- **Solana**: @solana/web3.js, @metaplex-foundation/js, Wallet Adapter
- **Storage**: IPFS/Pinata helpers, local fallbacks for dev
- **Backend routes**: Next.js Route Handlers under `app/api/*`
- **Optional services**: Supabase (auth/profile), Vercel KV/Blob utilities

---

## Quick Start

```bash
pnpm install
pnpm dev
# or
npm install
npm run dev
```

App will start at `http://localhost:3000`.

---

## Scripts

- `dev`: Start Next.js dev server
- `build`: Production build
- `start`: Start production server
- `lint`: Run ESLint

---

## Environment Variables

Create `.env.local` at the repo root when needed:

```env
# AI music service (optional)
MUSIC_API_KEY=
MUSIC_AI_API_URL=

# Add your own keys as you integrate providers (Pinata, etc.)
# PINATA_JWT=
# NEXT_PUBLIC_RPC_ENDPOINT=
```

See `app/config/env.ts` for currently referenced variables.

---

## Project Structure

- `app/` Next.js app router pages and route handlers
  - `app/api/*` REST-like endpoints (AI art, IPFS, minting, auth)
  - `app/art`, `app/ai`, `app/market`, `app/game` feature areas
- `components/` UI, 3D viewers, and shared widgets
- `lib/services/` Solana, IPFS/Pinata, NFT mint, wallet utilities
- `nft_marketplace/` Rust smart contract and tests for marketplace
- `public/` static assets (covers, audio)

---

## Core API Routes

- `app/api/generate-pixel-art/route.ts`: AI pixel art generation
- `app/api/mint-pixel-art/route.ts`: Pixel art minting flow
- `app/api/ipfs/[cid]/route.ts`: IPFS access helper
- `app/api/cube/[color]/route.ts`: Cube utilities
- `app/api/auth/wallet-login.ts`: Wallet-based auth example
- `app/api/music/callback/route.ts`: Music AI callback handler

---

## Solana & Wallet Setup

1. Install Phantom and switch to Devnet
2. Fund your wallet via a faucet if on Devnet
3. Configure your RPC if needed (`NEXT_PUBLIC_RPC_ENDPOINT`)
4. Connect your wallet in the app header and start minting

For the on-chain marketplace program, see `nft_marketplace/README.md` for build and deploy instructions (Solana CLI, program deployment, and integration notes).

---

## Minting Workflows

### Mint a Pixel Art NFT

1. Open `Art` → Pixel Art
2. Create or generate pixel art via AI
3. Provide name, description, and optional attributes
4. Mint; assets and metadata upload to IPFS, then an NFT is created with Metaplex

Related code:
- `lib/services/pixelArtNftService.ts`
- `lib/services/nftService.ts`

### Mint a 3D Cube NFT

1. Open `Game` or builder UI for cubes
2. Customize materials, colors, effects; preview in 3D
3. Mint; all `materialParams` are preserved in metadata and IPFS alongside the model

Related code:
- `lib/services/nftService.ts` (`getCubeNFTMetadata`, `mintNFT`)

### Mint a Music NFT

1. Open `AI` → Music or the Market mint flow
2. Select cover image and provide `audioUrl` or upload audio
3. Mint; metadata stores audio in multiple discoverable fields (`audio`, `audioUrl`, `animation_url`)

Related code:
- `lib/services/nftService.ts` (`getMusicNFTMetadata`)

---

## IPFS & Metadata

- Assets and metadata are uploaded via Pinata helpers
- Redundant fields ensure marketplaces can discover models/audio
- Fallbacks and local storage enable dev-friendly flows

Key helpers:
- `lib/services/pinataService.ts`
- `lib/services/modelExportService.ts`

---

## Development Notes

- Strong focus on preserving 3D `materialParams` across uploads and metadata
- Local fallbacks: when uploads or minting fail in dev, data is cached to `localStorage`
- Uses Metaplex JS SDK for minting and discovery

---

## Contributing

- Open issues and PRs are welcome
- Keep code clear and typed; match existing formatting
- Avoid introducing breaking API changes without discussion

---

## License

MIT

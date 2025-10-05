<div align="center">
  <img src="public/favicon.png" alt="VOID Logo" width="120"/>
  
# VOID

  ### On-Chain Creative Playground on Solana
  
  [![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://solana.com)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  
  **Category Winner: Best AI App**  
  *Solana Swinburne Hackathon 2025*
  
</div>

---

## Overview

VOID is an open, on-chain creative platform that empowers creators to mint, showcase, and trade unique digital assets on Solana. Built with cutting-edge web technologies and blockchain infrastructure, VOID offers a seamless experience for creating interactive 3D cube NFTs, AI-generated pixel art, and music collectibles.

---

## Features

### NFT Creation
- **3D Cube NFTs** — Mint interactive 3D cubes with customizable materials, textures, and animations. All material parameters are preserved on-chain.
- **AI-Generated Pixel Art** — Generate unique pixel art using AI and mint directly to Solana with structured metadata.
- **Music Collectibles** — Create audio NFTs with embedded music files and custom cover art.

### Platform Capabilities
- **Real-Time 3D Rendering** — WebGL-powered visualization using Three.js and React Three Fiber.
- **On-Chain Marketplace** — Rust smart contract for decentralized trading with integrated marketplace views.
- **IPFS Storage** — Decentralized asset storage via Pinata with automatic fallbacks.
- **Wallet Integration** — Seamless authentication with Phantom and Solana Wallet Adapter.
- **Immersive Gallery** — Explore realms, play interactive experiences, and browse collections.

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI |
| **3D & Audio** | Three.js, React Three Fiber, Tone.js, Howler, Postprocessing |
| **Blockchain** | Solana Web3.js, Metaplex Foundation JS, Wallet Adapter |
| **Storage** | IPFS, Pinata API |
| **Smart Contracts** | Rust, Solana Program Library |
| **Backend** | Next.js API Routes, Supabase (optional) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Phantom Wallet browser extension
- Solana CLI (for smart contract deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd VOID

# Install dependencies
pnpm install
# or
npm install

# Create environment file
cp .env.example .env.local

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create optimized production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint for code quality checks |

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# AI Services (Optional)
MUSIC_API_KEY=your_music_api_key
MUSIC_AI_API_URL=your_music_ai_url

# IPFS Storage (Recommended)
PINATA_JWT=your_pinata_jwt_token

# Solana Configuration
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Additional Services (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

Refer to `app/config/env.ts` for all available configuration options.

---

## Project Structure

```
VOID/
├── app/                      # Next.js App Router
│   ├── api/                  # API route handlers
│   │   ├── generate-pixel-art/
│   │   ├── mint-pixel-art/
│   │   ├── ipfs/
│   │   ├── cube/
│   │   ├── music/
│   │   └── auth/
│   ├── art/                  # Pixel art creation
│   ├── ai/                   # AI generation features
│   ├── market/               # NFT marketplace
│   ├── game/                 # Interactive game realms
│   └── gallery/              # NFT gallery
├── components/               # Reusable UI components
│   ├── ui/                   # Base UI components
│   └── nft/                  # NFT-specific components
├── lib/
│   ├── services/             # Core business logic
│   │   ├── nftService.ts
│   │   ├── pixelArtNftService.ts
│   │   ├── pinataService.ts
│   │   └── walletService.ts
│   ├── supabase/             # Database services
│   └── utils/                # Helper functions
├── nft_marketplace/          # Rust smart contract
│   ├── src/
│   ├── tests/
│   └── Cargo.toml
└── public/                   # Static assets
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-pixel-art` | POST | Generate AI pixel art from prompts |
| `/api/mint-pixel-art` | POST | Mint pixel art NFT to Solana |
| `/api/ipfs/[cid]` | GET | Retrieve IPFS content by CID |
| `/api/cube/[color]` | GET | Fetch cube configuration by color |
| `/api/auth/wallet-login` | POST | Authenticate via wallet signature |
| `/api/music/callback` | POST | Handle music AI generation callbacks |

---

## Wallet Setup

### Connect to Solana

1. **Install Phantom Wallet**  
   Download from [phantom.app](https://phantom.app)

2. **Switch to Devnet** (for testing)  
   Settings → Developer Settings → Change Network → Devnet

3. **Fund Your Wallet**  
   Get test SOL from [Solana Faucet](https://faucet.solana.com)

4. **Connect in App**  
   Click "Connect Wallet" in the navigation bar

### Smart Contract Deployment

For deploying the on-chain marketplace program, refer to the detailed guide in [`nft_marketplace/README.md`](nft_marketplace/README.md).

---

## Usage Guide

### Creating Pixel Art NFTs

1. Navigate to **Art** → **Pixel Art**
2. Use the canvas to draw or click **Generate with AI**
3. Enter NFT details (name, description, attributes)
4. Click **Mint NFT**
   - Assets upload to IPFS via Pinata
   - NFT is created using Metaplex standard
   - Transaction confirms on Solana

**Implementation:** `lib/services/pixelArtNftService.ts`

### Creating 3D Cube NFTs

1. Navigate to **Game** or the cube builder
2. Customize materials, textures, colors, and effects
3. Preview your cube in real-time 3D
4. Click **Mint NFT**
   - All material parameters are preserved
   - 3D model exports to GLB format
   - Metadata includes complete material data

**Implementation:** `lib/services/nftService.ts` (`getCubeNFTMetadata`, `mintNFT`)

### Creating Music NFTs

1. Navigate to **AI** → **Music** or **Market** → **Mint**
2. Upload or link audio file
3. Select cover artwork
4. Add metadata and attributes
5. Click **Mint NFT**
   - Audio stored with multiple reference fields
   - Compatible with major NFT marketplaces

**Implementation:** `lib/services/nftService.ts` (`getMusicNFTMetadata`)

---

## Architecture & Design

### IPFS Storage Strategy

- **Decentralized Storage:** All assets and metadata uploaded to IPFS via Pinata
- **Redundant References:** Multiple field locations ensure marketplace compatibility
- **Development Fallbacks:** Local storage caching when IPFS is unavailable
- **Gateway Diversity:** Multiple IPFS gateways for reliability

**Key Services:**
- `lib/services/pinataService.ts` — IPFS upload and retrieval
- `lib/services/modelExportService.ts` — 3D model export utilities

### Metadata Preservation

VOID prioritizes complete metadata integrity:

- **3D Material Parameters:** All material properties preserved through the entire pipeline
- **Metaplex Standard:** Full compliance with Solana NFT standards
- **Structured Attributes:** Type-safe attribute system for filtering and discovery
- **Multi-Format Support:** GLB models, PNG images, MP3 audio

### Development Philosophy

- Type-safe TypeScript throughout
- Comprehensive error handling with graceful fallbacks
- Local-first development with blockchain deployment
- Metaplex JS SDK for reliable minting

---

## Contributing

We welcome contributions from the community. To contribute:

1. **Fork the repository** and create a feature branch
2. **Follow existing code style** — TypeScript, ESLint rules
3. **Write clear commit messages** describing your changes
4. **Test thoroughly** before submitting
5. **Open a Pull Request** with a detailed description

### Guidelines

- Maintain type safety throughout
- Add comments for complex logic
- Update documentation for new features
- Avoid breaking changes without discussion

---

## Acknowledgments

**Category Winner: Best AI App**  
Solana Swinburne Hackathon 2025

Built with support from the Solana developer community and open-source contributors.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
  
**Built on Solana** | **Powered by Metaplex** | **Stored on IPFS**

[Documentation](nft_marketplace/README.md) • [Report Bug](../../issues) • [Request Feature](../../issues)

</div>

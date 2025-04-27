# VOID

VOID is a decentralized AI-powered creative economy and cross-game asset platform built on Solana.  
VOID empowers users to generate 3D Cubes, Music, and Pixel Art through custom AI models, mint them as NFTs, and use these assets across interactive realm-based games.  
VOID unifies creativity, ownership, and gameplay into a fully interoperable Web3 experience where players create, evolve, and trade their digital assets seamlessly.

---

## Project Structure

VOID's architecture connects modern AI generation pipelines, Web3 blockchain standards, and real-time backend infrastructure to support large-scale, decentralized user interaction.

- **Frontend**:
  - Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/).
  - UI styling powered by [TailwindCSS](https://tailwindcss.com/).
  - Solana wallet authentication integrated via [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter).
  - Pixel Canvas built as a scalable TypeScript-React component with real-time updates.

- **Backend**:
  - User profiles (wallet addresses, avatars) and Pixel Canvas pixel data are stored in [Supabase](https://supabase.com/).
  - Real-time capabilities of Supabase enable collaborative pixel art experiences without latency.

- **Blockchain Layer**:
  - Solana blockchain used for NFT minting, marketplace transactions, and ownership validation.
  - NFT metadata structured according to [Metaplex Metadata Standard](https://docs.metaplex.com/).

- **AI Engines**:
  - **VOID 3D Model**: Custom-trained model to generate original 3D Cube designs based on prompts.
  - **Suno AI**: Used for dynamic music track generation based on theme, realm, or player mood.
  - **Stable Diffusion (Pixel Art Tuning)**: Used for generating pixel art styled outputs matching game realms.

- **Storage Infrastructure**:
  - [Pinata](https://www.pinata.cloud/) IPFS hosting used for decentralized storage of all NFT assets (3D Cube files, Music tracks, Pixel Art).

- **Gameplay Layer**:
  - Interactive multi-realm games built with [Three.js](https://threejs.org/), dynamically loading user NFTs.
  - NFTs are playable objects that evolve based on player interaction and realm-specific logic.

---

## Features

- **AI Asset Studio**:
  - Generate Cubes, Music, and Pixel Art through intuitive prompt-based AI tools.
  - Immediate asset feedback and iteration capabilities.

- **Instant NFT Minting**:
  - Mint AI-generated assets as SPL NFTs directly from the frontend.
  - NFT metadata automatically formatted according to Metaplex standards.

- **Cross-Game Asset Interoperability**:
  - A single NFT can interact across multiple realm games, unlocking different appearances, abilities, or bonus content.

- **Marketplace**:
  - List, buy, and trade NFTs securely.
  - Marketplace built with direct Solana blockchain transaction support, eliminating intermediaries.

- **Pixel Canvas**:
  - Global collaborative pixel art board.
  - Each wallet can contribute one pixel at a time, verified on backend and frontend in real-time.

- **Profile System**:
  - Users manage their identity by uploading avatars, viewing their assets, transaction history, and in-game achievements.
  - Profiles linked directly to wallet authentication.

- **Real-time Interaction**:
  - Supabase enables seamless state synchronization across players for Pixel Canvas and Profile updates.

---

## System Architecture

VOID is designed to support massive scalability, minimal transaction fees, and real-time gameplay using decentralized infrastructures:

- **Authentication and Profiles**:
  - Wallet login secured via Solana Wallet Adapter.
  - Profiles are linked to public wallet addresses, stored in Supabase.

- **Asset Generation & Minting**:
  - AI asset output streamed back to frontend.
  - Mint button initiates transaction on Solana blockchain via Web3.js SDK, registering the asset metadata on-chain.

- **Data Storage**:
  - Generated assets and corresponding metadata (JSON + files) are uploaded to IPFS via Pinata.
  - All URIs in NFT metadata point directly to immutable IPFS hashes, ensuring asset authenticity.

- **Gameplay Integration**:
  - Three.js games dynamically read NFTs by parsing on-chain metadata, pulling assets from IPFS, and rendering them interactively.

- **Marketplace Operations**:
  - Each NFT listing is smart contract-validated for rightful ownership.
  - On purchase, Solana blockchain transfers NFT securely to buyer’s wallet.

---

## Security and Data Integrity

VOID prioritizes security at every architectural layer:

- **Supabase Backend Security**:
  - Row-Level Security (RLS) policies enforced to ensure wallets can only modify their own data.
  - Pixel Canvas contributions rate-limited and signed to prevent spamming or unauthorized canvas attacks.

- **Blockchain and NFT Security**:
  - NFTs minted with Metaplex standards guarantee immutability of ownership and metadata.
  - Marketplace operations require transaction signing and validation before trades are executed.

- **IPFS Asset Storage**:
  - Assets permanently pinned on IPFS.
  - Metadata content-addressed using CID hashes, preventing asset manipulation or link-breaking.

- **Frontend Wallet Operations**:
  - All wallet actions require explicit user confirmation through connected wallet (e.g., Phantom, Solflare).

---

## Roadmap

### ✅ Completed — Q1 2025
- Launch AI Asset Studio (VOID Cubes, Music, Pixel Art)
- NFT Minting System live
- Realm-Based Games (Echo, Pulse, Cipher) released
- Pixel Canvas collaborative system operational
- Marketplace launch for NFT trading

### 🚀 Upcoming

- **Q2 2025**:
  - Realm SDK launch for external developers.
  - Multiplayer-enhanced Pixel Canvas (live cursor tracking, collaboration).
  - Upgrade AI engine to VOID Model 2.0 for animated 3D cubes.

- **Q3 2025**:
  - Mobile App beta release for iOS and Android.
  - Gacha system and Fusion mechanics introduction.
  - Social media asset sharing integrations.

- **Q4 2025**:
  - Realm-specific tokenization tied to in-game activities.
  - Advanced AI personalized generators ("Liquid Cubes", "Biome Music").
  - Timed collaborative realm building events.

- **2026 and Beyond**:
  - Full Open Realm Protocol allowing anyone to create and connect new realms.
  - Cross-chain asset compatibility exploration.
  - AI personalization layer where users train their own asset styles.

---

## Setup (Quick Start)

Clone the repository:

```bash
git clone https://github.com/your-org-name/void.git
cd void

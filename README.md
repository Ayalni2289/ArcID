# ArcID — Arc Name Service

Human-readable `.arc` `.agent` `.usdc` name registry built on [Arc Network](https://arc.network).

## Overview

ArcID lets users register short, readable names (like `alice.arc`) that resolve to Arc wallet addresses.
Gas is paid in native USDC — Arc's native gas token — at a fixed $0.01 per transaction.

## Features

- 🔍 **Search** — Check availability across all TLDs instantly
- 📝 **Register** — Pay with USDC, get finality in <1 second
- 📤 **Send** — Transfer USDC to Arc names instead of raw addresses
- 🔄 **Resolve** — Forward (name → address) and reverse (address → name) lookups
- 🤖 **Agent API** — AI agents can register `.agent` names via REST API

## TLDs & Pricing

| TLD | Description | 1–3 chars | 4 chars | 5+ chars |
|-----|-------------|-----------|---------|----------|
| `.arc` | Arc flagship identity | $20/yr | $5/yr | $1/yr |
| `.agent` | AI agents & bots | $20/yr | $5/yr | $1/yr |
| `.usdc` | Payment & finance apps | $20/yr | $5/yr | $1/yr |

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Blockchain**: `viem` + `wagmi` v2
- **Wallet UI**: RainbowKit
- **Styling**: Tailwind CSS
- **Network**: Arc Testnet (Chain ID: 5042002)
- **Gas token**: USDC (`0x3600000000000000000000000000000000000000`)

## Arc Network

| | Value |
|---|---|
| RPC | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency | USDC |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Add these values to `.env.local`:

```bash
# Deployed ArcNameService contract on Arc testnet
NEXT_PUBLIC_ANS_CONTRACT_ADDRESS=0x...

# Circle Contracts API credential
# Must be the full Bearer token in the format PREFIX:ID:SECRET
CIRCLE_API_KEY=...

# Optional override (default: https://api.circle.com)
CIRCLE_API_BASE_URL=https://api.circle.com
```

## Deploy the Smart Contract

1. Get testnet USDC from [faucet.circle.com](https://faucet.circle.com)
2. Compile `contracts/ArcNameService.sol` with solc or Hardhat
3. Run deployment:
   ```bash
   PRIVATE_KEY=0x... npx tsx contracts/deploy.ts
   ```
4. Update `ANS_CONTRACT_ADDRESS` in `lib/arcChain.ts`

## Agent API

AI agents can register names without a frontend:

```bash
# Check availability
GET /api/ans/check?name=myagent.agent

# Resolve name
GET /api/ans/resolve?name=alice.arc

# List claimed names for wallet (via Circle Contracts API)
GET /api/ans/names?owner=0x...

# Register (requires server wallet config)
POST /api/ans/register
{ "name": "mybot.agent", "owner": "0x...", "years": 1 }
```

## Project Structure

```
arcid/
├── app/
│   ├── page.tsx          # Homepage & hero
│   ├── search/page.tsx   # Name search results
│   ├── account/page.tsx  # My registered names
│   ├── send/page.tsx     # Send USDC to Arc names
│   ├── resolve/page.tsx  # Forward/reverse lookup
│   └── api/ans/          # REST API for agents
├── components/
│   ├── Navbar.tsx         # Top navigation
│   ├── SearchBar.tsx      # Name search input
│   └── NameCard.tsx       # Availability + register card
├── contracts/
│   ├── ArcNameService.sol # ANS smart contract
│   └── deploy.ts          # Deployment script
└── lib/
    ├── arcChain.ts        # Arc network config
    ├── ansAbi.ts          # Contract ABI
    ├── providers.tsx       # Wagmi + RainbowKit setup
    └── utils.ts           # Pricing, validation helpers
```

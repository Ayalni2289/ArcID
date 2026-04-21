import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

// Native USDC on Arc (gas token)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

// ─── ANS Contract ──────────────────────────────────────────────────────────
// Deploy ArcNameService.sol via Remix → update this address
// Guide: contracts/DEPLOY_GUIDE.md
export const ANS_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_ANS_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

// Treasury wallet — all registration fees go here directly
export const TREASURY_ADDRESS = "0xd4806bdFD5b651AcD3f930717ce2c1c11b246Aa6" as const;

export const IS_DEMO_MODE = ANS_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

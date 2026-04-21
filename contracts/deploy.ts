/**
 * Deploy ArcNameService to Arc Testnet
 * 
 * Prerequisites:
 *   npm install -D viem
 *   Get testnet USDC from: https://faucet.circle.com
 * 
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx contracts/deploy.ts
 */

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "../lib/arcChain";

// Paste compiled bytecode here after: solc --bin ArcNameService.sol
const BYTECODE = "0x" as `0x${string}`; // TODO: paste compiled bytecode

async function deploy() {
  const pk = process.env.PRIVATE_KEY as `0x${string}`;
  if (!pk) throw new Error("Set PRIVATE_KEY env var");

  const account = privateKeyToAccount(pk);
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

  console.log("Deploying ArcNameService to Arc Testnet...");
  console.log("Deployer:", account.address);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", balance, "native USDC units");

  const hash = await walletClient.deployContract({
    abi: [],
    bytecode: BYTECODE,
    args: [],
  });

  console.log("Deploy tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("✓ Contract deployed at:", receipt.contractAddress);
  console.log("Update ANS_CONTRACT_ADDRESS in lib/arcChain.ts");
}

deploy().catch(console.error);

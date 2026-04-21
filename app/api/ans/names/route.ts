import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS, arcTestnet } from "@/lib/arcChain";

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

function resolveCircleBaseUrl(): string {
  if (process.env.CIRCLE_API_BASE_URL) return process.env.CIRCLE_API_BASE_URL;
  if (CIRCLE_API_KEY?.startsWith("TEST_API_KEY:")) return "https://api-sandbox.circle.com";
  return "https://api.circle.com";
}

type AnsItem = { name: string; txHash: string };

async function callArcRpcOwnedNames(owner: string): Promise<AnsItem[]> {
  const client = createPublicClient({
    chain: arcTestnet,
    transport: http(arcTestnet.rpcUrls.default.http[0]),
  });

  const normalizedOwner = owner.toLowerCase() as `0x${string}`;
  const nameToHash = new Map<string, string>();
  // Görseldeki 4 parametreli tam imza
  const SIG = "event NameRegistered(string name, address indexed owner, uint256 expiry, uint256 feePaid)";

  try {
    const latestBlock = await client.getBlockNumber();
    let from = BigInt(38000000); 
    const CHUNK = BigInt(10000);

    while (from <= latestBlock) {
      let to = from + CHUNK;
      if (to > latestBlock) to = latestBlock;

      const logs = await client.getLogs({
        address: ANS_CONTRACT_ADDRESS,
        event: parseAbiItem(SIG),
        args: { owner: normalizedOwner }, 
        fromBlock: from,
        toBlock: to,
      });

      for (const log of logs) {
        const name = (log.args as any).name;
        if (name && log.transactionHash) {
          nameToHash.set(name, log.transactionHash);
        }
      }
      from = to + BigInt(1);
    }
  } catch (err) {
    console.error("[RPC Error]", err);
  }

  const verified: AnsItem[] = [];
  const nowSec = BigInt(Math.floor(Date.now() / 1000));

  for (const [fullName, txHash] of Array.from(nameToHash.entries())) {
    try {
      const label = fullName.split('.')[0];
      const variations = [fullName, label];
      let isVerified = false;

      for (const n of variations) {
        try {
          let currentOwner;
          try {
            currentOwner = await client.readContract({ address: ANS_CONTRACT_ADDRESS, abi: ANS_ABI, functionName: "owner", args: [n] });
          } catch {
            currentOwner = await client.readContract({ address: ANS_CONTRACT_ADDRESS, abi: ANS_ABI, functionName: "getOwner", args: [n] });
          }

          let expiry;
          try {
            expiry = await client.readContract({ address: ANS_CONTRACT_ADDRESS, abi: ANS_ABI, functionName: "expiry", args: [n] }) as bigint;
          } catch {
            expiry = await client.readContract({ address: ANS_CONTRACT_ADDRESS, abi: ANS_ABI, functionName: "getExpiry", args: [n] }) as bigint;
          }

          if (currentOwner && String(currentOwner).toLowerCase() === normalizedOwner && expiry >= nowSec) {
            isVerified = true;
            break;
          }
        } catch { continue; }
      }

      if (isVerified) verified.push({ name: fullName, txHash });
    } catch { continue; }
  }

  return verified.sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  if (!owner || !/^0x[0-9a-fA-F]{40}$/.test(owner)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const results = await callArcRpcOwnedNames(owner.toLowerCase());
    return NextResponse.json({ owner, names: results, source: "arc-rpc-fallback" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
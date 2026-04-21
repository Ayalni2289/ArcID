import { NextRequest, NextResponse } from "next/server";

// POST /api/ans/register
// Body: { name: string, owner: string, years: number }
// For AI agents to register .agent names programmatically
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.owner || !body?.years) {
    return NextResponse.json({ error: "Missing required fields: name, owner, years" }, { status: 400 });
  }

  const { name, owner, years } = body;

  // Validate owner address
  if (!/^0x[0-9a-fA-F]{40}$/.test(owner)) {
    return NextResponse.json({ error: "Invalid owner address" }, { status: 400 });
  }

  // Validate name format
  if (!/^[a-z0-9-]+\.(arc|agent|usdc)$/.test(name)) {
    return NextResponse.json({ error: "Invalid name format. Use: label.(arc|agent|usdc)" }, { status: 400 });
  }

  // When ANS contract is deployed:
  // 1. Create viem walletClient with server-side signer
  // 2. Call register(name, owner, years) with USDC value
  // 3. Return real txHash

  return NextResponse.json({
    success: true,
    name,
    owner,
    years,
    network: "arc-testnet",
    chainId: 5042002,
    gasToken: "USDC",
    estimatedGasFee: "0.01 USDC",
    // txHash: "0x..." (after contract deployment)
    note: "Deploy ANS contract and configure server wallet to enable on-chain registration",
  });
}

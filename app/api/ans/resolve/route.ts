import { NextRequest, NextResponse } from "next/server";

// GET /api/ans/resolve?name=alice.arc
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name param" }, { status: 400 });

  // When ANS contract is deployed, call resolve() via viem publicClient here
  const mockRecords: Record<string, string> = {
    "alice.arc": "0x3fa81cb2d0e9a3f8bc0e6c1ca4d9e2f1a7b0c3d8",
    "dao.arc": "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0",
    "myagent.agent": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  };

  const address = mockRecords[name.toLowerCase()];
  if (!address) return NextResponse.json({ error: "Name not found" }, { status: 404 });

  return NextResponse.json({
    name,
    address,
    network: "arc-testnet",
    chainId: 5042002,
    resolvedAt: new Date().toISOString(),
  });
}

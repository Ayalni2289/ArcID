import { NextRequest, NextResponse } from "next/server";

// GET /api/ans/check?name=alice.arc
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name param" }, { status: 400 });

  // When ANS contract is deployed, call isAvailable() via viem publicClient here
  // For now: simulate
  const takenNames = ["alice.arc", "dao.arc", "defi.arc"];
  const available = !takenNames.includes(name.toLowerCase());

  return NextResponse.json({
    name,
    available,
    network: "arc-testnet",
    chainId: 5042002,
    gasToken: "USDC",
    registrationFeeUSDC: available ? getPriceUSDC(name) : null,
  });
}

function getPriceUSDC(fullName: string): number {
  const label = fullName.split(".")[0];
  if (label.length <= 3) return 20;
  if (label.length === 4) return 5;
  return 1;
}

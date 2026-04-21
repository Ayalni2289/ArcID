import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS, arcTestnet } from "@/lib/arcChain";

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

function resolveCircleBaseUrl(): string {
  if (process.env.CIRCLE_API_BASE_URL) {
    return process.env.CIRCLE_API_BASE_URL;
  }

  if (CIRCLE_API_KEY?.startsWith("TEST_API_KEY:")) {
    return "https://api-sandbox.circle.com";
  }

  return "https://api.circle.com";
}

type UnknownRecord = Record<string, unknown>;

function pickName(log: UnknownRecord): string | null {
  const candidates: unknown[] = [
    log.name,
    (log.decodedLog as UnknownRecord | undefined)?.name,
    (log.decodedLog as UnknownRecord | undefined)?.eventParameters &&
      ((log.decodedLog as UnknownRecord).eventParameters as UnknownRecord).name,
    (log.args as UnknownRecord | undefined)?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

function pickOwner(log: UnknownRecord): string | null {
  const candidates: unknown[] = [
    log.owner,
    (log.decodedLog as UnknownRecord | undefined)?.owner,
    (log.decodedLog as UnknownRecord | undefined)?.eventParameters &&
      ((log.decodedLog as UnknownRecord).eventParameters as UnknownRecord).owner,
    (log.args as UnknownRecord | undefined)?.owner,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate.toLowerCase();
    }
  }

  return null;
}

function isNameRegisteredEvent(log: UnknownRecord): boolean {
  const markerCandidates = [
    log.eventName,
    log.event,
    log.eventSignature,
    (log.decodedLog as UnknownRecord | undefined)?.eventName,
    (log.decodedLog as UnknownRecord | undefined)?.eventSignature,
  ];

  return markerCandidates.some((value) => {
    if (typeof value !== "string") return false;
    return value.toLowerCase().includes("nameregistered");
  });
}

async function callCircleListEventLogs(): Promise<UnknownRecord[]> {
  if (!CIRCLE_API_KEY) {
    throw new Error("Missing CIRCLE_API_KEY server environment variable");
  }

  const circleBaseUrl = resolveCircleBaseUrl();

  if (!ANS_CONTRACT_ADDRESS || ANS_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Missing NEXT_PUBLIC_ANS_CONTRACT_ADDRESS");
  }

  const pageSize = 50;
  const logs: UnknownRecord[] = [];
  let pageAfter: string | undefined;
  let lastError: string | null = null;

  for (let page = 0; page < 20; page += 1) {
    const url = new URL(`${circleBaseUrl}/v1/w3s/contracts/events`);
    url.searchParams.set("blockchain", "ARC-TESTNET");
    url.searchParams.set("contractAddress", ANS_CONTRACT_ADDRESS);
    url.searchParams.set("pageSize", String(pageSize));
    if (pageAfter) {
      url.searchParams.set("pageAfter", pageAfter);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
        "X-Request-Id": crypto.randomUUID(),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const bodyText = await res.text();
      lastError = `Circle API error (${res.status}) at ${url.toString()}: ${bodyText.slice(0, 180)}`;
      break;
    }

    const json = (await res.json()) as UnknownRecord;
    const data = (json.data as UnknownRecord | undefined) ?? json;
    const pageLogs = ((data.eventLogs as unknown[]) ?? []).filter(
      (item): item is UnknownRecord => !!item && typeof item === "object"
    );

    logs.push(...pageLogs);

    if (pageLogs.length < pageSize) {
      lastError = null;
      break;
    }

    const nextPageAfter = pageLogs[pageLogs.length - 1]?.id;
    if (typeof nextPageAfter !== "string" || nextPageAfter.length === 0) {
      break;
    }

    pageAfter = nextPageAfter;
  }

  if (logs.length === 0 && lastError) {
    throw new Error(lastError);
  }

  return logs;
}

async function callArcRpcOwnedNames(owner: string): Promise<string[]> {
  const client = createPublicClient({
    chain: arcTestnet,
    transport: http(arcTestnet.rpcUrls.default.http[0]),
  });

  const normalizedOwner = owner.toLowerCase() as `0x${string}`;
  const candidateNames = new Set<string>();

  const registeredEventSignatures = [
    "event NameRegistered(string name, address indexed owner, uint256 expiry)",
    "event NameRegistered(string name, address indexed owner, uint256 expiry, uint256 feePaid)",
  ] as const;

  for (const signature of registeredEventSignatures) {
    try {
      const eventLogs = await client.getLogs({
        address: ANS_CONTRACT_ADDRESS,
        event: parseAbiItem(signature),
        args: { owner: normalizedOwner },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });

      for (const log of eventLogs) {
        const name = log.args?.name;
        if (typeof name === "string" && name.length > 0) {
          candidateNames.add(name);
        }
      }
    } catch {
      // Try the next signature.
    }
  }

  try {
    const transferLogs = await client.getLogs({
      address: ANS_CONTRACT_ADDRESS,
      event: parseAbiItem("event NameTransferred(string name, address indexed from, address indexed to)"),
      args: { to: normalizedOwner },
      fromBlock: BigInt(0),
      toBlock: "latest",
    });

    for (const log of transferLogs) {
      const name = log.args?.name;
      if (typeof name === "string" && name.length > 0) {
        candidateNames.add(name);
      }
    }
  } catch {
    // Ignore transfer log fallback failures.
  }

  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const verifiedNames: string[] = [];

  await Promise.all(
    Array.from(candidateNames).map(async (name) => {
      try {
        const [currentOwner, expiry] = await Promise.all([
          client.readContract({
            address: ANS_CONTRACT_ADDRESS,
            abi: ANS_ABI,
            functionName: "owner",
            args: [name],
          }),
          client.readContract({
            address: ANS_CONTRACT_ADDRESS,
            abi: ANS_ABI,
            functionName: "expiry",
            args: [name],
          }),
        ]);

        if (String(currentOwner).toLowerCase() === normalizedOwner && (expiry as bigint) >= nowSec) {
          verifiedNames.push(name);
        }
      } catch {
        // Ignore candidates that cannot be verified.
      }
    })
  );

  return Array.from(new Set(verifiedNames)).sort((a, b) => a.localeCompare(b));
}

// GET /api/ans/names?owner=0x...&debug=1
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  if (!owner) {
    return NextResponse.json({ error: "Missing owner param" }, { status: 400 });
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(owner)) {
    return NextResponse.json({ error: "Invalid owner address" }, { status: 400 });
  }

  const ownerLower = owner.toLowerCase();

  try {
    const logs = await callCircleListEventLogs();
    const eventLogs = logs.filter(isNameRegisteredEvent);
    const ownerLogs = eventLogs.filter((log) => pickOwner(log) === ownerLower);
    const circleNames = Array.from(
      new Set(
        ownerLogs
          .map((log) => pickName(log))
          .filter((name): name is string => typeof name === "string" && name.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    if (circleNames.length > 0) {
      const response: UnknownRecord = {
        owner,
        names: circleNames,
        source: "circle-contracts-api",
        contractAddress: ANS_CONTRACT_ADDRESS,
      };

      if (debug) {
        response.debug = {
          totalLogs: logs.length,
          eventLogs: eventLogs.length,
          ownerMatches: ownerLogs.length,
          namesExtracted: circleNames.length,
        };
      }

      return NextResponse.json(response);
    }
  } catch (circleErr) {
    if (debug) {
      const message = circleErr instanceof Error ? circleErr.message : String(circleErr);
      // Continue to RPC fallback below.
      console.warn(`[api/ans/names] Circle event log fetch failed: ${message}`);
    }
  }

  try {
    const names = await callArcRpcOwnedNames(ownerLower);
    const response: UnknownRecord = {
      owner,
      names,
      source: "arc-rpc-fallback",
      contractAddress: ANS_CONTRACT_ADDRESS,
    };

    if (debug) {
      response.debug = {
        namesFromRpc: names.length,
      };
    }

    return NextResponse.json(response);
  } catch (rpcErr) {
    const message = rpcErr instanceof Error ? rpcErr.message : "Unknown RPC error";
    const response: UnknownRecord = {
      error: `Unable to load names from Circle API or Arc RPC: ${message}`,
    };

    if (debug) {
      response.debug = {
        rpcError: message,
      };
    }

    return NextResponse.json(response, { status: 502 });
  }
}

"use client";

import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Navbar from "@/components/Navbar";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS, IS_DEMO_MODE, TREASURY_ADDRESS } from "@/lib/arcChain";
import { shortAddress, TLD_COLORS } from "@/lib/utils";
import { ExternalLink, Copy, Check, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

type Tld = ".arc" | ".agent" | ".usdc";

function NameRow({ name }: { name: string }) {
  const dotIdx = name.indexOf(".");
  const tld = name.slice(dotIdx) as Tld;
  const label = name.slice(0, dotIdx);
  const colors = TLD_COLORS[tld] ?? TLD_COLORS[".arc"];

  const { data: expiryData } = useReadContract({
    address: ANS_CONTRACT_ADDRESS,
    abi: ANS_ABI,
    functionName: "expiry",
    args: [name],
    query: { enabled: !IS_DEMO_MODE },
  });

  const expiryTs = expiryData as bigint | undefined;
  const expiryDate = expiryTs ? new Date(Number(expiryTs) * 1000) : null;
  const daysLeft = expiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--line)] last:border-0">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold"
          style={{ background: colors.bg, color: colors.text }}
        >
          {label.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-medium text-[var(--ink-strong)]">{label}</span>
            <span className="text-sm font-medium" style={{ color: colors.text }}>{tld}</span>
          </div>
          {expiryDate && (
            <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1 mt-0.5">
              Expires {expiryDate.toLocaleDateString()}
              {daysLeft !== null && daysLeft < 90 && (
                <span className="text-amber-400">· {daysLeft}d left</span>
              )}
            </div>
          )}
        </div>
      </div>
      <a
        href={`https://testnet.arcscan.app/search?q=${name}`}
        target="_blank"
        rel="noreferrer"
        className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] hover:bg-[#ece9e0] transition-colors text-[var(--ink-muted)]"
      >
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

function OwnedNames({ address }: { address: string }) {
  const [names, setNames] = useState<string[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  const { data: primaryName } = useReadContract({
    address: ANS_CONTRACT_ADDRESS,
    abi: ANS_ABI,
    functionName: "reverseLookup",
    args: [address as `0x${string}`],
    query: { enabled: !IS_DEMO_MODE },
  });

  useEffect(() => {
    if (IS_DEMO_MODE || !address) return;

    let cancelled = false;

    const loadOwnedNames = async () => {
      setIsLoadingNames(true);
      setLoadError(null);
      setDebugInfo(null);

      try {
        // Add &debug=1 to enable debug output
        const debugMode = typeof window !== "undefined" && window.location.search.includes("debug=1");
        const debugParam = debugMode ? "&debug=1" : "";
        const res = await fetch(`/api/ans/names?owner=${encodeURIComponent(address)}${debugParam}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string; debug?: Record<string, unknown> } | null;
          throw new Error(json?.error || "Failed to fetch names");
        }

        const json = (await res.json()) as {
          names?: string[];
          debug?: Record<string, unknown>;
        };
        const result = Array.isArray(json.names)
          ? Array.from(new Set(json.names.filter((n): n is string => typeof n === "string"))).sort((a, b) => a.localeCompare(b))
          : [];

        if (!cancelled) {
          setNames(result);
          if (json.debug) {
            setDebugInfo(json.debug);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Could not load names";
          setLoadError(message);
          setNames([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNames(false);
        }
      }
    };

    loadOwnedNames();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const mergedNames = Array.from(
    new Set([
      ...names,
      ...(primaryName && (primaryName as string) !== "" ? [primaryName as string] : []),
    ])
  ).sort((a, b) => a.localeCompare(b));

  if (IS_DEMO_MODE) {
    return (
      <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
        <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-amber-300 font-medium mb-1">Contract is not deployed yet</p>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Follow <code className="text-amber-300 font-mono">contracts/DEPLOY_GUIDE.md</code> and deploy with Remix,
            then put the contract address into <code className="text-amber-300 font-mono">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingNames) {
    return (
      <div className="py-12 text-center text-[var(--ink-muted)] text-sm">
        Loading claimed names...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-12 text-center text-red-400 text-sm">
        {loadError}
        {debugInfo && (
          <div className="mt-4 text-xs text-red-300 bg-red-950 rounded p-3 text-left">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  if (mergedNames.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--ink-muted)] text-sm">
        No claimed names were found for this wallet
      </div>
    );
  }

  return (
    <>
      {mergedNames.map((name) => (
        <NameRow key={name} name={name} />
      ))}
      {debugInfo && (
        <div className="mt-6 p-3 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700">
          <p className="font-mono mb-2">Debug Info:</p>
          <pre className="whitespace-pre-wrap text-slate-400">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </>
  );
}

export default function AccountPage() {
  const { address, isConnected } = useAccount();

  const { data: primaryName } = useReadContract({
    address: ANS_CONTRACT_ADDRESS,
    abi: ANS_ABI,
    functionName: "reverseLookup",
    args: [address!],
    query: { enabled: !!address && !IS_DEMO_MODE },
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--ink-strong)] mb-2">My Names</h1>
            <p className="text-[var(--ink-muted)] text-sm mb-6">
              Connect your wallet to view your Arc names
            </p>
            <ConnectButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-[var(--ink-strong)] mb-1">My Names</h1>
          <p className="text-[var(--ink-muted)] text-sm flex items-center gap-1.5">
            {shortAddress(address!)} <CopyButton text={address!} />
          </p>
        </div>

        {/* Primary name banner */}
        {!IS_DEMO_MODE && primaryName && (primaryName as string) !== "" && (
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-5 mb-8">
            <div className="text-xs text-[var(--ink-muted)] uppercase tracking-widest mb-2">
              Primary Name
            </div>
            <div className="text-lg font-medium text-[var(--ink-strong)] font-mono">
              {primaryName as string}
            </div>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              This name is shown when others look up your address
            </p>
          </div>
        )}

        {/* Demo mode notice */}
        {IS_DEMO_MODE && (
          <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-8">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-amber-300 font-medium mb-1">Demo Mode - Contract Not Deployed</p>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Deploy <code className="text-amber-300 font-mono">ArcNameService.sol</code> via Remix -&gt;
                add the address to <code className="text-amber-300 font-mono">.env.local</code> -&gt;
                restart <code className="text-amber-300 font-mono">npm run dev</code>.
              </p>
            </div>
          </div>
        )}

        {/* Names list */}
        <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl px-5">
          <div className="py-4 border-b border-[var(--line)] flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--ink-strong)]">Claimed Names</span>
            {!IS_DEMO_MODE && (
              <a
                href={`https://testnet.arcscan.app/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors flex items-center gap-1"
              >
                View on ArcScan <ExternalLink size={10} />
              </a>
            )}
          </div>
          <OwnedNames address={address!} />
        </div>

        {/* Treasury info (for your reference) */}
        <div className="mt-8 bg-[var(--surface-2)] border border-[var(--line)] rounded-xl p-4">
          <div className="text-xs text-[var(--ink-muted)] uppercase tracking-widest mb-2">Protocol Treasury</div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--ink-muted)]">{shortAddress(TREASURY_ADDRESS)}</span>
            <CopyButton text={TREASURY_ADDRESS} />
            <a
              href={`https://testnet.arcscan.app/address/${TREASURY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors"
            >
              <ExternalLink size={11} />
            </a>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            All registration fees are sent here directly
          </p>
        </div>
      </main>
    </div>
  );
}

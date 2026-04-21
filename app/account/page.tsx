"use client";

import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Navbar from "@/components/Navbar";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS, IS_DEMO_MODE } from "@/lib/arcChain";
import { shortAddress, TLD_COLORS } from "@/lib/utils";
import { ExternalLink, Copy, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Tld = ".arc" | ".agent" | ".usdc";
type AnsItem = { name: string; txHash: string };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-[var(--ink-muted)] hover:text-[var(--ink-strong)]">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function NameRow({ name, owner, txHash }: { name: string; owner: string; txHash?: string }) {
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

  const expiryDate = expiryData ? new Date(Number(expiryData) * 1000) : null;

  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--line)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold" style={{ background: colors.bg, color: colors.text }}>
          {label.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-medium text-[var(--ink-strong)]">{label}</span>
            <span className="text-sm font-medium" style={{ color: colors.text }}>{tld}</span>
          </div>
          {expiryDate && (
            <div className="text-xs text-[var(--ink-muted)] mt-0.5">
              Expires {expiryDate.toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      <a
        href={txHash ? `https://testnet.arcscan.app/tx/${txHash}` : `https://testnet.arcscan.app/address/${owner}`}
        target="_blank"
        rel="noreferrer"
        className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] hover:bg-[#ece9e0] transition-colors"
      >
        <ExternalLink size={12} className="text-[var(--ink-muted)]" />
      </a>
    </div>
  );
}

function OwnedNames({ address }: { address: string }) {
  const [names, setNames] = useState<AnsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/ans/names?owner=${address}`);
        const json = await res.json();
        if (!cancelled) setNames(Array.isArray(json.names) ? json.names : []);
      } catch {
        if (!cancelled) setNames([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [address]);

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[var(--ink-muted)]" size={20} /></div>;
  if (names.length === 0) return <div className="py-12 text-center text-[var(--ink-muted)] text-sm">No names found.</div>;

  return (
    <>
      {names.map((item) => (
        <NameRow key={item.name} name={item.name} owner={address} txHash={item.txHash} />
      ))}
    </>
  );
}

export default function AccountPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-semibold mb-2">My Names</h1>
          <p className="text-[var(--ink-muted)] mb-6">Connect wallet to view names</p>
          <ConnectButton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-[var(--ink-strong)]">My Names</h1>
          <p className="text-[var(--ink-muted)] text-sm flex items-center gap-1.5 mt-1">
            {shortAddress(address!)} <CopyButton text={address!} />
          </p>
        </div>

        <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl px-5">
          <div className="py-4 border-b border-[var(--line)] flex items-center justify-between">
            <span className="text-sm font-medium">Claimed Names</span>
          </div>
          <OwnedNames address={address!} />
        </div>
      </main>
    </div>
  );
}
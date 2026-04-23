"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import Navbar from "@/components/Navbar";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS } from "@/lib/arcChain";
import { Search, Copy, Check, ExternalLink, Loader2 } from "lucide-react";

function CopyBtn({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(()=>setC(false),2000); }}
      className="text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors p-1">
      {c ? <Check size={13}/> : <Copy size={13}/>}
    </button>
  );
}

function ResolveResult({ query }: { query: string }) {
  const isReverse = /^0x[0-9a-fA-F]{40}$/.test(query);
  const isDemoMode = ANS_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

  // Demo resolution
  const demoForward: Record<string, string> = {
    "alice.arc": "0x3fa81cb2d0e9a3f8bc0e6c1ca4d9e2f1a7b0c3d8",
    "dao.arc": "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0",
    "myagent.agent": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  };
  const demoReverse: Record<string, string> = Object.fromEntries(Object.entries(demoForward).map(([k,v])=>[v,k]));

  const { data: resolved, isLoading } = useReadContract({
    address: ANS_CONTRACT_ADDRESS,
    abi: ANS_ABI,
    functionName: isReverse ? "reverseLookup" : "resolve",
    args: [query as `0x${string}`],
    query: { enabled: !isDemoMode },
  });

  const result = isDemoMode
    ? (isReverse ? demoReverse[query.toLowerCase()] : demoForward[query.toLowerCase()])
    : resolved as string | undefined;

  const found = !!result && result !== "0x0000000000000000000000000000000000000000" && result !== "";

  if (isLoading) return (
    <div className="flex items-center gap-2 text-[var(--ink-muted)] text-sm mt-4">
      <Loader2 size={14} className="animate-spin" /> Resolving on Arc…
    </div>
  );

  return (
    <div className="mt-6">
      <div className={`rounded-2xl border p-5 ${found
        ? "bg-[#34d399]/[0.06] border-[#34d399]/20"
        : "bg-[var(--surface-1)] border-[var(--line)]"}`}>
        {found ? (
          <>
            <div className="text-xs text-[#34d399] uppercase tracking-widest mb-3">Resolved</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[var(--ink-strong)] text-sm break-all">{result}</span>
              <CopyBtn text={result!} />
              <a href={`https://testnet.arcscan.app/address/${result}`} target="_blank" rel="noreferrer"
                className="text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors p-1">
                <ExternalLink size={13}/>
              </a>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--line)] text-xs text-[var(--ink-muted)] flex justify-between">
              <span>Query: <span className="text-[var(--ink-strong)] font-mono">{query}</span></span>
              <span className="text-[var(--ink-strong)]">Arc Testnet</span>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-[var(--ink-muted)] text-sm">No record found for</p>
            <p className="font-mono text-[var(--ink-strong)] text-sm mt-1">{query}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResolvePage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const handleResolve = () => {
    if (!query.trim()) return;
    setSubmitted(query.trim().toLowerCase());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12">
        <h1 className="text-2xl font-semibold text-[var(--ink-strong)] mb-1">Resolve</h1>
        <p className="text-[var(--ink-muted)] text-sm mb-8">
          Look up an Arc name → address, or reverse: address → name
        </p>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSubmitted(""); }}
            onKeyDown={e => e.key === "Enter" && handleResolve()}
            placeholder="alice.arc or 0x3fa8…"
            className="w-full bg-[var(--surface-1)] border border-[var(--line)] rounded-xl px-4 py-3 pr-28 text-sm text-[var(--ink-strong)] placeholder-[#8a9586] focus:outline-none focus:border-[var(--accent-deep)] transition-colors font-mono"
          />
          <button onClick={handleResolve}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--ink-strong)] hover:bg-[#25473a] text-white px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Search size={12}/> Resolve
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["alice.arc","dao.arc","myagent.agent","0x3fa81cb2d0e9a3f8bc0e6c1ca4d9e2f1a7b0c3d8"].map(ex=>(
            <button key={ex} onClick={() => { setQuery(ex); setSubmitted(ex); }}
              className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors font-mono">
              {ex.length > 20 ? ex.slice(0,10)+"…" : ex}
            </button>
          ))}
        </div>

        {submitted && <ResolveResult query={submitted} />}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12">
          <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-xl p-4">
            <div className="text-xs text-[var(--ink-muted)] mb-1">Forward lookup</div>
            <div className="font-mono text-xs text-[var(--ink-strong)]">name → address</div>
          </div>
          <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-xl p-4">
            <div className="text-xs text-[var(--ink-muted)] mb-1">Reverse lookup</div>
            <div className="font-mono text-xs text-[var(--ink-strong)]">address → name</div>
          </div>
        </div>
      </main>
    </div>
  );
}

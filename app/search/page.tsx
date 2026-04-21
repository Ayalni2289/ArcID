"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import NameCard from "@/components/NameCard";
import { TLD_OPTIONS, validateLabel, type Tld } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS } from "@/lib/arcChain";

function SearchResults({ label }: { label: string }) {
  const { valid, error } = validateLabel(label);

  if (!valid) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--ink-muted)] text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ink-muted)]">
        Showing results for <span className="text-[var(--ink-strong)] font-mono">"{label}"</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TLD_OPTIONS.map((tld) => (
          <NameCardWrapper key={tld} label={label} tld={tld} />
        ))}
      </div>
    </div>
  );
}

function NameCardWrapper({ label, tld }: { label: string; tld: Tld }) {
  const fullName = `${label}${tld}`;

  const { data: isAvailable, isLoading } = useReadContract({
    address: ANS_CONTRACT_ADDRESS,
    abi: ANS_ABI,
    functionName: "isAvailable",
    args: [fullName],
    query: { enabled: ANS_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" },
  });

  const { data: owner } = useReadContract({
    address: ANS_CONTRACT_ADDRESS,
    abi: ANS_ABI,
    functionName: "owner",
    args: [fullName],
    query: { enabled: ANS_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" && isAvailable === false },
  });

  // If contract not deployed yet, simulate availability based on name
  const simulatedAvailable = ANS_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
    ? !["alice", "dao", "defi", "arc"].includes(label.toLowerCase())
    : isAvailable;

  return (
    <NameCard
      label={label}
      tld={tld}
      available={isLoading ? null : (simulatedAvailable ?? true)}
      owner={owner as string | undefined}
    />
  );
}

function SearchPageInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="mb-10">
          <SearchBar initialQuery={q} size="md" />
        </div>
        {q ? <SearchResults label={q} /> : (
          <div className="text-center py-20 text-[var(--ink-muted)] text-sm">Enter a name to search</div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { validateLabel } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
  size?: "lg" | "md";
}

export default function SearchBar({ initialQuery = "", autoFocus = false, size = "lg" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Strip TLD if user types it
  const normalize = (raw: string) => raw.toLowerCase().replace(/\.(arc|agent|usdc)$/, "").replace(/\s+/g, "");

  const handleSearch = useCallback(async () => {
    const label = normalize(query);
    if (!label) return;
    const { valid } = validateLabel(label);
    if (!valid) return;
    setLoading(true);
    router.push(`/search?q=${encodeURIComponent(label)}`);
  }, [query, router]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const inputClass =
    size === "lg"
      ? "w-full bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl text-[var(--ink-strong)] placeholder-[#8c9889] focus:outline-none focus:border-[var(--accent-deep)] focus:ring-0 transition-colors text-base px-5 py-4 pr-36"
      : "w-full bg-[var(--surface-1)] border border-[var(--line)] rounded-xl text-[var(--ink-strong)] placeholder-[#8c9889] focus:outline-none focus:border-[var(--accent-deep)] transition-colors text-sm px-4 py-3 pr-28";

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(normalize(e.target.value))}
        onKeyDown={handleKey}
        placeholder="Search a name…  e.g. alice, myagent"
        autoFocus={autoFocus}
        className={inputClass}
        spellCheck={false}
      />
      <button
        onClick={handleSearch}
        disabled={loading || !query}
        className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[var(--ink-strong)] hover:bg-[#25473a] disabled:opacity-40 disabled:cursor-not-allowed text-[#ece9e0] rounded-xl transition-all font-medium ${
          size === "lg" ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs"
        }`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Search size={14} />
        )}
        Search
      </button>
    </div>
  );
}

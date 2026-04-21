"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Search" },
  { href: "/account", label: "My Names" },
  { href: "/send", label: "Send" },
  { href: "/resolve", label: "Resolve" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface-1)]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="text-lg font-medium text-[var(--ink-strong)]">
            Arc<span className="text-[var(--accent-deep)]">|</span>id
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? "bg-[var(--surface-2)] text-[var(--ink-strong)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink-strong)] hover:bg-[#ece9e0]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet */}
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus="avatar"
        />
      </div>
    </header>
  );
}

function HexIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L12 4V10L7 13L2 10V4L7 1Z" fill="#d9d4c4" fillOpacity="0.95" />
      <circle cx="7" cy="7" r="2" fill="#4e6548" />
      <circle cx="7" cy="7" r="1" fill="#f4f2ec" />
    </svg>
  );
}

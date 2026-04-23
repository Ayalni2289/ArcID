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
          chainStatus={{ smallScreen: "none", largeScreen: "icon" }}
          showBalance={false}
          accountStatus={{ smallScreen: "avatar", largeScreen: "avatar" }}
        />
      </div>

      {/* Mobile nav */}
      <nav className="sm:hidden border-t border-[var(--line)] bg-[var(--surface-1)]/95">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <div className="flex items-center gap-1 py-2 min-w-max">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  pathname === link.href
                    ? "bg-[var(--surface-2)] text-[var(--ink-strong)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-strong)] hover:bg-[#ece9e0]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

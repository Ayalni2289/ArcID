export type Tld = ".arc" | ".agent" | ".usdc";

export const TLD_OPTIONS: Tld[] = [".arc", ".agent", ".usdc"];

export const TLD_DESCRIPTIONS: Record<Tld, string> = {
  ".arc": "The flagship Arc Network identity",
  ".agent": "For AI agents & autonomous programs",
  ".usdc": "For financial apps & payment flows",
};

export const TLD_COLORS: Record<Tld, { bg: string; text: string; border: string }> = {
  ".arc": { bg: "rgba(7,53,44,0.1)", text: "#17362c", border: "rgba(7,53,44,0.28)" },
  ".agent": { bg: "rgba(78,101,72,0.12)", text: "#4e6548", border: "rgba(78,101,72,0.28)" },
  ".usdc": { bg: "rgba(198,184,121,0.2)", text: "#5f5734", border: "rgba(168,150,95,0.34)" },
};

/** Annual price in USDC cents based on name length */
export function getAnnualPriceUSDC(label: string): number {
  const len = label.length;
  if (len <= 3) return 20;
  if (len === 4) return 5;
  return 1;
}

/** Total price for N years */
export function getTotalPrice(label: string, years: number): number {
  return getAnnualPriceUSDC(label) * years;
}

/** Validate label (before the TLD) */
export function validateLabel(label: string): { valid: boolean; error?: string } {
  if (!label) return { valid: false, error: "Enter a name" };
  if (label.length < 1) return { valid: false, error: "Too short" };
  if (label.length > 63) return { valid: false, error: "Max 63 characters" };
  if (!/^[a-z0-9-]+$/.test(label))
    return { valid: false, error: "Only lowercase letters, numbers, hyphens" };
  if (label.startsWith("-") || label.endsWith("-"))
    return { valid: false, error: "Cannot start or end with a hyphen" };
  return { valid: true };
}

/** Format wallet address short */
export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format expiry timestamp to human-readable */
export function formatExpiry(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Days until expiry */
export function daysUntilExpiry(timestamp: bigint): number {
  const now = Date.now();
  const expiry = Number(timestamp) * 1000;
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

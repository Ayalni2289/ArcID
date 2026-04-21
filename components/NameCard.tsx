"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink, AlertTriangle, Fuel } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { type Tld, TLD_COLORS, getAnnualPriceUSDC, getTotalPrice, shortAddress } from "@/lib/utils";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS } from "@/lib/arcChain";

interface NameCardProps {
  label: string;
  tld: Tld;
  available: boolean | null;
  owner?: string;
  expiryTimestamp?: bigint;
}

const FAUCET_URL = "https://faucet.circle.com/";
const GAS_FEE = 0.01; // $0.01 USDC

export default function NameCard({ label, tld, available, owner, expiryTimestamp }: NameCardProps) {
  const [years, setYears] = useState(1);
  const [registered, setRegistered] = useState(false);

  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Read user's native USDC balance on Arc
  const { data: balanceData } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const colors = TLD_COLORS[tld];
  const pricePerYear = getAnnualPriceUSDC(label);
  const registrationCost = getTotalPrice(label, years);
  const totalRequired = registrationCost + GAS_FEE; // registration + gas
  const fullName = `${label}${tld}`;

  // Calculate balance in USDC (18 decimals on Arc native)
  const balanceUSDC = balanceData
    ? parseFloat(formatEther(balanceData.value))
    : null;

  const hasEnoughBalance = balanceUSDC !== null && balanceUSDC >= totalRequired;
  const isBalanceLoading = isConnected && balanceUSDC === null;

  // How much is missing
  const shortfall = balanceUSDC !== null
    ? Math.max(0, totalRequired - balanceUSDC).toFixed(2)
    : null;

  const handleRegister = () => {
    if (!isConnected || !address || !hasEnoughBalance) return;
    const value = parseEther(registrationCost.toString());
    writeContract({
      address: ANS_CONTRACT_ADDRESS,
      abi: ANS_ABI,
      functionName: "register",
      args: [fullName, address, BigInt(years)],
      value,
    });
  };

  if (isSuccess && !registered) setRegistered(true);

  // Determine button state
  const getButtonState = () => {
    if (!isConnected) return "not_connected";
    if (isBalanceLoading) return "loading_balance";
    if (!hasEnoughBalance) return "insufficient";
    if (isPending) return "pending";
    if (isMining) return "mining";
    return "ready";
  };

  const btnState = getButtonState();

  return (
    <div
      className="rounded-2xl border bg-[var(--surface-1)] transition-all"
      style={{ borderColor: registered ? "rgba(52,211,153,0.4)" : colors.border }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-0.5 whitespace-nowrap">
              <span className="text-xl font-semibold text-[var(--ink-strong)]">{label}</span>
              <span className="text-xl font-medium" style={{ color: colors.text }}>{tld}</span>
            </div>
            {owner && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5 break-all">
                Owned by{" "}
                <a
                  href={`https://testnet.arcscan.app/address/${owner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--ink-strong)] transition-colors inline-flex items-center gap-0.5"
                >
                  {shortAddress(owner)}
                  <ExternalLink size={10} />
                </a>
              </p>
            )}
          </div>

          {/* Status badge */}
          <div className="shrink-0 self-start">
            {available === null ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-muted)] text-xs border border-[var(--line)]">
                <Loader2 size={12} className="animate-spin" />
                Checking
              </div>
            ) : available || registered ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "0.5px solid rgba(52,211,153,0.25)" }}
              >
                <CheckCircle size={12} />
                {registered ? "Registered!" : "Available"}
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "0.5px solid rgba(239,68,68,0.2)" }}
              >
                <XCircle size={12} />
                Taken
              </div>
            )}
          </div>
        </div>

        {/* Pricing row */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="text-[var(--ink-muted)]">
            <span className="text-[#7d8b7a] text-xs">from </span>
            <span className="text-[var(--ink-strong)] font-semibold">${pricePerYear}</span>
            <span className="text-[#7d8b7a] text-xs"> USDC / yr</span>
          </div>
          {available && !registered && (
            <div className="text-xs" style={{ color: colors.text }}>
              Total: <span className="font-semibold">${registrationCost} USDC</span>
            </div>
          )}
        </div>

        {/* Register UI */}
        {(available || registered) && (
          <>
            {!registered ? (
              <div className="space-y-3">
                {/* Duration selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--ink-muted)]">Duration</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[1, 2, 3, 5].map((y) => (
                      <button
                        key={y}
                        onClick={() => setYears(y)}
                        className="px-2.5 py-1 rounded-lg text-xs transition-all"
                        style={
                          years === y
                            ? { background: colors.bg, color: colors.text, border: `0.5px solid ${colors.border}` }
                            : { background: "rgba(78,101,72,0.08)", color: "#6f7c6c" }
                        }
                      >
                        {y}yr
                      </button>
                    ))}
                  </div>
                </div>

                {/* Balance indicator */}
                {isConnected && balanceUSDC !== null && (
                  <div
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: hasEnoughBalance
                        ? "rgba(52,211,153,0.06)"
                        : "rgba(251,191,36,0.06)",
                      border: `0.5px solid ${hasEnoughBalance
                        ? "rgba(52,211,153,0.2)"
                        : "rgba(251,191,36,0.2)"}`,
                    }}
                  >
                    <span className="text-[var(--ink-muted)] flex items-center gap-1.5 min-w-0">
                      <Fuel size={11} />
                      Wallet balance
                    </span>
                    <span
                      className="font-semibold shrink-0"
                      style={{ color: hasEnoughBalance ? "#34d399" : "#fb6c24" }}
                    >
                      {balanceUSDC.toFixed(2)} USDC
                    </span>
                  </div>
                )}

                {/* Insufficient balance warning + faucet CTA */}
                {isConnected && balanceUSDC !== null && !hasEnoughBalance && (
                  <div
                    className="rounded-xl p-3 space-y-2"
                    style={{
                      background: "rgba(251,191,36,0.07)",
                      border: "0.5px solid rgba(251,191,36,0.25)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-black leading-relaxed break-words">
                        You need <span className="font-semibold text-red-500">${totalRequired.toFixed(2)} USDC</span> for this name.
                        You are short by <span className="font-semibold text-red-500">${shortfall}</span>.
                      </p>
                    </div>
                    <a
                      href={FAUCET_URL}
                      target="_blank"
                      rel="noreferrer"
                      // hover:scale-[1.02] üzerine gelince %2 büyütür, active:scale-95 tıklayınca küçültür
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "rgba(251,191,36,0.15)",
                        color: "#000000",
                        border: "0.5px solid rgba(251,191,36,0.3)",
                        // Pulse animasyonunu buradan kaldırdık
                      }}
                    >
                      Get testnet USDC - faucet.circle.com
                      <ExternalLink size={10} />
                    </a>
                    <p className="text-center text-xs" style={{ color: "rgba(0, 0, 0, 0.5)" }}>
                      Network: Arc Testnet · 20 USDC / 2 hours
                    </p>
                  </div>
                )}

                {/* Main register button */}
                <button
                  onClick={handleRegister}
                  disabled={btnState !== "ready"}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed px-3 text-center break-words"
                  style={{ background: "#17362c" }}
                >
                  {btnState === "not_connected" && "Connect wallet"}
                  {btnState === "loading_balance" && (
                    <><Loader2 size={14} className="animate-spin" /> Checking balance...</>
                  )}
                  {btnState === "insufficient" && (
                    <><AlertTriangle size={14} /> Insufficient balance</>
                  )}
                  {btnState === "pending" && (
                    <><Loader2 size={14} className="animate-spin" /> Confirm in wallet...</>
                  )}
                  {btnState === "mining" && (
                    <><Loader2 size={14} className="animate-spin" /> Confirming on Arc...</>
                  )}
                  {btnState === "ready" && `Register for $${registrationCost} USDC`}
                </button>

                {/* Cost breakdown */}
                <div className="flex flex-wrap justify-between gap-1 text-xs text-[var(--ink-muted)] px-0.5">
                  <span className="break-words">Registration: ${registrationCost} + Gas: $0.01</span>
                  <span className="shrink-0">Total: ${totalRequired.toFixed(2)} USDC</span>
                </div>

                {/* Write error */}
                {writeError && (
                  <p className="text-xs text-red-400 text-center break-words">
                    {writeError.message.includes("insufficient")
                      ? "Insufficient balance - get USDC from the faucet"
                      : writeError.message.slice(0, 80)}
                  </p>
                )}
              </div>
            ) : (
              /* Success state */
              <div className="text-center py-3 space-y-1.5">
                <p className="text-sm text-[var(--ink-strong)]">
                  🎉 <span className="font-medium break-all">{fullName}</span> is now yours!
                </p>
                {txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs inline-flex items-center gap-1 transition-colors"
                    style={{ color: "#4e6548" }}
                  >
                    View on ArcScan <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {/* Taken state — show expiry */}
        {!available && !registered && expiryTimestamp && (
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Expires {new Date(Number(expiryTimestamp) * 1000).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

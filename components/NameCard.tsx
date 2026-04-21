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
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-semibold text-[var(--ink-strong)]">{label}</span>
              <span className="text-xl font-medium" style={{ color: colors.text }}>{tld}</span>
            </div>
            {owner && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
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
          <div className="shrink-0">
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
                  <div className="flex items-center gap-1">
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
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: hasEnoughBalance
                        ? "rgba(52,211,153,0.06)"
                        : "rgba(251,191,36,0.06)",
                      border: `0.5px solid ${hasEnoughBalance
                        ? "rgba(52,211,153,0.2)"
                        : "rgba(251,191,36,0.2)"}`,
                    }}
                  >
                    <span className="text-[var(--ink-muted)] flex items-center gap-1.5">
                      <Fuel size={11} />
                      Cüzdan bakiyesi
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: hasEnoughBalance ? "#34d399" : "#fbbf24" }}
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
                      <p className="text-xs text-amber-300 leading-relaxed">
                        Bu isim için <span className="font-semibold">${totalRequired.toFixed(2)} USDC</span> gerekiyor.
                        Bakiyende <span className="font-semibold">${shortfall}</span> eksik.
                      </p>
                    </div>
                    <a
                      href={FAUCET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: "rgba(251,191,36,0.15)",
                        color: "#fbbf24",
                        border: "0.5px solid rgba(251,191,36,0.3)",
                      }}
                    >
                      Testnet USDC al → faucet.circle.com
                      <ExternalLink size={10} />
                    </a>
                    <p className="text-center text-xs" style={{ color: "rgba(251,191,36,0.5)" }}>
                      Network: Arc Testnet · 20 USDC / 2 saat
                    </p>
                  </div>
                )}

                {/* Main register button */}
                <button
                  onClick={handleRegister}
                  disabled={btnState !== "ready"}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#17362c" }}
                >
                  {btnState === "not_connected" && "Cüzdan bağla"}
                  {btnState === "loading_balance" && (
                    <><Loader2 size={14} className="animate-spin" /> Bakiye kontrol ediliyor…</>
                  )}
                  {btnState === "insufficient" && (
                    <><AlertTriangle size={14} /> Yetersiz bakiye</>
                  )}
                  {btnState === "pending" && (
                    <><Loader2 size={14} className="animate-spin" /> Cüzdanda onayla…</>
                  )}
                  {btnState === "mining" && (
                    <><Loader2 size={14} className="animate-spin" /> Arc&apos;ta onaylanıyor…</>
                  )}
                  {btnState === "ready" && `Register for $${registrationCost} USDC`}
                </button>

                {/* Cost breakdown */}
                <div className="flex justify-between text-xs text-[var(--ink-muted)] px-0.5">
                  <span>Registration: ${registrationCost} + Gas: $0.01</span>
                  <span>Toplam: ${totalRequired.toFixed(2)} USDC</span>
                </div>

                {/* Write error */}
                {writeError && (
                  <p className="text-xs text-red-400 text-center">
                    {writeError.message.includes("insufficient")
                      ? "Yetersiz bakiye — faucet'ten USDC al"
                      : writeError.message.slice(0, 80)}
                  </p>
                )}
              </div>
            ) : (
              /* Success state */
              <div className="text-center py-3 space-y-1.5">
                <p className="text-sm text-[var(--ink-strong)]">
                  🎉 <span className="font-medium">{fullName}</span> artık senin!
                </p>
                {txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs inline-flex items-center gap-1 transition-colors"
                    style={{ color: "#4e6548" }}
                  >
                    ArcScan&apos;da görüntüle <ExternalLink size={10} />
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

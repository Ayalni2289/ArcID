"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Navbar from "@/components/Navbar";
import { ANS_ABI } from "@/lib/ansAbi";
import { ANS_CONTRACT_ADDRESS, USDC_ADDRESS } from "@/lib/arcChain";
import { validateLabel } from "@/lib/utils";
import { ArrowRight, Loader2, CheckCircle, ExternalLink } from "lucide-react";

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type Step = "input" | "resolving" | "confirm" | "sending" | "done";

export default function SendPage() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (isMining && step === "sending") setStep("done");

  const isArcName = (r: string) => /\.(arc|agent|usdc)$/.test(r.toLowerCase());
  const isAddress = (r: string) => /^0x[0-9a-fA-F]{40}$/.test(r);

  const handleResolve = async () => {
    setError("");
    if (!recipient || !amount) { setError("Fill in recipient and amount"); return; }
    if (parseFloat(amount) <= 0) { setError("Amount must be greater than 0"); return; }

    if (isArcName(recipient)) {
      setStep("resolving");
      // Demo: simulate resolution
      await new Promise(r => setTimeout(r, 800));
      const mockAddr = "0x3f" + Array.from({length:38}, () => Math.floor(Math.random()*16).toString(16)).join("");
      setResolvedAddress(mockAddr);
      setStep("confirm");
    } else if (isAddress(recipient)) {
      setResolvedAddress(recipient);
      setStep("confirm");
    } else {
      setError("Enter a valid .arc name or 0x address");
    }
  };

  const handleSend = () => {
    if (!resolvedAddress) return;
    setStep("sending");
    // Send USDC via ERC-20 transfer
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [resolvedAddress as `0x${string}`, parseUnits(amount, 6)],
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--ink-strong)] mb-2">Send USDC</h1>
            <p className="text-[var(--ink-muted)] text-sm mb-6">Connect your wallet to send USDC</p>
            <ConnectButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-[var(--ink-strong)] mb-1">Send USDC</h1>
          <p className="text-[var(--ink-muted)] text-sm mb-8">Use an Arc name or wallet address</p>

          <div className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-6 space-y-4">
            {/* Recipient */}
            <div>
              <label className="text-xs text-[var(--ink-muted)] uppercase tracking-widest block mb-2">To</label>
              <input
                type="text"
                value={recipient}
                onChange={e => { setRecipient(e.target.value); setStep("input"); setResolvedAddress(null); }}
                placeholder="alice.arc or 0x..."
                disabled={step !== "input"}
                className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink-strong)] placeholder-[#8a9586] focus:outline-none focus:border-[var(--accent-deep)] transition-colors disabled:opacity-50 font-mono"
              />
              {/* Resolution badge */}
              {resolvedAddress && step !== "input" && (
                <div className="mt-2 px-3 py-1.5 bg-[#34d399]/10 border border-[#34d399]/20 rounded-lg flex items-center gap-2 text-xs text-[#34d399]">
                  <CheckCircle size={12} />
                  Resolved → <span className="font-mono">{resolvedAddress.slice(0,8)}…{resolvedAddress.slice(-6)}</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-[var(--ink-muted)] uppercase tracking-widest block mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={step !== "input"}
                  className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink-strong)] placeholder-[#8a9586] focus:outline-none focus:border-[var(--accent-deep)] transition-colors disabled:opacity-50"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--ink-muted)]">USDC</div>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {/* Gas info */}
            <div className="flex justify-between text-xs text-[var(--ink-muted)] border-t border-[var(--line)] pt-3">
              <span>Network fee</span>
              <span className="text-[var(--ink-strong)]">$0.01 USDC · Arc Network</span>
            </div>

            {/* CTA */}
            {step === "input" && (
              <button onClick={handleResolve} className="w-full bg-[var(--ink-strong)] hover:bg-[#25473a] text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                Continue <ArrowRight size={14} />
              </button>
            )}

            {step === "resolving" && (
              <button disabled className="w-full bg-[var(--ink-strong)]/50 text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Resolving name…
              </button>
            )}

            {step === "confirm" && (
              <div className="space-y-3">
                <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-xl p-4 text-sm">
                  <div className="flex justify-between text-[var(--ink-muted)] mb-1.5">
                    <span>Sending</span>
                    <span className="text-[var(--ink-strong)] font-semibold">{amount} USDC</span>
                  </div>
                  <div className="flex justify-between text-[var(--ink-muted)] mb-1.5">
                    <span>To</span>
                    <span className="text-[var(--ink-strong)] font-mono text-xs">{recipient}</span>
                  </div>
                  <div className="flex justify-between text-[var(--ink-muted)]">
                    <span>Fee</span>
                    <span className="text-[var(--ink-strong)]">$0.01 USDC</span>
                  </div>
                </div>
                <button onClick={handleSend} className="w-full bg-[var(--ink-strong)] hover:bg-[#25473a] text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  Confirm & Send
                </button>
                <button onClick={() => { setStep("input"); setResolvedAddress(null); }} className="w-full text-[var(--ink-muted)] hover:text-[var(--ink-strong)] text-sm py-1 transition-colors">
                  Cancel
                </button>
              </div>
            )}

            {(step === "sending" || (step === "done" && !isSuccess)) && (
              <button disabled className="w-full bg-[var(--ink-strong)]/50 text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {isPending ? "Confirm in wallet…" : "Confirming on Arc…"}
              </button>
            )}

            {isSuccess && (
              <div className="text-center py-2">
                <p className="text-[#34d399] text-sm font-medium mb-1">✓ Sent successfully</p>
                {txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noreferrer"
                    className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors inline-flex items-center gap-1">
                    View on ArcScan <ExternalLink size={10} />
                  </a>
                )}
                <button onClick={() => { setStep("input"); setRecipient(""); setAmount(""); setResolvedAddress(null); }}
                  className="block mx-auto mt-3 text-xs text-[var(--accent-deep)] hover:underline">
                  Send another
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

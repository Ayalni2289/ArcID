import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import { TLD_OPTIONS, TLD_COLORS, TLD_DESCRIPTIONS } from "@/lib/utils";

const EXAMPLE_NAMES = ["alice.arc", "mybot.agent", "treasury.usdc", "dao.arc", "gpt5.agent", "payments.usdc"];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f2f0e9] via-[var(--bg-base)] to-[#dddacf]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 relative overflow-hidden">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[680px] h-[320px] bg-[#4e6548]/20 blur-[120px] pointer-events-none rounded-full" />
        <div className="relative w-full max-w-2xl text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--ink-muted)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-deep)] animate-pulse inline-block" />
            Powered by Arc Network · $0.01 USDC gas
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--ink-strong)] mb-4 leading-tight tracking-tight">
            Your name,<br /><span className="text-[var(--accent-deep)]">on Arc</span>
          </h1>
          <p className="text-[var(--ink-muted)] text-lg leading-relaxed max-w-lg mx-auto">
            Register human-readable{" "}
            <code className="text-[var(--ink-strong)] font-mono text-sm">.arc</code>{" "}
            <code className="text-[var(--ink-muted)] font-mono text-sm">.agent</code>{" "}
            <code className="text-[#6f663f] font-mono text-sm">.usdc</code>{" "}
            names. Powered by USDC. Settled in under a second.
          </p>
        </div>
        <div className="w-full max-w-xl mb-16 relative">
          <SearchBar size="lg" autoFocus />
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-16 text-xs">
          {[{chars:"1–3 chars",price:"$20/yr",example:"abc.arc"},{chars:"4 chars",price:"$5/yr",example:"name.arc"},{chars:"5+ chars",price:"$1/yr",example:"myname.arc"}].map(p=>(
            <div key={p.chars} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-muted)]">
              <span className="text-[#70816c]">{p.chars}</span>
              <span className="text-[var(--ink-strong)] font-medium">{p.price}</span>
              <span className="text-[var(--accent-deep)] font-mono">{p.example}</span>
            </div>
          ))}
        </div>
        <div className="w-full max-w-3xl mb-16">
          <h2 className="text-center text-xs font-medium text-[#7a786d] uppercase tracking-widest mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{step:"01",title:"Search",desc:"Find your perfect name across all Arc TLDs instantly."},{step:"02",title:"Register",desc:"Pay with USDC — the native gas token on Arc Network."},{step:"03",title:"Use",desc:"Send, receive, and identify with your human-readable name."}].map(item=>(
              <div key={item.step} className="bg-[var(--surface-1)] border border-[var(--line)] rounded-2xl p-5">
                <div className="text-2xl font-semibold text-[var(--accent-deep)] mb-3 font-mono">{item.step}</div>
                <div className="font-medium text-[var(--ink-strong)] mb-1.5">{item.title}</div>
                <div className="text-sm text-[var(--ink-muted)] leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-3xl mb-16">
          <h2 className="text-center text-xs font-medium text-[#7a786d] uppercase tracking-widest mb-8">Available TLDs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TLD_OPTIONS.map(tld=>{const c=TLD_COLORS[tld];return(
              <div key={tld} className="rounded-2xl p-5 border" style={{background:c.bg,borderColor:c.border}}>
                <div className="text-xl font-semibold mb-1" style={{color:c.text}}>{tld}</div>
                <p className="text-sm text-[var(--ink-muted)]">{TLD_DESCRIPTIONS[tld]}</p>
              </div>
            )})}
          </div>
        </div>
        <div className="w-full max-w-3xl overflow-hidden mb-16">
          <h2 className="text-center text-xs font-medium text-[#7a786d] uppercase tracking-widest mb-6">Examples</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLE_NAMES.map(name=>{const tld=("."+name.split(".")[1]) as keyof typeof TLD_COLORS;const c=TLD_COLORS[tld];return(
              <span key={name} className="px-3 py-1.5 rounded-full text-sm font-mono" style={{background:c.bg,color:c.text,border:`0.5px solid ${c.border}`}}>{name}</span>
            )})}
          </div>
        </div>
        <div className="w-full max-w-3xl bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-8">
          <div className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-widest mb-3">For AI Agents</div>
          <h3 className="text-xl font-semibold text-[var(--ink-strong)] mb-2">Your agent needs an identity too</h3>
          <p className="text-[var(--ink-muted)] text-sm leading-relaxed mb-6">AI agents can register <code className="text-[var(--ink-strong)] font-mono">.agent</code> domains autonomously via the API. No frontend, no human in the loop.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {[{n:"01 · Check",c:"GET /api/ans/check/myagent"},{n:"02 · Register",c:"POST /api/ans/register"},{n:"03 · Resolve",c:"GET /api/ans/resolve/myagent"}].map(x=>(
              <div key={x.n} className="bg-[var(--surface-1)] rounded-xl p-3 text-[var(--ink-muted)]"><div className="text-[var(--accent-deep)] mb-1">{x.n}</div>{x.c}</div>
            ))}
          </div>
        </div>
      </main>
      <footer className="border-t border-[var(--line)] py-8 text-center text-xs text-[var(--ink-muted)] bg-[var(--surface-2)]/80">
        <p>ArcID · Arc Name Service · Built on <a href="https://arc.network" className="hover:text-[var(--ink-strong)] transition-colors">Arc Network</a></p>
        <p className="mt-1">Chain ID 5042002 · USDC native gas · &lt;1s finality</p>
        <p className="mt-2">
          Creator: <a href="https://x.com/0xAliBuilds" target="_blank" rel="noreferrer" className="hover:text-[var(--ink-strong)] transition-colors">@0xAliBuilds</a>
        </p>
      </footer>
    </div>
  );
}

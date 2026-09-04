import { Link } from "wouter";
import { ArrowRight, ChevronRight, Gauge, Layers3, Library, Target, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="engine-logo-mark grid h-7 w-7 place-items-center rounded-sm text-xs font-bold border border-primary/50 text-primary">S</span>
            <span className="text-[13px] font-semibold uppercase tracking-[.16em]">
              Startup <span className="text-primary">Man</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[.08em] sm:inline-flex">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-3 text-[11px] font-semibold uppercase tracking-[.06em] text-primary-foreground hover:bg-primary/90 transition-colors sm:px-4 sm:text-xs sm:tracking-[.08em]">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 pt-24 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-border/50 bg-noisy min-h-[70vh] flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[.1em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              The Professional Studio
            </div>
            
            <h1 className="mb-8 font-sans text-5xl font-semibold tracking-tight text-foreground sm:text-7xl leading-[1.1]">
              Turn lived experience into <span className="text-primary">intellectual property.</span>
            </h1>
            
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Startup Man is a serious mastery studio for coaches. Every client interaction, moment of resistance, and hard-won lesson is systematically extracted into your proprietary methodology, proof, and authority.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-primary px-8 text-sm font-bold uppercase tracking-[.1em] text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto">
                Enter the Studio <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-border bg-card px-8 text-sm font-semibold uppercase tracking-[.1em] text-foreground hover:border-primary/50 transition-colors w-full sm:w-auto">
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="relative z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/50 pt-12">
            {[
              { label: "EXPERIENCE", text: "Capture the raw reality of your coaching practice." },
              { label: "EXPERTISE", text: "Extract repeatable principles and frameworks." },
              { label: "IP & ASSETS", text: "Generate courses, content, and undeniable proof." }
            ].map((step, i, arr) => (
              <div key={step.label} className="relative flex flex-col">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary">0{i + 1}</div>
                <div className="mb-3 font-mono text-sm font-medium tracking-wide text-foreground uppercase">{step.label}</div>
                <p className="text-sm text-muted-foreground">{step.text}</p>
                {i < arr.length - 1 && (
                  <ChevronRight className="absolute -right-5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/30 md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* The System Section */}
        <section className="border-b border-t border-border bg-card px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16">
              <h2 className="engine-section-title mb-4">Core Engines</h2>
              <p className="max-w-2xl text-muted-foreground">The architecture of your practice. Four interconnected systems that ensure your coaching never remains just a temporary conversation.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="engine-card group p-6 flex flex-col items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">Practice Simulator</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">Train against AI-simulated client resistance before you face it in real life. Measure your interventions.</p>
                </div>
              </div>

              <div className="engine-card group p-6 flex flex-col items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Library className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">Knowledge Vault</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">A disciplined ledger of your coaching reality. Document sessions, insights, and turning points.</p>
                </div>
              </div>

              <div className="engine-card group p-6 flex flex-col items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">Methodology Builder</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">Automatically distill recurring insights into signature frameworks. Stop borrowing other people's methods.</p>
                </div>
              </div>

              <div className="engine-card group p-6 flex flex-col items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-sm bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">IP Generation</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">Turn validated frameworks into workshop curriculum, course modules, and authority-building content.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence & Authority */}
        <section className="px-4 py-24 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-border/50">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-secondary bg-secondary/50 px-3 py-1 text-xs font-medium uppercase tracking-[.1em] text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Safeguards
              </div>
              <h2 className="engine-section-title mb-6 leading-tight">Evidence precedes authority.</h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                The internet is saturated with generic coaching advice. Startup Man enforces a strict lineage: you cannot generate a framework without linking it to a documented lived experience. You cannot claim an outcome without logging the proof.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Traceability: Every IP asset maps back to real client sessions.",
                  "Proof Bank: Correlate outcomes with specific framework applications.",
                  "Coach Passport: A portable, verified identity of your accumulated mastery."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="engine-card relative overflow-hidden bg-card/50 p-8 before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] before:opacity-50">
                <div className="relative z-10 space-y-6">
                  <div className="border-b border-border/50 pb-4">
                    <div className="engine-kicker mb-1">Source Material</div>
                    <div className="font-mono text-sm font-medium text-foreground">Client avoided confronting VP of Sales</div>
                    <div className="text-xs text-muted-foreground mt-1">Experience #142</div>
                  </div>
                  <div className="flex justify-center text-primary/50 py-2">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>
                  <div className="border-b border-border/50 pb-4">
                    <div className="engine-kicker mb-1">Extracted Principle</div>
                    <div className="font-mono text-sm font-medium text-foreground">Conflict avoidance is a crisis of clarity, not courage.</div>
                  </div>
                  <div className="flex justify-center text-primary/50 py-2">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>
                  <div>
                    <div className="engine-kicker mb-1 text-primary">Generated IP</div>
                    <div className="font-mono text-sm font-medium text-primary">The Conflict Clarity Matrix (Framework)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 font-sans text-3xl font-semibold tracking-tight sm:text-5xl">
              Stop coaching from memory.
            </h2>
            <p className="mb-10 text-lg text-muted-foreground">
              Your methodology is waiting to be built. Start documenting your practice today.
            </p>
            <Link href="/sign-up" className="inline-flex h-14 items-center justify-center gap-2 rounded-sm bg-primary px-10 text-sm font-bold uppercase tracking-[.1em] text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(201,168,78,0.3)]">
              Start Your Engine
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background py-10 text-center">
        <div className="text-xs font-medium uppercase tracking-[.15em] text-muted-foreground/60">
          © {new Date().getFullYear()} Startup Man. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

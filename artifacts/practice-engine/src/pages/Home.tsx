import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Gauge, Layers3, Library, Target, Sparkles, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative px-4 pt-24 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-border/50 min-h-[85vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[.15em] text-primary backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            The Professional Studio
          </motion.div>

          <motion.h1 variants={fadeUp} className="mb-8 font-sans text-5xl font-semibold tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem] leading-[1.05]">
            Turn lived experience into <br className="hidden md:block" />
            <span className="text-primary italic font-serif">intellectual property.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl font-light">
            Startup Man is a serious mastery studio for coaches. Every client interaction, moment of resistance, and hard-won lesson is systematically extracted into your proprietary methodology, proof, and authority.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start gap-5">
            <Link href="/sign-up" className="inline-flex h-14 items-center justify-center gap-2 rounded-sm bg-primary px-8 text-xs font-bold uppercase tracking-[.15em] text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-[0_0_25px_rgba(201,168,78,0.2)] w-full sm:w-auto" data-testid="button-hero-cta">
              Enter the Studio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="inline-flex h-14 items-center justify-center gap-2 rounded-sm border border-border/80 bg-background/50 backdrop-blur-sm px-8 text-xs font-semibold uppercase tracking-[.15em] text-foreground hover:border-primary/50 hover:bg-card transition-colors w-full sm:w-auto" data-testid="button-hero-secondary">
              See the System
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative z-10 mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border/50 pt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {[
            { label: "EXPERIENCE", text: "Capture the raw reality of your coaching practice in a secure vault." },
            { label: "EXPERTISE", text: "Extract repeatable principles and frameworks from chaotic sessions." },
            { label: "IP & ASSETS", text: "Generate courses, content, and undeniable proof of competence." }
          ].map((step, i, arr) => (
            <motion.div key={step.label} variants={fadeUp} className="relative flex flex-col group">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[.25em] text-primary/70 group-hover:text-primary transition-colors">Phase 0{i + 1}</div>
              <div className="mb-3 font-mono text-base font-medium tracking-wider text-foreground uppercase">{step.label}</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              {i < arr.length - 1 && (
                <ChevronRight className="absolute -right-6 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-border md:block" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* The System Section */}
      <section className="border-y border-border bg-card/40 relative">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
        <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <motion.div
            className="mb-20 md:flex justify-between items-end gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="max-w-2xl">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-[.25em] text-primary">Architecture</div>
              <h2 className="engine-section-title leading-tight mb-6">Four Core Engines</h2>
              <p className="text-lg text-muted-foreground/90 font-light leading-relaxed">
                The operating system for a world-class coaching practice. Connected tools that ensure your impact compounds instead of fading after the call ends.
              </p>
            </div>
            <div className="hidden md:block">
              <Link href="/services" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.1em] text-primary hover:text-primary/80 transition-colors">
                View All Capabilities <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { icon: Target, title: "Practice Simulator", desc: "Train against AI-simulated client resistance before you face it. Measure your interventions." },
              { icon: Library, title: "Knowledge Vault", desc: "A disciplined ledger of your coaching reality. Document sessions, insights, and turning points." },
              { icon: Layers3, title: "Methodology Builder", desc: "Automatically distill recurring insights into signature frameworks. Stop borrowing methods." },
              { icon: Sparkles, title: "IP Generation", desc: "Turn validated frameworks into workshop curriculum, course modules, and authority content." }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/50 p-8 hover:border-primary/40 hover:bg-card transition-all duration-300">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-card border border-border shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors text-muted-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/80">{feature.desc}</p>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Evidence & Authority */}
      <section className="px-4 py-32 sm:px-6 lg:px-8 max-w-7xl mx-auto border-x border-border/50">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-sm border border-secondary bg-secondary/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Immutable Standard
            </motion.div>
            <motion.h2 variants={fadeUp} className="engine-section-title mb-6 leading-[1.15]">Evidence precedes <br/>authority.</motion.h2>
            <motion.p variants={fadeUp} className="mb-10 text-lg leading-relaxed text-muted-foreground font-light">
              The internet is saturated with generic coaching advice. Startup Man enforces a strict lineage: you cannot generate a framework without linking it to a documented lived experience. You cannot claim an outcome without logging the proof.
            </motion.p>

            <motion.ul variants={staggerContainer} className="space-y-6">
              {[
                { title: "Traceability", desc: "Every intellectual property asset mathematically maps back to real, documented client sessions." },
                { title: "Proof Bank", desc: "Correlate profound outcomes with specific framework applications over time." },
                { title: "Coach Passport", desc: "A portable, verified, public identity of your accumulated mastery and reps." }
              ].map((item, i) => (
                <motion.li key={i} variants={fadeUp} className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary">
                    0{i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">{item.title}</div>
                    <div className="text-sm text-muted-foreground/80 leading-relaxed">{item.desc}</div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            className="relative lg:ml-10"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-transparent to-transparent blur-2xl -z-10 rounded-full" />
            <div className="engine-card relative overflow-hidden rounded-xl border border-border/80 bg-[#101419] p-10 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="relative z-10 space-y-8">
                <div className="border-b border-border/50 pb-6 relative">
                  <div className="absolute -left-10 top-2 h-px w-6 bg-border/50" />
                  <div className="engine-kicker mb-2 text-muted-foreground/60">Source Material</div>
                  <div className="font-mono text-sm leading-relaxed text-foreground/90">Client aggressively avoided confronting VP of Sales regarding Q3 pipeline miss. Attempted to solve via tooling instead of direct feedback.</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-3">Experience Log #142</div>
                </div>

                <div className="flex justify-center -my-3 relative z-20">
                  <div className="bg-[#101419] p-2 rounded-full border border-border/50">
                    <ArrowRight className="h-4 w-4 rotate-90 text-primary/70" />
                  </div>
                </div>

                <div className="border-b border-border/50 pb-6 relative">
                  <div className="absolute -left-10 top-2 h-px w-6 bg-border/50" />
                  <div className="engine-kicker mb-2 text-primary/70">Extracted Principle</div>
                  <div className="font-sans text-lg font-medium text-foreground leading-snug">"Conflict avoidance manifests as a crisis of operational clarity, not courage."</div>
                </div>

                <div className="flex justify-center -my-3 relative z-20">
                  <div className="bg-[#101419] p-2 rounded-full border border-border/50">
                    <ArrowRight className="h-4 w-4 rotate-90 text-primary/70" />
                  </div>
                </div>

                <div className="relative bg-primary/5 -mx-4 -mb-4 rounded-lg p-6 border border-primary/20">
                  <div className="engine-kicker mb-2 text-primary">Generated Asset</div>
                  <div className="font-mono text-sm font-semibold text-primary/90 flex items-center gap-3">
                    <Layers3 className="h-4 w-4" /> The Conflict Clarity Matrix
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Framework • Version 1.0</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80" />

        <motion.div
          className="relative mx-auto max-w-4xl px-4 py-32 text-center sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <span className="font-serif italic text-xl">S</span>
          </div>
          <h2 className="mb-8 font-sans text-4xl font-semibold tracking-tight sm:text-6xl leading-tight">
            Stop coaching <br className="hidden sm:block"/> from memory.
          </h2>
          <p className="mb-12 text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            Your proprietary methodology is waiting to be built. Begin documenting your practice, extracting principles, and scaling your authority today.
          </p>
          <Link href="/sign-up" className="inline-flex h-16 items-center justify-center gap-3 rounded-sm bg-primary px-12 text-sm font-bold uppercase tracking-[.15em] text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(201,168,78,0.25)]" data-testid="button-bottom-cta">
            Start Your Engine <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>
    </>
  );
}
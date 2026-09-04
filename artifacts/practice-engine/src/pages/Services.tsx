import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Compass, TestTube, Key, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Services() {
  return (
    <div className="pt-12 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/50 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="max-w-3xl mb-24"
      >
        <div className="mb-6 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          Platform Capabilities
        </div>
        <h1 className="mb-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
          Engineered for <span className="text-primary italic font-serif">mastery.</span>
        </h1>
        <p className="text-xl text-muted-foreground/90 font-light leading-relaxed">
          Startup Man is not a CRM or a billing tool. It is a specialized suite of engines designed exclusively for IP creation and practice mastery.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {[
          {
            icon: Compass,
            title: "Methodology Synthesis",
            desc: "Automatic pattern recognition across your session logs to build your signature coaching models."
          },
          {
            icon: BookOpen,
            title: "Curriculum Export",
            desc: "Convert your validated frameworks instantly into structured course modules and workshop agendas."
          },
          {
            icon: TestTube,
            title: "Practice Simulation",
            desc: "AI-driven client scenarios allowing you to test new interventions before using them live."
          },
          {
            icon: Key,
            title: "Asset Vault",
            desc: "A strictly organized repository of every insight, principle, and tool you've ever created."
          },
          {
            icon: Shield,
            title: "Proof Ledger",
            desc: "Correlate specific frameworks to verified client outcomes, establishing undeniable authority."
          }
        ].map((service, i) => (
          <motion.div key={i} variants={fadeUp} className="group engine-card bg-background/30 p-8 flex flex-col h-full hover:border-primary/40 transition-colors" data-testid={`service-card-${i}`}>
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-card border border-border text-muted-foreground group-hover:text-primary transition-colors">
              <service.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">{service.title}</h3>
            <p className="text-sm text-muted-foreground/80 leading-relaxed font-light mb-6 flex-grow">
              {service.desc}
            </p>
          </motion.div>
        ))}

        <motion.div variants={fadeUp} className="engine-card bg-primary/5 border-primary/20 p-8 flex flex-col h-full justify-center items-start">
          <h3 className="text-xl font-semibold text-foreground mb-3">Ready to build?</h3>
          <p className="text-sm text-muted-foreground/80 mb-6">
            Enter the studio and begin constructing your IP library today.
          </p>
          <Link href="/sign-up" className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-xs font-bold uppercase tracking-[.1em] text-primary-foreground hover:bg-primary/90 transition-colors">
            Create Account <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

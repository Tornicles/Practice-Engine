import { motion } from "framer-motion";
import { ArrowDown, Database, Cpu, Presentation, Workflow } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const steps = [
  {
    icon: Database,
    title: "Phase 1: Experience Capture",
    description: "The foundation of all intellectual property is lived reality. You log client sessions, identifying specific moments of friction, breakthroughs, and tactical advice delivered. This becomes your raw material.",
    kicker: "The Input"
  },
  {
    icon: Cpu,
    title: "Phase 2: Principle Extraction",
    description: "Our extraction engine analyzes your raw session logs. It looks for patterns across multiple clients, distilling your instinctual responses into articulated, repeatable principles.",
    kicker: "The Processing"
  },
  {
    icon: Workflow,
    title: "Phase 3: Framework Assembly",
    description: "Principles are organized into coherent models. What used to be 'just advice you give' becomes a named, structured framework (e.g., The Priority Matrix) that belongs exclusively to your brand.",
    kicker: "The Structure"
  },
  {
    icon: Presentation,
    title: "Phase 4: Asset Generation",
    description: "Validated frameworks are exported into tangible assets: workshop curriculum, book chapters, lead magnets, and diagnostic tools. Your IP is ready for market.",
    kicker: "The Output"
  }
];

export default function HowItWorks() {
  return (
    <div className="pt-12 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/50 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="max-w-3xl mb-24"
      >
        <div className="mb-6 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          Operating Model
        </div>
        <h1 className="mb-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
          The Experience-to-IP <span className="text-primary italic font-serif">Pipeline.</span>
        </h1>
        <p className="text-xl text-muted-foreground/90 font-light leading-relaxed">
          How we systematically convert the chaotic reality of 1:1 coaching into rigorous, scalable intellectual property.
        </p>
      </motion.div>

      <div className="relative max-w-4xl mx-auto">
        <div className="absolute left-[27px] top-0 bottom-0 w-px bg-border/50 hidden md:block" />

        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex flex-col md:flex-row gap-8"
              data-testid={`step-${index + 1}`}
            >
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-card border border-border/80 shadow-xl group">
                <step.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </div>

              <div className="flex-1 engine-card bg-background/40 p-8 pt-7">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {step.kicker}
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground/90 leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <ArrowDown className="h-6 w-6 text-primary/50 mx-auto animate-bounce" />
        </motion.div>
      </div>
    </div>
  );
}

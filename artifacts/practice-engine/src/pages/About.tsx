import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function About() {
  return (
    <div className="pt-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/50 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="max-w-3xl"
      >
        <div className="mb-6 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          Company Philosophy
        </div>
        <h1 className="mb-8 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
          We believe coaching should be an <span className="text-primary italic font-serif">asset-generating</span> profession.
        </h1>

        <div className="prose prose-invert prose-lg text-muted-foreground/90 font-light mt-12 space-y-8 max-w-none">
          <p className="lead text-xl text-foreground font-medium">
            For decades, the coaching industry has operated as a strictly transactional exchange. You sell hours, you impart wisdom, and when the hour ends, the value evaporates into the ether. We built Startup Man to break this cycle.
          </p>

          <div className="h-px w-24 bg-primary/30 my-12" />

          <h2 className="text-2xl font-semibold text-foreground font-sans tracking-tight">The Dallas Identity</h2>
          <p>
            Headquartered in Dallas, Texas, our ethos is built on substantive, undeniable reality. In an internet culture obsessed with "faking it until you make it," we stand for the opposite. We believe in building quietly, proving rigorously, and letting the work speak for itself.
          </p>
          <p>
            Dallas is a city of builders and industrialists. It values substance over surface. Startup Man applies this industrial mindset to intellectual property. We are the manufacturing plant for your methodology.
          </p>

          <h2 className="text-2xl font-semibold text-foreground font-sans tracking-tight mt-12">The Mission</h2>
          <p>
            Our mission is to help 10,000 elite practitioners stop renting out their time and start owning their expertise. We envision a world where a coach's true value is not measured by their calendar availability, but by the depth, rigor, and verified proof of their proprietary intellectual property.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="engine-card p-6 bg-background/50">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Core Tenet 01</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Ghostwriting</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/80 m-0">
                You cannot synthesize what you haven't lived. Every framework generated on our platform must be traced back to a real client interaction.
              </p>
            </div>
            <div className="engine-card p-6 bg-background/50">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Core Tenet 02</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Proof Over Promise</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/80 m-0">
                Authority is not claimed; it is demonstrated. We prioritize the systematic documentation of outcomes over aggressive marketing tactics.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

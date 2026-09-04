import { motion } from "framer-motion";
import { Link } from "wouter";
import { FileText, PlayCircle, Book } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const resources = [
  {
    type: "Manifesto",
    title: "The End of Hourly Coaching",
    desc: "Why the current model of executive coaching is fundamentally broken, and how IP generation fixes it.",
    icon: FileText
  },
  {
    type: "Field Note",
    title: "From 1:1 Work to Curriculum",
    desc: "A practical way to recognize recurring lessons in client work and shape them into a teachable curriculum.",
    icon: Book
  },
  {
    type: "Guide",
    title: "The Framework Architecture",
    desc: "A structural guide to naming, organizing, and visualizing your intuitive coaching methods.",
    icon: FileText
  },
  {
    type: "Video",
    title: "Studio Walkthrough",
    desc: "A 10-minute deep dive into the Practice Simulator and Knowledge Vault.",
    icon: PlayCircle
  }
];

export default function Resources() {
  return (
    <div className="pt-12 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/50 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="max-w-3xl mb-16"
      >
        <div className="mb-6 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          Thought Leadership
        </div>
        <h1 className="mb-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
          The Library.
        </h1>
        <p className="text-xl text-muted-foreground/90 font-light leading-relaxed">
          Essays, guides, and architectural blueprints for coaches transitioning from practitioners to IP owners.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {resources.map((res, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group engine-card flex flex-col sm:flex-row gap-6 p-6 items-start bg-background/50 transition-colors"
            data-testid={`resource-card-${i}`}
          >
            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-sm bg-card border border-border text-muted-foreground transition-colors">
              <res.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-primary/70 mb-2">
                {res.type}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors">
                {res.title}
              </h3>
              <p className="text-sm text-muted-foreground/80 leading-relaxed font-light">
                {res.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

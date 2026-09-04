import { motion } from "framer-motion";
import { Mail, MapPin } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Contact() {
  return (
    <div className="pt-12 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/50 min-h-[80vh] flex flex-col justify-center">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-xl"
        >
          <div className="mb-6 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
            Direct Line
          </div>
          <h1 className="mb-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
            Contact the <span className="text-primary italic font-serif">Studio.</span>
          </h1>
          <p className="text-xl text-muted-foreground/90 font-light leading-relaxed mb-12">
            Startup Man is based in Dallas, Texas, USA. For product questions, partnership inquiries, or support, contact our team by email.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-card border border-border text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-1">Email</h3>
                <a href="mailto:info@startupmans.com" className="text-lg font-mono text-muted-foreground hover:text-primary transition-colors" data-testid="link-contact-email">
                  info@startupmans.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-card border border-border text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-1">Location</h3>
                <div className="text-lg font-mono text-muted-foreground">
                  Dallas, Texas, USA
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-card border border-border text-primary">
                <span className="text-sm font-bold" aria-hidden="true">↗</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-1">Website</h3>
                <a href="https://startupmans.com" className="text-lg font-mono text-muted-foreground hover:text-primary transition-colors" rel="noopener noreferrer" data-testid="link-contact-website">
                  startupmans.com
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:block relative"
        >
          <div className="aspect-square w-full max-w-md mx-auto rounded-full border border-primary/10 bg-primary/5 relative flex items-center justify-center">
            <div className="absolute inset-4 rounded-full border border-primary/20 border-dashed animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-12 rounded-full border border-primary/30 border-dotted animate-[spin_40s_linear_infinite_reverse]" />
            <div className="h-32 w-32 rounded-full bg-card border border-primary/50 flex items-center justify-center shadow-[0_0_50px_rgba(201,168,78,0.15)]">
              <span className="font-serif italic text-5xl text-primary">S</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

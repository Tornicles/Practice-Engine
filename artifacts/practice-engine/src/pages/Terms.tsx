import { motion } from "framer-motion";

export default function Terms() {
  return (
    <div className="pt-12 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-6 inline-flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">
          Legal
        </div>
        <h1 className="mb-12 text-3xl sm:text-5xl font-semibold tracking-tight">Terms of Service</h1>

        <div className="prose prose-invert max-w-none text-muted-foreground font-light text-sm sm:text-base space-y-6">
          <p>These terms apply to your use of startupmans.com and the Startup Man platform, operated from Dallas, Texas, USA.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Startup Man platform (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Intellectual Property Rights</h2>
          <p>
            You are responsible for ensuring that you have the rights to submit the content you add to the Service. The Service and its underlying software, design, and branding remain the property of Startup Man or its licensors.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to use the Service in compliance with all applicable laws and your own professional ethical standards. You are solely responsible for ensuring that any client data you input into the Service is properly anonymized and complies with your client confidentiality agreements.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Platform Capabilities and AI Limitations</h2>
          <p>
            Some features may assist with organizing or developing your material. You are responsible for reviewing outputs and deciding whether they are appropriate for your work and audience.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Texas, USA, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Contact</h2>
          <p>
            Questions about these terms can be sent to <a href="mailto:info@startupmans.com" className="text-primary hover:underline">info@startupmans.com</a>. You can also visit <a href="https://startupmans.com" className="text-primary hover:underline">startupmans.com</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

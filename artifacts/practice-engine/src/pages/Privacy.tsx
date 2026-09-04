import { motion } from "framer-motion";

export default function Privacy() {
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
        <h1 className="mb-12 text-3xl sm:text-5xl font-semibold tracking-tight">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none text-muted-foreground font-light text-sm sm:text-base space-y-6">
          <p>Startup Man is based in Dallas, Texas, USA. This policy describes how information is handled when you use startupmans.com and the Startup Man platform.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We receive information you provide when you create an account, complete your profile, add experiences or materials to your workspace, or contact us. This can include account details and the content you choose to add to the platform.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use information to provide and maintain the platform, respond to requests, and support the features you choose to use. Please do not enter information you are not authorized to share.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Your workspace content</h2>
          <p>
            You are responsible for the content you add to your workspace, including ensuring that it does not violate confidentiality obligations or applicable law. Consider anonymizing client information before entering it.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Sharing of Information</h2>
          <p>
            We may use service providers that help us operate the platform. We do not sell personal information as part of operating Startup Man.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p>
            For questions regarding this policy or your data, contact <a href="mailto:info@startupmans.com" className="text-primary hover:underline">info@startupmans.com</a> or visit <a href="https://startupmans.com" className="text-primary hover:underline">startupmans.com</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

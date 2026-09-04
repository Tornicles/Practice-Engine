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
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
          <p>
            Startup Man collects information you provide directly to us when you create an account, build your profile, log coaching experiences, or communicate with us. This includes your name, email address, niche, and any proprietary coaching notes or IP you submit to the platform.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate, maintain, and improve our platform. Specifically, your coaching logs are processed by our AI engines to extract principles and generate frameworks exclusive to your account. We do not use your proprietary session data to train models for other users.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Data Security and IP Ownership</h2>
          <p>
            The intellectual property (frameworks, principles, content) generated on Startup Man using your logged experiences belongs to you. We employ rigorous security measures to protect your data from unauthorized access. Your client notes should be anonymized by you before entry to comply with your own confidentiality agreements.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Sharing of Information</h2>
          <p>
            We do not sell your personal information or your generated IP. We may share information with third-party service providers (such as hosting partners or AI processing APIs) strictly for the purpose of operating the Startup Man platform, under strict confidentiality agreements.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p>
            For questions regarding this privacy policy or your data, please contact us at <a href="mailto:info@startupmans.com" className="text-primary hover:underline">info@startupmans.com</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

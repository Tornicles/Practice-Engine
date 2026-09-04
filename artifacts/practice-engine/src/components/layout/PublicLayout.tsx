import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Show } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/services", label: "Services" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 bg-noisy">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${
          scrolled
            ? "border-border/50 bg-background/80 backdrop-blur-md py-3"
            : "border-transparent bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 z-50 relative group" data-testid="link-home">
            <span className="engine-logo-mark grid h-7 w-7 place-items-center rounded-sm text-xs font-bold border border-primary/50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              S
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[.16em]">
              Startup <span className="text-primary">Man</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-medium uppercase tracking-[.1em] transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[.1em]"
                data-testid="link-nav-sign-in"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-5 text-[11px] font-semibold uppercase tracking-[.1em] text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(201,168,78,0.15)] hover:shadow-[0_0_20px_rgba(201,168,78,0.3)]"
                data-testid="link-nav-sign-up"
              >
                Enter Studio
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-5 text-[11px] font-semibold uppercase tracking-[.1em] text-primary-foreground hover:bg-primary/90 transition-colors"
                data-testid="link-nav-dashboard"
              >
                Dashboard
              </Link>
            </Show>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden z-50 relative p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 pt-24 px-6 pb-8 flex flex-col md:hidden"
            data-testid="mobile-menu-container"
          >
            <nav className="flex flex-col gap-6 items-center text-center mt-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-lg font-medium uppercase tracking-[.15em] transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-12 bg-border my-2" />
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-muted-foreground uppercase tracking-[.15em] mb-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-sm bg-primary px-8 text-xs font-bold uppercase tracking-[.15em] text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Enter Studio
                </Link>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-sm bg-primary px-8 text-xs font-bold uppercase tracking-[.15em] text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </Show>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full pt-[72px]">
        {children}
      </main>

      <footer className="border-t border-border bg-card/30 py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <span className="engine-logo-mark grid h-6 w-6 place-items-center rounded-sm text-[10px] font-bold border border-primary/50 text-primary">
                  S
                </span>
                <span className="text-xs font-semibold uppercase tracking-[.16em]">
                  Startup <span className="text-primary">Man</span>
                </span>
              </Link>
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed mb-6">
                A Dallas-based mastery platform for coaches and advisors. Turn lived experience into intellectual property.
              </p>
              <a
                href="mailto:info@startupmans.com"
                className="text-xs font-mono text-foreground hover:text-primary transition-colors"
                data-testid="link-footer-email"
              >
                info@startupmans.com
              </a>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[.15em] text-foreground mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Studio</Link></li>
                <li><Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">How It Works</Link></li>
                <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">Services</Link></li>
                <li><Link href="/resources" className="text-sm text-muted-foreground hover:text-primary transition-colors">Resources</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[.15em] text-foreground mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 gap-4">
            <div className="text-[10px] font-medium uppercase tracking-[.15em] text-muted-foreground/60">
              © {new Date().getFullYear()} Startup Man. All rights reserved.
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[.15em] text-muted-foreground/60">
              Dallas, Texas, USA
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

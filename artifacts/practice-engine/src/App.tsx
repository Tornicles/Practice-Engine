import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import { useGetPracticeProfile } from "@workspace/api-client-react";

import { Shell } from "@/components/layout/Shell";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import HowItWorks from "@/pages/HowItWorks";
import Services from "@/pages/Services";
import Resources from "@/pages/Resources";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Dashboard from "@/pages/Dashboard";
import Today from "@/pages/Today";
import Practice from "@/pages/Practice";
import Lab from "@/pages/Lab";
import Knowledge from "@/pages/Knowledge";
import Methodology from "@/pages/Methodology";
import Passport from "@/pages/Passport";
import Brand from "@/pages/Brand";
import Content from "@/pages/Content";
import Courses from "@/pages/Courses";
import Products from "@/pages/Products";
import Proof from "@/pages/Proof";
import Delivery from "@/pages/Delivery";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(41, 58%, 54%)",
    colorForeground: "hsl(210, 18%, 92%)",
    colorMutedForeground: "hsl(214, 10%, 58%)",
    colorDanger: "hsl(2, 58%, 47%)",
    colorBackground: "hsl(213, 16%, 10%)",
    colorInput: "hsl(214, 14%, 18%)",
    colorInputForeground: "hsl(210, 18%, 92%)",
    colorNeutral: "hsl(214, 14%, 18%)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.35rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#161a20] border border-[#27303a] rounded-xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight text-[#f4f6f8]",
    headerSubtitle: "text-sm text-[#98a3af]",
    socialButtonsBlockButtonText: "text-sm font-medium text-[#f4f6f8]",
    formFieldLabel: "text-sm font-medium text-[#f4f6f8]",
    footerActionLink: "text-sm font-medium text-[#c9a84e] hover:text-[#d4a34b]",
    footerActionText: "text-sm text-[#98a3af]",
    dividerText: "text-xs font-mono uppercase tracking-widest text-[#56616d]",
    identityPreviewEditButton: "text-sm font-medium text-[#c9a84e]",
    formFieldSuccessText: "text-sm text-[#4fd18b]",
    alertText: "text-sm font-medium",
    logoBox: "mx-auto mb-2 h-12 w-12 border border-[#c9a84e]/30 p-2 rounded-sm bg-[#c9a84e]/10",
    logoImage: "w-full h-full object-contain",
    socialButtonsBlockButton: "border border-[#27303a] bg-[#12161b] hover:bg-[#1a2027] transition-colors rounded-md",
    formButtonPrimary: "bg-[#c9a84e] text-[#101010] font-bold hover:bg-[#d4a34b] transition-colors rounded-md uppercase tracking-[0.05em] text-sm h-10",
    formFieldInput: "bg-[#0b0d10] border-[#27303a] text-[#f4f6f8] rounded-md focus:border-[#c9a84e]/50 focus:ring-1 focus:ring-[#c9a84e]/20 transition-all",
    footerAction: "bg-[#12161b] border-t border-[#27303a] py-6 rounded-b-xl",
    dividerLine: "bg-[#27303a]",
    alert: "bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#ff6b6b] rounded-md",
    otpCodeFieldInput: "border-[#27303a] bg-[#0b0d10] text-[#f4f6f8]",
    formFieldRow: "mb-4",
    main: "px-8 py-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 bg-noisy">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 bg-noisy">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading, isError, refetch } = useGetPracticeProfile();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && profile) {
      if (!profile.onboardingCompleted && location !== "/onboarding") {
        setLocation("/onboarding");
      }
    }
  }, [isLoading, profile, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-6 text-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" data-testid="status-profile-loading">Loading your workspace…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
        <section className="engine-card w-full max-w-md p-7 text-center" role="alert" aria-labelledby="profile-error-title">
          <AlertCircle className="mx-auto mb-4 h-7 w-7 text-destructive" aria-hidden="true" />
          <h1 id="profile-error-title" className="text-xl font-semibold">We couldn’t load your workspace</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Check your connection and try again. Your account remains signed in.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 border border-primary/60 px-4 text-xs font-semibold uppercase tracking-[.1em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="button-retry-profile"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
          </button>
        </section>
      </main>
    );
  }

  return <Shell>{children}</Shell>;
}

const publicMetadata: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Startup Man | Turn Experience Into IP",
    description: "Startup Man helps coaches and advisors turn lived experience into stronger skills, repeatable methodology, and evidence-backed intellectual property.",
  },
  "/about": { title: "About Startup Man | Dallas, Texas", description: "Learn about Startup Man, a Dallas-based platform for coaches and advisors developing their practice and intellectual property." },
  "/how-it-works": { title: "How Startup Man Works", description: "See how Startup Man helps coaches capture experience, develop repeatable methodology, and build evidence-backed intellectual property." },
  "/services": { title: "Startup Man Services", description: "Explore Startup Man services for coaches and advisors who want to turn practical experience into usable intellectual property." },
  "/resources": { title: "Startup Man Resources", description: "Browse Startup Man resources for building a stronger coaching practice, methodology, and body of work." },
  "/contact": { title: "Contact Startup Man | Dallas, Texas", description: "Contact Startup Man at info@startupmans.com. Startup Man is based in Dallas, Texas, USA." },
  "/privacy": { title: "Privacy Policy | Startup Man", description: "Read the Startup Man privacy policy and find contact details for privacy questions." },
  "/terms": { title: "Terms of Service | Startup Man", description: "Read the Startup Man terms of service for use of the Startup Man platform." },
};

function PageMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const metadata = publicMetadata[location];
    const noIndex = !metadata;
    const title = metadata?.title ?? "Startup Man Workspace";
    const description = metadata?.description ?? "Private Startup Man workspace.";
    const canonical = `https://startupmans.com${basePath}${location === "/" ? "/" : location}`.replace(/([^:]\/)\/+/g, "$1");

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", noIndex ? "noindex, nofollow" : "index, follow");
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical);
  }, [location]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <PublicLayout>
          <Home />
        </PublicLayout>
      </Show>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/about">
          <PublicLayout><About /></PublicLayout>
        </Route>
        <Route path="/how-it-works">
          <PublicLayout><HowItWorks /></PublicLayout>
        </Route>
        <Route path="/services">
          <PublicLayout><Services /></PublicLayout>
        </Route>
        <Route path="/resources">
          <PublicLayout><Resources /></PublicLayout>
        </Route>
        <Route path="/contact">
          <PublicLayout><Contact /></PublicLayout>
        </Route>
        <Route path="/privacy">
          <PublicLayout><Privacy /></PublicLayout>
        </Route>
        <Route path="/terms">
          <PublicLayout><Terms /></PublicLayout>
        </Route>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />

        <Route path="/:rest*">
          <Show when="signed-in">
            <AuthGuard>
              <Switch>
                <Route path="/onboarding" component={Onboarding} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/today" component={Today} />
                <Route path="/practice" component={Practice} />
                <Route path="/lab" component={Lab} />
                <Route path="/knowledge" component={Knowledge} />
                <Route path="/methodology" component={Methodology} />
                <Route path="/passport" component={Passport} />
                <Route path="/brand" component={Brand} />
                <Route path="/content" component={Content} />
                <Route path="/courses" component={Courses} />
                <Route path="/products" component={Products} />
                <Route path="/proof" component={Proof} />
                <Route path="/delivery" component={Delivery} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </AuthGuard>
          </Show>
          <Show when="signed-out">
            <Redirect to="/sign-in" />
          </Show>
        </Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Enter the Studio",
            subtitle: "Sign in to Startup Man",
          },
        },
        signUp: {
          start: {
            title: "Build Your Practice",
            subtitle: "Turn lived experience into IP",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ClerkQueryClientCacheInvalidator />
          <PageMetadata />
          <Router />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

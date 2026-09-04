import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { Shell } from '@/components/layout/Shell';

// Pages
import Home from '@/pages/Home';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Today from '@/pages/Today';
import Practice from '@/pages/Practice';
import Knowledge from '@/pages/Knowledge';
import Methodology from '@/pages/Methodology';
import Passport from '@/pages/Passport';
import Brand from '@/pages/Brand';
import Content from '@/pages/Content';
import Courses from '@/pages/Courses';
import Products from '@/pages/Products';
import Proof from '@/pages/Proof';
import Delivery from '@/pages/Delivery';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <RoutedErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/today" component={Today} />
          <Route path="/practice" component={Practice} />
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
      </Shell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

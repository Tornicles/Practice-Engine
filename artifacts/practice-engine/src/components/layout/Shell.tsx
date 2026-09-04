import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { Home, Zap, Target, BookOpen, Layers, Award, Box, FileText, Globe, Star, ShieldCheck, UserCircle, Settings } from "lucide-react"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, group: 'core' },
  { name: 'Today', href: '/today', icon: Target, group: 'core' },
  { name: 'Simulator', href: '/practice', icon: Zap, group: 'core' },
  { name: 'Knowledge', href: '/knowledge', icon: BookOpen, group: 'core' },
  { name: 'Delivery', href: '/delivery', icon: UserCircle, group: 'development' },
  { name: 'Methodology', href: '/methodology', icon: Layers, group: 'development' },
  { name: 'Passport', href: '/passport', icon: ShieldCheck, group: 'identity' },
  { name: 'Brand', href: '/brand', icon: Star, group: 'identity' },
  { name: 'Content', href: '/content', icon: FileText, group: 'growth' },
  { name: 'Courses', href: '/courses', icon: Box, group: 'growth' },
  { name: 'Products', href: '/products', icon: Globe, group: 'growth' },
  { name: 'Proof', href: '/proof', icon: Award, group: 'growth' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  
  if (location === '/' || location === '/onboarding') {
    return <main className="flex-1 flex flex-col">{children}</main>
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">P</span>
            <span>Practice Engine</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
          <nav className="flex flex-col gap-8">
            <div className="space-y-1">
              {navigation.filter(i => i.group === 'core').map((item) => {
                const isActive = location === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Development</h4>
              {navigation.filter(i => i.group === 'development').map((item) => {
                const isActive = location === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Identity</h4>
              {navigation.filter(i => i.group === 'identity').map((item) => {
                const isActive = location === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Assets</h4>
              {navigation.filter(i => i.group === 'growth').map((item) => {
                const isActive = location === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-border/50">
          <Link
            href="/settings"
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location === '/settings'
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className={cn(
              "mr-3 h-4 w-4 flex-shrink-0",
              location === '/settings' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center justify-between px-4 border-b border-border glass z-10">
          <span className="font-serif font-semibold">Practice Engine</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

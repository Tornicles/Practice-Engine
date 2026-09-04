import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center p-4 bg-background">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-6">
        <AlertCircle className="h-8 w-8 opacity-50" />
      </div>
      <h1 className="font-serif text-4xl font-medium tracking-tight mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or hasn't been built yet in this version of the engine.
      </p>
      <Button asChild variant="outline" size="lg">
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  )
}

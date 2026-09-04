import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import { Layers, ShieldCheck, Star, Box, FileText, Globe, Award, Settings } from "lucide-react"

export default function GenericPage({ title, description, icon: Icon, actions = false }: any) {
  return (
    <div className="flex flex-col h-[60vh] items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
      <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground ring-1 ring-border shadow-sm mb-4">
        {Icon ? <Icon className="h-10 w-10 opacity-50" /> : <Layers className="h-10 w-10 opacity-50" />}
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="font-serif text-3xl font-medium">{title}</h1>
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>
      
      {actions && (
        <div className="pt-8 w-full max-w-sm">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium mb-4">This engine requires more captured experiences to synthesize.</p>
              <Button asChild className="w-full"><Link href="/knowledge">Capture Experience</Link></Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

import { NextActionWidget } from "@/components/NextActionWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Calendar, CheckCircle2, ChevronRight } from "lucide-react";

export default function Today() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="mx-auto max-w-5xl space-y-7 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <div className="engine-kicker mb-3">WORKSPACE / DAILY SEQUENCE</div>
          <h1 className="engine-section-title">Today</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> {today}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Focus</h2>
            <NextActionWidget />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" /> Pending Tasks
            </h2>
            <div className="space-y-3">
              <Card className="engine-card cursor-pointer transition-colors group hover:border-primary/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border border-primary/50 group-hover:border-primary flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm font-medium">Extract lessons from yesterday's session</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </CardContent>
              </Card>
              <Card className="engine-card cursor-pointer transition-colors group hover:border-primary/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border border-primary/50 group-hover:border-primary flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm font-medium">Complete 1 practice scenario</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="engine-card border-border bg-card">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="text-base">Daily Reflection</CardTitle>
              <CardDescription>What is the most important coaching realization you had today?</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground text-sm italic mb-4">"The quality of your coaching is bounded by the quality of your reflection."</p>
              <div className="h-24 w-px bg-gradient-to-b from-primary/30 to-transparent mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
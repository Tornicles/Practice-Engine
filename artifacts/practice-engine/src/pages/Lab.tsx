import { Link } from "wouter";
import { ArrowRight, Check, CircleDot, Gauge, Layers3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const curriculum = [
  { label: "FOUNDATION", title: "Coaching fundamentals", detail: "Boundaries, session architecture, and a clean coaching stance.", progress: 92, state: "Active" },
  { label: "SKILL", title: "Questioning under resistance", detail: "Create clarity without taking the client’s thinking away from them.", progress: 68, state: "Priority" },
  { label: "ADVANCED", title: "Challenge and reframe", detail: "Name the pattern, hold the tension, and invite a different choice.", progress: 42, state: "Developing" },
];

export default function Lab() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="engine-kicker mb-3">DEVELOPMENT / CURRICULUM</div>
          <h1 className="engine-section-title">Coach Lab</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">A focused development track for turning deliberate practice into reliable delivery.</p>
        </div>
        <Link href="/practice" data-testid="link-lab-practice">
          <Button variant="outline" className="gap-2">Open simulator <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="engine-card">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><Gauge className="h-4 w-4 text-primary" /> Current track</CardTitle>
              <span className="engine-kicker text-primary">03 MODULES</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {curriculum.map((item, index) => (
              <div className="border border-border bg-background/40 p-4" key={item.title} data-testid={`card-lab-module-${index}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">{item.progress > 80 ? <Check className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="engine-kicker">{item.label}</span>
                      <span className="font-mono text-[11px] text-primary">{item.progress}%</span>
                    </div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                    <div className="engine-progress mt-3"><div style={{ width: `${item.progress}%` }} /></div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="engine-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Layers3 className="h-4 w-4 text-primary" /> Competency map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {[
              ["Listening", "81", "steady"],
              ["Questioning", "82", "rising"],
              ["Reframing", "61", "focus"],
              ["Challenge", "58", "focus"],
            ].map(([name, score, trend]) => (
              <div key={name} className="border-b border-border/60 pb-3 last:border-0">
                <div className="mb-2 flex justify-between text-sm"><span>{name}</span><span className="font-mono text-xs text-primary">{score}</span></div>
                <div className="flex items-center justify-between gap-3">
                  <div className="engine-progress flex-1"><div style={{ width: `${score}%` }} /></div>
                  <span className="engine-kicker w-12 text-right">{trend}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
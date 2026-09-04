import React, { useState } from "react";
import { useRecommendNextAction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Compass, Clock, CheckCircle, BrainCircuit } from "lucide-react";

export function NextActionWidget() {
  const recommend = useRecommendNextAction();
  const [objective, setObjective] = useState("");
  const [minutes, setMinutes] = useState("15");

  const handleRecommend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective) return;
    recommend.mutate({
      data: {
        currentObjective: objective,
        availableMinutes: parseInt(minutes, 10)
      }
    });
  };

  return (
    <Card className="engine-card border-primary/25 bg-primary/[.035]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Intelligence Director
        </CardTitle>
        <CardDescription>What are you trying to achieve right now?</CardDescription>
      </CardHeader>
      <CardContent>
        {!recommend.data ? (
          <form onSubmit={handleRecommend} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Objective</Label>
              <Input 
                placeholder="e.g. Prepare for an onboarding call, build a new framework..." 
                value={objective}
                onChange={e => setObjective(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Available Time</Label>
              <Select value={minutes} onValueChange={setMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="120">2+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={recommend.isPending || !objective} className="w-full">
              {recommend.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              Analyze Context & Recommend
            </Button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-background rounded-md p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                  {recommend.data.engine} Engine
                </Badge>
                <span className="text-xs flex items-center text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" /> {recommend.data.duration}
                </span>
              </div>
              <h3 className="font-medium text-lg mb-1">{recommend.data.action}</h3>
              <p className="text-sm text-muted-foreground mb-4">{recommend.data.reason}</p>
              
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Success Criteria</h4>
                <ul className="space-y-1">
                  {recommend.data.successCriteria.map((criterion: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => recommend.reset()}>
              Focus on something else
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
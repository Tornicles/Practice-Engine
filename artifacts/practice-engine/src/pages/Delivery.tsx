import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Delivery() {
  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <div>
        <div className="engine-kicker mb-3">WORKSPACE / LIVE DELIVERY</div>
        <h1 className="engine-section-title">Delivery Studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Prepare for and evaluate live client sessions.</p>
      </div>

      <Card className="engine-card border-dashed border-2 bg-transparent">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <CardTitle className="mb-2">Delivery context offline</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            The delivery tools will unlock when you schedule a live session. This engine prepares your strategic approach before the call and processes the transcript after.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
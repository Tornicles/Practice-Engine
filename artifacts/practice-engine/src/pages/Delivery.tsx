import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Delivery() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight mb-2">Delivery Engine</h1>
        <p className="text-muted-foreground">Prepare for and evaluate live client sessions.</p>
      </div>

      <Card className="border-dashed border-2 bg-transparent">
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
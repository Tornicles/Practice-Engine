import { useGetPracticeProfile, useListKnowledgeAssets, useListExperiences } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Briefcase, Zap, GitCommit } from "lucide-react";

export default function Passport() {
  const { data: profile, isLoading: loadingProfile } = useGetPracticeProfile();
  const { data: assets, isLoading: loadingAssets } = useListKnowledgeAssets();
  const { data: experiences, isLoading: loadingExperiences } = useListExperiences();

  if (loadingProfile || loadingAssets || loadingExperiences) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const assetCounts = assets?.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="engine-kicker mb-3">EVIDENCE / IDENTITY</div>
        <h1 className="engine-section-title">Coach Passport</h1>
        <p className="mt-2 text-sm text-muted-foreground">The verifiable record of your expertise, built entirely from lived experience.</p>
      </div>

      <Card className="engine-card border-primary/25 bg-primary/[.035] overflow-hidden">
        <div className="h-1 w-full bg-primary/70" />
        <CardContent className="p-5 md:p-7">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="h-32 w-32 rounded-2xl bg-secondary border border-border/50 flex items-center justify-center shrink-0 shadow-inner">
              <Shield className="h-12 w-12 text-primary/50" />
            </div>
            <div className="space-y-6 flex-1">
              <div>
               <h2 className="text-2xl font-semibold">{profile?.name}</h2>
                <p className="text-primary font-medium tracking-wide mt-1">{profile?.niche} Coach</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Level</div>
                  <div className="font-medium">{profile?.experienceLevel}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mastery Score</div>
                  <div className="font-mono text-primary font-bold">{profile?.practiceScore}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Audience</div>
                  <div className="font-medium line-clamp-2">{profile?.audience}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Focus</div>
                  <div className="font-medium line-clamp-2">{profile?.developmentFocus}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

       <div className="space-y-4">
         <div><div className="engine-kicker mb-2">TRACEABLE PRACTICE</div><h3 className="text-xl font-semibold">Experience <span className="text-primary">→</span> Expertise <span className="text-primary">→</span> IP</h3></div>
         <p className="text-sm text-muted-foreground">This system proves your authority by mapping every asset back to a real client interaction.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
           <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px bg-border -translate-y-1/2 z-0" />
          
           <Card className="engine-card relative z-10">
            <CardHeader className="text-center pb-2">
               <div className="mx-auto flex h-10 w-10 items-center justify-center border border-border bg-secondary mb-4">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>1. Lived Experience</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-mono font-bold text-foreground mb-2">{experiences?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Captured client situations</p>
            </CardContent>
          </Card>

           <Card className="engine-card relative z-10">
            <CardHeader className="text-center pb-2">
               <div className="mx-auto flex h-10 w-10 items-center justify-center border border-primary/30 bg-primary/10 mb-4">
                <GitCommit className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>2. Structural IP</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-mono font-bold text-primary mb-2">{assetCounts['framework'] || 0}</div>
              <p className="text-sm text-muted-foreground">Extracted Frameworks</p>
            </CardContent>
          </Card>

           <Card className="engine-card relative z-10">
            <CardHeader className="text-center pb-2">
               <div className="mx-auto flex h-10 w-10 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 mb-4">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <CardTitle>3. Market Value</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-mono font-bold text-emerald-500 mb-2">
                {(assets?.length || 0) - (assetCounts['framework'] || 0)}
              </div>
              <p className="text-sm text-muted-foreground">Content, Courses & Offers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="engine-card">
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>A breakdown of your synthesized intellectual property.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(assetCounts).map(([type, count]) => (
               <div key={type} className="p-4 bg-secondary/30 border border-border/50 text-center">
                <div className="text-3xl font-mono font-bold mb-1">{count}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{type}</div>
              </div>
            ))}
            {Object.keys(assetCounts).length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No assets generated yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
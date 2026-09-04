import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { 
  useListKnowledgeAssets, 
  useListExperiences, 
  useGenerateKnowledgeAsset,
  getListKnowledgeAssetsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles, Box, GitMerge, FileText, CheckCircle2 } from "lucide-react";
import { AssetGenerationInputAssetType } from "@workspace/api-client-react";

interface AssetWorkspaceProps {
  title: string;
  description: string;
  allowedTypes: Array<typeof AssetGenerationInputAssetType[keyof typeof AssetGenerationInputAssetType]>;
  emptyMessage?: string;
}

export function AssetWorkspace({ title, description, allowedTypes, emptyMessage }: AssetWorkspaceProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: allAssets, isLoading: loadingAssets } = useListKnowledgeAssets();
  const { data: experiences, isLoading: loadingExperiences } = useListExperiences();
  const generateAsset = useGenerateKnowledgeAsset();
  const searchString = useSearch();
  
  const assets = allAssets?.filter(a => allowedTypes.includes(a.type as any)) || [];
  
  const [sourceId, setSourceId] = useState<string>("");
  const [assetType, setAssetType] = useState<string>(allowedTypes[0]);
  const [objective, setObjective] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const expId = params.get("experienceId");
    if (expId && !sourceId) {
      setSourceId(expId);
    }
  }, [searchString, sourceId]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !objective) return;
    
    generateAsset.mutate({
      data: {
        sourceExperienceId: parseInt(sourceId, 10),
        assetType: assetType as any,
        objective: objective
      }
    }, {
      onSuccess: () => {
        toast({ title: "Asset Generated", description: "Successfully synthesized new knowledge asset." });
        queryClient.invalidateQueries({ queryKey: getListKnowledgeAssetsQueryKey() });
        setObjective("");
      }
    });
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <div>
        <div className="engine-kicker mb-3">DEVELOPMENT / STRUCTURAL IP</div>
        <h1 className="engine-section-title">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loadingAssets ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : assets.length === 0 ? (
              <div className="border border-dashed border-border bg-card/30 py-16 text-center">
              <Box className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                {emptyMessage || "Use the generator to synthesize your first asset from captured experiences."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {assets.map(asset => (
                  <Card key={asset.id} className="engine-card overflow-hidden border-border/50">
                   <div className="flex items-center justify-between border-b border-border/50 bg-primary/[.035] px-5 py-3">
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{asset.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                   <CardHeader className="p-5">
                     <CardTitle className="text-lg font-medium">{asset.title}</CardTitle>
                     <div className="mt-3 flex items-start gap-2 border border-border/50 bg-secondary/30 p-3">
                      <GitMerge className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        <span className="font-semibold text-foreground not-italic">Lineage: </span> 
                        {asset.promptStrategy}
                      </p>
                    </div>
                  </CardHeader>
                   <CardContent className="px-5 pb-5">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {asset.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
           <Card className="engine-card sticky top-6 border-primary/25 bg-primary/[.025]">
             <CardHeader className="border-b border-border/50 bg-primary/[.035]">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" /> Generate Asset
              </CardTitle>
              <CardDescription>Synthesize an IP asset directly from lived experience.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <Label>Source Experience</Label>
                  <Select value={sourceId} onValueChange={setSourceId} disabled={loadingExperiences}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an experience to extract from..." />
                    </SelectTrigger>
                    <SelectContent>
                      {experiences?.map(exp => (
                        <SelectItem key={exp.id} value={exp.id.toString()}>
                          {exp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {allowedTypes.length > 1 && (
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select value={assetType} onValueChange={setAssetType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            <span className="capitalize">{type}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Objective</Label>
                  <Textarea 
                    placeholder="e.g. Create a practical 3-step exercise for clients struggling with this exact issue."
                    className="min-h-[100px] resize-none"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={generateAsset.isPending || !sourceId || !objective} className="w-full">
                  {generateAsset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Asset
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { AssetWorkspace } from "@/components/AssetWorkspace";

export default function Content() {
  return (
    <AssetWorkspace
      title="Content Engine"
      description="Transform lived coaching experiences into engaging articles, posts, and narratives."
      allowedTypes={["content"]}
      emptyMessage="No content generated yet. Synthesize an experience into an article or social media post to share your expertise publicly."
    />
  );
}
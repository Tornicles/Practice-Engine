import { AssetWorkspace } from "@/components/AssetWorkspace";

export default function Methodology() {
  return (
    <AssetWorkspace
      title="Methodology Builder"
      description="Turn your extracted principles into scalable frameworks and structural IP."
      allowedTypes={["framework"]}
      emptyMessage="No frameworks yet. Select a core principle from your knowledge vault and let the AI synthesize a structured framework."
    />
  );
}
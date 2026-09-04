import { AssetWorkspace } from "@/components/AssetWorkspace";

export default function Brand() {
  return (
    <AssetWorkspace
      title="Brand Lab"
      description="Develop your unique positioning, messaging, and authority derived from actual client work."
      allowedTypes={["brand"]}
      emptyMessage="Your brand identity is currently undefined. Use an experience to generate core positioning statements or brand guidelines."
    />
  );
}
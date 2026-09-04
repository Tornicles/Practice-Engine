import { AssetWorkspace } from "@/components/AssetWorkspace";

export default function Products() {
  return (
    <AssetWorkspace
      title="Product & Offers"
      description="Package your expertise into scalable products and irresistible coaching offers."
      allowedTypes={["offer"]}
      emptyMessage="No offers defined. Synthesize your expertise and target audience into a compelling product offering."
    />
  );
}
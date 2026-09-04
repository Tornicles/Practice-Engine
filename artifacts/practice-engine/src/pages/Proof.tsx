import { AssetWorkspace } from "@/components/AssetWorkspace";

export default function Proof() {
  return (
    <AssetWorkspace 
      title="Proof Bank"
      description="Convert client outcomes and interactions into validated case studies and testimonials."
      allowedTypes={["case-study"]}
      emptyMessage="No case studies exist. Transform a successful client experience into a structured case study to prove your capabilities."
    />
  );
}
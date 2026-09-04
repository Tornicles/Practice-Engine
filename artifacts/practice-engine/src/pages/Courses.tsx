import { AssetWorkspace } from "@/components/AssetWorkspace";

export default function Courses() {
  return (
    <AssetWorkspace 
      title="Course Creator"
      description="Structure your methodology into teachable modules, workshops, and comprehensive courses."
      allowedTypes={["course", "workshop", "exercise"]}
      emptyMessage="You haven't built any course materials yet. Generate a workshop outline or client exercise from your proven principles."
    />
  );
}
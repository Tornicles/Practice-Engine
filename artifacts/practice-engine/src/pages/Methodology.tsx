import GenericPage from "@/components/ui/generic-page"
import { Layers } from "lucide-react"

export default function Methodology() {
  return <GenericPage 
    title="Methodology Builder" 
    description="Turn scattered knowledge from your vault into your own proprietary frameworks."
    icon={Layers}
    actions={true}
  />
}

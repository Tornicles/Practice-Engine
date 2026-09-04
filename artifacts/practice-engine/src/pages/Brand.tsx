import GenericPage from "@/components/ui/generic-page"
import { Star } from "lucide-react"

export default function Brand() {
  return <GenericPage 
    title="Brand Lab" 
    description="Positioning and authority workspace grounded in your actual profile."
    icon={Star}
    actions={true}
  />
}

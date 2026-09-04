import GenericPage from "@/components/ui/generic-page"
import { Box } from "lucide-react"

export default function Courses() {
  return <GenericPage 
    title="Course Development" 
    description="Experience-backed course development journey."
    icon={Box}
    actions={true}
  />
}

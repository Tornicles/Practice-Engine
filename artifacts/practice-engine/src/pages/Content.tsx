import GenericPage from "@/components/ui/generic-page"
import { FileText } from "lucide-react"

export default function Content() {
  return <GenericPage 
    title="Content Engine" 
    description="Content and authority workspace showing source lineage from your experiences."
    icon={FileText}
    actions={true}
  />
}

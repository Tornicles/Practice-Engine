import GenericPage from "@/components/ui/generic-page"
import { ShieldCheck } from "lucide-react"

export default function Passport() {
  return <GenericPage 
    title="Coach Passport" 
    description="Your persistent representation across skill, experience, methodology, and IP."
    icon={ShieldCheck}
  />
}

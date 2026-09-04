import { useEffect } from "react"
import { useLocation } from "wouter"
import { useGetPracticeProfile } from "@workspace/api-client-react"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [_, setLocation] = useLocation()
  const { data: profile, isLoading } = useGetPracticeProfile()

  useEffect(() => {
    if (!isLoading) {
      if (profile && profile.name) {
        setLocation('/dashboard')
      } else {
        setLocation('/onboarding')
      }
    }
  }, [isLoading, profile, setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

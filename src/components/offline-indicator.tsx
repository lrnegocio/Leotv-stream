
"use client"

import * as React from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = React.useState(false)

  React.useEffect(() => {
    function updateStatus() {
      setIsOffline(!navigator.onLine)
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    updateStatus()

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-bottom-full font-bold uppercase text-[10px] tracking-widest">
      <WifiOff className="h-4 w-4" />
      Sinal de Internet Perdido. Verifique o cabo ou Wi-Fi.
    </div>
  )
}

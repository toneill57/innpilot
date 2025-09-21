'use client'

import { PWAInstallPrompt, PWAOfflineIndicator, PWAUpdatePrompt } from './PWAPrompt'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PWAInstallPrompt />
      <PWAOfflineIndicator />
      <PWAUpdatePrompt />
    </>
  )
}
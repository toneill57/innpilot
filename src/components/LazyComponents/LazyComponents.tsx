'use client'

import { lazy, Suspense, ComponentType } from 'react'
import {
  ChatLoadingSkeleton,
  MuvaChatLoadingSkeleton,
  FileUploadLoadingSkeleton,
  ReportsLoadingSkeleton
} from '@/components/LoadingStates'

// Lazy load heavy components
export const LazyChatAssistant = lazy(() =>
  import('@/components/ChatAssistant/ChatAssistant').then(module => ({
    default: module.ChatAssistant
  }))
)

export const LazyMuvaAssistant = lazy(() =>
  import('@/components/MuvaAssistant/MuvaAssistant')
)

export const LazyFileUploader = lazy(() =>
  import('@/components/FileUploader/FileUploader').then(module => ({
    default: module.FileUploader
  }))
)

export const LazyReportsTab = lazy(() =>
  import('@/components/Reports/ReportsTab').then(module => ({
    default: module.ReportsTab
  }))
)

// High-order component for lazy loading with error boundaries
function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  LoadingComponent: ComponentType,
  fallbackErrorMessage: string = 'Error al cargar el componente'
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Pre-configured lazy components with appropriate loading states
export const ChatAssistantLazy = withLazyLoading(
  LazyChatAssistant,
  ChatLoadingSkeleton,
  'Error al cargar el Chat Assistant'
)

export const MuvaAssistantLazy = withLazyLoading(
  LazyMuvaAssistant,
  MuvaChatLoadingSkeleton,
  'Error al cargar MUVA Assistant'
)

export const FileUploaderLazy = withLazyLoading(
  LazyFileUploader,
  FileUploadLoadingSkeleton,
  'Error al cargar el File Uploader'
)

export const ReportsTabLazy = withLazyLoading(
  LazyReportsTab,
  ReportsLoadingSkeleton,
  'Error al cargar los Reportes'
)

// Route-based code splitting helpers
export const routePreloader = {
  dashboard: () => Promise.all([
    import('@/components/Dashboard/Dashboard'),
    import('@/components/FileUploader/FileUploader'),
    import('@/components/ChatAssistant/ChatAssistant')
  ]),

  muva: () => Promise.all([
    import('@/components/MuvaAssistant/MuvaAssistant'),
    import('@/app/muva/page')
  ]),

  reports: () => import('@/components/Reports/ReportsTab'),

  // Preload critical components
  critical: () => Promise.all([
    import('@/components/ErrorBoundary/ErrorBoundary'),
    import('@/components/LoadingStates/LoadingStates'),
    import('@/components/PWA/PWAProvider')
  ])
}

// Component preloader hook
export function useComponentPreloader() {
  const preloadComponent = (componentName: keyof typeof routePreloader) => {
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback for non-critical preloading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          routePreloader[componentName]().catch(err =>
            console.warn(`Failed to preload ${componentName}:`, err)
          )
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          routePreloader[componentName]().catch(err =>
            console.warn(`Failed to preload ${componentName}:`, err)
          )
        }, 100)
      }
    }
  }

  return { preloadComponent }
}

// Bundle size analysis helper (development only)
export const bundleAnalyzer = {
  logComponentSize: (componentName: string, startTime: number) => {
    if (process.env.NODE_ENV === 'development') {
      const loadTime = performance.now() - startTime
      console.log(`🚀 Component "${componentName}" loaded in ${loadTime.toFixed(2)}ms`)
    }
  },

  measureBundle: async (importFn: () => Promise<any>, name: string) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now()
      const result = await importFn()
      const end = performance.now()

      console.log(`📦 Bundle "${name}" loaded in ${(end - start).toFixed(2)}ms`)
      return result
    }
    return importFn()
  }
}
'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, FileUp, MessageCircle, BarChart3 } from "lucide-react"

// Base Skeleton Component
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

// Pulse Animation Component
export const PulseLoader = ({ size = 'md', color = 'blue' }: { size?: 'sm' | 'md' | 'lg', color?: 'blue' | 'green' | 'purple' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
  )
}

// Chat Loading State
export const ChatLoadingSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-start space-x-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="flex items-start space-x-3 justify-end">
      <div className="flex-1 space-y-2 max-w-xs">
        <Skeleton className="h-4 w-full ml-auto" />
        <Skeleton className="h-4 w-2/3 ml-auto" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center space-x-2 text-gray-500">
        <PulseLoader size="sm" />
        <span className="text-sm">Generando respuesta...</span>
      </div>
    </div>
  </div>
)

// MUVA Chat Loading (tropical theme)
export const MuvaChatLoadingSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-start space-x-3">
      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-200 to-teal-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-cyan-100 to-teal-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gradient-to-r from-cyan-100 to-teal-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center space-x-3 text-cyan-600">
        <div className="animate-bounce">🏝️</div>
        <PulseLoader size="md" color="blue" />
        <div className="animate-bounce delay-75">🌊</div>
        <span className="text-sm font-medium">MUVA está pensando...</span>
      </div>
    </div>
  </div>
)

// File Upload Loading State
export const FileUploadLoadingSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <div className="flex items-center space-x-3">
        <div className="animate-spin">
          <FileUp className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-2 bg-blue-600 rounded-full animate-pulse w-3/4"></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Procesando archivo...</span>
          <span>75%</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Reports Loading State
export const ReportsLoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex space-x-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>

    {/* Tabs Skeleton */}
    <div className="flex space-x-8 border-b border-gray-200">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-24 mb-1" />
      ))}
    </div>

    {/* Cards Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Chart Skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end space-x-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton
              key={i}
              className={`w-8 bg-blue-200 animate-pulse ${
                i % 4 === 0 ? 'h-20' : i % 3 === 0 ? 'h-16' : i % 2 === 0 ? 'h-12' : 'h-8'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

// Dashboard Stats Loading
export const DashboardStatsLoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
)

// Page Loading Overlay
export const PageLoadingOverlay = ({ message = "Cargando..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <Card className="p-6 max-w-sm mx-4">
      <CardContent className="flex flex-col items-center space-y-4">
        <PulseLoader size="lg" />
        <p className="text-lg font-medium">{message}</p>
      </CardContent>
    </Card>
  </div>
)

// Inline Loading Component
export const InlineLoader = ({
  text = "Cargando...",
  size = 'sm',
  className = ''
}: {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <PulseLoader size={size} />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
)

// Typing Animation for Chat
export const TypingIndicator = ({ variant = 'sire' }: { variant?: 'sire' | 'muva' }) => {
  const dots = variant === 'muva' ? '🏝️' : '•'

  return (
    <div className="flex items-center space-x-1 text-gray-500">
      <span className="text-sm">Escribiendo</span>
      <div className="flex space-x-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>{dots}</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>{dots}</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>{dots}</span>
      </div>
    </div>
  )
}

// Shimmer Effect for Images
export const ImageSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded ${className}`} />
)

// Progress Bar Component
export const ProgressBar = ({
  progress,
  label,
  color = 'blue',
  animated = true
}: {
  progress: number
  label?: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
  animated?: boolean
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }

  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClasses[color]} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}
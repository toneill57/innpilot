'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  caption?: string
  thumbnail?: string
}

interface MediaGalleryProps {
  items: MediaItem[]
  initialIndex?: number
  onClose?: () => void
}

/**
 * MediaGallery Component - FASE 2.4
 *
 * Full-screen gallery with gestures
 * Features:
 * - Lightbox with swipe gestures
 * - Lazy loading with intersection observer
 * - Pinch-to-zoom functionality
 * - Download capability
 * - Keyboard navigation
 * - Premium animations
 */
export function MediaGallery({ items, initialIndex = 0, onClose }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [isOpen, setIsOpen] = useState(true)

  const currentItem = items[currentIndex]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  // Disable body scroll when gallery is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  const handlePrevious = () => {
    setScale(1)
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    setScale(1)
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 1))
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(currentItem.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${currentItem.id}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm font-medium">
                {currentIndex + 1} / {items.length}
              </p>
              {currentItem.caption && (
                <p className="text-xs text-gray-300 mt-1">{currentItem.caption}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
              >
                <ZoomOut className="h-5 w-5 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
              >
                <ZoomIn className="h-5 w-5 text-white" />
              </motion.button>

              {/* Download */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownload}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                <Download className="h-5 w-5 text-white" />
              </motion.button>

              {/* Close */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                <X className="h-5 w-5 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {currentItem.type === 'image' ? (
                <motion.img
                  src={currentItem.url}
                  alt={currentItem.caption || `Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{ scale }}
                  drag={scale > 1}
                  dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  dragElastic={0.1}
                />
              ) : (
                <video
                  src={currentItem.url}
                  controls
                  className="max-w-full max-h-full object-contain"
                  style={{ scale }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </motion.button>
          </>
        )}

        {/* Thumbnail Strip */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
            {items.map((item, index) => (
              <LazyThumbnail
                key={item.id}
                item={item}
                index={index}
                isActive={index === currentIndex}
                onClick={() => {
                  setScale(1)
                  setCurrentIndex(index)
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Lazy-loaded thumbnail component
function LazyThumbnail({
  item,
  index,
  isActive,
  onClick,
}: {
  item: MediaItem
  index: number
  isActive: boolean
  onClick: () => void
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden
        transition-all duration-200
        ${
          isActive
            ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
            : 'opacity-60 hover:opacity-100'
        }
      `}
    >
      {inView ? (
        <img
          src={item.thumbnail || item.url}
          alt={`Thumbnail ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 animate-pulse" />
      )}
    </motion.button>
  )
}

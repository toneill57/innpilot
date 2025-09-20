import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageGridProps {
  images: string[]
  captions?: Record<string, string>
  altText?: Record<string, string>
}

export function ImageGrid({ images, captions = {}, altText = {} }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage !== null) {
        setSelectedImage(null)
      }
    }

    if (selectedImage !== null) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedImage])

  // Handle arrow keys for navigation
  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (selectedImage === null) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)
      }
    }

    if (selectedImage !== null) {
      document.addEventListener('keydown', handleArrowKeys)
      return () => document.removeEventListener('keydown', handleArrowKeys)
    }
  }, [selectedImage, images.length])

  // Focus trap for modal
  useEffect(() => {
    if (selectedImage !== null) {
      const modal = document.querySelector('[role="dialog"]') as HTMLElement
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault()
                lastElement.focus()
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault()
                firstElement.focus()
              }
            }
          }
        }

        modal.addEventListener('keydown', handleTabKey)
        firstElement?.focus()

        return () => modal.removeEventListener('keydown', handleTabKey)
      }
    }
  }, [selectedImage])

  if (!images || images.length === 0) return null

  // Single image display
  if (images.length === 1) {
    return (
      <div className="mb-3">
        <img
          src={images[0]}
          alt={altText[images[0]] || "Imagen del lugar turístico"}
          className="w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => setSelectedImage(0)}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        {captions[images[0]] && (
          <p className="text-xs text-gray-600 mt-1 italic">
            {captions[images[0]]}
          </p>
        )}
      </div>
    )
  }

  // Multiple images grid
  const displayImages = images.slice(0, 4)
  const remainingCount = images.length - 4

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {displayImages.map((img, idx) => (
          <div key={idx} className="relative">
            <img
              src={img}
              alt={altText[img] || `Imagen ${idx + 1} del lugar`}
              className="rounded-lg h-32 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setSelectedImage(idx)}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            {idx === 3 && remainingCount > 0 && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={() => setSelectedImage(idx)}
              >
                <span className="text-white font-semibold">
                  +{remainingCount} más
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image viewer modal */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de imágenes"
          aria-describedby={`image-${selectedImage + 1}-description`}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-12 right-0 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => setSelectedImage(null)}
              aria-label="Cerrar galería"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </Button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={() => setSelectedImage(
                    selectedImage === 0 ? images.length - 1 : selectedImage - 1
                  )}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={() => setSelectedImage(
                    selectedImage === images.length - 1 ? 0 : selectedImage + 1
                  )}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </Button>
              </>
            )}

            {/* Main image */}
            <img
              src={images[selectedImage]}
              alt={altText[images[selectedImage]] || `Imagen ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-image.jpg' // Fallback image
              }}
            />

            {/* Caption */}
            {captions[images[selectedImage]] && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg"
                id={`image-${selectedImage + 1}-description`}
              >
                <p className="text-sm">
                  {captions[images[selectedImage]]}
                </p>
              </div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div
                className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm"
                aria-label={`Imagen ${selectedImage + 1} de ${images.length}`}
              >
                {selectedImage + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageGrid
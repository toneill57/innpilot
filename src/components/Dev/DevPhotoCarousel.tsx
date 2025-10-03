'use client'

import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface Photo {
  url: string
  caption?: string
}

interface DevPhotoCarouselProps {
  photos: Photo[]
}

export default function DevPhotoCarousel({ photos }: DevPhotoCarouselProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!photos || photos.length === 0) return null

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % photos.length)
    }
  }

  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
    }
  }

  // Determine grid layout based on photo count
  const gridClass = photos.length === 1
    ? 'grid-cols-1'
    : photos.length === 2
    ? 'grid-cols-2'
    : photos.length === 3
    ? 'grid-cols-2'
    : 'grid-cols-2'

  return (
    <>
      {/* Photo Grid */}
      <div className={`grid ${gridClass} gap-2 my-3 rounded-lg overflow-hidden`}>
        {photos.slice(0, 4).map((photo, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative aspect-square overflow-hidden bg-gray-100
                       hover:opacity-90 transition-opacity duration-200
                       group cursor-pointer"
            aria-label={`View photo ${index + 1}: ${photo.caption || 'Accommodation'}`}
          >
            <Image
              src={photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />

            {/* Hover overlay with caption */}
            {photo.caption && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent
                              opacity-0 group-hover:opacity-100
                              transition-opacity duration-200
                              flex items-end p-2">
                <p className="text-white text-xs font-medium">
                  {photo.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center
                     animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300
                       transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevPhoto()
                }}
                className="absolute left-4 text-white hover:text-gray-300
                           transition-colors z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextPhoto()
                }}
                className="absolute right-4 text-white hover:text-gray-300
                           transition-colors z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          {/* Photo */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption || `Photo ${lightboxIndex + 1}`}
              width={1200}
              height={800}
              className="object-contain max-w-full max-h-full"
            />

            {/* Caption */}
            {photos[lightboxIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white
                              p-4 text-center">
                <p className="text-lg font-medium">
                  {photos[lightboxIndex].caption}
                </p>
              </div>
            )}
          </div>

          {/* Photo counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}

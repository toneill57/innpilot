'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>
  onCancel?: () => void
  maxSizeMB?: number
  acceptedFormats?: string[]
  disabled?: boolean
}

/**
 * ImageUpload Component - FASE 2.4
 *
 * Image upload with preview and compression
 * Features:
 * - Drag-and-drop zone with hover states
 * - Preview thumbnails before upload
 * - Client-side image compression
 * - Upload progress indicator
 * - File validation (size, format)
 * - Premium animations
 */
export function ImageUpload({
  onUpload,
  onCancel,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  disabled = false,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Formato no válido. Usa: ${acceptedFormats.map((f) => f.split('/')[1]).join(', ')}`
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `Archivo muy grande. Máximo ${maxSizeMB}MB`
    }

    return null
  }

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string

        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920

          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.85
          )
        }
      }
    })
  }

  const handleFileSelect = async (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Compress large images
    const sizeMB = file.size / (1024 * 1024)
    const processedFile = sizeMB > 2 ? await compressImage(file) : file

    setSelectedFile(processedFile)

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(processedFile)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      await onUpload(selectedFile)
      setProgress(100)
      clearInterval(progressInterval)

      // Reset after success
      setTimeout(() => {
        handleCancel()
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
      setIsUploading(false)
      setProgress(0)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setProgress(0)
    setIsUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="w-full">
      {/* Drop Zone */}
      {!selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <motion.div
            animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          </motion.div>

          <p className="text-sm font-medium text-gray-700 mb-1">
            {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz click'}
          </p>
          <p className="text-xs text-gray-500">
            Formatos: JPG, PNG, WebP, GIF • Máximo {maxSizeMB}MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />
        </motion.div>
      )}

      {/* Preview & Upload */}
      <AnimatePresence>
        {selectedFile && previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            {/* Preview Image */}
            <div className="relative rounded-lg overflow-hidden mb-4 bg-gray-100">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-[300px] object-contain"
              />

              {/* Remove Button */}
              {!isUploading && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancel}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* File Info */}
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
              <ImageIcon className="h-4 w-4" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4"
              >
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Subiendo... {progress}%
                </p>
              </motion.div>
            )}

            {/* Actions */}
            {!isUploading && (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
                >
                  Subir imagen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

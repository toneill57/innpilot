'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, Download, X, Loader2, ZoomIn, ZoomOut, FileText } from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentPreviewProps {
  fileUrl: string
  fileName?: string
  onClose?: () => void
  initialPage?: number
}

/**
 * DocumentPreview Component - FASE 2.4
 *
 * PDF/Document preview with navigation
 * Features:
 * - Inline preview with react-pdf
 * - Page navigation with thumbnails
 * - Download button with progress
 * - Zoom controls
 * - Mobile-responsive
 * - Loading states
 */
export function DocumentPreview({
  fileUrl,
  fileName = 'document.pdf',
  onClose,
  initialPage = 1,
}: DocumentPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Disable body scroll when preview is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setError('No se pudo cargar el documento')
    setIsLoading(false)
  }

  const handlePreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages))
    }
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      setError('No se pudo descargar el documento')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <FileText className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">{fileName}</h3>
              {numPages && (
                <p className="text-sm text-gray-300">
                  Página {pageNumber} de {numPages}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
            >
              <ZoomOut className="h-5 w-5 text-white" />
            </motion.button>

            <span className="text-sm text-white font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomIn}
              disabled={scale >= 2.0}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
            >
              <ZoomIn className="h-5 w-5 text-white" />
            </motion.button>

            {/* Download */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Download className="h-5 w-5 text-white" />
              )}
            </motion.button>

            {/* Close */}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                <X className="h-5 w-5 text-white" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="absolute inset-0 flex items-center justify-center overflow-auto pt-20 pb-24">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="h-12 w-12 text-white animate-spin" />
              <p className="text-white">Cargando documento...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-red-400"
            >
              <FileText className="h-12 w-12" />
              <p>{error}</p>
            </motion.div>
          )}

          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-2xl overflow-hidden"
            >
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {numPages && numPages > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviousPage}
              disabled={pageNumber <= 1}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </motion.button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= numPages) {
                    setPageNumber(page)
                  }
                }}
                className="w-16 px-3 py-2 bg-white/10 text-white text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <span className="text-white">/ {numPages}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPage}
              disabled={pageNumber >= numPages}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </motion.button>
          </div>

          {/* Page Thumbnails */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 justify-center scrollbar-thin scrollbar-thumb-white/20">
            {Array.from({ length: Math.min(numPages, 10) }, (_, i) => i + 1).map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPageNumber(page)}
                className={`
                  flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all
                  ${
                    page === pageNumber
                      ? 'border-white shadow-lg'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }
                `}
              >
                <Document file={fileUrl}>
                  <Page pageNumber={page} width={64} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>
              </motion.button>
            ))}
            {numPages > 10 && (
              <div className="flex items-center px-4 text-white text-sm">
                +{numPages - 10} más
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { formatFileSize, validateSireFormat } from "@/lib/utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  lineCount: number
  fileSize: number
  fileName: string
}

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setValidationResult({
        isValid: false,
        errors: ['Solo se permiten archivos .txt'],
        lineCount: 0,
        fileSize: file.size,
        fileName: file.name
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationResult({
        isValid: false,
        errors: ['El archivo es demasiado grande. Máximo 10MB'],
        lineCount: 0,
        fileSize: file.size,
        fileName: file.name
      })
      return
    }

    setIsValidating(true)

    try {
      const content = await file.text()
      const validation = validateSireFormat(content)

      setValidationResult({
        ...validation,
        fileSize: file.size,
        fileName: file.name
      })
    } catch {
      setValidationResult({
        isValid: false,
        errors: ['Error al leer el archivo'],
        lineCount: 0,
        fileSize: file.size,
        fileName: file.name
      })
    } finally {
      setIsValidating(false)
    }
  }

  const downloadTemplate = () => {
    const templateContent = `TIPO_DOC\tNUMERO_DOC\tPRIMER_NOMBRE\tSEGUNDO_NOMBRE\tPRIMER_APELLIDO\tSEGUNDO_APELLIDO\tFECHA_NACIMIENTO\tPAIS_NACIMIENTO\tSEXO\tCIUDAD_HOSPEDAJE\tFECHA_INGRESO_PAIS\tFECHA_SALIDA_PAIS\tOBSERVACIONES
3\t12345678\tJOHN\tMICHAEL\tDOE\tSMITH\t01/01/1990\tUSA\tM\tBOGOTA\t15/09/2024\t20/09/2024\tEJEMPLO`

    const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_sire.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo SIRE
          </CardTitle>
          <CardDescription>
            Arrastra tu archivo .txt aquí o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Selecciona un archivo TXT
              </p>
              <p className="text-sm text-gray-500">
                Formato SIRE con 13 campos separados por tabulaciones
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>Seleccionar Archivo</span>
                  </Button>
                </label>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Plantilla
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {isValidating && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Validando archivo...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado de Validación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Archivo</p>
                <p className="font-medium">{validationResult.fileName}</p>
              </div>
              <div>
                <p className="text-gray-500">Tamaño</p>
                <p className="font-medium">{formatFileSize(validationResult.fileSize)}</p>
              </div>
              <div>
                <p className="text-gray-500">Registros</p>
                <p className="font-medium">{validationResult.lineCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Estado</p>
                <p className={`font-medium ${
                  validationResult.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.isValid ? 'Válido' : 'Con errores'}
                </p>
              </div>
            </div>

            {validationResult.isValid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    ¡Archivo válido! Listo para enviar al SIRE
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  El archivo cumple con todos los requisitos de formato SIRE
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-red-800 font-medium">
                      Errores encontrados:
                    </span>
                    <ul className="text-red-700 text-sm mt-1 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validationResult.isValid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-800 font-medium mb-2">Próximos pasos:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Descarga el archivo validado si es necesario</li>
                  <li>• Sube el archivo al portal oficial del SIRE</li>
                  <li>• Verifica la recepción en el sistema gubernamental</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información sobre formato SIRE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium mb-1">Campos obligatorios (13 total):</h4>
            <p className="text-gray-600">
              Tipo documento, número, nombres, apellidos, fecha nacimiento, país, sexo,
              ciudad hospedaje, fechas de ingreso/salida, observaciones
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Tipos de documento válidos:</h4>
            <p className="text-gray-600">
              3 (Cédula extranjería), 5 (Pasaporte), 46 (Visa), 10 (PTP)
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Formato:</h4>
            <p className="text-gray-600">
              Archivo .txt con campos separados por tabulaciones (TAB)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
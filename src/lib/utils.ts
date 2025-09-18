import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateSireFormat(content: string): {
  isValid: boolean
  errors: string[]
  lineCount: number
} {
  const lines = content.split('\n').filter(line => line.trim())
  const errors: string[] = []

  if (lines.length === 0) {
    errors.push('El archivo está vacío')
    return { isValid: false, errors, lineCount: 0 }
  }

  // Validar cada línea
  lines.forEach((line, index) => {
    const fields = line.split('\t')

    // Debe tener exactamente 13 campos
    if (fields.length !== 13) {
      errors.push(`Línea ${index + 1}: Debe tener exactamente 13 campos separados por tabulaciones (encontrados: ${fields.length})`)
    }

    // Validar tipos de documento válidos (3, 5, 46, 10)
    const docType = fields[3]?.trim()
    if (docType && !['3', '5', '46', '10'].includes(docType)) {
      errors.push(`Línea ${index + 1}: Tipo de documento inválido '${docType}'. Solo se permiten: 3, 5, 46, 10`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    lineCount: lines.length
  }
}
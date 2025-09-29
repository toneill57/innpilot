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

interface SireValidationError {
  line: number
  field: number | null
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

interface SireValidationResult {
  isValid: boolean
  errors: string[]
  detailedErrors: SireValidationError[]
  lineCount: number
  preview: string[]
  format: 'tab' | 'csv' | 'unknown'
  fieldValidation: {
    field: number
    name: string
    validCount: number
    totalCount: number
    errors: string[]
  }[]
}

function detectFileFormat(content: string): 'tab' | 'csv' | 'unknown' {
  const firstLine = content.split('\n')[0]
  if (!firstLine) return 'unknown'

  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length

  if (tabCount >= 12) return 'tab'
  if (commaCount >= 12) return 'csv'
  return 'unknown'
}

function parseFileLine(line: string, format: 'tab' | 'csv'): string[] {
  if (format === 'csv') {
    // Simple CSV parsing - handle quoted fields
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }
  return line.split('\t')
}

const SIRE_FIELD_DEFINITIONS = [
  { name: 'Código del hotel', required: true, type: 'numeric', maxLength: 10 },
  { name: 'Código de ciudad', required: true, type: 'numeric', maxLength: 5 },
  { name: 'Tipo de documento', required: true, type: 'numeric', validValues: ['3', '5', '46', '10'] },
  { name: 'Número de identificación', required: true, type: 'alphanumeric', maxLength: 20 },
  { name: 'Código nacionalidad', required: true, type: 'numeric', maxLength: 3 },
  { name: 'Primer apellido', required: true, type: 'text', maxLength: 50 },
  { name: 'Segundo apellido', required: false, type: 'text', maxLength: 50 },
  { name: 'Nombres', required: true, type: 'text', maxLength: 50 },
  { name: 'Tipo de movimiento', required: true, type: 'text', validValues: ['E', 'S'] },
  { name: 'Fecha del movimiento', required: true, type: 'date', pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
  { name: 'Lugar de procedencia', required: true, type: 'numeric', maxLength: 3 },
  { name: 'Lugar de destino', required: true, type: 'numeric', maxLength: 3 },
  { name: 'Fecha de nacimiento', required: true, type: 'date', pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/ }
]

function validateField(value: string, fieldDef: typeof SIRE_FIELD_DEFINITIONS[0], fieldIndex: number, lineNumber: number): SireValidationError[] {
  const errors: SireValidationError[] = []
  const trimmedValue = value.trim()

  // Required field validation
  if (fieldDef.required && !trimmedValue) {
    errors.push({
      line: lineNumber,
      field: fieldIndex,
      message: `Campo requerido "${fieldDef.name}" está vacío`,
      severity: 'error',
      suggestion: `Este campo debe contener información válida`
    })
    return errors
  }

  if (!trimmedValue && !fieldDef.required) {
    return errors // Optional empty field is valid
  }

  // Type validation
  switch (fieldDef.type) {
    case 'numeric':
      if (!/^\d+$/.test(trimmedValue)) {
        errors.push({
          line: lineNumber,
          field: fieldIndex,
          message: `"${fieldDef.name}" debe contener solo números`,
          severity: 'error',
          suggestion: `Valor actual: "${trimmedValue}". Use solo dígitos 0-9`
        })
      }
      break

    case 'text':
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) {
        errors.push({
          line: lineNumber,
          field: fieldIndex,
          message: `"${fieldDef.name}" debe contener solo letras y espacios`,
          severity: 'error',
          suggestion: `Valor actual: "${trimmedValue}". Remover números y símbolos`
        })
      }
      break

    case 'date':
      if (fieldDef.pattern && !fieldDef.pattern.test(trimmedValue)) {
        errors.push({
          line: lineNumber,
          field: fieldIndex,
          message: `"${fieldDef.name}" debe tener formato DD/MM/AAAA`,
          severity: 'error',
          suggestion: `Valor actual: "${trimmedValue}". Ejemplo correcto: 15/03/1985`
        })
      }
      break
  }

  // Valid values validation
  if (fieldDef.validValues && !fieldDef.validValues.includes(trimmedValue)) {
    errors.push({
      line: lineNumber,
      field: fieldIndex,
      message: `"${fieldDef.name}" tiene valor inválido "${trimmedValue}"`,
      severity: 'error',
      suggestion: `Valores permitidos: ${fieldDef.validValues.join(', ')}`
    })
  }

  // Length validation
  if (fieldDef.maxLength && trimmedValue.length > fieldDef.maxLength) {
    errors.push({
      line: lineNumber,
      field: fieldIndex,
      message: `"${fieldDef.name}" excede la longitud máxima de ${fieldDef.maxLength} caracteres`,
      severity: 'warning',
      suggestion: `Longitud actual: ${trimmedValue.length}. Considere abreviar`
    })
  }

  return errors
}

export function validateSireFormat(content: string): SireValidationResult {
  const lines = content.split('\n').filter(line => line.trim())
  const errors: string[] = []
  const detailedErrors: SireValidationError[] = []

  if (lines.length === 0) {
    errors.push('El archivo está vacío')
    return {
      isValid: false,
      errors,
      detailedErrors,
      lineCount: 0,
      preview: [],
      format: 'unknown',
      fieldValidation: []
    }
  }

  // Detect file format
  const format = detectFileFormat(content)

  if (format === 'unknown') {
    errors.push('Formato de archivo no reconocido. Use archivos separados por tabulaciones (.txt) o comas (.csv)')
    return {
      isValid: false,
      errors,
      detailedErrors,
      lineCount: lines.length,
      preview: lines.slice(0, 5),
      format,
      fieldValidation: []
    }
  }

  // Initialize field validation tracking
  const fieldValidation = SIRE_FIELD_DEFINITIONS.map((def, index) => ({
    field: index,
    name: def.name,
    validCount: 0,
    totalCount: 0,
    errors: [] as string[]
  }))

  // Validate each line
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const fields = parseFileLine(line, format)

    // Field count validation
    if (fields.length !== 13) {
      const error: SireValidationError = {
        line: lineNumber,
        field: null,
        message: `Debe tener exactamente 13 campos (encontrados: ${fields.length})`,
        severity: 'error',
        suggestion: format === 'tab'
          ? 'Verifique que todos los campos estén separados por tabulaciones'
          : 'Verifique que todos los campos estén separados por comas'
      }
      detailedErrors.push(error)
      errors.push(`Línea ${lineNumber}: ${error.message}`)
      return
    }

    // Validate each field
    fields.forEach((field, fieldIndex) => {
      fieldValidation[fieldIndex].totalCount++

      const fieldErrors = validateField(field, SIRE_FIELD_DEFINITIONS[fieldIndex], fieldIndex, lineNumber)

      if (fieldErrors.length === 0) {
        fieldValidation[fieldIndex].validCount++
      } else {
        fieldErrors.forEach(error => {
          detailedErrors.push(error)
          errors.push(`Línea ${lineNumber}, Campo ${fieldIndex + 1} (${error.message})`)
          fieldValidation[fieldIndex].errors.push(error.message)
        })
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    detailedErrors,
    lineCount: lines.length,
    preview: lines.slice(0, 5),
    format,
    fieldValidation
  }
}
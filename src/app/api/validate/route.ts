import { NextRequest, NextResponse } from 'next/server'
import { validateSireFormat } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo (ahora soporta .txt y .csv)
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.txt') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: 'Only .txt and .csv files are allowed'
        },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: 'Maximum file size is 10MB'
        },
        { status: 400 }
      )
    }

    // Leer contenido del archivo
    const content = await file.text()

    // Validar formato SIRE
    const validation = validateSireFormat(content)

    const response = {
      fileName: file.name,
      fileSize: file.size,
      isValid: validation.isValid,
      lineCount: validation.lineCount,
      format: validation.format,
      errors: validation.errors,
      detailedErrors: validation.detailedErrors,
      preview: validation.preview,
      fieldValidation: validation.fieldValidation,
      timestamp: new Date().toISOString()
    }

    // Log para debugging
    console.log(`File validation result for ${file.name}:`, {
      isValid: validation.isValid,
      format: validation.format,
      errorCount: validation.errors.length,
      detailedErrorCount: validation.detailedErrors.length,
      lineCount: validation.lineCount
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in validate API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to validate file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File validation API endpoint - Use POST method',
    description: 'Upload a .txt or .csv file to validate SIRE format',
    requirements: {
      method: 'POST',
      contentType: 'multipart/form-data',
      field: 'file',
      maxSize: '10MB',
      allowedTypes: ['.txt', '.csv']
    },
    validation: {
      fields: 13,
      separators: ['TAB', 'CSV'],
      validDocTypes: ['3', '5', '46', '10'],
      autoDetectFormat: true,
      detailedErrorReporting: true
    }
  })
}
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

    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith('.txt')) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: 'Only .txt files are allowed'
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
      errors: validation.errors,
      timestamp: new Date().toISOString()
    }

    // Log para debugging
    console.log(`File validation result for ${file.name}:`, {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
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
    description: 'Upload a .txt file to validate SIRE format',
    requirements: {
      method: 'POST',
      contentType: 'multipart/form-data',
      field: 'file',
      maxSize: '10MB',
      allowedTypes: ['.txt']
    },
    validation: {
      fields: 13,
      separator: 'TAB',
      validDocTypes: ['3', '5', '46', '10']
    }
  })
}
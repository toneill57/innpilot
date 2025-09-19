import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploader } from '@/components/FileUploader/FileUploader'

// Mock fetch
global.fetch = jest.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url')

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders upload area', () => {
    render(<FileUploader />)

    expect(screen.getByText('Validar Archivo SIRE')).toBeInTheDocument()
    expect(screen.getByText(/Arrastra y suelta tu archivo .txt aquí/)).toBeInTheDocument()
    expect(screen.getByText('Seleccionar archivo')).toBeInTheDocument()
  })

  it('handles file selection via input', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isValid: true,
        errors: [],
        lineCount: 10,
        fileName: 'test.txt',
        fileSize: 1000
      })
    })

    render(<FileUploader />)

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText('✓ Archivo válido')).toBeInTheDocument()
    })

    expect(screen.getByText('test.txt')).toBeInTheDocument()
    expect(screen.getByText('10 registros procesados')).toBeInTheDocument()
  })

  it('handles drag and drop', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isValid: true,
        errors: [],
        lineCount: 5,
        fileName: 'dragged.txt',
        fileSize: 500
      })
    })

    render(<FileUploader />)

    const file = new File(['dragged content'], 'dragged.txt', { type: 'text/plain' })
    const dropZone = screen.getByText(/Arrastra y suelta/).closest('div')

    expect(dropZone).toBeInTheDocument()

    // Simulate drag and drop
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: {
        items: [{ kind: 'file', type: 'text/plain' }]
      }
    })

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    })

    await waitFor(() => {
      expect(screen.getByText('✓ Archivo válido')).toBeInTheDocument()
    })

    expect(screen.getByText('dragged.txt')).toBeInTheDocument()
  })

  it('shows validation errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isValid: false,
        errors: [
          'Error en línea 1: Formato inválido',
          'Error en línea 3: Campo faltante'
        ],
        lineCount: 5,
        fileName: 'invalid.txt',
        fileSize: 300
      })
    })

    render(<FileUploader />)

    const file = new File(['invalid content'], 'invalid.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText('✗ Errores encontrados')).toBeInTheDocument()
    })

    expect(screen.getByText('Error en línea 1: Formato inválido')).toBeInTheDocument()
    expect(screen.getByText('Error en línea 3: Campo faltante')).toBeInTheDocument()
    expect(screen.getByText('2 errores encontrados')).toBeInTheDocument()
  })

  it('shows loading state during validation', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<FileUploader />)

    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file)

    expect(screen.getByText('Validando archivo...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /loader/i })).toBeInTheDocument()
  })

  it('handles API errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<FileUploader />)

    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText('✗ Error de validación')).toBeInTheDocument()
    })

    expect(screen.getByText(/Error al validar el archivo/)).toBeInTheDocument()
  })

  it('rejects non-txt files', async () => {
    const user = userEvent.setup()

    render(<FileUploader />)

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file)

    expect(screen.getByText('✗ Tipo de archivo inválido')).toBeInTheDocument()
    expect(screen.getByText('Solo se permiten archivos .txt')).toBeInTheDocument()
  })

  it('rejects files larger than 10MB', async () => {
    const user = userEvent.setup()

    render(<FileUploader />)

    // Create a mock file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, largeFile)

    expect(screen.getByText('✗ Archivo muy grande')).toBeInTheDocument()
    expect(screen.getByText('El archivo no puede superar 10MB')).toBeInTheDocument()
  })

  it('allows uploading new file after validation', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isValid: true,
        errors: [],
        lineCount: 10,
        fileName: 'test.txt',
        fileSize: 1000
      })
    })

    render(<FileUploader />)

    // Upload first file
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file1)

    await waitFor(() => {
      expect(screen.getByText('test1.txt')).toBeInTheDocument()
    })

    // Upload second file
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' })
    await user.upload(input, file2)

    await waitFor(() => {
      expect(screen.getByText('test2.txt')).toBeInTheDocument()
    })

    expect(screen.queryByText('test1.txt')).not.toBeInTheDocument()
  })

  it('displays file size in human readable format', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        isValid: true,
        errors: [],
        lineCount: 10,
        fileName: 'test.txt',
        fileSize: 2048 // 2KB
      })
    })

    render(<FileUploader />)

    const file = new File(['x'.repeat(2048)], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Seleccionar archivo/)

    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/2\\.0.*KB/)).toBeInTheDocument()
    })
  })
})
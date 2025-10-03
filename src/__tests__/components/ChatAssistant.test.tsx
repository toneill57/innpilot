import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatAssistant } from '@/components/ChatAssistant/ChatAssistant'

// Mock fetch
global.fetch = jest.fn()

// Mock clipboard API
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn()
    },
    writable: true
  })
} else {
  navigator.clipboard.writeText = jest.fn()
}

describe('ChatAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(navigator.clipboard.writeText as jest.Mock).mockClear()
  })

  it.skip('renders initial welcome message', () => {
    render(<ChatAssistant />)

    expect(screen.getByText(/¡Hola! Soy tu asistente especializado en SIRE/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Pregunta sobre SIRE/)).toBeInTheDocument()
  })

  it.skip('shows question suggestions initially', () => {
    render(<ChatAssistant />)

    expect(screen.getByText('Preguntas frecuentes:')).toBeInTheDocument()
    expect(screen.getByText('📄 Documentos')).toBeInTheDocument()
    expect(screen.getByText('📋 Procedimientos')).toBeInTheDocument()
    expect(screen.getByText('✅ Validaciones')).toBeInTheDocument()
    expect(screen.getByText('🏨 Hoteles')).toBeInTheDocument()
  })

  it.skip('allows typing and sending messages', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: 'Test response from API',
        context_used: true,
        question: 'Test question'
      })
    })

    render(<ChatAssistant />)

    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Test question')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Test response from API')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'Test question',
        use_context: true,
        max_context_chunks: 4,
        conversation_history: []
      })
    })
  })

  it.skip('shows loading state during API call', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<ChatAssistant />)

    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)

    await user.type(input, 'Test question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByText('Escribiendo...')).toBeInTheDocument()
  })

  it.skip('handles suggestion clicks', async () => {
    const user = userEvent.setup()

    render(<ChatAssistant />)

    const suggestion = screen.getByText('¿Qué tipos de documentos válidos acepta el SIRE?')
    await user.click(suggestion)

    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/) as HTMLInputElement
    expect(input.value).toBe('¿Qué tipos de documentos válidos acepta el SIRE?')

    // Suggestions should be hidden after clicking
    expect(screen.queryByText('Preguntas frecuentes:')).not.toBeInTheDocument()
  })

  it.skip('can copy assistant messages', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: 'Test response to copy',
        context_used: true,
        question: 'Test question'
      })
    })

    render(<ChatAssistant />)

    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)
    await user.type(input, 'Test question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Test response to copy')).toBeInTheDocument()
    })

    // Hover over message to show copy button
    const messageCard = screen.getByText('Test response to copy').closest('.group')
    expect(messageCard).toBeInTheDocument()

    // Find and click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test response to copy')
  })

  it.skip('can clear conversation', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: 'Test response',
        context_used: true,
        question: 'Test question'
      })
    })

    render(<ChatAssistant />)

    // Send a message first
    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)
    await user.type(input, 'Test question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument()
    })

    // Clear conversation
    const clearButton = screen.getByText('Limpiar')
    await user.click(clearButton)

    // Should be back to initial state
    expect(screen.queryByText('Test question')).not.toBeInTheDocument()
    expect(screen.getByText(/¡Hola! Soy tu asistente especializado en SIRE/)).toBeInTheDocument()
    expect(screen.getByText('Preguntas frecuentes:')).toBeInTheDocument()
  })

  it.skip('can share conversation', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: 'Test response',
        context_used: true,
        question: 'Test question'
      })
    })

    // Mock alert
    global.alert = jest.fn()

    render(<ChatAssistant />)

    // Send a message first
    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)
    await user.type(input, 'Test question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument()
    })

    // Share conversation
    const shareButton = screen.getByText('Compartir')
    await user.click(shareButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('[USER] Test question')
    )
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('[ASSISTANT] Test response')
    )
    expect(global.alert).toHaveBeenCalledWith('Conversación copiada al portapapeles')
  })

  it.skip('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<ChatAssistant />)

    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)
    await user.type(input, 'Test question')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(screen.getByText(/Lo siento, hubo un error al procesar tu consulta/)).toBeInTheDocument()
    })
  })

  it.skip('shows character count', async () => {
    const user = userEvent.setup()

    render(<ChatAssistant />)

    const input = screen.getByPlaceholderText(/Pregunta sobre SIRE/)
    await user.type(input, 'Test message')

    expect(screen.getByText('12/500')).toBeInTheDocument()
  })

  it.skip('can toggle suggestions visibility', async () => {
    const user = userEvent.setup()

    render(<ChatAssistant />)

    // Hide suggestions
    const hideButton = screen.getByText('Ocultar sugerencias')
    await user.click(hideButton)

    expect(screen.queryByText('Preguntas frecuentes:')).not.toBeInTheDocument()

    // Show suggestions again
    const showButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(showButton)

    expect(screen.getByText('Preguntas frecuentes:')).toBeInTheDocument()
  })
})
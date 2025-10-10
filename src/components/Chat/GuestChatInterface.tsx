'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Loader2,
  LogOut,
  User,
  Bot,
  Calendar,
  AlertCircle,
  RefreshCw,
  Menu,
  X,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { EntityBadge } from './EntityBadge'
import { FollowUpSuggestions } from './FollowUpSuggestions'
import ConversationList from './ConversationList'
import ComplianceReminder from '@/components/Compliance/ComplianceReminder'
import ComplianceConfirmation from '@/components/Compliance/ComplianceConfirmation'
import ComplianceSuccess from '@/components/Compliance/ComplianceSuccess'
import type { GuestChatInterfaceProps, GuestChatMessage, TrackedEntity } from '@/lib/guest-chat-types'

interface Conversation {
  id: string
  title: string
  last_message: string | null
  updated_at: string
}

interface FileUploadState {
  file: File | null
  preview: string | null
  isUploading: boolean
  isAnalyzing: boolean
  error: string | null
  visionAnalysis: {
    description: string
    confidence: number
  } | null
  extractedData: {
    name?: string
    passportNumber?: string
    nationality?: string
    birthDate?: string
    expiryDate?: string
  } | null
}

interface TopicSuggestion {
  topic: string
  confidence: number
}

/**
 * GuestChatInterface Component
 *
 * Complete conversational chat interface for guests
 * Features: Message history, entity tracking, follow-up suggestions, auto-scroll, responsive design
 */
export function GuestChatInterface({ session, token, onLogout }: GuestChatInterfaceProps) {
  const [messages, setMessages] = useState<GuestChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackedEntities, setTrackedEntities] = useState<Map<string, TrackedEntity>>(new Map())
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([])

  // Multi-conversation state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)

  // Topic suggestion state (FASE 2.6 - Conversation Intelligence)
  const [topicSuggestion, setTopicSuggestion] = useState<TopicSuggestion | null>(null)

  // File upload state
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    preview: null,
    isUploading: false,
    isAnalyzing: false,
    error: null,
    visionAnalysis: null,
    extractedData: null,
  })
  const [showFilePreview, setShowFilePreview] = useState(false)

  // Compliance modal states
  const [showComplianceModal, setShowComplianceModal] = useState(false)
  const [showComplianceSuccess, setShowComplianceSuccess] = useState(false)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complianceData, setComplianceData] = useState<{
    conversational_data: any
    sire_data: any
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load chat history when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadChatHistory()
    }
  }, [activeConversationId])

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Keyboard shortcuts - ESC to close topic suggestion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && topicSuggestion) {
        setTopicSuggestion(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [topicSuggestion])

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const loadConversations = async () => {
    setIsLoadingConversations(true)

    try {
      const response = await fetch('/api/guest/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al cargar conversaciones')
      }

      const data = await response.json()
      const loadedConversations = data.conversations || []
      setConversations(loadedConversations)

      // First-time user: Create welcome conversation automatically
      if (loadedConversations.length === 0) {
        console.log('[GuestChat] First-time user detected - creating welcome conversation')
        await createWelcomeConversation()
      } else {
        // Returning user: Auto-select latest conversation
        const latestConversation = loadedConversations[0] // Already sorted by updated_at DESC
        setActiveConversationId(latestConversation.id)
      }
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  /**
   * Creates welcome conversation for first-time users
   * Sends "Hola" to chat engine to generate personalized welcome message
   */
  const createWelcomeConversation = async () => {
    try {
      // 1. Create conversation with "¡Bienvenido! 👋" title
      const createResponse = await fetch('/api/guest/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '¡Bienvenido! 👋',
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Error creating welcome conversation')
      }

      const createData = await createResponse.json()
      const welcomeConversation = createData.conversation

      console.log('[GuestChat] Welcome conversation created:', welcomeConversation.id)

      // 2. Add to conversations list
      const newConversation: Conversation = {
        id: welcomeConversation.id,
        title: welcomeConversation.title,
        last_message: welcomeConversation.last_message,
        updated_at: welcomeConversation.updated_at,
      }
      setConversations([newConversation])
      setActiveConversationId(welcomeConversation.id)

      // 3. Auto-send "Hola" to trigger personalized welcome message
      await sendWelcomeMessage(welcomeConversation.id)

    } catch (error) {
      console.error('[GuestChat] Failed to create welcome conversation:', error)
      // Non-blocking error - user can still create conversation manually
    }
  }

  /**
   * Sends "Hola" to chat engine to generate personalized welcome
   * Reuses existing chat engine logic (includes guest name + accommodation)
   */
  const sendWelcomeMessage = async (conversationId: string) => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/guest/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: 'Hola',
          conversation_id: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send welcome message')
      }

      const data = await response.json()

      console.log('[GuestChat] Welcome message received')

      // Add user message "Hola" and AI response to messages
      const userMessage: GuestChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: 'Hola',
        entities: [],
        timestamp: new Date(),
      }

      const assistantMessage: GuestChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        entities: data.entities || [],
        timestamp: new Date(),
      }

      setMessages([userMessage, assistantMessage])
      setFollowUpSuggestions(data.followUpSuggestions || [])

      // Update tracked entities
      if (data.entities && data.entities.length > 0) {
        setTrackedEntities((prev) => {
          const updated = new Map(prev)
          data.entities.forEach((entity: string) => {
            updated.set(entity, {
              name: entity,
              type: 'other',
              firstMentioned: new Date(),
              mentionCount: 1,
            })
          })
          return updated
        })
      }

    } catch (error) {
      console.error('[GuestChat] Failed to send welcome message:', error)
      // Non-blocking error
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/guest/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Nueva conversación',
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear conversación')
      }

      const data = await response.json()

      // Add new conversation to list
      const newConversation: Conversation = {
        id: data.conversation.id,
        title: data.conversation.title,
        last_message: data.conversation.last_message,
        updated_at: data.conversation.updated_at,
      }

      setConversations((prev) => [newConversation, ...prev])
      setActiveConversationId(data.conversation.id)

      // Clear current messages
      setMessages([])
      setTrackedEntities(new Map())
      setFollowUpSuggestions([])

      // Close sidebar on mobile
      setIsSidebarOpen(false)
    } catch (err) {
      console.error('Error creating conversation:', err)
      setError('No se pudo crear la conversación')
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)

    // Clear current state
    setMessages([])
    setTrackedEntities(new Map())
    setFollowUpSuggestions([])

    // Close sidebar on mobile
    setIsSidebarOpen(false)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/guest/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al eliminar conversación')
      }

      // Remove from list
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))

      // If deleted conversation was active, select another
      if (conversationId === activeConversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId)
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id)
          // Messages will be loaded automatically by useEffect
        } else {
          setActiveConversationId(null)
          setMessages([])
          setTrackedEntities(new Map())
          setFollowUpSuggestions([])
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError('No se pudo eliminar la conversación')
    }
  }

  const loadChatHistory = async () => {
    if (!activeConversationId) return

    setIsLoadingHistory(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/guest/chat/history?conversation_id=${activeConversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Error al cargar el historial')
      }

      const data = await response.json()

      // Convert API messages to GuestChatMessage format
      const historyMessages: GuestChatMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
        entities: msg.entities || [],
      }))

      setMessages(historyMessages)

      // Extract entities from history
      historyMessages.forEach((msg) => {
        if (msg.entities) {
          msg.entities.forEach((entity) => {
            updateTrackedEntity(entity)
          })
        }
      })

      // Add welcome message if no history
      if (historyMessages.length === 0) {
        const accommodationInfo = session.accommodation_unit
          ? `\n\nEstás alojado en **${session.accommodation_unit.name}${session.accommodation_unit.unit_number ? ` #${session.accommodation_unit.unit_number}` : ''}**${session.accommodation_unit.view_type ? ` con ${session.accommodation_unit.view_type}` : ''}.`
          : ''

        const welcomeMessage: GuestChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: `¡Hola **${session.guest_name}**! 👋${accommodationInfo}

Bienvenido a tu asistente personal. Puedo ayudarte con:

- 🏨 Información sobre las habitaciones y amenidades del hotel
- 🌴 Actividades turísticas y lugares de interés cercanos
- 🍽️ Restaurantes y opciones gastronómicas
- 🚕 Transporte y cómo llegar a diferentes lugares

¿En qué puedo ayudarte hoy?`,
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
      }
    } catch (err) {
      console.error('Error loading history:', err)
      setError('No se pudo cargar el historial de chat')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const updateTrackedEntity = (entityName: string) => {
    setTrackedEntities((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(entityName)

      if (existing) {
        newMap.set(entityName, {
          ...existing,
          mentionCount: existing.mentionCount + 1,
        })
      } else {
        // Infer type from name (simple heuristic)
        const type = inferEntityType(entityName)
        newMap.set(entityName, {
          name: entityName,
          type,
          firstMentioned: new Date(),
          mentionCount: 1,
        })
      }

      return newMap
    })
  }

  const inferEntityType = (entity: string): TrackedEntity['type'] => {
    const lowerEntity = entity.toLowerCase()
    if (lowerEntity.includes('buceo') || lowerEntity.includes('surf') || lowerEntity.includes('tour')) {
      return 'activity'
    }
    if (lowerEntity.includes('playa') || lowerEntity.includes('restaurante') || lowerEntity.includes('hotel')) {
      return 'place'
    }
    if (lowerEntity.includes('wifi') || lowerEntity.includes('piscina') || lowerEntity.includes('terraza')) {
      return 'amenity'
    }
    return 'other'
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()

    if (!textToSend || isLoading) {
      return
    }

    // Clear input immediately for better UX
    setInput('')
    setError(null)
    setIsLoading(true)

    // Add user message to UI
    const userMessage: GuestChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch('/api/guest/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          conversation_id: activeConversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: GuestChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        entities: data.entities || [],
        sources: data.sources || [],
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update tracked entities
      if (data.entities) {
        data.entities.forEach((entity: string) => {
          updateTrackedEntity(entity)
        })
      }

      // Update follow-up suggestions
      if (data.followUpSuggestions) {
        setFollowUpSuggestions(data.followUpSuggestions)
      }

      // Update topic suggestion (FASE 2.6 - Conversation Intelligence)
      if (data.topicSuggestion) {
        setTopicSuggestion({
          topic: data.topicSuggestion.topic,
          confidence: data.topicSuggestion.confidence || 0.8,
        })
      }

      // Update conversation in list (update last_message and updated_at)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, last_message: textToSend, updated_at: new Date().toISOString() }
            : conv
        )
      )

      // Auto-generate title from first user message if title is default
      if (messages.filter((m) => m.role === 'user').length === 0) {
        const generatedTitle = textToSend.slice(0, 50) + (textToSend.length > 50 ? '...' : '')

        // Update title in backend
        try {
          await fetch(`/api/guest/conversations/${activeConversationId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title: generatedTitle }),
          })

          // Update title in local state
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeConversationId
                ? { ...conv, title: generatedTitle }
                : conv
            )
          )
        } catch (err) {
          console.error('Error updating conversation title:', err)
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('No se pudo enviar el mensaje. Intenta de nuevo.')

      // Add error message to UI
      const errorMessage: GuestChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content)
    }
  }

  const handleCreateTopicConversation = async (topic: string) => {
    try {
      // Create nueva conversación con título del topic
      const response = await fetch('/api/guest/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: topic,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear conversación')
      }

      const data = await response.json()

      // Add new conversation to list
      const newConversation: Conversation = {
        id: data.conversation.id,
        title: data.conversation.title,
        last_message: data.conversation.last_message,
        updated_at: data.conversation.updated_at,
      }

      setConversations((prev) => [newConversation, ...prev])
      setActiveConversationId(data.conversation.id)

      // Clear current state
      setMessages([])
      setTrackedEntities(new Map())
      setFollowUpSuggestions([])
      setTopicSuggestion(null)

      // Close sidebar on mobile
      setIsSidebarOpen(false)

      // Optional: Send initial message about the topic
      setTimeout(() => {
        handleSendMessage(`Cuéntame más sobre ${topic}`)
      }, 500)
    } catch (err) {
      console.error('Error creating topic conversation:', err)
      setError('No se pudo crear la conversación sobre este tema')
    }
  }

  const formatDate = (date: string | undefined): string => {
    if (!date || typeof date !== 'string') {
      return 'N/A'
    }

    // Parse YYYY-MM-DD string to local date (not UTC) to avoid timezone issues
    const parts = date.split('-')
    if (parts.length !== 3) {
      return date // Return original string if not in expected format
    }

    const [year, month, day] = parts.map(Number)
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return date // Return original string if parsing failed
    }

    const dateObj = new Date(year, month - 1, day)  // month is 0-indexed

    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      return 'N/A'
    }

    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  }

  // File upload handlers
  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setFileUpload((prev) => ({
        ...prev,
        error: 'El archivo es demasiado grande (máximo 10MB)',
      }))
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setFileUpload((prev) => ({
        ...prev,
        error: 'Formato no permitido. Solo imágenes (JPEG, PNG, WEBP) y PDF.',
      }))
      return
    }

    // Create preview URL for images
    let preview: string | null = null
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    setFileUpload({
      file,
      preview,
      isUploading: false,
      isAnalyzing: false,
      error: null,
      visionAnalysis: null,
      extractedData: null,
    })

    setShowFilePreview(true)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancelUpload = () => {
    if (fileUpload.preview) {
      URL.revokeObjectURL(fileUpload.preview)
    }
    setFileUpload({
      file: null,
      preview: null,
      isUploading: false,
      isAnalyzing: false,
      error: null,
      visionAnalysis: null,
      extractedData: null,
    })
    setShowFilePreview(false)
  }

  const handleAnalyzeImage = async () => {
    if (!fileUpload.file || !activeConversationId) return

    setFileUpload((prev) => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const formData = new FormData()
      formData.append('file', fileUpload.file)
      formData.append('analyze', 'true')

      const response = await fetch(`/api/guest/conversations/${activeConversationId}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al analizar la imagen')
      }

      const data = await response.json()

      setFileUpload((prev) => ({
        ...prev,
        isAnalyzing: false,
        visionAnalysis: data.visionAnalysis || null,
        extractedData: data.extractedData || null,
      }))
    } catch (err) {
      console.error('Error analyzing image:', err)
      setFileUpload((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: 'No se pudo analizar la imagen. Intenta de nuevo.',
      }))
    }
  }

  const handleUploadFile = async () => {
    if (!fileUpload.file || !activeConversationId) return

    setFileUpload((prev) => ({ ...prev, isUploading: true, error: null }))

    try {
      const formData = new FormData()
      formData.append('file', fileUpload.file)

      const response = await fetch(`/api/guest/conversations/${activeConversationId}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al subir el archivo')
      }

      const data = await response.json()

      // Create a message with the file info
      const fileMessage = `📎 Archivo subido: ${fileUpload.file.name}`

      if (data.visionAnalysis?.description) {
        // If we have vision analysis, send it as context
        await handleSendMessage(`${fileMessage}\n\nAnálisis de la imagen: ${data.visionAnalysis.description}`)
      } else {
        // Just acknowledge the upload
        const uploadMessage: GuestChatMessage = {
          id: `file-${Date.now()}`,
          role: 'assistant',
          content: `✅ Archivo recibido: **${fileUpload.file.name}**`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, uploadMessage])
      }

      // Close modal and reset state
      handleCancelUpload()
    } catch (err) {
      console.error('Error uploading file:', err)
      setFileUpload((prev) => ({
        ...prev,
        isUploading: false,
        error: 'No se pudo subir el archivo. Intenta de nuevo.',
      }))
    }
  }

  const handleComplianceSubmit = async (data: any) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/compliance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationalData: data.conversational_data,
          reservationId: session.reservation_id,
          conversationId: activeConversationId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      const result = await response.json()

      // Success: cerrar modal, mostrar success screen
      setSubmissionData(result)
      setShowComplianceModal(false)
      setShowComplianceSuccess(true)
    } catch (err: any) {
      console.error('Compliance submission error:', err)
      // Error handling se maneja en ComplianceConfirmation
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditField = (field: string, value: any) => {
    // Update complianceData with edited value
    setComplianceData((prev: any) => ({
      ...prev,
      conversational_data: {
        ...prev?.conversational_data,
        [field]: value,
      },
    }))
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Sidebar (Desktop: always visible, Mobile: drawer overlay) */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-0
          w-80 h-full
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-slate-200 shadow-lg lg:shadow-none
        `}
      >
        <div className="h-full flex flex-col">
          {/* ComplianceReminder banner */}
          <div className="flex-shrink-0 p-4">
            <ComplianceReminder
              onStart={() => setShowComplianceModal(true)}
              onDismiss={() => {
                // Handle dismiss if needed
              }}
              reservation={{
                document_type: null,
                document_number: null,
                birth_date: null,
                first_surname: null,
                second_surname: null,
                given_names: null,
                nationality_code: null,
                origin_city_code: null,
                destination_city_code: null,
                movement_type: null,
                movement_date: null,
                hotel_sire_code: null,
                hotel_city_code: null,
              }}
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-hidden">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* File Preview Modal */}
      {showFilePreview && fileUpload.file && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Vista previa del archivo</h3>
              <button
                onClick={handleCancelUpload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <XCircle className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Image Preview */}
              {fileUpload.preview && (
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={fileUpload.preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {fileUpload.file.type.startsWith('image/') ? (
                  <ImageIcon className="h-8 w-8 text-blue-600" />
                ) : (
                  <FileText className="h-8 w-8 text-red-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{fileUpload.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Vision Analysis Results */}
              {fileUpload.visionAnalysis && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Análisis de IA</h4>
                      <p className="text-sm text-blue-800">{fileUpload.visionAnalysis.description}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Confianza: {(fileUpload.visionAnalysis.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Passport Data */}
              {fileUpload.extractedData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">Datos extraídos del pasaporte</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {fileUpload.extractedData.name && (
                          <div>
                            <p className="text-green-700 font-medium">Nombre:</p>
                            <p className="text-green-800">{fileUpload.extractedData.name}</p>
                          </div>
                        )}
                        {fileUpload.extractedData.passportNumber && (
                          <div>
                            <p className="text-green-700 font-medium">Pasaporte:</p>
                            <p className="text-green-800">{fileUpload.extractedData.passportNumber}</p>
                          </div>
                        )}
                        {fileUpload.extractedData.nationality && (
                          <div>
                            <p className="text-green-700 font-medium">Nacionalidad:</p>
                            <p className="text-green-800">{fileUpload.extractedData.nationality}</p>
                          </div>
                        )}
                        {fileUpload.extractedData.birthDate && (
                          <div>
                            <p className="text-green-700 font-medium">Fecha de nacimiento:</p>
                            <p className="text-green-800">{fileUpload.extractedData.birthDate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {fileUpload.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-800">{fileUpload.error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {/* Analyze button (only for images, if not already analyzed) */}
                {fileUpload.file.type.startsWith('image/') && !fileUpload.visionAnalysis && (
                  <Button
                    onClick={handleAnalyzeImage}
                    disabled={fileUpload.isAnalyzing || fileUpload.isUploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {fileUpload.isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Analizar con IA
                      </>
                    )}
                  </Button>
                )}

                {/* Upload button */}
                <Button
                  onClick={handleUploadFile}
                  disabled={fileUpload.isAnalyzing || fileUpload.isUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {fileUpload.isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir archivo
                    </>
                  )}
                </Button>

                {/* Cancel button */}
                <Button
                  onClick={handleCancelUpload}
                  disabled={fileUpload.isAnalyzing || fileUpload.isUploading}
                  variant="outline"
                  className="border-gray-300"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{session.guest_name}</h1>
              {session.accommodation_unit && (
                <p className="text-xs font-medium text-blue-600">
                  {session.accommodation_unit.name}{session.accommodation_unit.unit_number ? ` #${session.accommodation_unit.unit_number}` : ''}
                  {session.accommodation_unit.view_type && ` • ${session.accommodation_unit.view_type}`}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDate(session.check_in)} - {formatDate(session.check_out)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
        </header>

        {/* Entity Badges */}
        {trackedEntities.size > 0 && (
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-2">
            <div className="max-w-4xl mx-auto">
            <p className="text-xs text-gray-500 mb-2">Hablando sobre:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(trackedEntities.values()).map((entity) => (
                <EntityBadge
                  key={entity.name}
                  entity={entity.name}
                  type={entity.type}
                  onClick={() => handleSendMessage(`Cuéntame más sobre ${entity.name}`)}
                />
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !activeConversationId ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center max-w-md px-4">
                  <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Bienvenido a tu asistente de viaje
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Para comenzar, crea una nueva conversación haciendo click en el botón <strong>"Nueva conversación"</strong> en la barra lateral.
                  </p>
                  <p className="text-sm text-gray-400">
                    Puedes crear múltiples conversaciones para organizar tus preguntas por tema.
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center max-w-md px-4">
                  <Bot className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    ¡Conversación iniciada!
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Escribe tu primera pregunta abajo. Puedo ayudarte con información sobre:
                  </p>
                  <ul className="text-left text-sm text-gray-600 space-y-1 mb-4">
                    <li>🏖️ Actividades turísticas en San Andrés</li>
                    <li>🍽️ Restaurantes y gastronomía local</li>
                    <li>🏨 Información sobre tu alojamiento</li>
                    <li>🚕 Transporte y movilidad</li>
                  </ul>
                  <p className="text-xs text-gray-400">
                    Tip: Puedo recordar el contexto de nuestra conversación para darte mejores respuestas.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-message-in ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`flex-1 max-w-[75%] ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => (
                                <strong className={message.role === 'user' ? 'font-bold' : 'font-semibold text-blue-900'}>
                                  {children}
                                </strong>
                              ),
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                              li: ({ children }) => <li>{children}</li>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Sources (only for assistant messages) */}
                      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                        <div className="mt-2 px-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Fuentes:</p>
                          <div className="space-y-1">
                            {message.sources.slice(0, 3).map((source, idx) => (
                              <div key={idx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                {source.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-1 px-2">
                        {message.timestamp?.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-3 animate-message-in">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-typing-dot" />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          </ScrollArea>
        </div>

        {/* Follow-up Suggestions */}
        {followUpSuggestions.length > 0 && !isLoading && (
          <div className="flex-shrink-0 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <FollowUpSuggestions
              suggestions={followUpSuggestions}
              onSuggestionClick={handleSendMessage}
            />
            </div>
          </div>
        )}

        {/* Topic Suggestion Banner (FASE 2.6 - Conversation Intelligence) */}
        <AnimatePresence>
          {topicSuggestion && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200"
            >
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                      Nueva conversación sugerida
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      He notado que estás hablando sobre{' '}
                      <span className="font-medium text-blue-700">
                        {topicSuggestion.topic}
                      </span>
                      . ¿Te gustaría crear una conversación dedicada para este tema?
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleCreateTopicConversation(topicSuggestion.topic)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        aria-label={`Crear conversación sobre ${topicSuggestion.topic}`}
                      >
                        Sí, crear conversación
                      </button>
                      <button
                        onClick={() => setTopicSuggestion(null)}
                        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        aria-label="Continuar en conversación actual"
                      >
                        No, continuar aquí
                      </button>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setTopicSuggestion(null)}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Cerrar sugerencia"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Bar */}
        {error && (
          <div className="flex-shrink-0 bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reintentar
            </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2 items-end">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Seleccionar archivo"
            />

            {/* Paperclip button */}
            <Button
              onClick={handleFileButtonClick}
              disabled={isLoading}
              variant="outline"
              className="h-11 w-11 rounded-full flex items-center justify-center transition-colors hover:bg-blue-50 hover:border-blue-300"
              aria-label="Adjuntar archivo"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </Button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[120px] min-h-[44px]"
              rows={1}
              disabled={isLoading}
              aria-label="Mensaje"
            />

            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Enviar mensaje"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Send className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> para enviar •{' '}
            <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Shift+Enter</kbd> para nueva línea
          </p>
          </div>
        </div>
      </div>

      {/* ComplianceConfirmation Modal */}
      {showComplianceModal && complianceData && (
        <ComplianceConfirmation
          complianceData={complianceData.conversational_data}
          onConfirm={() => handleComplianceSubmit(complianceData)}
          onCancel={() => setShowComplianceModal(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* ComplianceSuccess Screen */}
      {showComplianceSuccess && submissionData && (
        <ComplianceSuccess
          submissionData={{
            submission_id: submissionData.submissionId || submissionData.id || '',
            reservation_id: session.reservation_id,
            sire_reference: submissionData.sireReference || submissionData.mockRefs?.sireRef,
          }}
          onClose={() => {
            setShowComplianceSuccess(false)
            // Auto-dismiss reminder
            if (typeof window !== 'undefined') {
              localStorage.setItem('compliance_reminder_dismissed', 'true')
            }
          }}
        />
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing-dot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .animate-message-in {
          animation: message-in 0.3s ease-out;
          animation-fill-mode: both;
        }

        .animate-typing-dot {
          animation: typing-dot 1.4s infinite;
        }

        /* Mobile keyboard handling */
        @media (max-width: 768px) {
          .h-screen {
            height: 100dvh;
          }
        }

        /* Markdown styles for messages */
        .prose {
          color: inherit;
        }

        .prose strong {
          color: inherit;
        }

        .prose ul {
          margin: 0;
        }
      `}</style>
    </div>
  )
}

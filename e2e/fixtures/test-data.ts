/**
 * Test data fixtures for Guest Chat E2E tests
 *
 * IMPORTANT: These credentials must exist in the database for tests to pass.
 * Run the setup script before running tests: npm run test:e2e:setup
 */

export const testReservation = {
  // Valid test reservation
  valid: {
    tenantId: 'test-hotel',
    checkInDate: '2025-10-05', // Near future date
    phoneLast4: '1234',
    expectedGuestName: 'Test Guest',
    expectedReservationCode: 'TEST001',
  },

  // Invalid credentials
  invalid: {
    checkInDate: '2025-01-01', // Old date
    phoneLast4: '9999', // Non-existent
  },

  // Future reservation
  future: {
    checkInDate: '2025-11-15',
    phoneLast4: '5678',
  },
}

export const testQueries = {
  // General greeting
  greeting: 'Hello, what activities are available?',

  // Tourism query
  tourism: 'What are the best beaches nearby?',

  // Accommodation query
  accommodation: 'Does my room have a balcony?',

  // Follow-up query
  followUp: 'Tell me more about that',

  // Complex query
  complex: 'I want to go snorkeling tomorrow morning, where should I go and how much does it cost?',
}

export const expectedResponses = {
  // Should mention activities
  hasActivities: /actividad|tour|buceo|playa|surf/i,

  // Should have markdown formatting
  hasMarkdown: /\*\*|\*|#|-/,

  // Should have business info (for tourism queries)
  hasBusinessInfo: /\$|precio|teléfono|zona/i,

  // Should be conversational
  isConversational: /puedo|puedes|recomiendo|sugiero/i,
}

export const selectors = {
  // Login page
  login: {
    checkInDateInput: '#check_in_date',
    phoneLast4Input: '#phone_last_4',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"]',
    loadingIndicator: 'text=Verificando...',
  },

  // Chat interface
  chat: {
    messageInput: 'textarea[aria-label="Mensaje"]',
    sendButton: 'button[aria-label="Enviar mensaje"]',
    messageList: '[class*="space-y-4"]',
    userMessage: '[class*="bg-blue-600"]',
    assistantMessage: '[class*="bg-white"][class*="border"]',
    typingIndicator: '.animate-typing-dot',
    logoutButton: 'button:has-text("Salir")',
    errorBar: '.bg-red-50',
    retryButton: 'button:has-text("Reintentar")',
    followUpSuggestion: '[data-testid="follow-up-suggestion"]',
    entityBadge: '[data-testid="entity-badge"]',
  },

  // Header
  header: {
    guestName: 'h1',
    dates: 'span:has-text("-")',
  },
}

export const timeouts = {
  login: 5000,
  messageSend: 10000,
  aiResponse: 15000,
  navigation: 5000,
}

export const viewports = {
  mobile: {
    width: 375,
    height: 667,
  },
  mobileLarge: {
    width: 414,
    height: 896,
  },
  tablet: {
    width: 768,
    height: 1024,
  },
  desktop: {
    width: 1920,
    height: 1080,
  },
}

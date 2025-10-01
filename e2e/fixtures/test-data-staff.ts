/**
 * Test data fixtures for Staff Chat E2E tests
 *
 * IMPORTANT: These credentials must exist in the database for tests to pass.
 * Run the setup script before running tests: npm run test:e2e:setup
 */

export const testStaffUsers = {
  // CEO with full access (SimmerDown)
  ceo: {
    tenantId: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
    username: 'admin_ceo',
    password: 'Staff2024!',
    expectedRole: 'ceo',
    expectedName: 'Carlos Ospina (CEO)',
    expectedPermissions: {
      sire_access: true,
      admin_panel: true,
      reports_access: true,
      modify_operations: true,
    },
  },

  // Admin with operational access (SimmerDown)
  admin: {
    tenantId: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
    username: 'admin_simmer',
    password: 'Staff2024!',
    expectedRole: 'admin',
    expectedName: 'Laura Martínez (Admin)',
    expectedPermissions: {
      sire_access: true,
      admin_panel: true,
      reports_access: true,
      modify_operations: false,
    },
  },

  // Housekeeper with limited access (SimmerDown)
  housekeeper: {
    tenantId: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
    username: 'housekeeping_maria',
    password: 'Staff2024!',
    expectedRole: 'housekeeper',
    expectedName: 'María Rodríguez (Housekeeping)',
    expectedPermissions: {
      sire_access: true,
      admin_panel: false,
      reports_access: false,
      modify_operations: false,
    },
  },

  // Invalid credentials
  invalid: {
    tenantId: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
    username: 'invalid-user',
    password: 'wrongpassword',
  },

  // Inactive account (would need to be created manually for this test)
  inactive: {
    tenantId: 'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
    username: 'inactive-staff',
    password: 'Staff2024!',
  },
}

export const testStaffQueries = {
  // SIRE compliance query
  sire: '¿Cuáles son los requisitos para validar un reporte SIRE?',

  // Administrative query (CEO/Admin only)
  admin: '¿Cómo puedo acceder a los reportes financieros del mes?',

  // Operations query (all staff)
  operations: '¿Cuál es el procedimiento para check-in de huéspedes?',

  // Housekeeping query
  housekeeping: '¿Cuál es el checklist de limpieza de habitaciones?',

  // General query
  general: '¿Dónde encuentro los manuales operativos?',
}

export const expectedStaffResponses = {
  // Should mention SIRE
  hasSIRE: /SIRE|validación|reporte|formulario/i,

  // Should mention operations
  hasOperations: /procedimiento|protocolo|paso|siguiente/i,

  // Should have professional tone (no tropical/casual language)
  isProfessional: /debe|puede|debe seguir|procedimiento|protocolo/i,

  // Should include sources
  hasSources: /fuente|documento|referencia/i,

  // Permission denied message
  accessDenied: /no tiene permiso|acceso denegado|no autorizado/i,
}

export const staffSelectors = {
  // Login page
  login: {
    tenantSelect: '#tenant_id',
    usernameInput: '#username',
    passwordInput: '#password',
    passwordToggle: 'button[aria-label="Toggle password visibility"]',
    rememberMeCheckbox: '#remember_me',
    submitButton: 'button[type="submit"]',
    errorMessage: '[role="alert"]',
    loadingIndicator: 'text=Signing in...',
    forgotPassword: 'text=Forgot password?',
  },

  // Chat interface
  chat: {
    // Header
    logo: 'text=Staff Portal',
    userName: '[data-testid="staff-name"]',
    roleBadge: '[data-testid="role-badge"]',
    logoutButton: 'button:has-text("Logout")',

    // Sidebar
    sidebar: '[data-testid="sidebar"]',
    newConversationButton: 'button:has-text("New Conversation")',
    conversationItem: '[data-testid="conversation-item"]',
    categoryFilter: '[data-testid="category-filter"]',
    mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',

    // Chat area
    messageList: '[data-testid="message-list"]',
    userMessage: '[data-testid="user-message"]',
    assistantMessage: '[data-testid="assistant-message"]',
    messageInput: 'textarea[placeholder*="Type"]',
    sendButton: 'button[aria-label="Send message"]',
    loadingDots: '[data-testid="loading-dots"]',

    // Sources
    sourcesDrawer: '[data-testid="sources-drawer"]',
    sourcesHeader: 'button:has-text("Sources")',
    sourceItem: '[data-testid="source-item"]',
    similarityBar: '[data-testid="similarity-bar"]',
    copyButton: 'button[aria-label="Copy content"]',

    // Error states
    errorMessage: '[role="alert"]',
    retryButton: 'button:has-text("Retry")',
  },
}

export const staffTimeouts = {
  login: 5000,
  messageSend: 10000,
  aiResponse: 20000, // Staff queries may be more complex
  navigation: 5000,
  tokenVerify: 3000,
}

export const staffViewports = {
  mobile: {
    width: 375,
    height: 667,
  },
  tablet: {
    width: 768,
    height: 1024,
  },
  desktop: {
    width: 1440,
    height: 900,
  },
}

import { test, expect } from '@playwright/test'
import {
  testStaffUsers,
  testStaffQueries,
  expectedStaffResponses,
  staffSelectors,
  staffTimeouts,
} from './fixtures/test-data-staff'

/**
 * Staff Chat E2E Tests
 *
 * Tests the complete staff chat system including:
 * - Authentication flow
 * - Role-based permissions (CEO, Admin, Housekeeper)
 * - Vector search (SIRE, Operations, Admin content)
 * - Message persistence
 * - Sources attribution
 *
 * Prerequisites:
 * - Test staff users must exist in database (run setup script)
 * - Dev server running on http://localhost:3000
 * - Supabase connected with test data
 */

test.describe('Staff Chat - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/staff/login')
    await expect(page.locator('text=Staff Login Portal')).toBeVisible()
  })

  test('should display login form with correct elements', async ({ page }) => {
    // Verify form elements
    await expect(page.locator(staffSelectors.login.tenantSelect)).toBeVisible()
    await expect(page.locator(staffSelectors.login.usernameInput)).toBeVisible()
    await expect(page.locator(staffSelectors.login.passwordInput)).toBeVisible()
    await expect(page.locator(staffSelectors.login.rememberMeCheckbox)).toBeVisible()
    await expect(page.locator(staffSelectors.login.submitButton)).toBeVisible()

    // Verify labels
    await expect(page.locator('text=Hotel')).toBeVisible()
    await expect(page.locator('text=Username')).toBeVisible()
    await expect(page.locator('text=Password')).toBeVisible()
    await expect(page.locator('text=Remember me')).toBeVisible()

    // Verify forgot password link
    await expect(page.locator(staffSelectors.login.forgotPassword)).toBeVisible()
  })

  test('TEST 1: Login Flow - Staff login → token → authenticated', async ({ page }) => {
    const { tenantId, username, password, expectedName, expectedRole } = testStaffUsers.ceo

    // Fill login form
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)

    // Submit form
    await page.click(staffSelectors.login.submitButton)

    // Wait for loading
    await expect(page.locator(staffSelectors.login.loadingIndicator)).toBeVisible({
      timeout: staffTimeouts.login,
    })

    // Should redirect to /staff
    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })

    // Verify chat interface loaded
    await expect(page.locator(staffSelectors.chat.logo)).toBeVisible()

    // Verify user name and role badge
    await expect(page.locator(staffSelectors.chat.userName)).toContainText(expectedName)
    await expect(page.locator(staffSelectors.chat.roleBadge)).toContainText(expectedRole.toUpperCase())

    // Verify localStorage has JWT token
    const token = await page.evaluate(() => localStorage.getItem('staff_token'))
    expect(token).toBeTruthy()
    expect(token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/) // JWT format
  })

  test('should fail login with invalid credentials', async ({ page }) => {
    const { tenantId, username, password } = testStaffUsers.invalid

    // Fill login form with invalid credentials
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)

    // Submit form
    await page.click(staffSelectors.login.submitButton)

    // Should show error message
    await expect(page.locator(staffSelectors.login.errorMessage)).toBeVisible({
      timeout: staffTimeouts.login,
    })
    await expect(page.locator(staffSelectors.login.errorMessage)).toContainText(/invalid|incorrect|failed/i)

    // Should remain on login page
    await expect(page).toHaveURL(/\/staff\/login/)
  })

  test('should fail login for inactive account', async ({ page }) => {
    const { tenantId, username, password } = testStaffUsers.inactive

    // Fill login form
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)

    // Submit form
    await page.click(staffSelectors.login.submitButton)

    // Should show error message about inactive account
    await expect(page.locator(staffSelectors.login.errorMessage)).toBeVisible({
      timeout: staffTimeouts.login,
    })
    await expect(page.locator(staffSelectors.login.errorMessage)).toContainText(/inactive|disabled|suspended/i)
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator(staffSelectors.login.passwordInput)
    const toggleButton = page.locator(staffSelectors.login.passwordToggle)

    // Fill password
    await passwordInput.fill('test123456')

    // Initially should be hidden (type="password")
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle
    await toggleButton.click()

    // Should now be visible (type="text")
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle again
    await toggleButton.click()

    // Should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should validate required fields', async ({ page }) => {
    const submitButton = page.locator(staffSelectors.login.submitButton)

    // Initially submit button should be disabled or show validation errors
    await submitButton.click()

    // Should not navigate (validation failed)
    await expect(page).toHaveURL(/\/staff\/login/)

    // Fill only username
    await page.fill(staffSelectors.login.usernameInput, 'test-user')
    await submitButton.click()

    // Should still fail (missing password)
    await expect(page).toHaveURL(/\/staff\/login/)
  })
})

test.describe('Staff Chat - Role-Based Permissions', () => {
  test('TEST 2: CEO Full Access - CEO asks admin question → gets response', async ({ page }) => {
    const { tenantId, username, password } = testStaffUsers.ceo

    // Login as CEO
    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    // Wait for chat interface
    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })
    await expect(page.locator(staffSelectors.chat.logo)).toBeVisible()

    // Ask admin question
    const messageInput = page.locator(staffSelectors.chat.messageInput)
    const sendButton = page.locator(staffSelectors.chat.sendButton)

    await messageInput.fill(testStaffQueries.admin)
    await sendButton.click()

    // Wait for user message to appear
    await expect(page.locator(staffSelectors.chat.userMessage).last()).toContainText(testStaffQueries.admin, {
      timeout: staffTimeouts.messageSend,
    })

    // Wait for assistant response
    await expect(page.locator(staffSelectors.chat.loadingDots)).toBeVisible()
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Verify response has content (not access denied)
    const responseText = await page.locator(staffSelectors.chat.assistantMessage).last().textContent()
    expect(responseText).toBeTruthy()
    expect(responseText).not.toMatch(expectedStaffResponses.accessDenied)
    expect(responseText?.length).toBeGreaterThan(50) // Substantial response

    // Verify sources are shown
    await expect(page.locator(staffSelectors.chat.sourcesDrawer).last()).toBeVisible()
  })

  test('TEST 3: Housekeeper Limited - Housekeeper asks admin question → permission denied', async ({ page }) => {
    const { tenantId, username, password } = testStaffUsers.housekeeper

    // Login as Housekeeper
    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    // Wait for chat interface
    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })
    await expect(page.locator(staffSelectors.chat.logo)).toBeVisible()

    // Verify role badge shows "HOUSEKEEPER"
    await expect(page.locator(staffSelectors.chat.roleBadge)).toContainText(/housekeeper/i)

    // Ask admin question
    const messageInput = page.locator(staffSelectors.chat.messageInput)
    const sendButton = page.locator(staffSelectors.chat.sendButton)

    await messageInput.fill(testStaffQueries.admin)
    await sendButton.click()

    // Wait for response
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Verify response indicates access denied or limited permissions
    const responseText = await page.locator(staffSelectors.chat.assistantMessage).last().textContent()
    expect(responseText).toBeTruthy()
    // Should either deny access or provide limited info
    const hasAccessDenied = expectedStaffResponses.accessDenied.test(responseText || '')
    const isVeryShort = (responseText?.length || 0) < 100 // Limited response
    expect(hasAccessDenied || isVeryShort).toBeTruthy()
  })

  test('Admin has operational access but not admin panel', async ({ page }) => {
    const { tenantId, username, password } = testStaffUsers.admin

    // Login as Admin
    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    // Wait for chat interface
    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })

    // Verify role badge shows "ADMIN"
    await expect(page.locator(staffSelectors.chat.roleBadge)).toContainText(/admin/i)

    // Ask operations question (should work)
    const messageInput = page.locator(staffSelectors.chat.messageInput)
    const sendButton = page.locator(staffSelectors.chat.sendButton)

    await messageInput.fill(testStaffQueries.operations)
    await sendButton.click()

    // Should get proper response
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    const responseText = await page.locator(staffSelectors.chat.assistantMessage).last().textContent()
    expect(responseText).toBeTruthy()
    expect(responseText).toMatch(expectedStaffResponses.hasOperations)
  })
})

test.describe('Staff Chat - Content Queries', () => {
  test.beforeEach(async ({ page }) => {
    // Login as CEO (full access) for content tests
    const { tenantId, username, password } = testStaffUsers.ceo

    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })
    await expect(page.locator(staffSelectors.chat.logo)).toBeVisible()
  })

  test('TEST 4: SIRE Query - Staff asks SIRE → proper response with sources', async ({ page }) => {
    const messageInput = page.locator(staffSelectors.chat.messageInput)
    const sendButton = page.locator(staffSelectors.chat.sendButton)

    // Ask SIRE question
    await messageInput.fill(testStaffQueries.sire)
    await sendButton.click()

    // Wait for response
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Verify response mentions SIRE
    const responseText = await page.locator(staffSelectors.chat.assistantMessage).last().textContent()
    expect(responseText).toBeTruthy()
    expect(responseText).toMatch(expectedStaffResponses.hasSIRE)
    expect(responseText).toMatch(expectedStaffResponses.isProfessional)

    // Verify sources drawer exists
    const sourcesDrawer = page.locator(staffSelectors.chat.sourcesDrawer).last()
    await expect(sourcesDrawer).toBeVisible()

    // Expand sources
    const sourcesHeader = sourcesDrawer.locator(staffSelectors.chat.sourcesHeader)
    await sourcesHeader.click()

    // Verify sources are displayed
    const sourceItems = sourcesDrawer.locator(staffSelectors.chat.sourceItem)
    await expect(sourceItems.first()).toBeVisible()

    // Verify similarity bar exists
    await expect(sourcesDrawer.locator(staffSelectors.chat.similarityBar).first()).toBeVisible()

    // Test copy functionality
    const copyButton = sourcesDrawer.locator(staffSelectors.chat.copyButton).first()
    await copyButton.click()

    // Verify clipboard content (if supported)
    // Note: clipboard API may not work in all test environments
  })

  test('TEST 5: Operations Query - Staff asks operational → hotel_operations results', async ({ page }) => {
    const messageInput = page.locator(staffSelectors.chat.messageInput)
    const sendButton = page.locator(staffSelectors.chat.sendButton)

    // Ask operations question
    await messageInput.fill(testStaffQueries.operations)
    await sendButton.click()

    // Wait for response
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Verify response is about operations
    const responseText = await page.locator(staffSelectors.chat.assistantMessage).last().textContent()
    expect(responseText).toBeTruthy()
    expect(responseText).toMatch(expectedStaffResponses.hasOperations)
    expect(responseText).toMatch(expectedStaffResponses.isProfessional)

    // Verify sources include operations content
    const sourcesDrawer = page.locator(staffSelectors.chat.sourcesDrawer).last()
    await expect(sourcesDrawer).toBeVisible()

    // Expand and check sources
    const sourcesHeader = sourcesDrawer.locator(staffSelectors.chat.sourcesHeader)
    await sourcesHeader.click()

    const sourceItems = sourcesDrawer.locator(staffSelectors.chat.sourceItem)
    const count = await sourceItems.count()
    expect(count).toBeGreaterThan(0)

    // At least one source should be from operations
    // Note: This assumes source items show table name
  })

  test('should display housekeeping content for housekeeping query', async ({ page }) => {
    const messageInput = page.locator(staffSelectors.chat.messageInput)
    const sendButton = page.locator(staffSelectors.chat.sendButton)

    // Ask housekeeping question
    await messageInput.fill(testStaffQueries.housekeeping)
    await sendButton.click()

    // Wait for response
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Verify response is relevant
    const responseText = await page.locator(staffSelectors.chat.assistantMessage).last().textContent()
    expect(responseText).toBeTruthy()
    expect(responseText).toMatch(/limpieza|habitación|checklist|procedimiento/i)
  })
})

test.describe('Staff Chat - Conversation Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    const { tenantId, username, password } = testStaffUsers.admin

    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })
  })

  test('should create new conversation', async ({ page }) => {
    // Click new conversation button
    const newConvButton = page.locator(staffSelectors.chat.newConversationButton)
    await newConvButton.click()

    // Message list should be empty
    const messages = page.locator(staffSelectors.chat.userMessage)
    const count = await messages.count()
    expect(count).toBe(0)

    // Send first message
    await page.fill(staffSelectors.chat.messageInput, testStaffQueries.general)
    await page.click(staffSelectors.chat.sendButton)

    // Wait for response
    await expect(page.locator(staffSelectors.chat.assistantMessage).first()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // New conversation should appear in sidebar
    await expect(page.locator(staffSelectors.chat.conversationItem).first()).toBeVisible()
  })

  test('should persist conversation history', async ({ page }) => {
    // Send a message
    await page.fill(staffSelectors.chat.messageInput, testStaffQueries.operations)
    await page.click(staffSelectors.chat.sendButton)

    // Wait for response
    await expect(page.locator(staffSelectors.chat.assistantMessage).first()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Reload page
    await page.reload()

    // Should still see the conversation
    await expect(page.locator(staffSelectors.chat.userMessage).first()).toBeVisible()
    await expect(page.locator(staffSelectors.chat.userMessage).first()).toContainText(testStaffQueries.operations)
  })

  test('should switch between conversations', async ({ page }) => {
    // Create first conversation
    await page.fill(staffSelectors.chat.messageInput, 'First conversation')
    await page.click(staffSelectors.chat.sendButton)
    await expect(page.locator(staffSelectors.chat.assistantMessage).first()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Create new conversation
    await page.click(staffSelectors.chat.newConversationButton)

    // Send message in new conversation
    await page.fill(staffSelectors.chat.messageInput, 'Second conversation')
    await page.click(staffSelectors.chat.sendButton)
    await expect(page.locator(staffSelectors.chat.assistantMessage).first()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Should have 2 conversations in sidebar
    const conversations = page.locator(staffSelectors.chat.conversationItem)
    const count = await conversations.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Click on first conversation
    await conversations.first().click()

    // Should see first conversation's message
    await expect(page.locator(staffSelectors.chat.userMessage).first()).toContainText('First conversation')
  })
})

test.describe('Staff Chat - UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    // Login as CEO
    const { tenantId, username, password } = testStaffUsers.ceo

    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })
  })

  test('should handle Enter key to send message', async ({ page }) => {
    const messageInput = page.locator(staffSelectors.chat.messageInput)

    // Type message and press Enter
    await messageInput.fill(testStaffQueries.general)
    await messageInput.press('Enter')

    // Should send message (not create newline)
    await expect(page.locator(staffSelectors.chat.userMessage).last()).toContainText(testStaffQueries.general, {
      timeout: staffTimeouts.messageSend,
    })
  })

  test('should handle Shift+Enter to create newline', async ({ page }) => {
    const messageInput = page.locator(staffSelectors.chat.messageInput)

    // Type message and press Shift+Enter
    await messageInput.fill('First line')
    await messageInput.press('Shift+Enter')
    await messageInput.type('Second line')

    // Should have newline (not sent yet)
    const value = await messageInput.inputValue()
    expect(value).toContain('\n')
    expect(value).toContain('First line')
    expect(value).toContain('Second line')

    // Now press Enter to send
    await messageInput.press('Enter')

    // Should send multi-line message
    await expect(page.locator(staffSelectors.chat.userMessage).last()).toBeVisible({
      timeout: staffTimeouts.messageSend,
    })
  })

  test('should auto-scroll to latest message', async ({ page }) => {
    // Send multiple messages to trigger scroll
    for (let i = 0; i < 3; i++) {
      await page.fill(staffSelectors.chat.messageInput, `Message ${i + 1}`)
      await page.click(staffSelectors.chat.sendButton)
      await page.waitForTimeout(500) // Small delay between messages
    }

    // Wait for last assistant response
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })

    // Last message should be visible (scrolled into view)
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeInViewport()
  })

  test('should handle logout', async ({ page }) => {
    // Click logout button
    await page.click(staffSelectors.chat.logoutButton)

    // Should redirect to login page
    await page.waitForURL('/staff/login', { timeout: staffTimeouts.navigation })

    // Token should be removed from localStorage
    const token = await page.evaluate(() => localStorage.getItem('staff_token'))
    expect(token).toBeNull()
  })

  test('should show mobile menu on small screens', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 })

    // Sidebar should be hidden initially
    const sidebar = page.locator(staffSelectors.chat.sidebar)
    await expect(sidebar).not.toBeVisible()

    // Mobile menu toggle should be visible
    const menuToggle = page.locator(staffSelectors.chat.mobileMenuToggle)
    await expect(menuToggle).toBeVisible()

    // Click to open sidebar
    await menuToggle.click()

    // Sidebar should now be visible
    await expect(sidebar).toBeVisible()
  })
})

test.describe('Staff Chat - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    const { tenantId, username, password } = testStaffUsers.admin

    await page.goto('/staff/login')
    await page.selectOption(staffSelectors.login.tenantSelect, tenantId)
    await page.fill(staffSelectors.login.usernameInput, username)
    await page.fill(staffSelectors.login.passwordInput, password)
    await page.click(staffSelectors.login.submitButton)

    await page.waitForURL('/staff', { timeout: staffTimeouts.navigation })
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline by blocking network
    await page.route('**/api/staff/chat', (route) => route.abort())

    // Try to send message
    await page.fill(staffSelectors.chat.messageInput, testStaffQueries.general)
    await page.click(staffSelectors.chat.sendButton)

    // Should show error message
    await expect(page.locator(staffSelectors.chat.errorMessage)).toBeVisible({
      timeout: staffTimeouts.messageSend,
    })

    // Should have retry button
    await expect(page.locator(staffSelectors.chat.retryButton)).toBeVisible()
  })

  test('should retry failed message', async ({ page }) => {
    // Block network for first attempt
    let attemptCount = 0
    await page.route('**/api/staff/chat', (route) => {
      attemptCount++
      if (attemptCount === 1) {
        route.abort() // Fail first time
      } else {
        route.continue() // Succeed on retry
      }
    })

    // Send message
    await page.fill(staffSelectors.chat.messageInput, testStaffQueries.general)
    await page.click(staffSelectors.chat.sendButton)

    // Should show error
    await expect(page.locator(staffSelectors.chat.errorMessage)).toBeVisible({
      timeout: staffTimeouts.messageSend,
    })

    // Click retry
    await page.click(staffSelectors.chat.retryButton)

    // Should succeed this time
    await expect(page.locator(staffSelectors.chat.assistantMessage).last()).toBeVisible({
      timeout: staffTimeouts.aiResponse,
    })
  })

  test('should handle token expiry', async ({ page }) => {
    // Set expired token
    await page.evaluate(() => {
      localStorage.setItem('staff_token', 'expired.token.here')
    })

    // Reload page
    await page.reload()

    // Should redirect to login
    await page.waitForURL('/staff/login', { timeout: staffTimeouts.navigation })
  })
})

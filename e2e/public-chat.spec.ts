/**
 * E2E Tests - Public Chat Frontend
 *
 * 5 test scenarios for marketing-focused public chat:
 * 1. New visitor → first message → session created
 * 2. Intent capture → "4 guests Dec 15-20" → URL generated
 * 3. Accommodation inquiry → public info returned
 * 4. Session persistence → multiple messages → history maintained
 * 5. Mobile UX → bubble expand/collapse works
 */

import { test, expect } from '@playwright/test'

const CHAT_API = '/api/public/chat'
const DEMO_PAGE = '/public-chat-demo'
const TENANT_ID = 'simmerdown'

test.describe('Public Chat Frontend - Marketing Flow', () => {

  /**
   * SCENARIO 1: New Visitor - Session Creation
   *
   * Flow:
   * - Visitor lands on page
   * - Clicks chat bubble
   * - Sends first message
   * - System creates new session
   * - Response includes session_id
   * - session_id stored in localStorage
   */
  test('should create new session for first-time visitor', async ({ page }) => {
    // Clear localStorage
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Open chat bubble
    const chatBubble = page.locator('[data-testid="public-chat-bubble"]')
    await expect(chatBubble).toBeVisible()
    await chatBubble.click()

    // Chat interface should expand
    const chatInterface = page.locator('[data-testid="public-chat-interface"]')
    await expect(chatInterface).toBeVisible()

    // Type first message
    const messageInput = page.locator('[data-testid="chat-input"]')
    await messageInput.fill('Hello! Tell me about your accommodations')

    // Send message
    const sendButton = page.locator('[data-testid="send-button"]')
    await sendButton.click()

    // Wait for response
    await page.waitForResponse(response =>
      response.url().includes(CHAT_API) && response.status() === 200
    )

    // Verify session_id stored in localStorage
    const sessionId = await page.evaluate(() =>
      localStorage.getItem('public_chat_session_id')
    )
    expect(sessionId).toBeTruthy()
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)

    // Verify message appears in chat
    const userMessage = page.locator('[data-testid="user-message"]').last()
    await expect(userMessage).toContainText('Tell me about your accommodations')

    // Verify assistant response appears
    const assistantMessage = page.locator('[data-testid="assistant-message"]').last()
    await expect(assistantMessage).toBeVisible()
  })

  /**
   * SCENARIO 2: Intent Capture - Travel Details Extraction
   *
   * Flow:
   * - User sends message with travel intent
   * - "Looking for apartment for 4 guests from Dec 15 to Dec 20"
   * - System extracts: check_in, check_out, guests, type
   * - Intent summary displays captured details
   * - Availability URL generated
   * - CTA button enabled with URL
   */
  test('should capture travel intent and generate availability URL', async ({ page }) => {
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Open chat
    await page.locator('[data-testid="public-chat-bubble"]').click()
    await page.waitForSelector('[data-testid="public-chat-interface"]')

    // Send message with intent
    const messageInput = page.locator('[data-testid="chat-input"]')
    await messageInput.fill('I need an apartment for 4 people from December 15 to December 20')
    await page.locator('[data-testid="send-button"]').click()

    // Wait for API response
    const response = await page.waitForResponse(response =>
      response.url().includes(CHAT_API) && response.status() === 200
    )

    const responseData = await response.json()

    // Verify travel_intent extracted
    expect(responseData.data.travel_intent).toBeDefined()
    expect(responseData.data.travel_intent.check_in).toBeTruthy()
    expect(responseData.data.travel_intent.check_out).toBeTruthy()
    expect(responseData.data.travel_intent.guests).toBe(4)
    expect(responseData.data.travel_intent.captured_this_message).toBe(true)

    // Verify intent summary displays
    const intentSummary = page.locator('[data-testid="intent-summary"]')
    await expect(intentSummary).toBeVisible()

    // Verify dates displayed
    await expect(intentSummary).toContainText('Dec 15')
    await expect(intentSummary).toContainText('Dec 20')

    // Verify guests displayed
    await expect(intentSummary).toContainText('4')

    // Verify availability CTA appears
    const ctaButton = page.locator('[data-testid="availability-cta"]')
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toBeEnabled()

    // Verify CTA has correct URL
    const ctaHref = await ctaButton.getAttribute('href')
    expect(ctaHref).toContain('check_in=2025-12-15')
    expect(ctaHref).toContain('check_out=2025-12-20')
    expect(ctaHref).toContain('guests=4')
  })

  /**
   * SCENARIO 3: Accommodation Inquiry - Public Info Only
   *
   * Flow:
   * - User asks about accommodations
   * - System searches accommodation_units_public table
   * - Response includes public info (pricing, photos, description)
   * - NO manual/operational content included
   * - Photo carousel displays images
   */
  test('should return public accommodation info only', async ({ page }) => {
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Open chat
    await page.locator('[data-testid="public-chat-bubble"]').click()
    await page.waitForSelector('[data-testid="public-chat-interface"]')

    // Ask about accommodations
    const messageInput = page.locator('[data-testid="chat-input"]')
    await messageInput.fill('What apartments do you have available?')
    await page.locator('[data-testid="send-button"]').click()

    // Wait for response
    const response = await page.waitForResponse(response =>
      response.url().includes(CHAT_API) && response.status() === 200
    )

    const responseData = await response.json()

    // Verify sources returned
    expect(responseData.data.sources).toBeDefined()
    expect(responseData.data.sources.length).toBeGreaterThan(0)

    // Verify sources are from public tables only
    const sources = responseData.data.sources
    const publicTables = ['accommodation_units_public', 'policies', 'muva_content']

    sources.forEach((source: any) => {
      expect(publicTables).toContain(source.table)
    })

    // Verify NO manual content included
    sources.forEach((source: any) => {
      expect(source.table).not.toBe('accommodation_units_manual')
    })

    // Check for pricing in response
    const hasPricing = sources.some((source: any) => source.pricing)
    expect(hasPricing).toBe(true)

    // Check for photos in response
    const hasPhotos = sources.some((source: any) => source.photos && source.photos.length > 0)
    if (hasPhotos) {
      // Verify photo carousel appears
      const photoCarousel = page.locator('[data-testid="photo-carousel"]')
      await expect(photoCarousel).toBeVisible()

      // Verify at least one photo displayed
      const photos = page.locator('[data-testid="carousel-photo"]')
      await expect(photos.first()).toBeVisible()
    }
  })

  /**
   * SCENARIO 4: Session Persistence - Conversation History
   *
   * Flow:
   * - User sends first message → session created
   * - User sends second message → same session used
   * - User sends third message → history maintained
   * - Refresh page → conversation persists
   * - All messages visible in chronological order
   */
  test('should persist session and conversation history', async ({ page }) => {
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Open chat
    await page.locator('[data-testid="public-chat-bubble"]').click()
    await page.waitForSelector('[data-testid="public-chat-interface"]')

    // Send first message
    const messageInput = page.locator('[data-testid="chat-input"]')
    await messageInput.fill('First message about apartments')
    await page.locator('[data-testid="send-button"]').click()
    await page.waitForResponse(response => response.url().includes(CHAT_API))

    // Get session_id
    const sessionId1 = await page.evaluate(() =>
      localStorage.getItem('public_chat_session_id')
    )
    expect(sessionId1).toBeTruthy()

    // Send second message
    await messageInput.fill('Second message about pricing')
    await page.locator('[data-testid="send-button"]').click()
    await page.waitForResponse(response => response.url().includes(CHAT_API))

    // Verify same session
    const sessionId2 = await page.evaluate(() =>
      localStorage.getItem('public_chat_session_id')
    )
    expect(sessionId2).toBe(sessionId1)

    // Verify both messages visible
    const userMessages = page.locator('[data-testid="user-message"]')
    await expect(userMessages).toHaveCount(2)
    await expect(userMessages.first()).toContainText('First message')
    await expect(userMessages.last()).toContainText('Second message')

    // Send third message
    await messageInput.fill('Third message about availability')
    await page.locator('[data-testid="send-button"]').click()
    await page.waitForResponse(response => response.url().includes(CHAT_API))

    // Verify all three messages visible
    await expect(userMessages).toHaveCount(3)

    // Refresh page
    await page.reload()

    // Reopen chat
    await page.locator('[data-testid="public-chat-bubble"]').click()
    await page.waitForSelector('[data-testid="public-chat-interface"]')

    // Verify session_id still present
    const sessionId3 = await page.evaluate(() =>
      localStorage.getItem('public_chat_session_id')
    )
    expect(sessionId3).toBe(sessionId1)

    // Verify conversation history loaded
    // Note: This requires backend to persist and return history
    // For now, just verify session_id persists across refresh
  })

  /**
   * SCENARIO 5: Mobile UX - Bubble Expand/Collapse
   *
   * Flow:
   * - Mobile viewport (375px × 667px)
   * - Chat bubble visible at bottom-center
   * - Click bubble → chat expands to full-screen
   * - Chat interface covers entire viewport
   * - Minimize button → collapses back to bubble
   * - Close button → closes chat completely
   */
  test('should handle mobile UX correctly', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Verify chat bubble visible on mobile
    const chatBubble = page.locator('[data-testid="public-chat-bubble"]')
    await expect(chatBubble).toBeVisible()

    // Verify bubble positioned at bottom-center
    const bubbleBox = await chatBubble.boundingBox()
    expect(bubbleBox).toBeTruthy()
    if (bubbleBox) {
      // Bubble should be horizontally centered
      const viewportWidth = 375
      const bubbleCenterX = bubbleBox.x + bubbleBox.width / 2
      expect(Math.abs(bubbleCenterX - viewportWidth / 2)).toBeLessThan(50)

      // Bubble should be near bottom
      expect(bubbleBox.y).toBeGreaterThan(500)
    }

    // Click to expand
    await chatBubble.click()

    // Verify chat interface appears
    const chatInterface = page.locator('[data-testid="public-chat-interface"]')
    await expect(chatInterface).toBeVisible()

    // Verify chat interface is full-screen on mobile
    const interfaceBox = await chatInterface.boundingBox()
    expect(interfaceBox).toBeTruthy()
    if (interfaceBox) {
      // Should fill viewport width
      expect(interfaceBox.width).toBeGreaterThan(350)

      // Should fill most of viewport height
      expect(interfaceBox.height).toBeGreaterThan(600)
    }

    // Test minimize button
    const minimizeButton = page.locator('[data-testid="minimize-button"]')
    await expect(minimizeButton).toBeVisible()
    await minimizeButton.click()

    // Chat should collapse back to bubble
    await expect(chatInterface).not.toBeVisible()
    await expect(chatBubble).toBeVisible()

    // Re-expand to test close button
    await chatBubble.click()
    await expect(chatInterface).toBeVisible()

    // Test close button
    const closeButton = page.locator('[data-testid="close-button"]')
    await expect(closeButton).toBeVisible()
    await closeButton.click()

    // Chat should close completely
    await expect(chatInterface).not.toBeVisible()
    await expect(chatBubble).toBeVisible()
  })

  /**
   * BONUS: Follow-up Suggestions
   *
   * Verify suggestion chips are clickable and populate input
   */
  test('should handle follow-up suggestions correctly', async ({ page }) => {
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Open chat
    await page.locator('[data-testid="public-chat-bubble"]').click()
    await page.waitForSelector('[data-testid="public-chat-interface"]')

    // Send message
    const messageInput = page.locator('[data-testid="chat-input"]')
    await messageInput.fill('Tell me about your apartments')
    await page.locator('[data-testid="send-button"]').click()

    // Wait for response
    await page.waitForResponse(response =>
      response.url().includes(CHAT_API) && response.status() === 200
    )

    // Wait for suggestions to appear
    const suggestions = page.locator('[data-testid="suggestion-chip"]')
    const suggestionCount = await suggestions.count()

    if (suggestionCount > 0) {
      // Click first suggestion
      const firstSuggestion = suggestions.first()
      const suggestionText = await firstSuggestion.textContent()
      await firstSuggestion.click()

      // Verify input populated with suggestion text
      const inputValue = await messageInput.inputValue()
      expect(inputValue).toBe(suggestionText)
    }
  })

  /**
   * BONUS: Error Handling
   *
   * Verify error states display correctly
   */
  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Intercept API and return error
    await page.route(CHAT_API, route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })

    // Open chat
    await page.locator('[data-testid="public-chat-bubble"]').click()
    await page.waitForSelector('[data-testid="public-chat-interface"]')

    // Send message
    const messageInput = page.locator('[data-testid="chat-input"]')
    await messageInput.fill('Test message')
    await page.locator('[data-testid="send-button"]').click()

    // Verify error message appears
    const errorBanner = page.locator('[data-testid="error-banner"]')
    await expect(errorBanner).toBeVisible()
    await expect(errorBanner).toContainText('Something went wrong')

    // Verify retry button appears
    const retryButton = page.locator('[data-testid="retry-button"]')
    await expect(retryButton).toBeVisible()
  })

  /**
   * BONUS: Accessibility
   *
   * Verify keyboard navigation works
   */
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(DEMO_PAGE)
    await page.evaluate(() => localStorage.clear())

    // Tab to chat bubble
    await page.keyboard.press('Tab')

    // Open with Enter
    await page.keyboard.press('Enter')

    // Verify chat opened
    const chatInterface = page.locator('[data-testid="public-chat-interface"]')
    await expect(chatInterface).toBeVisible()

    // Tab to input field
    await page.keyboard.press('Tab')

    // Type message
    await page.keyboard.type('Test keyboard navigation')

    // Send with Enter
    await page.keyboard.press('Enter')

    // Verify message sent
    const userMessage = page.locator('[data-testid="user-message"]').last()
    await expect(userMessage).toContainText('Test keyboard navigation')

    // Close chat with Escape
    await page.keyboard.press('Escape')

    // Verify chat closed
    await expect(chatInterface).not.toBeVisible()
  })
})

/**
 * Test Helpers
 */

// Helper to mock API response
async function mockApiResponse(page: any, data: any) {
  await page.route(CHAT_API, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: data
      })
    })
  })
}

// Helper to get localStorage value
async function getLocalStorage(page: any, key: string): Promise<string | null> {
  return page.evaluate((k: string) => localStorage.getItem(k), key)
}

// Helper to clear all storage
async function clearAllStorage(page: any) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

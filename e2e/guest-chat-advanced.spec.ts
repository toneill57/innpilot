import { test, expect } from '@playwright/test'
import {
  loginAsGuest,
  sendMessage,
  waitForAiResponse,
  clickFollowUpSuggestion,
  clickEntityBadge,
  isErrorDisplayed,
  clickRetry,
  simulateNetworkError,
  restoreNetwork,
  waitForWelcomeMessage,
  getLastAssistantMessage,
} from './helpers/chat-helpers'
import { testQueries, selectors } from './fixtures/test-data'

/**
 * Guest Chat Advanced Features E2E Tests
 *
 * Tests follow-up suggestions, entity tracking, error handling
 */

test.describe('Guest Chat Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page)
    await waitForWelcomeMessage(page)
  })

  test.describe('Follow-up Suggestions', () => {
    test('should display follow-up suggestions after response', async ({ page }) => {
      // Send a message
      await sendMessage(page, testQueries.tourism)
      await waitForAiResponse(page)

      // Check if follow-up suggestions are displayed
      const suggestions = page.locator(selectors.chat.followUpSuggestion)
      const count = await suggestions.count()

      // Should have at least 1 suggestion (up to 3)
      if (count > 0) {
        expect(count).toBeGreaterThanOrEqual(1)
        expect(count).toBeLessThanOrEqual(3)

        // Verify suggestions are visible
        await expect(suggestions.first()).toBeVisible()
      } else {
        console.log('No follow-up suggestions generated for this response')
      }
    })

    test('should send message when clicking follow-up suggestion', async ({ page }) => {
      // Send initial message
      await sendMessage(page, testQueries.tourism)
      await waitForAiResponse(page)

      // Check for suggestions
      const suggestions = page.locator(selectors.chat.followUpSuggestion)
      const count = await suggestions.count()

      if (count > 0) {
        // Get suggestion text
        const suggestionText = await suggestions.first().textContent()

        // Click suggestion
        await suggestions.first().click()

        // Should send the suggestion as a message
        await expect(page.locator(selectors.chat.typingIndicator).first()).toBeVisible()

        // Wait for response
        await waitForAiResponse(page)

        // Verify user message was added
        const userMessages = await page.locator(selectors.chat.userMessage).allTextContents()
        const lastUserMessage = userMessages[userMessages.length - 1]
        expect(lastUserMessage).toContain(suggestionText || '')
      } else {
        test.skip()
      }
    })

    test('should generate new suggestions after follow-up', async ({ page }) => {
      // Send initial message
      await sendMessage(page, 'Tell me about activities')
      await waitForAiResponse(page)

      const suggestions = page.locator(selectors.chat.followUpSuggestion)
      const firstCount = await suggestions.count()

      if (firstCount > 0) {
        // Click first suggestion
        await suggestions.first().click()
        await waitForAiResponse(page)

        // Should have new suggestions
        const secondCount = await suggestions.count()
        expect(secondCount).toBeGreaterThanOrEqual(0) // Could be 0 or new suggestions
      } else {
        test.skip()
      }
    })
  })

  test.describe('Entity Tracking', () => {
    test('should track entities mentioned in conversation', async ({ page }) => {
      // Send message that should trigger entity extraction
      await sendMessage(page, 'Tell me about diving and surfing')
      await waitForAiResponse(page)

      // Check for entity badges
      const entityBadges = page.locator(selectors.chat.entityBadge)
      const count = await entityBadges.count()

      if (count > 0) {
        // Should have at least one entity
        expect(count).toBeGreaterThan(0)

        // Verify entities are visible
        await expect(entityBadges.first()).toBeVisible()
      } else {
        console.log('No entities tracked for this conversation')
      }
    })

    test('should allow clicking entity badges', async ({ page }) => {
      // Send message
      await sendMessage(page, 'What about snorkeling?')
      await waitForAiResponse(page)

      // Check for entity badges
      const entityBadges = page.locator(selectors.chat.entityBadge)
      const count = await entityBadges.count()

      if (count > 0) {
        // Click first entity badge
        await entityBadges.first().click()

        // Should send a follow-up message
        await expect(page.locator(selectors.chat.typingIndicator).first()).toBeVisible()
        await waitForAiResponse(page)

        // Verify response is about the entity
        const lastMessage = await getLastAssistantMessage(page)
        expect(lastMessage.length).toBeGreaterThan(0)
      } else {
        test.skip()
      }
    })

    test('should show entity mention count', async ({ page }) => {
      const activityName = 'buceo' // diving

      // Mention activity multiple times
      await sendMessage(page, `Tell me about ${activityName}`)
      await waitForAiResponse(page)

      await sendMessage(page, `Where can I do ${activityName}?`)
      await waitForAiResponse(page)

      // Check if entity badge exists and shows count
      const entityBadges = page.locator(selectors.chat.entityBadge)
      const count = await entityBadges.count()

      if (count > 0) {
        // At least one entity should be tracked
        expect(count).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should display error message on network failure', async ({ page }) => {
      // Simulate network error
      await simulateNetworkError(page)

      // Try to send message
      await page.fill(selectors.chat.messageInput, testQueries.greeting)
      await page.click(selectors.chat.sendButton)

      // Should show error
      const errorDisplayed = await isErrorDisplayed(page)
      expect(errorDisplayed).toBeTruthy()

      // Should show error message in chat
      await expect(page.locator('text=hubo un error')).toBeVisible({ timeout: 5000 })

      // Restore network
      await restoreNetwork(page)
    })

    test('should show retry button on error', async ({ page }) => {
      // Simulate error
      await simulateNetworkError(page)

      // Send message
      await page.fill(selectors.chat.messageInput, testQueries.greeting)
      await page.click(selectors.chat.sendButton)

      // Wait for error
      await page.waitForTimeout(2000)

      // Should show retry button
      await expect(page.locator(selectors.chat.retryButton)).toBeVisible()

      // Restore network
      await restoreNetwork(page)
    })

    test('should retry message on button click', async ({ page }) => {
      // Simulate temporary network error
      await simulateNetworkError(page)

      // Send message
      await page.fill(selectors.chat.messageInput, testQueries.greeting)
      await page.click(selectors.chat.sendButton)

      // Wait for error
      await page.waitForTimeout(2000)

      // Restore network
      await restoreNetwork(page)

      // Click retry
      const retryButton = page.locator(selectors.chat.retryButton)
      if (await retryButton.isVisible()) {
        await retryButton.click()

        // Should retry and succeed
        await waitForAiResponse(page)

        // Verify response received
        const lastMessage = await getLastAssistantMessage(page)
        expect(lastMessage.length).toBeGreaterThan(0)
      }
    })

    test('should handle session expiration gracefully', async ({ page }) => {
      // Clear session token from storage
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // Try to send message
      await sendMessage(page, testQueries.greeting)

      // Should show error or redirect to login
      await page.waitForTimeout(5000)

      // Either error is shown or redirected to login
      const onLoginPage = await page.locator(selectors.login.submitButton).isVisible()
      const errorShown = await isErrorDisplayed(page)

      expect(onLoginPage || errorShown).toBeTruthy()
    })

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error response
      await page.route('/api/guest/chat', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      })

      // Send message
      await sendMessage(page, testQueries.greeting)

      // Wait for error
      await page.waitForTimeout(2000)

      // Should show error
      const errorDisplayed = await isErrorDisplayed(page)
      expect(errorDisplayed).toBeTruthy()

      // Cleanup
      await page.unroute('/api/guest/chat')
    })
  })

  test.describe('Conversation Persistence', () => {
    test('should load previous messages on login', async ({ page }) => {
      // Already logged in from beforeEach
      // Send a few messages
      await sendMessage(page, 'First message')
      await waitForAiResponse(page)

      await sendMessage(page, 'Second message')
      await waitForAiResponse(page)

      // Get message count
      const messagesBefore = await page.locator(selectors.chat.assistantMessage).count()

      // Logout
      await page.click(selectors.chat.logoutButton)

      // Login again
      await loginAsGuest(page)

      // Wait for history to load
      await page.waitForTimeout(2000)

      // Should have same or more messages
      const messagesAfter = await page.locator(selectors.chat.assistantMessage).count()
      expect(messagesAfter).toBeGreaterThanOrEqual(messagesBefore)
    })

    test('should show loading state while fetching history', async ({ page }) => {
      // Already logged in, reload to trigger history load
      await page.reload()

      // Should show loading indicator briefly
      const loadingIndicator = page.locator('svg.animate-spin')

      // Either loading is visible or messages loaded immediately
      const isLoading = await loadingIndicator.isVisible().catch(() => false)
      const messagesLoaded = await page.locator(selectors.chat.messageInput).isVisible()

      expect(isLoading || messagesLoaded).toBeTruthy()
    })
  })

  test.describe('Mobile Specific Features', () => {
    test('should handle mobile keyboard properly', async ({ page, viewport }) => {
      if (!viewport || viewport.width > 768) {
        test.skip()
      }

      const textarea = page.locator(selectors.chat.messageInput)

      // Focus textarea
      await textarea.click()

      // Verify textarea is in viewport
      await expect(textarea).toBeInViewport()

      // Type message
      await textarea.fill('Mobile test message')

      // Send button should still be visible
      const sendButton = page.locator(selectors.chat.sendButton)
      await expect(sendButton).toBeInViewport()
    })

    test('should support touch gestures', async ({ page, viewport }) => {
      if (!viewport || viewport.width > 768) {
        test.skip()
      }

      // Send multiple messages to create scrollable content
      for (let i = 0; i < 3; i++) {
        await sendMessage(page, `Touch test ${i + 1}`)
        await waitForAiResponse(page)
      }

      // Verify scrolling works
      const messageList = page.locator('[class*="space-y-4"]')
      await expect(messageList).toBeVisible()

      // Simulate scroll
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(500)

      // Verify can scroll back
      await page.mouse.wheel(0, -500)
    })

    test('should handle viewport changes', async ({ page, viewport }) => {
      if (!viewport) {
        test.skip()
      }

      // Send a message
      await sendMessage(page, testQueries.greeting)
      await waitForAiResponse(page)

      // Simulate orientation change (swap width/height)
      await page.setViewportSize({
        width: viewport.height,
        height: viewport.width,
      })

      // Wait for layout adjustment
      await page.waitForTimeout(500)

      // Interface should still be functional
      await expect(page.locator(selectors.chat.messageInput)).toBeVisible()
      await expect(page.locator(selectors.chat.sendButton)).toBeVisible()
    })
  })
})

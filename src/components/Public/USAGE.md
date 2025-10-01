# Public Chat - Usage Examples

## Basic Integration

### 1. Add to Landing Page

```tsx
// app/page.tsx
import { PublicChat } from '@/components/Public'

export default function HomePage() {
  return (
    <main>
      {/* Your landing page content */}
      <Hero />
      <Features />
      <Testimonials />
      <Footer />

      {/* Add chat bubble - it will float on top */}
      <PublicChat />
    </main>
  )
}
```

### 2. Add to Layout (Site-wide)

```tsx
// app/layout.tsx
import { PublicChat } from '@/components/Public'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <PublicChat />
      </body>
    </html>
  )
}
```

## Advanced Usage

### Conditional Display

Only show chat on certain pages:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { PublicChat } from '@/components/Public'

export default function ConditionalChat() {
  const pathname = usePathname()

  // Only show on landing and accommodations pages
  const showChat = ['/', '/accommodations', '/about'].includes(pathname)

  if (!showChat) return null

  return <PublicChat />
}
```

### Custom Tenant ID

For multi-tenant setups:

```tsx
// Modify PublicChatInterface.tsx
const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'simmerdown'

// In API call
body: JSON.stringify({
  message: input.trim(),
  session_id: sessionId,
  tenant_id: tenantId
})
```

### Track Analytics

Add event tracking to AvailabilityCTA:

```tsx
// AvailabilityCTA.tsx
const handleClick = () => {
  if (disabled || !availabilityUrl) return

  // Track with your analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'availability_click', {
      event_category: 'public_chat',
      event_label: availabilityUrl
    })
  }

  // Or PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('availability_cta_clicked', {
      url: availabilityUrl
    })
  }

  window.open(availabilityUrl, '_blank', 'noopener,noreferrer')
}
```

### Custom Welcome Message

Modify initial message in PublicChatInterface.tsx:

```tsx
useEffect(() => {
  if (messages.length === 0 && isExpanded) {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Your custom welcome message here! 🌴',
      timestamp: new Date(),
      suggestions: [
        'Your custom suggestion 1',
        'Your custom suggestion 2',
        'Your custom suggestion 3'
      ]
    }
    setMessages([welcomeMessage])
  }
}, [isExpanded, messages.length])
```

## Styling Customization

### Change Colors

Update `globals.css`:

```css
:root {
  /* Original */
  --teal: 172 66% 45%;
  --cyan: 185 66% 51%;
  --coral: 4 86% 70%;

  /* Custom brand colors */
  --teal: 180 70% 40%;    /* Your brand primary */
  --cyan: 190 65% 50%;    /* Your brand secondary */
  --coral: 10 80% 65%;    /* Your brand accent */
}
```

### Modify Bubble Position

```tsx
// PublicChatBubble.tsx
className="fixed z-[9999]
  bottom-5 right-5        // Change position
  md:bottom-8 md:right-8  // Desktop position
  // Or left side:
  // bottom-5 left-5
  // md:bottom-8 md:left-8
"
```

### Custom Animations

Add your own animations to `globals.css`:

```css
@keyframes your-animation {
  from { /* start state */ }
  to { /* end state */ }
}

.animate-your-animation {
  animation: your-animation 1s ease-in-out;
}
```

## API Customization

### Add Custom Headers

```tsx
// PublicChatInterface.tsx
const response = await fetch('/api/public/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value',
    'X-User-Locale': navigator.language
  },
  body: JSON.stringify({ ... })
})
```

### Handle Custom Response Fields

```tsx
// If your API returns extra fields
interface ExtendedMessage extends Message {
  custom_field?: string
}

// In sendMessage function
const assistantMessage: ExtendedMessage = {
  id: `assistant-${Date.now()}`,
  role: 'assistant',
  content: data.data.response,
  timestamp: new Date(),
  custom_field: data.data.custom_field, // Your field
  // ...
}
```

## Mobile Optimizations

### Disable on Mobile

```tsx
'use client'

import { useEffect, useState } from 'react'
import { PublicChat } from '@/components/Public'

export default function DesktopOnlyChat() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  if (isMobile) return null

  return <PublicChat />
}
```

### Custom Mobile Layout

Modify PublicChatInterface.tsx:

```tsx
// Change mobile classes
className="
  // Desktop: windowed
  w-[400px] h-[600px] bottom-5 right-5 rounded-2xl
  // Mobile: full-screen
  max-md:inset-0 max-md:rounded-none max-md:w-full max-md:h-full
"
```

## Testing

### Mock API Responses

```tsx
// For development/testing
const MOCK_RESPONSE = {
  success: true,
  data: {
    session_id: 'mock-session',
    response: 'This is a mock response',
    sources: [{
      unit_name: 'Test Room',
      photos: ['/test-photo.jpg']
    }],
    travel_intent: {
      num_guests: 2
    },
    availability_url: 'https://example.com',
    suggestions: ['Test suggestion']
  }
}

// In sendMessage()
if (process.env.NODE_ENV === 'development') {
  // Use mock
  const data = MOCK_RESPONSE
  // ... handle response
} else {
  // Real API call
  const response = await fetch('/api/public/chat', ...)
}
```

### E2E Testing with Playwright

```typescript
// e2e/public-chat.spec.ts
import { test, expect } from '@playwright/test'

test('Public chat opens and sends message', async ({ page }) => {
  await page.goto('/')

  // Click chat bubble
  await page.click('[aria-label="Open chat"]')

  // Verify interface opens
  await expect(page.locator('role=dialog')).toBeVisible()

  // Type message
  await page.fill('textarea[placeholder*="Type your message"]', 'Hello')

  // Send
  await page.click('[aria-label="Send message"]')

  // Verify response appears
  await expect(page.locator('.bg-white.rounded-2xl')).toBeVisible()
})
```

## Deployment

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_TENANT_ID=simmerdown
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_CHAT_ENABLED=true
```

### Production Optimizations

1. **Enable Image Optimization**
   - Configure Next.js image domains in `next.config.ts`

2. **Add Error Tracking**
   - Integrate Sentry or similar for error monitoring

3. **Analytics**
   - Track chat opens, messages sent, CTAs clicked

4. **A/B Testing**
   - Test different welcome messages, colors, CTAs

### Performance Monitoring

```tsx
// Add to PublicChatInterface.tsx
useEffect(() => {
  if (loading) {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      console.log(`API response time: ${duration}ms`)

      // Send to analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name: 'chat_api_response',
          value: Math.round(duration)
        })
      }
    }
  }
}, [loading])
```

## Troubleshooting

### Chat not appearing

1. Check component is imported and rendered
2. Verify z-index isn't conflicting
3. Check console for errors

### API errors

1. Verify endpoint is correct: `/api/public/chat`
2. Check network tab for request/response
3. Verify CORS if API is on different domain
4. Check API logs for backend errors

### Styling issues

1. Ensure `globals.css` animations are loaded
2. Verify Tailwind classes are being processed
3. Check for CSS conflicts with other styles
4. Use browser DevTools to inspect computed styles

### Performance issues

1. Check image sizes (use Next.js Image optimization)
2. Monitor animation frame rate (60fps target)
3. Reduce message history limit if needed
4. Use React DevTools to identify re-renders

## Support

For issues or questions:
1. Check README.md for component documentation
2. Review types.ts for TypeScript definitions
3. Inspect browser console for errors
4. Check API logs for backend issues

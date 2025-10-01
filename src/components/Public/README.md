# Public Chat Components

Marketing-focused chat interface for public website visitors (no authentication required).

## Overview

The Public Chat system provides a beautiful, conversion-optimized chat experience designed to turn website visitors into bookings. It features:

- **Tropical aesthetic** with teal, cyan, and coral gradients
- **Photo previews** of accommodations in chat responses
- **Travel intent capture** (dates, guests, accommodation type)
- **One-click availability CTAs** to booking system
- **Mobile-first responsive design**
- **Smooth animations** for professional UX

## Architecture

```
PublicChat (main wrapper)
├── PublicChatBubble (floating button)
└── PublicChatInterface (expanded chat)
    ├── IntentSummary (captured travel details)
    ├── PhotoCarousel (accommodation photos)
    ├── AvailabilityCTA (booking button)
    └── FollowUpSuggestions (clickable chips)
```

## Components

### 1. PublicChat

Main wrapper component that manages bubble and interface state.

**Usage:**
```tsx
import { PublicChat } from '@/components/Public'

export default function LandingPage() {
  return (
    <>
      <YourContent />
      <PublicChat />
    </>
  )
}
```

### 2. PublicChatBubble

Floating chat button (bottom-right on desktop, bottom-center on mobile).

**Features:**
- Gradient teal/cyan background
- "Chat" badge with bounce animation
- Hover effects with scale and pulse
- Hides when chat is expanded

### 3. PublicChatInterface

Main chat interface with messages, input, and features.

**Features:**
- Header with hotel name and minimize/close buttons
- Scrollable message area with user/assistant bubbles
- Typing indicator during loading
- Auto-scroll to new messages
- Follow-up suggestion chips
- Error handling with retry
- Session persistence via localStorage

**Layout:**
- Desktop: 400px × 600px fixed bottom-right
- Mobile: Full-screen overlay

### 4. IntentSummary

Displays captured travel intent with icons.

**Shows:**
- Check-in/out dates (Calendar icon)
- Number of guests (Users icon)
- Accommodation type (Home icon)
- Edit button (optional)

**Only renders when intent data is present.**

### 5. PhotoCarousel

2×2 grid of accommodation photos with lightbox.

**Features:**
- Grid layout (2 columns on desktop, responsive)
- Click to expand to full-screen lightbox
- Lightbox navigation arrows
- Caption overlay on hover
- Photo counter in lightbox
- Smooth transitions

### 6. AvailabilityCTA

Prominent "Check Availability" button with gradient.

**Features:**
- Gradient teal → cyan → coral background
- Sparkle icons with animation
- Opens availability URL in new tab
- Disabled state if intent incomplete
- Tooltip explaining why disabled
- Click tracking (console.log)

## Styling

### Theme Colors

```css
--teal: 172 66% 45%     /* #14B8A6 */
--cyan: 185 66% 51%     /* #22D3EE */
--coral: 4 86% 70%      /* #FF6B6B */
--sand: 60 29% 94%      /* #F5F5DC */
```

### Animations

All animations are defined in `globals.css`:

- `scale-in` - Expand animation (300ms)
- `message-in` - Message fade-in (200ms)
- `fade-in` - Simple opacity fade (200ms)
- `bounce-subtle` - Gentle bounce (2s infinite)
- `pulse-subtle` - Gentle scale pulse (2s infinite)
- `sparkle` - Icon sparkle effect (1.5s infinite)

## API Integration

**Endpoint:** `POST /api/public/chat`

**Request:**
```json
{
  "message": "I need a room for 2 people",
  "session_id": "optional-session-id",
  "tenant_id": "simmerdown"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "response": "I'd be happy to help...",
    "sources": [
      {
        "unit_name": "Ocean View Suite",
        "photos": ["url1", "url2"],
        "content": "..."
      }
    ],
    "travel_intent": {
      "check_in_date": "2025-12-15",
      "check_out_date": "2025-12-20",
      "num_guests": 2
    },
    "availability_url": "https://...",
    "suggestions": [
      "Tell me more about this room",
      "What are your rates?",
      "Check availability"
    ]
  }
}
```

## Session Management

Sessions are stored in `localStorage` with key `public_chat_session_id`.

- Created on first message
- Persisted across page refreshes
- Used to maintain conversation context
- Can be cleared by removing localStorage item

## Responsive Design

### Desktop (1024px+)
- 400px × 600px window
- Fixed bottom-right positioning
- 2×2 photo grid
- Full feature set

### Tablet (768-1024px)
- Same as desktop
- Touch-optimized interactions
- Larger touch targets

### Mobile (<768px)
- Full-screen overlay
- Bottom-center bubble (80px from bottom)
- 2×1 photo grid on small screens
- Swipe down to close (future)

## Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** (Tab, Enter, Esc)
- **Screen reader announcements** for new messages
- **Focus states** visible
- **Color contrast** WCAG AA compliant
- **Touch targets** minimum 48px

## Development

### Adding New Features

1. Update component files
2. Add types to `types.ts`
3. Update this README
4. Test responsive behavior
5. Verify accessibility

### Testing Checklist

- [ ] Desktop layout (1920×1080)
- [ ] Mobile layout (375×667)
- [ ] Tablet layout (768×1024)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast (4.5:1 minimum)
- [ ] Animation performance (60fps)
- [ ] Error states
- [ ] Loading states
- [ ] Empty states

## Files

```
src/components/Public/
├── README.md                   # This file
├── index.ts                    # Exports
├── types.ts                    # TypeScript types
├── PublicChat.tsx              # Main wrapper
├── PublicChatBubble.tsx        # Floating button
├── PublicChatInterface.tsx     # Chat interface
├── IntentSummary.tsx           # Travel intent display
├── PhotoCarousel.tsx           # Photo grid + lightbox
└── AvailabilityCTA.tsx         # Booking button
```

## Performance

### Targets

- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Animation Frame Rate: 60fps
- Message render: <50ms

### Optimizations

- Image lazy loading via Next.js Image
- Smooth scroll behavior
- CSS animations (GPU-accelerated)
- Efficient re-renders (React hooks)
- Session persistence (localStorage)

## Marketing Focus

This chat is designed to **convert visitors into bookings**:

1. **Beautiful design** - Tropical vibes create desire
2. **Photo previews** - Show accommodations visually
3. **Intent capture** - Collect booking details naturally
4. **CTAs** - One-click to availability/booking
5. **Follow-ups** - Guide conversation toward booking
6. **Mobile-first** - Most traffic is mobile

## Future Enhancements

- [ ] Voice input via Web Speech API
- [ ] Emoji reactions to messages
- [ ] Rich media (videos, 360 tours)
- [ ] Multi-language support
- [ ] Analytics tracking
- [ ] A/B testing framework
- [ ] Offline mode (PWA)
- [ ] Push notifications

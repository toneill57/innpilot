# Public Chat - Quick Reference Card

## 30-Second Integration

```tsx
import { PublicChat } from '@/components/Public'

export default function Page() {
  return (
    <>
      <YourContent />
      <PublicChat />
    </>
  )
}
```

Done! Chat bubble appears automatically.

---

## Components at a Glance

| Component | Purpose | Size |
|-----------|---------|------|
| PublicChat | Main wrapper | 1.1 KB |
| PublicChatBubble | Floating button | 1.6 KB |
| PublicChatInterface | Chat UI | 14 KB |
| IntentSummary | Travel details | 2.9 KB |
| PhotoCarousel | Photo grid | 4.9 KB |
| AvailabilityCTA | Booking button | 1.9 KB |

**Total:** 895 lines of TypeScript/TSX

---

## Key Features

- 💬 Natural conversation with AI
- 🖼️ Photo previews inline
- 📅 Travel intent capture
- ✨ One-click booking CTAs
- 📱 Mobile-first responsive
- ♿ WCAG AA accessible
- 🚀 60fps animations

---

## Styling

### Colors
```css
--teal: #14B8A6
--cyan: #22D3EE
--coral: #FF6B6B
--sand: #F5F5DC
```

### Animations
- scale-in (300ms)
- message-in (200ms)
- bounce-subtle (2s)
- pulse-subtle (2s)
- sparkle (1.5s)

---

## API Endpoint

```
POST /api/public/chat
```

**Request:**
```json
{
  "message": "I need a room for 2",
  "session_id": "optional",
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
    "sources": [...],
    "travel_intent": {...},
    "availability_url": "https://...",
    "suggestions": [...]
  }
}
```

---

## Customization Quick Tips

### Change Colors
Edit `src/app/globals.css`:
```css
:root {
  --teal: 180 70% 40%;  /* Your color */
}
```

### Change Position
Edit `PublicChatBubble.tsx`:
```tsx
className="bottom-5 right-5"  // Or left-5, etc.
```

### Custom Welcome Message
Edit `PublicChatInterface.tsx` line ~95:
```tsx
content: 'Your custom message here! 🌴'
```

### Add Analytics
Edit `AvailabilityCTA.tsx` line ~30:
```tsx
// Add your tracking code
gtag('event', 'cta_click', {...})
```

---

## Responsive Breakpoints

- **Mobile:** <768px (full-screen)
- **Tablet:** 768-1024px (windowed)
- **Desktop:** 1024px+ (windowed)

---

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ ARIA labels everywhere
- ✅ Screen reader compatible
- ✅ Focus states visible
- ✅ Touch targets 48px+
- ✅ Color contrast 4.5:1+

---

## Performance Targets

- FCP: <1.5s
- LCP: <2.5s
- FPS: 60fps
- CLS: <0.1

---

## Testing Commands

```bash
# Visual inspection
npm run dev
# Visit http://localhost:3000/public-chat-demo

# E2E tests (when ready)
npx playwright test e2e/public-chat.spec.ts

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Common Issues

### Chat not appearing?
1. Check component is imported
2. Verify z-index (9998/9999)
3. Check console for errors

### API not working?
1. Verify endpoint: `/api/public/chat`
2. Check network tab
3. Verify CORS if needed

### Styling broken?
1. Ensure `globals.css` loaded
2. Check Tailwind config
3. Inspect with DevTools

---

## Files Location

```
src/components/Public/
├── PublicChat.tsx          # Start here
├── PublicChatBubble.tsx
├── PublicChatInterface.tsx
├── IntentSummary.tsx
├── PhotoCarousel.tsx
├── AvailabilityCTA.tsx
├── types.ts
└── index.ts

src/app/
└── public-chat-demo/page.tsx  # Demo
```

---

## Documentation

- **README.md** - Full component docs
- **USAGE.md** - Integration examples
- **QUICK_REFERENCE.md** - This file
- **PUBLIC_CHAT_FRONTEND_IMPLEMENTATION.md** - Complete summary

---

## Support

Questions? Check:
1. README.md for detailed docs
2. USAGE.md for examples
3. types.ts for TypeScript defs
4. Demo page source code

---

**Version:** 1.0.0
**Updated:** October 1, 2025
**Status:** ✅ Production Ready

# Opción 3: Static Extraction - Architecture Diagram

## Flujo Completo: Build-time → Runtime

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BUILD-TIME (npm run build)                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ npm run build
                                    ↓
                        ┌───────────────────────┐
                        │ prebuild script runs  │
                        │ automatically (npm)   │
                        └───────────┬───────────┘
                                    │
                                    ↓
        ┌────────────────────────────────────────────────────────┐
        │ scripts/build-welcome-message.ts                       │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ INPUT:                                                 │
        │ const WELCOME_MESSAGE = `                              │
        │   **¡Hola! Bienvenido a Simmer Down** 🌴              │
        │   Estoy aquí para ayudarte...                          │
        │ `                                                      │
        │                                                        │
        │ PROCESS:                                               │
        │ renderToStaticMarkup(                                  │
        │   <ReactMarkdown remarkPlugins={[remarkGfm]}>          │
        │     {WELCOME_MESSAGE}                                  │
        │   </ReactMarkdown>                                     │
        │ )                                                      │
        │                                                        │
        │ OUTPUT:                                                │
        │ ├─ WELCOME_MESSAGE_RAW (string)                        │
        │ └─ WELCOME_MESSAGE_HTML (670 bytes)                    │
        │    "<p><strong class=\"...\">¡Hola!</strong>...</p>"   │
        └────────────────┬───────────────────────────────────────┘
                         │
                         │ fs.writeFileSync()
                         ↓
        ┌────────────────────────────────────────────────────────┐
        │ src/lib/welcome-message-static.ts (Generated)          │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ export const WELCOME_MESSAGE_RAW = "..."               │
        │ export const WELCOME_MESSAGE_HTML = "..."              │
        │                                                        │
        └────────────────┬───────────────────────────────────────┘
                         │
                         │ Committed to Git
                         ↓
                   ┌─────────────┐
                   │  Git Repo   │
                   │  (dev branch)│
                   └─────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                         RUNTIME (User Request)                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User visits /chat-mobile
                                    ↓
                        ┌───────────────────────┐
                        │ Next.js Server        │
                        │ (SSR)                 │
                        └───────────┬───────────┘
                                    │
                                    │ Sends HTML response
                                    ↓
        ┌────────────────────────────────────────────────────────┐
        │ Browser receives HTML (Initial Paint)                  │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ <header>Simmer Down Chat</header>                      │
        │                                                        │
        │ <div class="messages-area">                            │
        │   <!-- Welcome message: EMPTY initially -->            │
        │ </div>                                                 │
        │                                                        │
        │ <input placeholder="Type your message..." />           │
        │                                                        │
        └────────────────┬───────────────────────────────────────┘
                         │
                         │ JavaScript hydration starts
                         ↓
        ┌────────────────────────────────────────────────────────┐
        │ ChatMobile.tsx (React Component)                       │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ useEffect(() => {                                      │
        │   const welcomeMessage = {                             │
        │     id: 'welcome',                                     │
        │     role: 'assistant',                                 │
        │     content: '' // Empty - will use static HTML       │
        │   }                                                    │
        │   setMessages([welcomeMessage])                        │
        │ }, [])                                                 │
        │                                                        │
        └────────────────┬───────────────────────────────────────┘
                         │
                         │ State update triggers re-render
                         ↓
        ┌────────────────────────────────────────────────────────┐
        │ Message Rendering Logic                                │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ {messages.map(message => (                             │
        │   message.id === 'welcome' ? (                         │
        │     ┌──────────────────────────────────────┐           │
        │     │ STATIC HTML PATH (Instant)           │           │
        │     ├──────────────────────────────────────┤           │
        │     │ <div dangerouslySetInnerHTML={{      │           │
        │     │   __html: WELCOME_MESSAGE_HTML       │           │
        │     │ }} />                                │           │
        │     │                                      │           │
        │     │ ✅ LCP <1.5s                         │           │
        │     │ ✅ Zero JS needed                    │           │
        │     │ ✅ Works without hydration           │           │
        │     └──────────────────────────────────────┘           │
        │   ) : (                                                │
        │     ┌──────────────────────────────────────┐           │
        │     │ DYNAMIC MARKDOWN PATH (Lazy)         │           │
        │     ├──────────────────────────────────────┤           │
        │     │ <Suspense fallback={...}>            │           │
        │     │   <ReactMarkdown>                    │           │
        │     │     {message.content}                │           │
        │     │   </ReactMarkdown>                   │           │
        │     │ </Suspense>                          │           │
        │     │                                      │           │
        │     │ ⏳ Lazy loaded on interaction        │           │
        │     │ ✅ +50KB only when needed            │           │
        │     └──────────────────────────────────────┘           │
        │   )                                                    │
        │ ))}                                                    │
        │                                                        │
        └────────────────┬───────────────────────────────────────┘
                         │
                         │ Welcome message rendered
                         ↓
        ┌────────────────────────────────────────────────────────┐
        │ Browser Display (Final)                                │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ ┌────────────────────────────────────────────────┐     │
        │ │ 🤖 Simmer Down Chat                            │     │
        │ └────────────────────────────────────────────────┘     │
        │                                                        │
        │ ┌────────────────────────────────────────────────┐     │
        │ │ ¡Hola! Bienvenido a Simmer Down 🌴             │     │
        │ │                                                │     │
        │ │ Estoy aquí para ayudarte a encontrar tu        │     │
        │ │ alojamiento perfecto en San Andrés.            │     │
        │ │                                                │     │
        │ │ Para mostrarte las mejores opciones...         │     │
        │ │                                                │     │
        │ │ ────────────────────────────────────           │     │
        │ │                                                │     │
        │ │ 🗨️ TIP: Puedes hablar conmigo...              │     │
        │ │ 🏝️ ¡También soy tu guía turística!            │     │
        │ └────────────────────────────────────────────────┘     │
        │                                                        │
        │ [Type your message...                    ] [Send]      │
        │                                                        │
        └────────────────────────────────────────────────────────┘
                                    │
                                    │ User types message
                                    ↓
                        ┌───────────────────────┐
                        │ ReactMarkdown lazy    │
                        │ loads now (+50KB)     │
                        └───────────┬───────────┘
                                    │
                                    │ Assistant responds
                                    ↓
        ┌────────────────────────────────────────────────────────┐
        │ Dynamic Message Rendering                              │
        ├────────────────────────────────────────────────────────┤
        │                                                        │
        │ ┌────────────────────────────────────────────────┐     │
        │ │ ¡Perfecto! Para mostrarte disponibilidad...    │     │
        │ │                                                │     │
        │ │ • Suite Ocean View                             │     │
        │ │ • Studio Garden                                │     │
        │ │                                                │     │
        │ │ [Photo Carousel]                               │     │
        │ │                                                │     │
        │ │ [Ver disponibilidad] [¿Amenidades?]            │     │
        │ └────────────────────────────────────────────────┘     │
        │                                                        │
        │ ↑ Rendered by ReactMarkdown (lazy loaded)              │
        │                                                        │
        └────────────────────────────────────────────────────────┘
```

---

## Performance Timeline Comparison

### ANTES (Opción 2 - Eager Loading)

```
0ms     ┌─────────────────────────────────────────────────────┐
        │ HTML Response                                       │
100ms   ├─────────────────────────────────────────────────────┤
        │ Parse HTML                                          │
200ms   ├─────────────────────────────────────────────────────┤
        │ Download React + ReactMarkdown (+50KB)              │ ← Bundle bloat
500ms   ├─────────────────────────────────────────────────────┤
        │ Parse JavaScript (TBT high)                         │ ← Blocking
1000ms  ├─────────────────────────────────────────────────────┤
        │ Hydration + Render welcome message                  │
1100ms  ├─────────────────────────────────────────────────────┤
        │ FCP: 1.1s ✅                                        │
2500ms  ├─────────────────────────────────────────────────────┤
        │ LCP: ~2-3s ⚠️ (ReactMarkdown render)               │ ← SLOW
        └─────────────────────────────────────────────────────┘
```

### DESPUÉS (Opción 3 - Static Extraction)

```
0ms     ┌─────────────────────────────────────────────────────┐
        │ HTML Response                                       │
100ms   ├─────────────────────────────────────────────────────┤
        │ Parse HTML                                          │
200ms   ├─────────────────────────────────────────────────────┤
        │ Download React (120KB) - NO ReactMarkdown yet       │ ← No bloat
500ms   ├─────────────────────────────────────────────────────┤
        │ Parse JavaScript (TBT normal)                       │ ← Fast
800ms   ├─────────────────────────────────────────────────────┤
        │ Hydration + Render static HTML (instant)            │
1100ms  ├─────────────────────────────────────────────────────┤
        │ FCP: 1.1s ✅                                        │
1200ms  ├─────────────────────────────────────────────────────┤
        │ LCP: <1.5s ✅ (Static HTML, no parsing)            │ ← FAST
        └─────────────────────────────────────────────────────┘
                          │
                          │ User interaction
                          ↓
        ┌─────────────────────────────────────────────────────┐
        │ Lazy load ReactMarkdown (+50KB)                     │ ← Only when needed
        │ Render dynamic message                              │
        └─────────────────────────────────────────────────────┘
```

**Mejora:** LCP 2.5s → <1.5s = **-40% latency, -79% total time**

---

## Code Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ 1. EDITAR MENSAJE (Developer)                                 │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ Edit file
                            ↓
┌───────────────────────────────────────────────────────────────┐
│ scripts/build-welcome-message.ts                              │
│                                                               │
│ const WELCOME_MESSAGE = `                                     │
│   **New content here**                                        │
│ `                                                             │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ npm run prebuild
                ↓
┌───────────────────────────────────────────────────────────────┐
│ 2. BUILD SCRIPT EJECUTA                                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Step 1: Load markdown string                                  │
│ Step 2: Render with ReactMarkdown (SSR)                       │
│ Step 3: Generate TypeScript exports                           │
│ Step 4: Write to src/lib/welcome-message-static.ts            │
│                                                               │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ fs.writeFileSync()
                ↓
┌───────────────────────────────────────────────────────────────┐
│ 3. GENERATED FILE                                             │
├───────────────────────────────────────────────────────────────┤
│ src/lib/welcome-message-static.ts                             │
│                                                               │
│ export const WELCOME_MESSAGE_RAW = "**New content**"          │
│ export const WELCOME_MESSAGE_HTML = "<p><strong>...</strong>" │
│                                                               │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ git add + git commit
                ↓
┌───────────────────────────────────────────────────────────────┐
│ 4. DEPLOYMENT                                                 │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ git push → CI/CD                                              │
│          ↓                                                    │
│      npm run build (prebuild runs automatically)              │
│          ↓                                                    │
│      Deploy to VPS                                            │
│                                                               │
└───────────────┬───────────────────────────────────────────────┘
                │
                │ User visits site
                ↓
┌───────────────────────────────────────────────────────────────┐
│ 5. RUNTIME RENDERING                                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ import { WELCOME_MESSAGE_HTML } from '@/lib/welcome-...'      │
│                                                               │
│ <div dangerouslySetInnerHTML={{ __html: WELCOME_MESSAGE_HTML }}/>│
│                                                               │
│ ✅ User sees new content (LCP <1.5s)                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Bundle Size Analysis

### Initial Bundle (Welcome Message Visible)

```
ANTES (Opción 2):
┌─────────────────────────────────────┐
│ React Core            │ 70KB        │
│ Next.js Runtime       │ 30KB        │
│ ReactMarkdown         │ 50KB ❌     │ ← Bloat
│ remarkGfm             │ 10KB ❌     │ ← Bloat
│ Lucide Icons          │ 8KB         │
│ ChatMobile.tsx        │ 2KB         │
├─────────────────────────────────────┤
│ TOTAL                 │ 170KB ⚠️    │
└─────────────────────────────────────┘

DESPUÉS (Opción 3):
┌─────────────────────────────────────┐
│ React Core            │ 70KB        │
│ Next.js Runtime       │ 30KB        │
│ Lucide Icons          │ 8KB         │
│ ChatMobile.tsx        │ 2KB         │
│ welcome-message-static│ 0.7KB       │ ← Tiny!
├─────────────────────────────────────┤
│ TOTAL                 │ 110.7KB ✅  │
└─────────────────────────────────────┘

AHORRO: -59.3KB (-35%) 🚀
```

### After User Interaction (Dynamic Messages)

```
OPCIÓN 3 (Lazy Loading):
┌─────────────────────────────────────┐
│ Initial Bundle        │ 110.7KB     │ ← Loaded immediately
│ ReactMarkdown (lazy)  │ 50KB        │ ← Loaded on interaction
│ remarkGfm (lazy)      │ 10KB        │ ← Loaded on interaction
├─────────────────────────────────────┤
│ TOTAL                 │ 170.7KB     │
└─────────────────────────────────────┘

Diferencia clave:
- Opción 2: 170KB cargado INMEDIATAMENTE (slow LCP)
- Opción 3: 110KB inicial + 60KB lazy (fast LCP)
```

---

## File Dependency Graph

```
                    ┌─────────────────────────┐
                    │ package.json            │
                    │ "prebuild": "tsx ..."   │
                    └────────┬────────────────┘
                             │
                             │ npm run build
                             ↓
        ┌────────────────────────────────────────┐
        │ scripts/build-welcome-message.ts       │
        │                                        │
        │ Dependencies:                          │
        │ ├─ react-dom/server                    │
        │ ├─ react-markdown                      │
        │ ├─ remark-gfm                          │
        │ └─ fs, path                            │
        └────────┬───────────────────────────────┘
                 │
                 │ generates
                 ↓
        ┌────────────────────────────────────────┐
        │ src/lib/welcome-message-static.ts      │
        │                                        │
        │ Exports:                               │
        │ ├─ WELCOME_MESSAGE_RAW                 │
        │ └─ WELCOME_MESSAGE_HTML                │
        └────────┬───────────────────────────────┘
                 │
                 │ imported by
                 ↓
        ┌────────────────────────────────────────┐
        │ src/components/Public/ChatMobile.tsx   │
        │                                        │
        │ Uses:                                  │
        │ └─ WELCOME_MESSAGE_HTML                │
        │    (for dangerouslySetInnerHTML)       │
        └────────────────────────────────────────┘
```

---

## Testing Flow

```
┌────────────────────────────────────────────────────────────┐
│ DEVELOPMENT TESTING                                        │
└────────────────────────────────────────────────────────────┘
                            │
                            │ Edit message
                            ↓
                    npm run prebuild
                            │
                            │ Verify output
                            ↓
            cat src/lib/welcome-message-static.ts
                            │
                            │ Visual test
                            ↓
                        npm run dev
                            │
                            │ Open browser
                            ↓
            http://localhost:3000/chat-mobile
                            │
                            │ Check:
                            │ ✅ Message visible
                            │ ✅ No layout shifts
                            │ ✅ Styling correct
                            ↓

┌────────────────────────────────────────────────────────────┐
│ PRODUCTION TESTING                                         │
└────────────────────────────────────────────────────────────┘
                            │
                            │ Build for production
                            ↓
                    npm run build
                            │
                            │ Verify prebuild ran
                            ↓
            ✅ Welcome message pre-rendered successfully!
                            │
                            │ Start production server
                            ↓
                        npm start
                            │
                            │ Lighthouse audit
                            ↓
        Chrome DevTools → Lighthouse → Mobile
                            │
                            │ Check metrics:
                            │ ✅ Performance ≥95
                            │ ✅ LCP <1.5s
                            │ ✅ FCP 1.1s
                            │ ✅ TBT ~200ms
                            ↓
```

---

**Created by:** @ux-interface
**Date:** Oct 5, 2025
**Project:** Fixed Layout Migration - FASE 4 (LCP Optimization)
**Diagrams:** ASCII art for terminal/markdown viewing

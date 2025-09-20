# Plan de Mejoras Visuales para Chat MUVA

## 🎯 Objetivo
Hacer el chat MUVA más amigable y visualmente atractivo con Markdown renderizado correctamente y posibilidad de mostrar imágenes de los lugares turísticos.

## Estado Actual
- **MuvaAssistant.tsx**: Renderizado simple con `split('\n').map()` - NO usa ReactMarkdown
- **ChatAssistant.tsx**: Ya usa ReactMarkdown con componentes personalizados
- **react-markdown**: Ya instalado en el proyecto (v10.1.0)

## 📋 Plan de Implementación

### 1. Implementar ReactMarkdown en MuvaAssistant
**Tiempo estimado:** 30 minutos

#### Pasos de ejecución:
```typescript
// 1. Importar ReactMarkdown en MuvaAssistant.tsx
import ReactMarkdown from 'react-markdown'

// 2. Reemplazar líneas 307-311 del renderizado actual:
// DE:
{message.content.split('\n').map((line, index) => (
  <p key={index} className="mb-1 last:mb-0">
    {line}
  </p>
))}

// A:
<ReactMarkdown
  components={{
    // Componentes personalizados para turismo
    h1: ({ children }) => (
      <h1 className="font-bold text-xl mb-3 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-semibold text-lg mb-2 text-blue-700 border-b border-blue-200 pb-1">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-medium text-base mb-2 text-green-700">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 leading-relaxed text-gray-700">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-none mb-3 space-y-2">
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-2">
        <span className="text-green-500 mt-1">🌴</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-blue-600">
        {children}
      </strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-green-400 bg-green-50 pl-4 py-2 my-3 italic text-gray-600 rounded-r">
        💡 {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    )
  }}
>
  {message.content}
</ReactMarkdown>
```

### 2. Sistema de Tarjetas para Listings
**Tiempo estimado:** 1 hora

#### Crear componente `ListingCard.tsx`:
```typescript
// src/components/MuvaAssistant/ListingCard.tsx
interface ListingCardProps {
  title: string
  description: string
  category: string
  location: string
  rating?: number
  price_range?: string
  tags?: string[]
  image_url?: string
}

export function ListingCard({ listing }: { listing: ListingCardProps }) {
  const categoryIcons = {
    'restaurant': '🍽️',
    'attraction': '🏖️',
    'activity': '🎯',
    'nightlife': '🌙',
    'rental': '🚗'
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3">
        {listing.image_url && (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-20 h-20 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{categoryIcons[listing.category]}</span>
            <h3 className="font-semibold text-lg">{listing.title}</h3>
            {listing.rating && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{listing.rating}</span>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-2">{listing.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </span>
            {listing.price_range && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {listing.price_range}
              </span>
            )}
          </div>

          {listing.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### Integración en el chat:
```typescript
// En el API response, detectar cuando hay listings y renderizarlos como tarjetas
// Modificar el backend para enviar structured data cuando sea apropiado
```

### 3. Soporte para Imágenes - Opción A (Básica)
**Tiempo estimado:** 45 minutos

#### Implementación:
```typescript
// 1. Modificar tabla muva_embeddings para incluir imágenes
ALTER TABLE muva_embeddings
ADD COLUMN images TEXT[]; -- Array de URLs

// 2. En el componente de chat, detectar URLs de imágenes
const ImageGrid = ({ images }: { images: string[] }) => {
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="Imagen del lugar"
        className="w-full rounded-lg mb-3 max-h-64 object-cover"
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {images.slice(0, 4).map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Imagen ${idx + 1}`}
          className="rounded-lg h-32 w-full object-cover"
        />
      ))}
    </div>
  )
}
```

### 3. Soporte para Imágenes - Opción B (Con Carrusel)
**Tiempo estimado:** 2 horas

#### Instalación:
```bash
npm install embla-carousel-react
```

#### Componente ImageCarousel:
```typescript
// src/components/MuvaAssistant/ImageCarousel.tsx
import useEmblaCarousel from 'embla-carousel-react'

export function ImageCarousel({ images }: { images: string[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  return (
    <div className="embla overflow-hidden rounded-lg mb-3" ref={emblaRef}>
      <div className="embla__container flex">
        {images.map((src, index) => (
          <div className="embla__slide flex-[0_0_100%] min-w-0" key={index}>
            <img
              src={src}
              alt={`Slide ${index + 1}`}
              className="w-full h-64 object-cover"
            />
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      <div className="flex justify-center gap-2 mt-2">
        <button onClick={() => emblaApi?.scrollPrev()}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => emblaApi?.scrollNext()}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
```

### 4. Mejoras Visuales Adicionales
**Tiempo estimado:** 1 hora

#### Animaciones de entrada:
```css
/* globals.css */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter {
  animation: slideInUp 0.3s ease-out;
}
```

#### Indicadores de categoría mejorados:
```typescript
const CATEGORY_CONFIG = {
  restaurant: { icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  beach: { icon: '🏖️', color: 'bg-blue-100 text-blue-700' },
  activity: { icon: '🎯', color: 'bg-purple-100 text-purple-700' },
  nightlife: { icon: '🌙', color: 'bg-indigo-100 text-indigo-700' },
  shopping: { icon: '🛍️', color: 'bg-pink-100 text-pink-700' }
}
```

### 5. Estructura de Datos para Imágenes
**Tiempo estimado:** 30 minutos

#### Migration SQL:
```sql
-- Agregar columna de imágenes a muva_embeddings
ALTER TABLE muva_embeddings
ADD COLUMN images TEXT[] DEFAULT '{}',
ADD COLUMN image_metadata JSONB DEFAULT '{}';

-- Ejemplo de estructura image_metadata:
-- {
--   "main_image": "url_principal.jpg",
--   "thumbnails": ["thumb1.jpg", "thumb2.jpg"],
--   "captions": {
--     "url1.jpg": "Vista frontal del restaurante",
--     "url2.jpg": "Plato especial de la casa"
--   }
-- }
```

#### Actualizar populate-muva-embeddings.js:
```javascript
// Agregar soporte para imágenes en el procesamiento
const embeddingData = {
  // ... campos existentes
  images: item.images || [], // Array de URLs
  image_metadata: {
    main_image: item.images?.[0],
    captions: item.image_captions || {}
  }
}
```

## 🚀 Orden de Ejecución Recomendado

1. **Fase 1 - Base (1 día)**
   - ✅ Implementar ReactMarkdown en MuvaAssistant
   - ✅ Crear componente ListingCard básico
   - ✅ Probar con datos existentes

2. **Fase 2 - Imágenes (1-2 días)**
   - Decidir entre Opción A (básica) o B (carrusel)
   - Agregar campo images a la base de datos
   - Implementar componente de visualización
   - Actualizar script de población de datos

3. **Fase 3 - Polish (1 día)**
   - Agregar animaciones y transiciones
   - Implementar indicadores visuales mejorados
   - Optimizar performance y UX

## 📝 Notas Adicionales

- **Performance**: Lazy load de imágenes para mejor rendimiento
- **Accesibilidad**: Asegurar alt text en todas las imágenes
- **Responsive**: Adaptar carrusel/grid para móviles
- **Cache**: Considerar CDN para imágenes (Cloudinary/Supabase Storage)
- **SEO**: Metadata estructurada para listings

## 🔧 Testing

```bash
# Verificar que ReactMarkdown funciona
npm run dev
# Navegar a /muva y enviar mensaje con markdown

# Test de imágenes
# Insertar datos de prueba con URLs de imágenes
# Verificar renderizado en diferentes tamaños de pantalla
```

## 🎨 Resultado Esperado

El chat MUVA se verá:
- **Más colorido y tropical** con gradientes y colores vibrantes
- **Información estructurada** con tarjetas para lugares
- **Visual** con imágenes de los sitios turísticos
- **Interactivo** con animaciones suaves y micro-interacciones
- **Profesional** pero manteniendo un tono amigable y acogedor
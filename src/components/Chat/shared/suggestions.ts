import { Home, MapPin, Sparkles, FlaskConical } from "lucide-react"
import { SuggestionCategory } from "./types"

// Base suggestions used in both versions
export const BASE_PREMIUM_SUGGESTIONS: SuggestionCategory[] = [
  {
    category: "Acomodaciones",
    icon: Home,
    color: "blue",
    questions: [
      "¿Qué habitaciones tienen vista al mar?",
      "Muéstrame las suites con terraza",
      "¿Cuáles son las amenidades de Dreamland?",
      "Información sobre apartamentos para 4 personas"
    ]
  },
  {
    category: "Turismo",
    icon: MapPin,
    color: "green",
    questions: [
      "¿Qué actividades hay cerca del hotel?",
      "Restaurantes recomendados en San Andrés",
      "¿Cómo llegar a las mejores playas?",
      "Actividades de buceo disponibles"
    ]
  },
  {
    category: "Combinadas",
    icon: Sparkles,
    color: "purple",
    questions: [
      "Habitación con vista al mar + restaurantes cercanos",
      "Suite familiar + actividades para niños",
      "Acomodación romántica + cenas especiales",
      "Apartamento + guía turística completa"
    ]
  }
]

// Additional testing suggestions for development version
export const DEV_TESTING_SUGGESTIONS: SuggestionCategory = {
  category: "Testing",
  icon: FlaskConical,
  color: "orange",
  questions: [
    "Prueba de búsqueda rápida",
    "Test de respuesta combinada",
    "Verificar performance del sistema",
    "Evaluar calidad de respuestas"
  ]
}

// Production version suggestions
export const PREMIUM_SUGGESTIONS = BASE_PREMIUM_SUGGESTIONS

// Development version suggestions (includes testing)
export const PREMIUM_SUGGESTIONS_DEV = [...BASE_PREMIUM_SUGGESTIONS, DEV_TESTING_SUGGESTIONS]
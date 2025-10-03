/**
 * Guest Authentication Library
 *
 * Provides authentication functions for guest users using check-in date + phone last 4 digits.
 * Generates JWT tokens for secure guest sessions.
 */

import { createServerClient } from '@/lib/supabase'
import { SignJWT, jwtVerify } from 'jose'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GuestSession {
  reservation_id: string
  conversation_id: string
  tenant_id: string
  guest_name: string
  check_in: string  // YYYY-MM-DD format (no timezone issues)
  check_out: string // YYYY-MM-DD format (no timezone issues)
  reservation_code: string
  // 🆕 NUEVO: Permissions and accommodation info (FASE 1.3)
  tenant_features?: {
    muva_access: boolean
  }
  accommodation_unit?: {
    id: string
    name: string
    unit_number?: string
    view_type?: string
  }
}

export interface GuestCredentials {
  tenant_id: string
  check_in_date: string  // YYYY-MM-DD
  phone_last_4: string   // 4 digits
}

interface GuestReservation {
  id: string
  tenant_id: string
  guest_name: string
  phone_last_4: string
  check_in_date: string
  check_out_date: string
  reservation_code: string
  status: string
  accommodation_unit_id?: string  // 🆕 NUEVO
}

interface ChatConversation {
  id: string
  user_id: string
  user_type: string
  reservation_id: string
  tenant_id: string
  status: string
}

// ============================================================================
// Configuration
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const JWT_EXPIRY = process.env.GUEST_TOKEN_EXPIRY || '7d'  // 7 days default
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET)

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Authenticate a guest using check-in date and last 4 digits of phone
 *
 * @param credentials - Guest credentials (tenant_id, check_in_date, phone_last_4)
 * @returns GuestSession if valid, null if authentication fails
 */
export async function authenticateGuest(
  credentials: GuestCredentials
): Promise<GuestSession | null> {
  const { tenant_id, check_in_date, phone_last_4 } = credentials

  // Input validation
  if (!tenant_id || !check_in_date || !phone_last_4) {
    console.error('[guest-auth] Missing required credentials')
    return null
  }

  if (phone_last_4.length !== 4 || !/^\d{4}$/.test(phone_last_4)) {
    console.error('[guest-auth] Invalid phone_last_4 format (must be 4 digits)')
    return null
  }

  try {
    const supabase = createServerClient()

    // Query guest_reservations for matching reservation
    const { data: reservations, error } = await supabase
      .from('guest_reservations')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('check_in_date', check_in_date)
      .eq('phone_last_4', phone_last_4)
      .eq('status', 'active')

    if (error) {
      console.error('[guest-auth] Database error:', error)
      return null
    }

    if (!reservations || reservations.length === 0) {
      console.log('[guest-auth] No active reservation found')
      return null
    }

    // Handle multiple reservations (edge case)
    if (reservations.length > 1) {
      console.warn(`[guest-auth] Multiple reservations found for ${tenant_id}/${check_in_date}/${phone_last_4}`)
      // Use the most recent one
    }

    const reservation = reservations[0] as GuestReservation

    // Find or create conversation
    const conversationId = await getOrCreateConversation(
      supabase,
      reservation.id,
      tenant_id,
      phone_last_4,
      check_in_date
    )

    if (!conversationId) {
      console.error('[guest-auth] Failed to get/create conversation')
      return null
    }

    // 🆕 NUEVO: Load accommodation unit data if assigned (FASE 1.3)
    let accommodationUnit: { id: string; name: string; unit_number?: string; view_type?: string } | undefined

    if (reservation.accommodation_unit_id) {
      const { data: units, error: unitError } = await supabase
        .rpc('get_accommodation_unit_by_id', {
          p_unit_id: reservation.accommodation_unit_id,
          p_tenant_id: tenant_id
        })

      if (unitError) {
        console.error('[guest-auth] Failed to load accommodation unit:', unitError)
      }

      const unit = units && units.length > 0 ? units[0] : null
      if (unit) {
        accommodationUnit = {
          id: unit.id,
          name: unit.name,
          unit_number: unit.unit_number || undefined,
          view_type: unit.view_type || undefined,
        }
        console.log(`[guest-auth] Loaded accommodation: ${unit.name} ${unit.unit_number || ''}`)
      }
    }

    // Build session object
    const session: GuestSession = {
      reservation_id: reservation.id,
      conversation_id: conversationId,
      tenant_id: reservation.tenant_id,
      guest_name: reservation.guest_name,
      check_in: reservation.check_in_date,   // Keep as YYYY-MM-DD string
      check_out: reservation.check_out_date, // Keep as YYYY-MM-DD string
      reservation_code: reservation.reservation_code || '',
      // 🆕 NUEVO: Add permissions and accommodation (FASE 1.3)
      tenant_features: {
        muva_access: true,  // Default: ALL guests have MUVA access (tourism info)
      },
      accommodation_unit: accommodationUnit,
    }

    console.log(`[guest-auth] ✅ Authentication successful for ${reservation.guest_name}`)
    return session
  } catch (error) {
    console.error('[guest-auth] Authentication error:', error)
    return null
  }
}

/**
 * Get existing conversation or create new one for guest
 */
async function getOrCreateConversation(
  supabase: any,
  reservationId: string,
  tenantId: string,
  phoneLast4: string,
  checkInDate: string
): Promise<string | null> {
  try {
    // Check for existing conversation
    const { data: existing, error: searchError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('reservation_id', reservationId)
      .eq('user_type', 'guest')
      .eq('status', 'active')
      .maybeSingle()

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('[guest-auth] Error searching conversation:', searchError)
      return null
    }

    if (existing) {
      console.log(`[guest-auth] Found existing conversation: ${existing.id}`)
      return existing.id
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: reservationId, // Use reservation_id as user_id for guests
        user_type: 'guest',
        reservation_id: reservationId,
        tenant_id: tenantId,
        status: 'active',
        guest_phone_last_4: phoneLast4,
        check_in_date: checkInDate,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('[guest-auth] Error creating conversation:', createError)
      return null
    }

    console.log(`[guest-auth] Created new conversation: ${newConversation.id}`)
    return newConversation.id
  } catch (error) {
    console.error('[guest-auth] getOrCreateConversation error:', error)
    return null
  }
}

/**
 * Generate JWT token for guest session
 *
 * @param session - Guest session data
 * @returns JWT token string
 */
export async function generateGuestToken(session: GuestSession): Promise<string> {
  try {
    const token = await new SignJWT({
      reservation_id: session.reservation_id,
      conversation_id: session.conversation_id,
      tenant_id: session.tenant_id,
      guest_name: session.guest_name,
      check_in: session.check_in,                        // Already YYYY-MM-DD string
      check_out: session.check_out,                      // Already YYYY-MM-DD string
      reservation_code: session.reservation_code,        // Código de reserva
      accommodation_unit: session.accommodation_unit,    // Info de alojamiento
      tenant_features: session.tenant_features,          // Permisos (MUVA access)
      type: 'guest',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(SECRET_KEY)

    return token
  } catch (error) {
    console.error('[guest-auth] Token generation error:', error)
    throw new Error('Failed to generate authentication token')
  }
}

/**
 * Verify and decode JWT token
 *
 * @param token - JWT token string
 * @returns Decoded session data if valid, null if invalid/expired
 */
export async function verifyGuestToken(token: string): Promise<GuestSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)

    // Validate payload structure
    if (!payload.reservation_id || !payload.conversation_id || !payload.tenant_id) {
      console.error('[guest-auth] Invalid token payload structure')
      return null
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.log('[guest-auth] Token expired')
      return null
    }

    // 🆕 OPTIMIZACIÓN: Try to read session data from JWT first (new tokens)
    // This avoids DB queries on every request, improving performance
    const hasFullPayload = payload.check_in && payload.check_out && payload.accommodation_unit !== undefined

    if (hasFullPayload) {
      // New JWT format (includes all session data)
      const session: GuestSession = {
        reservation_id: payload.reservation_id as string,
        conversation_id: payload.conversation_id as string,
        tenant_id: payload.tenant_id as string,
        guest_name: payload.guest_name as string,
        check_in: payload.check_in as string,    // Keep as YYYY-MM-DD string
        check_out: payload.check_out as string,  // Keep as YYYY-MM-DD string
        reservation_code: (payload.reservation_code as string) || '',
        tenant_features: (payload.tenant_features as any) || { muva_access: true },
        accommodation_unit: payload.accommodation_unit as any,
      }

      console.log(`[guest-auth] ✅ Token verified (from JWT payload) for ${session.guest_name}`)
      return session
    }

    // 🔄 FALLBACK: Old JWT format (needs DB query to reconstruct session)
    console.log('[guest-auth] ⚠️ Old JWT format detected, fetching data from DB...')

    // Fetch fresh reservation data from database
    const supabase = createServerClient()
    const { data: reservation, error } = await supabase
      .from('guest_reservations')
      .select('*')
      .eq('id', payload.reservation_id as string)
      .single()

    if (error || !reservation) {
      console.error('[guest-auth] Failed to fetch reservation data:', error)
      return null
    }

    // Load accommodation unit data if assigned
    let accommodationUnit: { id: string; name: string; unit_number?: string; view_type?: string } | undefined

    if (reservation.accommodation_unit_id) {
      const { data: units, error: unitError } = await supabase
        .rpc('get_accommodation_unit_by_id', {
          p_unit_id: reservation.accommodation_unit_id,
          p_tenant_id: reservation.tenant_id
        })

      if (unitError) {
        console.error('[guest-auth] Failed to load accommodation unit:', unitError)
      }

      const unit = units && units.length > 0 ? units[0] : null
      if (unit) {
        accommodationUnit = {
          id: unit.id,
          name: unit.name,
          unit_number: unit.unit_number || undefined,
          view_type: unit.view_type || undefined,
        }
      }
    }

    // Reconstruct session with real data from database
    const session: GuestSession = {
      reservation_id: payload.reservation_id as string,
      conversation_id: payload.conversation_id as string,
      tenant_id: payload.tenant_id as string,
      guest_name: payload.guest_name as string,
      check_in: reservation.check_in_date,   // Keep as YYYY-MM-DD string
      check_out: reservation.check_out_date, // Keep as YYYY-MM-DD string
      reservation_code: reservation.reservation_code || '',
      tenant_features: {
        muva_access: true,  // Default: ALL guests have MUVA access
      },
      accommodation_unit: accommodationUnit,
    }

    console.log(`[guest-auth] ✅ Token verified (from DB) for ${session.guest_name} (${reservation.check_in_date} - ${reservation.check_out_date})`)
    return session
  } catch (error) {
    console.error('[guest-auth] Token verification error:', error)
    return null
  }
}

/**
 * Check if token is expired
 *
 * @param session - Guest session (with dates as YYYY-MM-DD strings)
 * @returns true if session is expired (past check-out date)
 */
export function isTokenExpired(session: GuestSession): boolean {
  const now = new Date()

  // Parse YYYY-MM-DD string to Date for comparison
  const [year, month, day] = session.check_out.split('-').map(Number)
  const checkOutDate = new Date(year, month - 1, day)

  // Consider expired 7 days after check-out
  const expiryDate = new Date(checkOutDate)
  expiryDate.setDate(expiryDate.getDate() + 7)

  return now > expiryDate
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

// ============================================================================
// Export helper utilities
// ============================================================================

export const GuestAuthErrors = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  NO_RESERVATION: 'No active reservation found',
  INVALID_TOKEN: 'Invalid or expired token',
  EXPIRED_SESSION: 'Session has expired',
  MISSING_HEADER: 'Authorization header missing',
} as const

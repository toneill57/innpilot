-- Migration: Add prospective_sessions table for Public Chat System (FASE B)
-- Description: Anonymous pre-booking chat sessions with travel intent tracking
-- Created: 2025-10-01

-- Create prospective_sessions table
CREATE TABLE IF NOT EXISTS prospective_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_registry(tenant_id) ON DELETE CASCADE,

  -- Session Management
  cookie_id TEXT UNIQUE NOT NULL,
  -- Browser cookie identifier for anonymous tracking

  -- Conversation History (last 20 messages stored in memory)
  conversation_history JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- Structure: [
  --   { role: 'user', content: '...', timestamp: '...' },
  --   { role: 'assistant', content: '...', timestamp: '...', sources: [...] }
  -- ]

  -- Travel Intent (captured via NLP from conversation)
  travel_intent JSONB DEFAULT '{}'::jsonb NOT NULL,
  -- Structure: {
  --   check_in: '2025-12-15' | null,
  --   check_out: '2025-12-20' | null,
  --   guests: 4 | null,
  --   accommodation_type: 'apartment' | 'suite' | null,
  --   budget_range: { min: 100, max: 300 } | null,
  --   preferences: ['ocean view', 'kitchen']
  -- }

  -- Marketing Tracking (UTM parameters from landing)
  utm_tracking JSONB DEFAULT '{}'::jsonb NOT NULL,
  -- Structure: { source, medium, campaign, content, term }

  referrer TEXT,
  landing_page TEXT,

  -- Conversion Tracking
  converted_to_reservation_id UUID REFERENCES guest_reservations(id) ON DELETE SET NULL,
  conversion_date TIMESTAMPTZ,

  -- Lifecycle Management
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' NOT NULL
    CHECK (status IN ('active', 'converted', 'expired'))
);

-- Add comments for documentation
COMMENT ON TABLE prospective_sessions IS 'Anonymous chat sessions for prospective guests before booking. Tracks conversation history, travel intent, and conversion funnel.';
COMMENT ON COLUMN prospective_sessions.cookie_id IS 'Unique browser cookie identifier for tracking anonymous sessions';
COMMENT ON COLUMN prospective_sessions.conversation_history IS 'Last 20 messages of chat history for context continuity';
COMMENT ON COLUMN prospective_sessions.travel_intent IS 'Extracted booking intent from conversation using NLP (dates, guests, preferences)';
COMMENT ON COLUMN prospective_sessions.utm_tracking IS 'Marketing attribution data from UTM parameters';
COMMENT ON COLUMN prospective_sessions.expires_at IS 'Session expiry time (default 7 days). Cleanup via daily cron job.';

-- Performance Indexes
CREATE INDEX idx_prospective_sessions_cookie 
  ON prospective_sessions(cookie_id) 
  WHERE status = 'active';

CREATE INDEX idx_prospective_sessions_tenant 
  ON prospective_sessions(tenant_id, created_at DESC);

CREATE INDEX idx_prospective_sessions_expires 
  ON prospective_sessions(expires_at) 
  WHERE status = 'active';

-- GIN index for travel intent queries (filter by preferences, budget, etc)
CREATE INDEX idx_prospective_sessions_intent_gin 
  ON prospective_sessions USING GIN (travel_intent);

-- Cleanup note for cron job
COMMENT ON INDEX idx_prospective_sessions_expires IS 'Used by daily cleanup cron: DELETE FROM prospective_sessions WHERE status = ''active'' AND expires_at < NOW();';

-- Enable Row Level Security
ALTER TABLE prospective_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read/write for active sessions (no auth required)
CREATE POLICY prospective_sessions_public_access ON prospective_sessions
  FOR ALL
  USING (status = 'active');

-- RLS Policy: Staff access to all sessions for their tenant
CREATE POLICY prospective_sessions_staff_access ON prospective_sessions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM staff_users 
      WHERE staff_id::text = current_setting('request.jwt.claim.sub', true)
    )
  );

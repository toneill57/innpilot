# Public Chat System - Quick Start Guide

**Phase**: FASE B - Public Chat System  
**Created**: October 1, 2025  
**Status**: Ready for Development Testing

---

## Quick Deploy (Development)

### 1. Apply Migrations (3 commands)
```bash
# Set your database URL
export DATABASE_URL="your-supabase-connection-string"

# Apply migrations in order
psql $DATABASE_URL -f supabase/migrations/20251001015000_add_prospective_sessions_table.sql
psql $DATABASE_URL -f supabase/migrations/20251001015100_add_accommodation_units_public_table.sql
psql $DATABASE_URL -f supabase/migrations/20251001015200_add_match_accommodations_public_function.sql
```

### 2. Validate Deployment
```bash
psql $DATABASE_URL -f scripts/validate-public-chat-migrations.sql
```

### 3. Migrate Data
```bash
npx tsx scripts/migrate-accommodation-units-public.ts
```

### 4. Test Vector Search
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM match_accommodations_public(
  (SELECT embedding_fast FROM accommodation_units_public LIMIT 1),
  (SELECT tenant_id FROM tenant_registry LIMIT 1),
  0.3, 4
);"
```

---

## What Was Created

### Database Objects
- **2 tables**: `prospective_sessions`, `accommodation_units_public`
- **2 functions**: `match_accommodations_public()`, `update_accommodation_units_public_updated_at()`
- **7 indexes**: 4 on sessions, 3 on accommodations (including HNSW)
- **4 RLS policies**: Public access + staff management

### Key Features
- Anonymous session tracking (cookie-based, 7-day expiry)
- Marketing-focused accommodation data (pricing, photos, highlights)
- Ultra-fast vector search (<50ms via HNSW index)
- Travel intent extraction (NLP-ready JSONB)
- UTM marketing attribution
- Conversion tracking (sessions → reservations)

---

## Quick Tests

### Test Session Creation
```sql
INSERT INTO prospective_sessions (tenant_id, cookie_id, landing_page)
VALUES (
  (SELECT tenant_id FROM tenant_registry LIMIT 1),
  'test-' || gen_random_uuid()::text,
  '/public-chat'
)
RETURNING session_id, expires_at;
```

### Test Public Access (Anonymous)
```sql
SET ROLE anon;
SELECT COUNT(*) FROM accommodation_units_public WHERE is_bookable = true;
RESET ROLE;
```

### Test Vector Search Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM match_accommodations_public(
  (SELECT embedding_fast FROM accommodation_units_public LIMIT 1),
  (SELECT tenant_id FROM tenant_registry LIMIT 1),
  0.3, 4
);
```

---

## Files Reference

### Migrations
- `supabase/migrations/20251001015000_add_prospective_sessions_table.sql`
- `supabase/migrations/20251001015100_add_accommodation_units_public_table.sql`
- `supabase/migrations/20251001015200_add_match_accommodations_public_function.sql`

### Scripts
- `scripts/migrate-accommodation-units-public.ts` - Data migration
- `scripts/cleanup-expired-sessions.sql` - Daily cron job
- `scripts/validate-public-chat-migrations.sql` - Validation

### Documentation
- `PUBLIC_CHAT_MIGRATIONS_SUMMARY.md` - Complete technical details
- `PUBLIC_CHAT_DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment
- `supabase/migrations/README.md` - Migration guide

---

## Rollback (If Needed)

### Quick Rollback
```sql
DROP FUNCTION IF EXISTS match_accommodations_public CASCADE;
DROP FUNCTION IF EXISTS update_accommodation_units_public_updated_at CASCADE;
DROP TABLE IF EXISTS accommodation_units_public CASCADE;
DROP TABLE IF EXISTS prospective_sessions CASCADE;
```

---

## Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| Session lookup | <10ms | Partial index on cookie |
| Session creation | <20ms | Default values |
| Vector search | <50ms | HNSW index (1024d) |
| Data migration | ~500ms/unit | API rate limiting |

---

## Security Model

- **RLS enabled** on all tables
- **Public read access** for bookable accommodations only
- **Anonymous sessions** via cookies (no PII)
- **Tenant isolation** via UUID filtering
- **Staff access** filtered by JWT tenant_id

---

## Next Steps

1. Review migrations (see `PUBLIC_CHAT_MIGRATIONS_SUMMARY.md`)
2. Apply to development database
3. Run validation script
4. Test vector search performance
5. Deploy to staging
6. Schedule cleanup cron job
7. Production deployment

---

## Support

**Specification**: `plan.md` lines 1238-1372  
**Architecture**: `docs/backend/MATRYOSHKA_ARCHITECTURE.md`  
**Security**: `docs/backend/MULTI_TENANT_ARCHITECTURE.md`

---

**Status**: ✅ Ready for development testing

Created by Database Agent (Claude Code) - October 1, 2025

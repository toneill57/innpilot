-- BACKUP: public.accommodation_units
-- Date: $(date +"%Y-%m-%d %H:%M:%S")
-- Purpose: Pre-migration backup for FASE C accommodation split

-- Record 1: Suite Ocean View (SimmerDown)
INSERT INTO public.accommodation_units (
  id, hotel_id, motopress_type_id, motopress_instance_id, name, unit_number, 
  description, unit_type, capacity, bed_configuration, size_m2, floor_number, 
  view_type, is_featured, display_order, status, tenant_id, created_at, updated_at
) VALUES (
  '43ff96da-dbef-4757-88e5-31f7618edd33',
  '238845ed-8c5b-4d33-9866-bb4e706b90b2',
  NULL,
  1,
  'Suite Ocean View',
  '101',
  'Amplia suite con vista panorámica al mar Caribe. Incluye sala de estar, kitchenette y balcón privado.',
  'suite',
  '{"total":3,"adults":2,"children":1}'::jsonb,
  '{"sofa_bed":1,"queen_beds":1,"single_beds":1}'::jsonb,
  45,
  1,
  'Ocean View',
  false,
  1,
  'active',
  'b5c45f51-a333-4cdf-ba9d-ad0a17bf79bf',
  '2025-09-30 23:26:53.933854+00',
  '2025-09-30 23:26:53.933854+00'
);

-- Record 2: Standard Room (TEST - FREE tier)
INSERT INTO public.accommodation_units (
  id, name, unit_number, description, unit_type, is_featured, display_order, 
  status, tenant_id, created_at, updated_at
) VALUES (
  '22222222-3333-4444-5555-666666666666',
  'Standard Room',
  '201',
  'Basic room for FREE tier testing',
  'room',
  false,
  1,
  'active',
  '11111111-2222-3333-4444-555555555555',
  '2025-10-01 02:18:43.585159+00',
  '2025-10-01 02:18:43.585159+00'
);

-- BACKUP COMPLETE: 2 records

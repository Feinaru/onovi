# Phase 1 Migration Guide — Data Model Foundation

## Overview

This migration adds the foundation for the new Service Provider registration system while preserving all existing functionality.

**What's changing:**
- New terminology: BUSINESS → SERVICE_PROVIDER, CUSTOMER → SERVICE_RECIPIENT
- New models: Field, Profession, ServiceTemplate, DocumentType, etc.
- Service model renamed to BusinessService in code (table name unchanged)
- Separate ServiceProviderApproval model for registration status
- Added publicId UUID to public-facing entities

**What's NOT changing:**
- Existing Slot/Booking/Calendar functionality
- Database table names (Service table stays as "Service")
- Existing foreign key relationships
- Production data (all preserved)

---

## Pre-Migration Checklist

Before running migration, ensure:

- [ ] Database backup created
- [ ] You have reviewed the Prisma schema changes
- [ ] Development environment is ready
- [ ] You have admin access to database

---

## Migration Commands

### 1. Backup Database (CRITICAL)

```bash
# Navigate to project root
cd /Users/feinaru/PycharmProjects/fillApp

# Create backup directory if it doesn't exist
mkdir -p backups

# Backup database
pg_dump -U postgres -d onovi_dev > backups/backup_before_phase1_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Generate Prisma Client

```bash
cd server
npx prisma generate
```

### 3. Create Migration (Review First)

```bash
npx prisma migrate dev --name phase1_service_provider_foundation --create-only
```

**IMPORTANT:** Before applying, open the generated migration file in `server/prisma/migrations/` and review the SQL.

### 4. Apply Migration

```bash
npx prisma migrate dev
```

### 5. Run Seed Script

```bash
node prisma/seed-phase1.js
```

### 6. Run Verification Tests

```bash
node test-phase1-migration.js
```

### 7. Verify in Prisma Studio

```bash
npx prisma studio
```

Check:
- New tables exist (Field, Profession, ServiceTemplate, etc.)
- Service table still exists (not renamed)
- Existing Slot/Booking records have publicId
- User roles updated to SERVICE_PROVIDER

### 8. Restart Development Server

```bash
npm run dev
```

---

## Expected Migration Changes

### New Tables Created
- `Field` - Top-level business categories
- `Profession` - Specializations within fields
- `ServiceTemplate` - Predefined service catalog
- `DocumentType` - Required document types
- `ServiceDocumentRequirement` - Which docs each service needs
- `UploadedDocument` - Service provider uploaded files
- `BusinessProfession` - Junction: Business ↔ Profession
- `BusinessServiceDocument` - Junction: Service ↔ Document
- `ServiceProviderApproval` - Registration approval workflow
- `SuggestionRequest` - User requests for missing fields/professions/services
- `ConsentType` - Legal consent definitions
- `UserConsent` - User consent records
- `ApplicationSetting` - Key-value configuration

### Existing Tables Modified

**User:**
- role enum: Added SERVICE_RECIPIENT, SERVICE_PROVIDER (removed BUSINESS)

**Business:**
- Added: publicId (UUID)
- Added: phoneNormalized (string, nullable)
- Added: sourceLeadId (int, nullable)
- Modified: categoryId (now nullable)

**Service (mapped as BusinessService in code):**
- Added: publicId (UUID)
- Added: serviceTemplateId (int, nullable)
- Added: customName (string, nullable)
- Added: approvalStatus (enum)
- Added: approvedAt (datetime, nullable)
- Added: approvedById (int, nullable)

**Slot:**
- Added: publicId (UUID)

**Booking:**
- Added: publicId (UUID)

**Lead:**
- Added: phoneNormalized (string, nullable)
- Added: convertedToBusinessId (int, nullable, unique)
- Added: registrationCompletedAt (datetime, nullable)

### Existing Tables Unchanged
- Category (kept for backwards compatibility)
- CalendarEvent
- TimeBlock
- Vacation
- LeadNote, TimelineEvent
- UserNote, UserTag, UserToTag, UserActivityLog

---

## Verification Steps

### Database Verification

```sql
-- Check that Service table was NOT renamed
SELECT table_name FROM information_schema.tables WHERE table_name = 'Service';
-- Expected: 1 row

-- Check new columns added to Business
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Business'
AND column_name IN ('public_id', 'phone_normalized', 'source_lead_id');
-- Expected: 3 rows

-- Check that all Slots have valid serviceId
SELECT COUNT(*) FROM "Slot" s
LEFT JOIN "Service" svc ON s.service_id = svc.id
WHERE svc.id IS NULL;
-- Expected: 0 (no orphaned slots)

-- Check that all Bookings have valid relations
SELECT COUNT(*) FROM "Booking" b
LEFT JOIN "Slot" s ON b.slot_id = s.id
LEFT JOIN "Service" svc ON b.service_id = svc.id
WHERE s.id IS NULL OR svc.id IS NULL;
-- Expected: 0 (no orphaned bookings)
```

### API Endpoint Testing

```bash
# Start server
cd server && npm run dev

# Test existing slot endpoint
curl http://localhost:5000/api/slots?businessId=1

# Test existing calendar endpoint
curl http://localhost:5000/api/calendar/1/unified?from=2026-07-01&to=2026-07-31

# Test existing booking endpoint
curl http://localhost:5000/api/bookings?businessId=1
```

All endpoints should return data without errors.

### Frontend Testing

```bash
# Start frontend
cd client && npm run dev

# Navigate to:
# - Business Calendar Page (should show slots)
# - Customer Booking Flow (should work)
# - Business Services Page (should load)
```

---

## Rollback Plan

If anything goes wrong:

### Option 1: Restore from Backup (Safest)

```bash
# Stop server
cd server
# Press Ctrl+C to stop

# Restore database
psql -U postgres -d onovi_dev < ../backups/backup_before_phase1_YYYYMMDD_HHMMSS.sql

# Revert Prisma schema
git checkout HEAD~1 server/prisma/schema.prisma

# Regenerate client
npx prisma generate

# Restart server
npm run dev
```

### Option 2: Revert Migration

```bash
# If no data has been modified yet
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Manually drop new tables
psql -U postgres -d onovi_dev -f rollback-phase1.sql
```

---

## Risks and Mitigation

### 🔴 HIGH RISK

**Risk: Enum Value Change (BUSINESS → SERVICE_PROVIDER)**
- **Impact:** Existing User records with role='BUSINESS' may cause constraint violations
- **Mitigation:** Seed script updates all existing users AFTER enum is created
- **Verification:** Check that no users have role='BUSINESS' after migration

### ⚠️ MEDIUM RISK

**Risk: publicId UUID Generation**
- **Impact:** Existing Slot/Booking records need publicId backfilled
- **Mitigation:** Prisma will auto-generate UUID for existing records via @default(uuid())
- **Verification:** After migration, check that all Slot/Booking records have publicId

**Risk: Category Table Still Referenced**
- **Impact:** Business.categoryId still exists, Category table still exists
- **Mitigation:** We're keeping both for backwards compatibility during Phase 1
- **Verification:** Confirm Category table not dropped, Business.categoryId nullable

### ✅ LOW RISK

**Risk: Table Rename (Service → BusinessService)**
- **Impact:** NONE - we're using @@map("Service") to keep table name unchanged
- **Verification:** Check that table name in database is still "Service"

---

## Seed Script Details

The seed script (`prisma/seed-phase1.js`) performs:

1. **User Role Update:** Changes all BUSINESS → SERVICE_PROVIDER
2. **Phone Normalization:** Strips non-digits from Business and Lead phone numbers
3. **Service Approval:** Sets all existing services to APPROVED status
4. **Approval Records:** Creates ServiceProviderApproval for all businesses
5. **Consent Types:** Creates Terms, Privacy, Marketing consents
6. **Application Settings:** Creates document disclaimer settings
7. **Field Migration:** Creates Fields from Categories with default Professions

---

## Post-Migration Tasks

After successful migration:

```bash
# 1. Commit changes
git add server/prisma/schema.prisma
git add server/prisma/migrations/
git add server/prisma/seed-phase1.js
git add server/test-phase1-migration.js
git commit -m "feat: Phase 1 - Service Provider data model foundation"

# 2. Update any affected backend routes (if needed)
# Check for imports of 'Service' model → should now be 'BusinessService'

# 3. No frontend changes needed yet
# This is data model foundation only
```

---

## Success Criteria

Migration is successful if all of these are true:

- [x] All new tables created
- [x] All new enums created
- [x] Service table name unchanged (still "Service")
- [x] Slot → Service → Business relations intact
- [x] All User roles updated to SERVICE_PROVIDER
- [x] publicId generated for Business/Slot/Booking/Service
- [x] phoneNormalized backfilled
- [x] ServiceProviderApproval records created
- [x] Consent types created
- [x] Fields created from Categories
- [x] Category table preserved
- [x] Existing bookings/calendar still work
- [x] No compilation errors
- [x] Frontend still works
- [x] Test script passes

---

## Troubleshooting

### Issue: "Column 'role' does not exist"

**Cause:** Enum migration failed

**Solution:**
```bash
npx prisma migrate reset --skip-seed
npx prisma migrate dev
node prisma/seed-phase1.js
```

### Issue: "Relation does not exist"

**Cause:** Foreign key constraint issue

**Solution:** Check that all referenced tables exist before applying migration

### Issue: "publicId cannot be null"

**Cause:** UUID default not applied

**Solution:** Manually backfill:
```sql
UPDATE "Business" SET public_id = gen_random_uuid() WHERE public_id IS NULL;
UPDATE "Slot" SET public_id = gen_random_uuid() WHERE public_id IS NULL;
UPDATE "Booking" SET public_id = gen_random_uuid() WHERE public_id IS NULL;
UPDATE "Service" SET public_id = gen_random_uuid() WHERE public_id IS NULL;
```

### Issue: "Seed script fails on consent types"

**Cause:** No admin user exists

**Solution:** Create admin user first or skip application settings creation

---

## Next Steps (Phase 2)

After Phase 1 is stable:

1. Build new Service Provider registration API endpoints
2. Build registration frontend flow
3. Build Admin panel for Field/Profession/Service management
4. Implement document upload system
5. Implement approval workflow

**Phase 1 is data foundation only. No user-facing changes yet.**

---

## Support

If you encounter issues:

1. Check the verification test output: `node test-phase1-migration.js`
2. Review database state: `npx prisma studio`
3. Check server logs for errors
4. Restore from backup if needed

Remember: **Always backup before migrating!**

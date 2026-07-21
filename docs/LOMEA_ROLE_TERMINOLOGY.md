# Lomea Role & Booking-Identity Terminology

**Status:** 🔒 MANDATORY — living reference
**Last Updated:** 2026-07-21
**Version:** 1.0

---

## 0. About This Document

This is the **canonical source of truth for Lomea role and booking-identity terminology** —
the target names for who does what in the product, in English (code token) and Hebrew.

- **Scope:** naming and concepts only. This is **not** a code, enum, schema, or data-model
  change, and it does **not** claim any migration has already happened.
- **Companion docs:** `LOMEA_BUILDING_PRINCIPLES.md` (architecture/process) and
  `LOMEA_DESIGN_SYSTEM.md` §5.6 (UI copy) both defer to this document for role terminology.
- **When docs disagree:** this document wins for terminology. Older docs may describe the
  current/as-built code, which still uses legacy names.

---

## 1. The Roles

| Token | Hebrew | Purpose | Migrated from |
|-------|--------|---------|---------------|
| `SERVICE_PROVIDER` | נותן השירות | The registered provider/business-side user who offers services. | `BUSINESS` |
| `SERVICE_BOOKER` | מזמין השירות | The registered user who searches, books, manages, approves, and may pay for a booking. The customer-facing **login role**. | `CUSTOMER` |
| `SERVICE_RECIPIENT` | מקבל השירות | The person who actually **receives** the service inside a booking. **Not necessarily a login role** — a booking-level identity/fields. | — (new concept, not a rename of `CUSTOMER`) |
| `ADMIN` | מנהל מערכת | System administrator. | — |

---

## 2. Core Rule: booker ≠ recipient

**`SERVICE_BOOKER` and `SERVICE_RECIPIENT` are not the same concept, and "customer" and
"service recipient" are not interchangeable.**

- The **booker** (מזמין השירות) is the account that performs the booking.
- The **recipient** (מקבל השירות) is the person the service is for. This may be the booker or
  someone else entirely.

Use **"מזמין שירות"** for the registered customer-facing user. Reserve **"מקבל השירות"** only
for the person receiving the service inside a booking.

---

## 3. `SERVICE_RECIPIENT` is a booking-level identity, not (necessarily) a login role

`SERVICE_RECIPIENT` describes **who the service is for within a specific booking** — a name and
associated details attached to the booking, not a login/account role.

- Treat it as a **booking-level identity / entity / fields** until a separate code/data-model
  plan decides whether it should ever be an account role.
- **Do not** build a separate "recipient" login shell or workspace for it (this is consistent
  with `LOMEA_DESIGN_SYSTEM.md` §3.4: render recipient details inside the booking's views).

### Current code state (honest snapshot — do not treat as target)

As of this writing, the code has **not** migrated. Per `docs/CODEBASE_AUDIT.md`, the
`UserRole` enum (`server/prisma/schema.prisma`) currently contains: `CUSTOMER` (active),
`BUSINESS` (legacy, still used), `SERVICE_PROVIDER` (active), `SERVICE_RECIPIENT` (defined but
not used), and `ADMIN`. The existence of a `SERVICE_RECIPIENT` enum value is a legacy artifact
and does **not** make it the target login role. Whether that enum value is kept, repurposed, or
removed is **deferred to a separate code/data-model plan** and is out of scope here.

---

## 4. Migration Direction (terminology intent)

- `BUSINESS` → `SERVICE_PROVIDER`
- `CUSTOMER` → `SERVICE_BOOKER`
- `SERVICE_RECIPIENT` is **not** the replacement for `CUSTOMER`; it is a distinct
  booking-level concept.
- This document records **intent**. It does **not** claim the code, enum, or data has already
  migrated.

---

## 5. Worked Examples

1. **A mother books a private lesson for her child**
   - `SERVICE_BOOKER` = the mother
   - `SERVICE_RECIPIENT` = the child

2. **A company books a service for an employee**
   - `SERVICE_BOOKER` = the company / admin user placing the booking
   - `SERVICE_RECIPIENT` = the employee

3. **A person books for themselves**
   - `SERVICE_BOOKER` = that person
   - `SERVICE_RECIPIENT` = the same person

---

## 6. Change Log

### v1.0 — 2026-07-21
- Created as the canonical role & booking-identity terminology source of truth.
- Established: `SERVICE_PROVIDER` (נותן השירות), `SERVICE_BOOKER` (מזמין השירות),
  `SERVICE_RECIPIENT` (מקבל השירות, booking-level identity), `ADMIN` (מנהל מערכת).
- Fixed the migration direction: `CUSTOMER` → `SERVICE_BOOKER` (not `SERVICE_RECIPIENT`);
  `BUSINESS` → `SERVICE_PROVIDER`.
- Clarified that `SERVICE_RECIPIENT` is not necessarily a login role; the enum/data-model
  decision is deferred to a separate code plan.

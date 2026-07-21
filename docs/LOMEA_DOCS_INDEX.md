# Lomea Documentation Index

**Status:** 🔒 MANDATORY — living navigational index
**docs_baseline:** 2026.07.21
**Last Updated:** 2026-07-21

---

## About

This is the single navigational entry point for all Markdown documentation in the Lomea/fillApp
repository. It lists every Markdown file, its governance status, its owning area, and — for
source-of-truth docs — its canonical flag. Governance rules (how to create, deprecate, archive, and
delete docs; the metadata format; naming conventions) live in
[`LOMEA_DOCUMENTATION_GOVERNANCE.md`](./LOMEA_DOCUMENTATION_GOVERNANCE.md).

- **docs_baseline** `2026.07.21` — the reference point for this index snapshot.
- **Current brand:** Lomea. Docs still saying "Onovi" or "PickMe" are stale (flagged in notes).
- **Status values:** CANONICAL · ACTIVE · REFERENCE · HISTORICAL · DEPRECATED · DELETE_CANDIDATE · TEMPORARY (see governance doc).
- This index does **not** move or delete anything. The archival/deletion candidates below are proposals
  requiring explicit approval before any Phase 2/3 action.

## Canonical source-of-truth docs (one per area)

| Area | Canonical doc |
|------|---------------|
| architecture / build principles | `docs/LOMEA_BUILDING_PRINCIPLES.md` |
| ui | `docs/LOMEA_DESIGN_SYSTEM.md` |
| roles / booking identity | `docs/LOMEA_ROLE_TERMINOLOGY.md` |
| calendar | `docs/LOMEA_CALENDAR_SYSTEM.md` |
| deployment | `docs/deployment/RENDER_DEPLOYMENT.md` |

---

## Full index (44 Markdown files)

| path | status | owner_area | canonical? | supersedes | superseded_by | last_reviewed | notes |
|------|--------|------------|:---------:|------------|---------------|---------------|-------|
| docs/LOMEA_BUILDING_PRINCIPLES.md | CANONICAL | architecture | ✅ | LOMEA_ARCHITECTURE_RULES_DRAFT.md, AVAILABILITY_MODEL.md | — | 2026-07-21 | Master architecture/process rules (v1.2) |
| docs/LOMEA_DESIGN_SYSTEM.md | CANONICAL | ui | ✅ | — | — | 2026-07-21 | UI/visual language source of truth |
| docs/LOMEA_ROLE_TERMINOLOGY.md | CANONICAL | roles | ✅ | — | — | 2026-07-21 | Role & booking-identity source of truth (commit ea25f8b) |
| docs/LOMEA_CALENDAR_SYSTEM.md | CANONICAL | calendar | ✅ | CALENDAR_ARCHITECTURE.md, CALENDAR_IMPLEMENTATION_PLAN.md | — | 2026-07-12 | Calendar domain spec |
| docs/deployment/RENDER_DEPLOYMENT.md | CANONICAL | deployment | ✅ | — | — | 2026-06-29 | Render deploy how-to; "Onovi" naming stale |
| README.md | ACTIVE | product | — | — | — | 2026-07-03 | Project overview (Lomea) |
| docs/AI_AGENT_WORKFLOW.md | ACTIVE | docs | — | — | — | 2026-07-07 | AI-agent process rules |
| docs/crm/CRM_DESIGN.md | ACTIVE | crm | — | — | — | 2026-06-29 | CRM design doc |
| docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md | ACTIVE | deployment | — | — | — | 2026-06-29 | Reusable deploy checklist |
| docs/deployment/LOCAL_POSTGRESQL_SETUP.md | ACTIVE | deployment | — | — | — | 2026-06-29 | Local Postgres setup; "Onovi" naming stale |
| docs/testing/test-business-lead-linking.md | ACTIVE | testing | — | — | — | 2026-06-28 | CRM linking test guide; legacy BUSINESS role in example |
| docs/development/ADDRESS_DATABASE_INFO.md | REFERENCE | development | — | — | — | 2026-06-26 | data.gov.il address reference |
| docs/testing/ADDRESS_TESTING_GUIDE.md | REFERENCE | testing | — | — | — | 2026-06-26 | Address integration test guide; stale status header |
| docs/deployment/RENDER_COST_ANALYSIS.md | REFERENCE | deployment | — | — | — | 2026-06-29 | Render cost snapshot; verify prices before use |
| PHASE2_API_DOCUMENTATION.md | REFERENCE | architecture | — | — | — | 2026-07-01 | Admin master-data API ref; rename off "PHASE2" |
| PHASE3_DOCUMENTATION.md | REFERENCE | auth | — | — | — | 2026-07-01 | Registration API ref; rename off "PHASE3" |
| docs/ROLE_BASED_WORKSPACES_SPEC.md | REFERENCE | architecture | — | — | — | 2026-07-21 | Per-role workspace spec (DRAFT); ⚠️ body L468 stale role line (see conflicts) |
| docs/crm/CRM_FORM_TESTING.md | HISTORICAL | crm | — | — | — | 2026-06-29 | CRM form test walkthrough; point-in-time |
| docs/CODEBASE_AUDIT.md | HISTORICAL | architecture | — | — | — | 2026-07-21 | As-built inventory (dated 07-06); ⚠️ body role lines stale (see conflicts) |
| docs/architecture/ARCHITECTURE_REFACTOR_PLAN.md | HISTORICAL | architecture | — | — | — | 2026-06-29 | Address refactor plan; "PickMe" branding |
| client/src/docs/REFACTORING_PLAN.md | HISTORICAL | ui | — | — | — | 2026-06-29 | Frontend refactor tracker |
| docs/development/BUSINESS_IDENTIFIER_IMPLEMENTATION.md | HISTORICAL | development | — | — | — | 2026-06-28 | Feature completion report; keep as design ref |
| docs/deployment/DEPLOYMENT_PREPARATION_SUMMARY.md | HISTORICAL | deployment | — | — | — | 2026-06-29 | Deploy-prep status snapshot |
| docs/development/REBRANDING_COMPLETE.md | DEPRECATED | product | — | — | (Lomea rebrand) | 2026-06-29 | ⚠️ role/brand wording stale (see conflicts); brand later became Lomea |
| docs/LOMEA_ARCHITECTURE_RULES_DRAFT.md | DEPRECATED | architecture | — | — | docs/LOMEA_BUILDING_PRINCIPLES.md | 2026-07-12 | Redirect stub; delete candidate once no inbound links |
| AVAILABILITY_MODEL.md | DEPRECATED | calendar | — | — | docs/LOMEA_BUILDING_PRINCIPLES.md | 2026-07-01 | "Onovi"; merged into Building Principles |
| CALENDAR_ARCHITECTURE.md | DEPRECATED | calendar | — | — | docs/LOMEA_CALENDAR_SYSTEM.md | 2026-07-01 | "Onovi"; merged into Calendar System |
| PHASE1_MIGRATION_GUIDE.md | DEPRECATED | roles | — | — | docs/LOMEA_ROLE_TERMINOLOGY.md | 2026-07-01 | ⚠️ stale role mapping L8/L121 (see conflicts) |
| CALENDAR_IMPLEMENTATION_PLAN.md | DELETE_CANDIDATE | calendar | — | — | docs/LOMEA_CALENDAR_SYSTEM.md | 2026-07-01 | "Onovi" build plan; superseded |
| PHASE2_QA_FINAL.md | DELETE_CANDIDATE | testing | — | — | — | 2026-07-01 | Point-in-time QA results |
| PHASE2_QA_REPORT.md | DELETE_CANDIDATE | testing | — | — | PHASE2_QA_FINAL.md | 2026-07-01 | Superseded by QA_FINAL |
| ROOT-CAUSE-ANALYSIS.md | DELETE_CANDIDATE | auth | — | — | — | 2026-07-02 | Registration RCA (resolved) |
| server/COMPLETE-E2E-TEST-REPORT.md | DELETE_CANDIDATE | testing | — | — | — | 2026-07-02 | E2E test evidence log |
| server/REGISTRATION-ATOMICITY-FIX.md | DELETE_CANDIDATE | auth | — | — | — | 2026-07-02 | Atomicity bug-fix log |
| docs/development/BUG_FIX_PROOF.md | DELETE_CANDIDATE | development | — | — | — | 2026-06-27 | Dup of TEST_BUSINESS_CREATE.md |
| docs/development/CITYCODE_FILTER_FIX.md | DELETE_CANDIDATE | development | — | CITY_FILTER_INVESTIGATION.md | — | 2026-06-28 | City/map bug cluster |
| docs/development/CITY_FILTER_INVESTIGATION.md | DELETE_CANDIDATE | development | — | — | CITYCODE_FILTER_FIX.md | 2026-06-27 | Superseded by CITYCODE_FILTER_FIX |
| docs/development/MAP_COORDINATES_FIX.md | DELETE_CANDIDATE | development | — | — | — | 2026-06-27 | Overlaps WHITE_SCREEN_BUG_FIX |
| docs/development/WHITE_SCREEN_BUG_FIX.md | DELETE_CANDIDATE | development | — | — | — | 2026-06-27 | Overlaps MAP_COORDINATES_FIX |
| docs/testing/FINAL_PROOF.md | DELETE_CANDIDATE | testing | — | — | — | 2026-06-26 | Address refactor proof; QA cluster |
| docs/testing/QA_FINAL_REPORT.md | DELETE_CANDIDATE | testing | — | — | — | 2026-06-26 | "PickMe" QA report; QA cluster |
| docs/testing/QA_SUMMARY.md | DELETE_CANDIDATE | testing | — | — | QA_FINAL_REPORT.md | 2026-06-26 | Subset of QA_FINAL_REPORT |
| docs/testing/QA_TEST_PLAN.md | REFERENCE | testing | — | — | — | 2026-06-26 | "PickMe" plan+run; extract reusable cases else HISTORICAL |
| docs/testing/TEST_BUSINESS_CREATE.md | DELETE_CANDIDATE | testing | — | — | — | 2026-06-27 | Dup of BUG_FIX_PROOF.md |

**Row count:** 44 Markdown files.

---

## Proposed for archival / later deletion candidates

> ⚠️ **Proposal only — nothing here has been moved or deleted.** These require explicit approval.
> Recommended flow: archive to `docs/archive/` first (Phase 2), then hard-delete only the
> explicitly-approved subset after an inbound-link check (Phase 3). See governance doc.

Point-in-time proofs, reports, investigations, and superseded plans with no lasting reference value:

- `CALENDAR_IMPLEMENTATION_PLAN.md`
- `PHASE2_QA_FINAL.md`
- `PHASE2_QA_REPORT.md`
- `ROOT-CAUSE-ANALYSIS.md`
- `server/COMPLETE-E2E-TEST-REPORT.md`
- `server/REGISTRATION-ATOMICITY-FIX.md`
- `docs/development/BUG_FIX_PROOF.md`
- `docs/development/CITYCODE_FILTER_FIX.md`
- `docs/development/CITY_FILTER_INVESTIGATION.md`
- `docs/development/MAP_COORDINATES_FIX.md`
- `docs/development/WHITE_SCREEN_BUG_FIX.md`
- `docs/testing/FINAL_PROOF.md`
- `docs/testing/QA_FINAL_REPORT.md`
- `docs/testing/QA_SUMMARY.md`
- `docs/testing/TEST_BUSINESS_CREATE.md`

---

## Known conflicts flagged (fix in a later phase, not here)

1. **Stale role terminology** contradicting canonical `docs/LOMEA_ROLE_TERMINOLOGY.md`
   (target: `CUSTOMER → SERVICE_BOOKER`, `BUSINESS → SERVICE_PROVIDER`, `SERVICE_RECIPIENT` = booking-level
   identity, not a login role):
   - `PHASE1_MIGRATION_GUIDE.md` — L8/L121 assert `CUSTOMER → SERVICE_RECIPIENT` and treat SERVICE_RECIPIENT as a login role.
   - `docs/CODEBASE_AUDIT.md` — body (L64/L66/L76/L378/L1244) still asserts the old mapping despite the terminology pointer note.
   - `docs/ROLE_BASED_WORKSPACES_SPEC.md` — L468 lists SERVICE_RECIPIENT as a UserRole login role.
   - `docs/development/REBRANDING_COMPLETE.md` — L107 "User roles (ADMIN, BUSINESS, CUSTOMER) unchanged"; stale role and brand wording.
2. **Branding drift** — "Onovi" (root calendar/availability + deployment docs) and "PickMe" (QA docs) vs current "Lomea". Body rename deferred to a separate task.
3. **QA verdict contradiction** — `QA_FINAL_REPORT`/`QA_SUMMARY` ("NOT READY") vs `FINAL_PROOF` ("COMPLETE"); resolved by date order.

---

## Non-Markdown / out of scope

- `docs/testing/TEST_CODEX.txt` — **non-Markdown, untracked, review separately.** Not part of the 44;
  not touched by any docs phase.

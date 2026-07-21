# Lomea Documentation Governance

**Status:** 🔒 MANDATORY — living reference
**lomea_doc_version:** 2026.07.21
**last_reviewed:** 2026-07-21
**owner_area:** docs

---

## 0. About

This document defines how Lomea documentation is created, classified, versioned, deprecated,
archived, and deleted. It is the rulebook; the live inventory of every doc lives in
[`LOMEA_DOCS_INDEX.md`](./LOMEA_DOCS_INDEX.md).

Goal: keep exactly one clear source of truth per area, make staleness visible, and never lose
history when cleaning up.

---

## 1. Documentation status model

Every doc has exactly one status:

| Status | Meaning | Metadata header? |
|--------|---------|:----------------:|
| **CANONICAL** | The single source of truth for its `owner_area`. Overrides all others on conflict. | Yes (`source_of_truth: true`) |
| **ACTIVE** | Current, maintained supporting doc. Not the sole source of truth. | Yes |
| **REFERENCE** | Useful, still-accurate reference, but not authoritative and not actively maintained. | Yes |
| **HISTORICAL** | Old but preserved for context (as-built snapshots, completed plans, feature reports). Do not treat as current. | Banner |
| **DEPRECATED** | Do not use; superseded by a named newer doc. | Banner + `superseded_by` |
| **DELETE_CANDIDATE** | Point-in-time artifact with no lasting value; proposed for archival then deletion. | Banner |
| **TEMPORARY** | Short-lived generated report/scratch; removable once its purpose is served. | Banner |

## 2. Metadata / front-matter format

Apply YAML front-matter to **CANONICAL / ACTIVE / REFERENCE** docs (the maintained set). For
**HISTORICAL / DEPRECATED / DELETE_CANDIDATE / TEMPORARY** docs, a one-line banner at the top is
sufficient and clearer than silent front-matter.

```yaml
---
lomea_doc_status: CANONICAL   # CANONICAL | ACTIVE | REFERENCE | HISTORICAL | DEPRECATED | DELETE_CANDIDATE | TEMPORARY
lomea_doc_version: 2026.07.21 # date-based; bump on material change
last_reviewed: 2026-07-21     # date of last human review
source_of_truth: true         # true ONLY for the one CANONICAL doc per owner_area
owner_area: roles             # see enum in §4
supersedes: []                # paths this doc replaces
superseded_by: null           # path that replaces this doc (set when deprecating)
---
```

Deprecated/historical banner (first line of the doc body):

```markdown
> ⚠️ **DEPRECATED — do not use.** Superseded by `docs/LOMEA_ROLE_TERMINOLOGY.md`. Kept for history.
```

## 3. Versioning, baseline, and review rules

- **Date-based versioning** `YYYY.MM.DD` in `lomea_doc_version`. No semver — docs don't need it.
  Bump the version only on a material content change.
- **`last_reviewed`** (`YYYY-MM-DD`) is the staleness signal. A doc not reviewed within **90 days**
  is considered stale and should be flagged in the index for re-review.
- **`docs_baseline`** is recorded once in `LOMEA_DOCS_INDEX.md` (currently `2026.07.21`) as the
  reference point for the whole doc set.
- **One `source_of_truth: true` per `owner_area`.** Two canonical docs claiming the same area is a
  governance violation; resolve by demoting one to ACTIVE/REFERENCE.
- **Brand baseline:** the current product name is **Lomea**. "Onovi" or "PickMe" in a doc is a
  staleness signal, not a valid name.

## 4. `owner_area` enum

One of: `product` · `ui` · `architecture` · `auth` · `calendar` · `crm` · `deployment` ·
`testing` · `docs` · `legal` · `operations`.

## 5. Naming conventions

- **No lifecycle words in living-doc names.** Avoid `PHASE1`/`PHASE2`, `FINAL`, `PROOF`, `COMPLETE`,
  `REPORT` in the filenames of CANONICAL/ACTIVE/REFERENCE docs — they mark point-in-time artifacts.
- **Canonical Lomea docs** use the `LOMEA_<AREA>_<TOPIC>.md` pattern (e.g. `LOMEA_ROLE_TERMINOLOGY.md`).
- **Casing:** `SCREAMING_SNAKE_CASE.md` for top-level/canonical docs; keep a directory's existing
  convention consistent rather than mixing.
- **Location:** group by area under `docs/<area>/` (e.g. `docs/deployment/`, `docs/testing/`). New
  root-level `*.md` should be avoided except `README.md`.
- **Archive:** superseded/obsolete docs move to `docs/archive/` (preserving relative hints in the name).

## 6. Source-of-truth rules (current canonical set)

On any conflict, these win for their area:

- **Role & booking-identity terminology →** `docs/LOMEA_ROLE_TERMINOLOGY.md`
  (`CUSTOMER → SERVICE_BOOKER`; `BUSINESS → SERVICE_PROVIDER`; `SERVICE_RECIPIENT` is a
  booking-level identity, **not** a login role).
- **UI / visual language →** `docs/LOMEA_DESIGN_SYSTEM.md`.
- **Architecture / build principles →** `docs/LOMEA_BUILDING_PRINCIPLES.md`.
- **Calendar domain →** `docs/LOMEA_CALENDAR_SYSTEM.md`.
- **Deployment →** `docs/deployment/RENDER_DEPLOYMENT.md`.

If another doc contradicts one of these, the other doc is wrong and must be corrected or deprecated —
not the canonical doc.

## 7. Workflows

### 7.1 Create a doc
1. Pick the `owner_area` and status. If it's meant to be authoritative, confirm no other CANONICAL
   doc already owns that area (only one allowed).
2. Add the front-matter (§2) with today's date as `lomea_doc_version` and `last_reviewed`.
3. Place it under the correct `docs/<area>/` folder using the naming rules (§5).
4. Add a row to `LOMEA_DOCS_INDEX.md`.

### 7.2 Deprecate a doc
1. Add the DEPRECATED banner naming the superseding doc; set `superseded_by`.
2. Update its row in the index (status → DEPRECATED, fill `superseded_by`).
3. Do **not** rewrite its body into current-state fiction (see §8).

### 7.3 Archive before delete
1. Move the file to `docs/archive/` via `git mv` (history preserved).
2. Update its index row path and status.
3. Archiving is the default safe step for DELETE_CANDIDATE / obsolete docs.

### 7.4 Hard delete (approval-gated)
1. Hard delete happens **only after explicit human approval** of a specific list.
2. Before deleting each file, run an **inbound-link check**: grep the filename across `docs/`,
   `README.md`, and root `*.md`. If any CANONICAL/ACTIVE/REFERENCE doc links to it, **stop** and
   report instead of deleting.
3. `git rm` the approved, link-clean files and update the index.

## 8. Rules for historical / as-built docs

- **Do not rewrite historical or as-built docs into fiction.** Docs like `CODEBASE_AUDIT.md` and
  `ROLE_BASED_WORKSPACES_SPEC.md` legitimately describe the code *as it was/is*. When their content
  is outdated relative to a canonical doc, add a **banner + a short correction note pointing to the
  source of truth** — do not silently rewrite the body to describe a target state that the code has
  not reached.
- A completed plan/report/proof is preserved as HISTORICAL, not edited to look current.

## 9. Change Log

### 2026.07.21 — v1.0
- Created alongside `LOMEA_DOCS_INDEX.md`.
- Established the 7-value status model, front-matter format, date-based versioning + `last_reviewed`,
  `owner_area` enum, naming conventions, and the create/deprecate/archive/delete workflows.
- Locked source-of-truth rules: roles → `LOMEA_ROLE_TERMINOLOGY.md`, ui → `LOMEA_DESIGN_SYSTEM.md`,
  architecture → `LOMEA_BUILDING_PRINCIPLES.md`.
- Codified "do not rewrite historical/as-built docs into fiction" and archive-before-delete.

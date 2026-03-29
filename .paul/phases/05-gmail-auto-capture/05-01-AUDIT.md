# Enterprise Plan Audit Report

**Plan:** .paul/phases/05-gmail-auto-capture/05-01-PLAN.md
**Audited:** 2026-03-29
**Verdict:** Conditionally acceptable — 3 must-have security gaps patched, now ready for APPLY

---

## 1. Executive Verdict

**Conditionally acceptable before audit. Enterprise-ready after applied fixes.**

The architecture is sound: OAuth2 + Supabase credential storage + a Settings UI is the correct approach for a single-admin Gmail integration. The scope split (OAuth in 05-01, polling in 05-02) is appropriate. However, the original plan shipped two release-blocking security gaps: missing CSRF protection on the OAuth flow, and a public callback route that burns one-time OAuth codes before verifying who's asking. Both have been patched and are now in the plan.

I would approve this plan for production with the applied fixes in place.

---

## 2. What Is Solid

- **`prompt: 'consent'` + `access_type: 'offline'`** — Correct OAuth2 configuration to force refresh_token re-issuance on every reconnect. Without `prompt: 'consent'`, Google silently omits `refresh_token` after the first authorization, breaking the polling phase before it starts.
- **`gmail.readonly` scope** — Minimum required privilege. Correct.
- **`maybeSingle()` pattern** — Consistent with established project convention (STATE.md). No fragile PGRST116 error code checking.
- **Delete-before-insert reconnect pattern** — Straightforward single-row management. The nil UUID `.neq('id', ...)` sentinel is unusual but now documented in code comments.
- **`gmail_processed_messages.gmail_message_id UNIQUE`** — Deduplication enforced at DB level, not just application layer. Correct.
- **`client_id ON DELETE SET NULL`** — Preserves the dedup record even if the associated client is deleted. Prevents false re-processing.
- **RLS `auth.role() = 'authenticated'`** — Consistent with project-wide team-access pattern.
- **ERROR_MESSAGES map in Settings** — User-facing errors are human-readable strings, not raw error codes. Good UX.
- **No `googleapis` package dependency** — Plain fetch handles OAuth handshake. Fewer supply chain dependencies for a one-time flow.

---

## 3. Enterprise Gaps Identified

### G1 — Missing OAuth2 CSRF state parameter [Must-have]
The original connect route built a Google OAuth URL with no `state` parameter. The callback validated nothing.

**Attack scenario:** Attacker initiates OAuth with their own Google account → pauses before the redirect → crafts the callback URL → tricks a logged-in CRM user into visiting it → CRM stores attacker's Gmail account as the connected integration → attacker controls what leads get captured (or suppresses captures by never connecting a real account).

RFC 6749 §10.12 and OAuth 2.0 Security Best Current Practice both require state parameter validation. This is not discretionary.

### G2 — Callback route lacks authentication gate [Must-have]
The original callback at `/api/auth/gmail/callback` was public (no auth check before external API calls). RLS would have blocked the DB insert for unauthenticated requests — but only after making two external Google API calls (token exchange + userInfo), burning the one-time OAuth code in the process.

**Impact:** Any unauthenticated request to the callback (crawler, vulnerability scanner, SSRF) burns a legitimate OAuth code. The CRM admin would need to re-initiate the full OAuth flow.

Fast-fail before external calls is the correct pattern.

### G3 — Missing `loading.tsx` for settings route [Strongly recommended]
Every other dashboard route (alerts, clients) has a `loading.tsx`. The settings page fetches from DB. Without a skeleton, the page renders blank during server-side fetch on slow connections — visually broken and inconsistent with established project conventions.

### G4 — `invalid_state` not in ERROR_MESSAGES [Must-have, paired with G1]
Once G1 is implemented, a CSRF rejection redirects to `/dashboard/settings?error=invalid_state`. The original ERROR_MESSAGES map didn't have this key, causing the Settings page to display the generic "An unexpected error occurred" fallback. A security-triggered error needs an actionable message. AC-6 also didn't cover this case.

### G5 — No comment on `connected === 'true'` string comparison [Can defer]
`searchParams` values are always strings in Next.js. The comparison is correct but a comment would clarify intent. Minor readability issue.

### G6 — OAuth tokens stored plaintext [Can defer]
Access and refresh tokens stored as plaintext in Supabase. Supabase encrypts data at rest (AES-256), which provides baseline protection. Full application-layer token encryption requires key management complexity disproportionate to a v0.1 internal tool. Accepted risk — documented here.

---

## 4. Upgrades Applied to Plan

### Must-Have (Release-Blocking)

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| G1 | Missing OAuth state parameter (CSRF) | Task 2 action (connect + callback routes), AC section | Connect route generates `crypto.randomUUID()` state, sets `oauth_state` httpOnly cookie (10min), appends to auth URL. Callback validates `returnedState === storedState` before any external calls; rejects with `?error=invalid_state`. Cookie deleted on all exit paths. Added AC-7. |
| G2 | Callback lacks authentication check | Task 2 action (callback route) | Added `supabase.auth.getUser()` as first operation in callback, before any external API calls. Unauthenticated requests redirect to `/login`. |
| G4 | `invalid_state` missing from ERROR_MESSAGES | Task 3 action (Settings page), AC section | Added `invalid_state: 'Connection attempt rejected for security reasons. Please try again.'` to ERROR_MESSAGES map. Added AC-8. |

### Strongly Recommended

| # | Finding | Plan Section Modified | Change Applied |
|---|---------|----------------------|----------------|
| G3 | Missing `loading.tsx` for settings route | Task 3 action + files_modified | Added `settings/loading.tsx` with pulse skeleton matching the page layout. Added to `files_modified` frontmatter. |

### Deferred (Can Safely Defer)

| # | Finding | Rationale for Deferral |
|---|---------|----------------------|
| G5 | No comment on `connected === 'true'` string comparison | Correct behavior, minor readability; address if someone raises confusion |
| G6 | OAuth tokens stored plaintext | Supabase AES-256 at-rest encryption provides baseline. Application-layer encryption requires key management complexity inappropriate for v0.1 single-admin internal tool. Accept and document. |

---

## 5. Audit & Compliance Readiness

**Evidence produced:** The OAuth flow now stores a verifiable audit record — `gmail_credentials` row includes `email`, `created_at`, and `updated_at`. The Settings page exposes connection status. Sufficient for v0.1.

**Silent failures prevented:** Every callback exit path now clears the `oauth_state` cookie. Every error condition redirects with a specific `?error=` code. No silent success-without-connection scenarios.

**Post-incident reconstruction:** If the wrong Gmail account is connected, the admin can see the connected email on the Settings page and reconnect. The `updated_at` timestamp shows when credentials last changed. Adequate for the scope.

**Ownership:** The `gmail_credentials` table has no `connected_by` field — no record of which CRM user connected the Gmail account. For v0.1 with a single admin, this is acceptable. Deferred.

**What would fail a real audit:**
- G1 and G2 would fail any OAuth security review outright — both are now fixed.
- Token plaintext storage (G6) would require documentation in a SOC 2 risk register. Deferred with justification above.

---

## 6. Final Release Bar

**What must be true before shipping:**
- State parameter validation in place (applied) ✓
- Auth check before external API calls in place (applied) ✓
- `invalid_state` error renders correctly on Settings page (applied) ✓
- All 8 acceptance criteria pass human verification checkpoint

**Remaining risks after applied fixes:**
- Plaintext token storage — accepted, Supabase encrypts at rest
- No per-user audit trail for Gmail connection changes — deferred, acceptable for v0.1

**Sign-off:** I would approve this plan for production with the applied fixes in place.

---

**Summary:** Applied 3 must-have + 1 strongly-recommended upgrades. Deferred 2 items.
**Plan status:** Updated and ready for APPLY.

---
*Audit performed by PAUL Enterprise Audit Workflow*
*Audit template version: 1.0*

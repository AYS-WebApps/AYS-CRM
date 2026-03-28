# Roadmap: AYS CRM

## Overview

Building a CRM from scratch for a Tent & Event Rentals business. The journey starts with a solid Next.js + Supabase foundation, builds up client management and pipeline tracking, adds a notes system for repeat clients, then connects to Gmail for automatic lead capture and WhatsApp for real-time team alerts and data entry.

## Current Milestone

**v0.1 Initial Release** (v0.1.0)
Status: In progress
Phases: 1 of 6 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Foundation | 2 | ✅ Complete | 2026-03-28 |
| 2 | Client & Lead Management | TBD | Not started | - |
| 3 | Pipeline & Next-Action Notifications | TBD | Not started | - |
| 4 | Notes System | TBD | Not started | - |
| 5 | Gmail Auto-Capture | TBD | Not started | - |
| 6 | WhatsApp Integration | TBD | Not started | - |

## Phase Details

### Phase 1: Foundation

**Goal:** Working Next.js app on Vercel with Supabase backend, full database schema, and authenticated login.
**Depends on:** Nothing (first phase)
**Research:** Unlikely (established stack)

**Scope:**
- Next.js 14 App Router scaffold with TypeScript
- Supabase project + client setup
- Supabase Auth (email/password login)
- All core database tables created with RLS
- Protected dashboard shell

**Plans:**
- [x] 01-01: Scaffold + Auth (Next.js, Supabase client, login, protected dashboard)
- [x] 01-02: Database Schema (all core tables, RLS policies, seed pipeline stages)

### Phase 2: Client & Lead Management

**Goal:** Create, view, edit, and list clients and leads with source tagging.
**Depends on:** Phase 1 (schema + auth)
**Research:** Unlikely

**Scope:**
- Client list view with search and filters
- Create/edit client form (name, phone, email, source tag)
- Client detail page (profile view)
- Lead source tags (Website, Direct, Referral, etc.)

**Plans:** TBD during planning

### Phase 3: Pipeline & Next-Action Notifications

**Goal:** Track each client through pipeline stages with in-app next-action alerts.
**Depends on:** Phase 2 (clients exist)
**Research:** Unlikely

**Scope:**
- Pipeline stage selector per client/project (New Lead → Quoted → Confirmed → Completed)
- Next-action field per client (what needs to happen, by when)
- Notification badge / alert view showing clients needing attention
- Dashboard summary of pipeline status

**Plans:** TBD during planning

### Phase 4: Notes System

**Goal:** Two-tier notes — general client notes and project/event-specific notes.
**Depends on:** Phase 2 (client profiles exist)
**Research:** Unlikely

**Scope:**
- General notes on client profile (not tied to any event)
- Project/event entity — each client can have multiple events
- Per-event notes (event date, event type, notes)
- Notes history (chronological, author + timestamp)

**Plans:** TBD during planning

### Phase 5: Gmail Auto-Capture

**Goal:** Auto-create leads from emails in Gmail "Quote Requests" folder.
**Depends on:** Phase 2 (client/lead creation logic exists)
**Research:** Likely (Gmail API OAuth flow, token refresh, polling vs. push)

**Research topics:** Gmail API watch vs. polling, OAuth2 token storage in Supabase, deduplication strategy

**Scope:**
- Gmail OAuth2 connection (admin connects once)
- Poll or watch "Quote Requests" label/folder
- Parse name, phone, email, message from email body
- Auto-create lead with "Website" source tag
- Mark processed emails to avoid duplicates

**Plans:** TBD during planning

### Phase 6: WhatsApp Integration

**Goal:** Alert team WhatsApp channel on new inquiries; accept client data via WhatsApp.
**Depends on:** Phase 5 (lead capture exists), Phase 2 (client creation logic)
**Research:** Likely (WhatsApp Business API vs. Twilio, webhook setup on Vercel serverless)

**Research topics:** Twilio vs. WhatsApp Cloud API pricing/complexity, webhook receiving on Vercel, parsing WhatsApp messages for client data

**Scope:**
- Send WhatsApp message to team channel when new lead is captured (Phase 5 trigger)
- Receive inbound WhatsApp messages (webhook)
- Parse structured commands to add/update client info (e.g., tagging format)
- Confirmation reply to sender

**Plans:** TBD during planning

---
*Roadmap created: 2026-03-24*
*Last updated: 2026-03-24*

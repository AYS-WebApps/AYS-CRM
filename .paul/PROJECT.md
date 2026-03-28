# AYS CRM

## What This Is

A CRM built for a Tent & Event Rentals business to manage the full client lifecycle — from first inquiry to repeat bookings. The system tracks leads and clients through a sales pipeline, supports per-client and per-project notes, auto-captures quote requests submitted via the website (from a Gmail folder), and integrates with WhatsApp for real-time alerts and client data entry.

## Core Value

The AYS team can track every lead and client through the pipeline, know exactly what needs to happen next, and never miss a new inquiry — whether it comes from the website, email, or WhatsApp.

## Current State

| Attribute | Value |
|-----------|-------|
| Version | 0.1.0 |
| Status | In Development |
| Last Updated | 2026-03-28 |

## Requirements

### Validated (Shipped)

- ✓ Authentication — email/password login, protected routes, logout — Phase 1
- ✓ Database Schema — clients, projects, notes, pipeline_stages tables with RLS and indexes — Phase 1
- ✓ Pipeline Stage Definitions — New Lead, Contacted, Quoted, Confirmed, Completed, Cancelled — Phase 1

### Active (In Progress)

- [ ] Client & Lead Management — store name, phone, email; create/edit profiles
- [ ] Pipeline Tracking — stages per project with per-client status
- [ ] Next-Action Notifications — alert the team on what needs to be done for a specific client

### Planned (Next)

- [ ] Notes System — general client notes + project-specific notes (supports repeat clients with multiple events)
- [ ] Gmail Auto-Capture — read "Quote Requests" folder, extract name/phone/email/message, create lead automatically
- [ ] Website Source Tagging — tag auto-captured leads as "Website" source
- [ ] WhatsApp Alerts — notify team WhatsApp channel when a new inquiry is captured
- [ ] WhatsApp Data Entry — add or update client info via WhatsApp (tag-based or command-based)

### Out of Scope

- Inventory / equipment tracking — may be a future milestone
- Invoicing / payments — may be a future milestone
- Multi-user permissions / roles — not required for initial release

## Target Users

**Primary:** AYS team members (sales/ops)
- Manage inbound leads from website and direct contact
- Need to know pipeline status and next actions at a glance
- Work on WhatsApp for day-to-day communication

**Secondary:** Repeat clients (indirectly — their data is managed in the CRM)

## Context

**Business Context:**
Tent & Event Rentals business renting tents, dance floors, stages, lighting, tables & chairs, bars, and more. Clients frequently return for multiple events, so the CRM must distinguish between client-level notes and event/project-level notes.

**Technical Context:**
- Website already generates inquiries sent to a Gmail folder ("Quote Requests")
- Team uses WhatsApp as primary communication channel
- Stack confirmed: Next.js 16 + Supabase + Vercel

## Constraints

### Technical Constraints
- Hosted on Vercel (serverless — no persistent processes)
- Database on Supabase (PostgreSQL)
- Must integrate with Gmail API to read "Quote Requests" folder
- Must integrate with WhatsApp (WhatsApp Business API or Twilio)
- Must be web-accessible (team needs access from multiple devices)
- Next.js 16 proxy convention (proxy.ts, not middleware.ts)

### Business Constraints
- Simple enough for non-technical staff to use daily
- Must support repeat clients — one client can have many projects/events

### Compliance Constraints
- Client PII (name, phone, email) must be stored securely
- No public exposure of client data
- RLS enabled on all tables — unauthenticated access returns zero rows

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Next.js 16 (upgraded from 14) | Fixed DoS vulnerabilities; proxy.ts convention adopted | 2026-03-28 | Active |
| Supabase Auth with @supabase/ssr | Not deprecated auth-helpers; async cookies() | 2026-03-28 | Active |
| Two-tier notes via nullable project_id | One table handles general + project-specific notes | 2026-03-28 | Active |
| Hard CASCADE deletes for v0.1 | Simpler; team-controlled access; address before multi-user | 2026-03-28 | Active |
| Team-wide RLS (USING true) | No per-user isolation needed for v0.1 internal tool | 2026-03-28 | Active |
| Email confirmation disabled in Supabase | Admin-created users only; no self-registration | 2026-03-28 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Leads captured from website without manual entry | 100% | 0% | Not started |
| Team notified of new inquiries via WhatsApp | < 2 min delay | — | Not started |
| Pipeline visibility for all active clients | 100% | 0% | Not started |

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16 App Router | proxy.ts for route protection |
| Frontend | React / Tailwind CSS | Hosted on Vercel |
| Database | Supabase (PostgreSQL) | Auth, RLS, real-time |
| Hosting | Vercel | Frontend + API routes (serverless) |
| Auth | Supabase Auth (@supabase/ssr) | Email/password, session via cookies |
| Gmail Integration | Gmail API | Read "Quote Requests" folder — Phase 5 |
| WhatsApp Integration | WhatsApp Business API / Twilio | Alerts + data entry — Phase 6 |

## Links

| Resource | URL |
|----------|-----|
| Supabase Project | avcyvtptrdnzvupitbaz.supabase.co |
| Repository | TBD |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-03-28 after Phase 1*

# Project Scope Document
# Daily Standup System

> **Version:** 1.0 | **Date:** 2026-06-10
> **Author:** Senior Product Manager
> **Source PRD:** `agents/standup_prd.md` v1.0
> **Source KPI:** `agents/standup_kpi.md` v1.0
> **Audience:** Engineering, QA, DevOps, Product, Stakeholders

---

## 1. Goal & Problem Statement

* **The Problem:** A remote team has no structured daily standup process — updates are scattered across emails, chat messages, and ad-hoc calls, leaving managers with zero visibility into blockers, progress, or team availability and costing ~30–45 minutes daily in manual status chasing.
* **The Solution:** Build a lightweight web-based Daily Standup System where team members submit a 3-field daily update via a form, managers review a real-time grouped digest view, and an automated email digest is dispatched to the manager at 10:00 AM every weekday — requiring zero manual coordination.

---

## 2. Tech Stack

* **Frontend:** React, TypeScript, Redux Toolkit, Tailwind CSS, Jest, React Testing Library
* **Backend & API:** Node.js 20 LTS, Express.js, REST API (`/api/v1`), node-cron (10:00 AM weekday scheduler), Nodemailer (SMTP email dispatch)
* **Database & Caching:** SQLite via `better-sqlite3` (single-file DB, zero infrastructure — appropriate for demo scale of 3–50 members); no caching layer required at v1.0 scale
* **Auth / Infra:** No authentication in v1.0 — team member identity via pre-configured name/email dropdown; `.env` file for SMTP credentials and manager email; deployable as a single Node.js process via `node server.js`

---

## 3. Core Features & Acceptance Criteria

| Feature Number | Feature Name | Description | Acceptance Criteria |
|---|---|---|---|
| F-01 | **Standup Submission Form** | 3-field web form (Yesterday / Today / Blockers) with member name dropdown; one submission per member per day enforced | `POST /api/v1/standups` with all valid fields returns HTTP 201 with `submitted_at` timestamp; empty/whitespace fields return HTTP 422 `VALIDATION_ERROR` with inline field highlight; second submission same day returns HTTP 409 `DUPLICATE_SUBMISSION`; unknown member returns HTTP 404 `MEMBER_NOT_FOUND` — per PRD §6 AC-1, AC-2, AC-6, AC-8 / KPI-FORM-01–06 |
| F-02 | **Team Member Registry** | Pre-configured member list loaded from config; dropdown on form; submission status (submitted / pending) exposed via API | `GET /api/v1/standups/members` returns all configured members with `submitted` boolean and `submitted_at`; `pending_count` equals `total_members` minus `submitted_count`; unrecognised email rejected at submission — per PRD §4 / KPI-MEM-01–05 |
| F-03 | **Manager Digest View** | Dashboard page at `/manager/digest` showing today's submissions as grouped member cards with pending section and blocker highlighting | All submitted standups render with name, timestamp, all 3 fields; non-submitted members listed in "Awaiting Submission" section; `blockers` field highlighted amber when not "None"; `GET /api/v1/standups` p95 < 200 ms; zero-submission state handled gracefully — per PRD §6 AC-3 / KPI-MGR-01–06 |
| F-04 | **Automated Email Digest at 10:00 AM** | node-cron job fires every weekday at 10:00 AM; compiles all submissions; sends formatted HTML email to manager; retries on SMTP failure | Digest fires within ±60 seconds of 10:00 AM on 100% of weekdays; email contains all submitted entries + pending members list; zero-submission digest still sent; SMTP failure triggers up to 3 retries at 5-minute intervals with log entries; standup data preserved regardless of send outcome — per PRD §6 AC-4, AC-5, AC-7 / KPI-EMAIL-01–10 |
| F-05 | **Manual Digest Trigger** | Admin API endpoint to retroactively dispatch a digest for any date | `POST /api/v1/digest/send` with `date` and `recipient_email` compiles and sends digest; returns HTTP 200 with `submissions_included`, `pending_members`, `sent_at`; usable after missed 10:00 AM scheduler fire — per PRD §4 / KPI-EMAIL-09, KPI-OPS-01 |
| F-06 | **Digest Status Check** | API endpoint confirming whether the email digest has been sent for a given date | `GET /api/v1/digest/status?date=YYYY-MM-DD` returns `digest_sent` boolean, `sent_at`, `recipient`, `submissions_included`; invalid date format returns HTTP 400 `INVALID_DATE_FORMAT` — per PRD §4 / KPI-EMAIL-08, KPI-API-02 |

---

## 4. UI/UX Standards

* **Theme & Style:** Dark mode primary with a curated HSL color palette — deep slate base `hsl(220, 26%, 10%)`, indigo primary `hsl(243, 75%, 62%)`, emerald success `hsl(152, 69%, 50%)`, amber blocker-highlight `hsl(38, 92%, 55%)`, rose error `hsl(355, 80%, 57%)`; glassmorphism card components on the Manager Digest View with `backdrop-filter: blur(10px)` and `background: rgba(255,255,255,0.05)`; clean, focused aesthetic that reduces cognitive load for a daily-use tool.
* **Layout:** Desktop-first single-column centred layout (max-width 720px for form; max-width 1100px for digest); `Inter` (Google Fonts) for all UI text; 16px base size; submission form: large labelled textareas with character count; success state: full-screen confirmation message with checkmark animation; Manager Digest: CSS grid of member cards (2-up on desktop, 1-up on mobile); pending section visually separated with dashed border and muted opacity; amber left-border accent on blocker cards; 200ms ease transitions on card hover elevation; skeleton loader on digest page initial load; toast notification on successful form submit.

---

## 5. Out of Scope

The following are **explicitly excluded from v1.0** and must not be implemented, prototyped, or stubbed:

* **User authentication / login system** — no passwords, sessions, JWTs, or OAuth; identity via pre-configured dropdown only
* **Edit or delete submitted standups** — once submitted, entries are immutable; no edit UI, no `PATCH`/`DELETE` standup endpoints
* **Slack / Microsoft Teams / webhook integration** — digest delivered via email only; no third-party chat platform connectors
* **Native iOS / Android mobile apps** — responsive web only; no React Native, Flutter, or PWA in v1.0
* **Historical analytics or trend reporting** — no charts, streak tracking, weekly summaries, or per-member performance views
* **Comment or reply threads on standup entries** — manager digest is read-only; no annotation, reaction, or reply capability
* **Reminder notifications to team members** — no pre-10:00 AM nudge emails or push notifications to pending members
* **Multi-team or multi-manager support** — single team, single manager email configured per deployment; no org hierarchy
* **In-app team member management UI** — members added/removed via config file only; no admin CRUD UI for the member list
* **Per-timezone scheduling** — cron fires at server local time 10:00 AM only; no member-level or team-level timezone configuration
* **Data archival or retention policy enforcement** — records stored indefinitely; no automated purge, export, or archival job in v1.0
* **Real-time digest page auto-refresh** — manager must manually refresh the digest page; no WebSocket, SSE, or polling

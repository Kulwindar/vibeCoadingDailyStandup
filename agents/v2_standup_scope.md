# Project Scope Document
# Daily Standup System

> **Version:** 2.0 | **Date:** 2026-06-10
> **Author:** Senior Product Manager
> **Source PRD:** `agents/v2_standup_prd.md` v2.0
> **Source KPI:** `agents/v2_standup_kpi.md` v2.0
> **Audience:** Engineering, QA, DevOps, Product, Stakeholders

---

## 1. Goal & Problem Statement

* **The Problem:** A remote team has no structured daily standup process — updates are scattered across emails, chat messages, and ad-hoc calls, leaving managers with zero visibility into blockers, progress, or team availability and costing ~30–45 minutes daily in manual status chasing.
* **The Solution:** Build a lightweight web-based Daily Standup System where team members submit a 3-field daily update via a form, managers review a real-time grouped digest view, and an automated email digest is dispatched to the manager at 10:00 AM every weekday — and extend with Slack integration, AI blocker detection, sprint analytics, kudos recognition, and searchable archives.

---

## 2. Tech Stack

* **Frontend:** React, TypeScript, Redux Toolkit, Tailwind CSS, Jest, React Testing Library
* **Backend & API:** Node.js 20 LTS, Express.js, REST API (`/api/v1`), node-cron (10:00 AM weekday scheduler), Nodemailer (SMTP email dispatch)
* **Database & Caching:** SQLite via `better-sqlite3` with FTS5 extension for archive search
* **V2 Additions:**
  * **Slack Integration:** Slack Bolt SDK for JavaScript (`@slack/bolt`), Slack Events API, Slack Web API
  * **AI Integration:** OpenAI GPT-4 API or Anthropic Claude API via `ai` package
  * **Realtime:** Socket.IO for kudos notifications and AI blocker alerts
  * **Analytics:** In-memory cache with node-cache for sprint analytics

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

## V2 Features (F-07 through F-11)

| Feature Number | Feature Name | Description | Acceptance Criteria |
|---|---|---|---|
| F-07 | **Slack /standup Bot (V2)** | Team members submit standups via Slack modal (`/standup` command) with email mapping and duplicate prevention | `/standup` slash command opens modal; valid submission returns HTTP 200 to Slack and stores entry; same-day duplicate returns ephemeral error; unmapped Slack user returns HTTP 404; feature flag `SLACK_BOT_ENABLED` controls availability — per PRD §8.3 / KPI-SLACK-01–05 |
| F-08 | **AI Blocker Detection (V2)** | Natural language processing analyzes blocker text for severity and confidence; manager alerts for high-severity blockers | `POST /api/v1/blockers/analyze` returns severity (HIGH/MEDIUM/LOW/NONE) and confidence score; confidence < 0.7 auto-rejected; HIGH severity triggers WebSocket alert; Blocker Dashboard shows flagged items; feature flag `AI_BLOCKER_DETECTION_ENABLED` — per PRD §8.5 / KPI-AI-01–05 |
| F-09 | **Sprint Velocity Analytics (V2)** | Automated velocity calculation from standup data with trend visualization | `GET /api/v1/analytics/sprint` returns `velocity_score`, `completed_tasks`, `trend` array; `/manager/analytics` displays interactive chart; cache TTL 5 minutes; feature flag `SPRINT_ANALYTICS_ENABLED` — per PRD §8.6 / KPI-ANALYTICS-01–04 |
| F-10 | **Kudos System (V2)** | Peer recognition with real-time notifications, feed display, and leaderboard | `POST /api/v1/kudos` with valid `from_member`, `to_member`, `message` returns HTTP 201; recipient receives WebSocket notification within 1 second; `/kudos/leaderboard` shows sorted points; `/kudos/feed` displays recent kudos; points decay after 30 days; max 5 kudos/day per giver; feature flag `KUDOS_ENABLED` — per PRD §8.8 / KPI-KUDOS-01–05 |
| F-11 | **Searchable Archive (V2)** | Full-text search across all standup history with date/member filters and export | `GET /api/v1/archive/search?q=text&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&member_email=x@y.z` returns paginated results; `GET /api/v1/archive/export?format=csv` returns downloadable file; 90-day max range; FTS5 index; feature flag `ARCHIVE_ENABLED` — per PRD §8.10 / KPI-ARCHIVE-01–05 |

---

## 4. UI/UX Standards

* **Theme & Style:** Dark mode primary with a curated HSL color palette — deep slate base `hsl(220, 26%, 10%)`, indigo primary `hsl(243, 75%, 62%)`, emerald success `hsl(152, 69%, 50%)`, amber blocker-highlight `hsl(38, 92%, 55%)`, rose error `hsl(355, 80%, 57%)`; glassmorphism card components on the Manager Digest View with `backdrop-filter: blur(10px)` and `background: rgba(255,255,255,0.05)`; clean, focused aesthetic that reduces cognitive load for a daily-use tool.

* **Layout:** Desktop-first single-column centred layout (max-width 720px for form; max-width 1100px for digest); `Inter` (Google Fonts) for all UI text; 16px base size; submission form: large labelled textareas with character count; success state: full-screen confirmation message with checkmark animation; Manager Digest: CSS grid of member cards (2-up on desktop, 1-up on mobile); pending section visually separated with dashed border and muted opacity; amber left-border accent on blocker cards; 200ms ease transitions on card hover elevation; skeleton loader on digest page initial load; toast notification on successful form submit.

* **V2 UI Additions:**
  * **Blocker Dashboard:** Red highlight for HIGH severity, amber for MEDIUM, green for LOW; confidence score displayed as percentage.
  * **Analytics Dashboard:** Chart.js line chart with velocity trend; date range picker component.
  * **Kudos Feed:** Masonry grid layout for kudos cards; emoji reaction support.
  * **Kudos Leaderboard:** Podium-style top 3 display; progress bars for remaining members.
  * **Archive Page:** Search input with autocomplete; filter sidebar; export buttons.

---

## 5. Out of Scope

The following are **explicitly excluded from v2.0** and must not be implemented, prototyped, or stubbed:

* **User authentication / login system** — no passwords, sessions, JWTs, or OAuth; identity via pre-configured dropdown or Slack user mapping only
* **Edit or delete submitted standups** — once submitted, entries are immutable; no edit UI, no `PATCH`/`DELETE` standup endpoints
* **Slack /standup via message** — only modal submission supported; no natural language parsing of chat messages
* **PWA / mobile offline support** — responsive web only; no offline caching or native mobile features
* **Multi-team support** — single team configuration; no org hierarchy or team switching
* **In-app team member management UI** — members added/removed via config file only
* **Per-timezone scheduling** — cron fires at server timezone 10:00 AM only
* **Blocker resolution tracking** — blockers flagged but no resolution workflow
* **Kudos monetary rewards** — points-only recognition; no integration with bonus systems
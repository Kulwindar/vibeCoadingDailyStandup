# KPI Document
# Daily Standup System

> **Version:** 2.0 | **Date:** 2026-06-10
> **Author:** Senior Product Manager
> **Source PRD:** `agents/v2_standup_prd.md` v2.0
> **Audience:** Engineering, QA, UAT, Product, Stakeholders

> **Cross-Reference Key:**
> - `PRD §1` = Problem Statement
> - `PRD §2` = Solution Overview & Core Features
> - `PRD §3` = User Flows (A, B, C)
> - `PRD §4` = API Design
> - `PRD §5` = Edge Cases & Error Handling
> - `PRD §6` = KPIs & Acceptance Criteria
> - `PRD §8` = V2 Features (Slack Bot, AI Blocker Detection, Analytics, Kudos, Archive)

---

## Module Breakdown (Derived from PRD §2)

| Module ID | Module Name |
|---|---|
| M1 | Standup Submission Form |
| M2 | Team Member Registry |
| M3 | Manager Digest View |
| M4 | Email Digest & Scheduler |
| M5 | API Layer & Validation |
| M6 | Data Persistence |
| M7 | Error Handling & Operational Reliability |
| M8 | Slack /standup Bot (V2) |
| M9 | AI Blocker Detection (V2) |
| M10 | Sprint Velocity Analytics (V2) |
| M11 | Kudos System (V2) |
| M12 | Searchable Archive (V2) |

---

# KPI Matrix

---

### M1 — Standup Submission Form
> Derived from: PRD §3 Flow A · PRD §4 `POST /api/v1/standups` · PRD §5 Empty Fields, Duplicate Submission · PRD §6 AC-1, AC-6

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-FORM-01 | Successful Submission | Team member submits all 3 fields and receives confirmation | `POST /api/v1/standups` with valid `member_name`, `member_email`, `yesterday`, `today`, `blockers` returns HTTP 201 with `submitted_at` timestamp per PRD §4 |
| KPI-FORM-02 | Empty Field Rejection | Form rejects submissions with any blank or whitespace-only field | Server trims all fields; any empty value returns HTTP 422 `VALIDATION_ERROR`; no record stored per PRD §5 |
| KPI-FORM-03 | Duplicate Submission Block | System prevents a member from submitting twice on the same calendar day | Second `POST` from same `member_email` on same `date` returns HTTP 409 `DUPLICATE_SUBMISSION`; original record unchanged per PRD §5 |
| KPI-FORM-04 | Submission Response Latency | Form submission API responds within performance threshold | `POST /api/v1/standups` p95 response time < 300 ms under normal load per PRD §6 KPIs |
| KPI-FORM-05 | Confirmation Display | Success state displayed to user after valid submission | UI renders "✅ Standup submitted! See you tomorrow." on HTTP 201 response per PRD §3 Flow A |
| KPI-FORM-06 | Inline Error Display | Form highlights specific empty field(s) in red on validation failure | Each field with empty/whitespace value renders a red "This field is required." message inline; no page reload per PRD §5 |

---

### M2 — Team Member Registry
> Derived from: PRD §2 Team Member List · PRD §3 Flow A (member selection) · PRD §4 `GET /api/v1/standups/members` · PRD §5 Unrecognised Member · PRD §6 AC-8

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-MEM-01 | Member List Accuracy | All pre-configured team members appear in the submission form dropdown | `GET /api/v1/standups/members` returns all configured members with name, email, submitted status, and submitted_at per PRD §4 |
| KPI-MEM-02 | Unknown Member Rejection | Submissions from unconfigured name/email combinations are blocked | `POST /api/v1/standups` with unrecognised `member_email` returns HTTP 404 `MEMBER_NOT_FOUND`; no record stored per PRD §5 |
| KPI-MEM-03 | Submission Status Accuracy | Member list correctly reflects who has and has not submitted today | `GET /api/v1/standups/members` returns `submitted: true` with correct `submitted_at` for members who submitted; `submitted: false` and `submitted_at: null` for pending members per PRD §4 |
| KPI-MEM-04 | Pending Count Accuracy | Total pending count matches actual non-submitted members | `GET /api/v1/standups` response field `pending_count` equals `total_members` minus `submitted_count`; verified against member registry per PRD §4 |
| KPI-MEM-05 | Static Config Integrity | Team member list loaded correctly from configuration on server start | Server startup reads member config without errors; all members available in dropdown within 2 seconds of page load per PRD §7 |

---

### M3 — Manager Digest View
> Derived from: PRD §2 Manager Daily Digest View · PRD §3 Flow B · PRD §4 `GET /api/v1/standups` · PRD §6 AC-3

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-MGR-01 | Digest Load Time | Manager digest page loads within performance threshold | `GET /api/v1/standups` p95 response time < 200 ms for up to 50 team members per PRD §6 KPIs |
| KPI-MGR-02 | Submitted Cards Completeness | All submitted standups display all 3 fields per member card | Each submission card renders member name, `submitted_at` timestamp, `yesterday`, `today`, and `blockers` fields — no field missing per PRD §3 Flow B |
| KPI-MGR-03 | Pending Section Accuracy | Non-submitted members appear in "Pending" section with correct badge | Members with `submitted: false` appear in "Awaiting Submission" section; count matches `pending_count` from API per PRD §3 Flow B |
| KPI-MGR-04 | Blocker Highlight | Blockers field visually highlighted when value is not "None" or empty | `blockers` field rendered with amber highlight when value is not "None" / not empty string; plain style when "None" per PRD §3 Flow B |
| KPI-MGR-05 | Date Filter Functionality | Manager can query digest for a specific past date | `GET /api/v1/standups?date=YYYY-MM-DD` returns correct submissions for the queried date; defaults to today when no param provided per PRD §4 |
| KPI-MGR-06 | Zero Submissions State | Digest view handles gracefully when no submissions exist | When `submitted_count: 0`, digest view renders all members in Pending section with message "No submissions yet for today." per PRD §5 |

---

### M4 — Email Digest & Scheduler
> Derived from: PRD §2 Automated Email Digest · PRD §3 Flow C · PRD §4 `POST /api/v1/digest/send`, `GET /api/v1/digest/status` · PRD §5 SMTP Failure, No Submissions, Partial Team · PRD §6 AC-4, AC-5, AC-7

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-EMAIL-01 | Scheduler Trigger Accuracy | Digest job fires at 10:00 AM server time every weekday | Cron job triggers within ±60 seconds of 10:00 AM local server time on 100% of scheduled weekdays per PRD §6 KPIs |
| KPI-EMAIL-02 | Full Team Digest Content | Email digest includes all submitted members' full entries | Email body contains `yesterday`, `today`, and `blockers` for every member who submitted before 10:00 AM; each entry attributed to the correct member per PRD §3 Flow C |
| KPI-EMAIL-03 | Pending Members Listed | Non-submitted members noted in email digest | Members with no submission by 10:00 AM listed as "No submission received by 10:00 AM" at bottom of email per PRD §3 Flow C and PRD §5 |
| KPI-EMAIL-04 | Zero-Submission Digest Sent | Email sends even when all members are pending | When `submitted_count = 0`, email is still dispatched stating "No standups were submitted by 10:00 AM today" with full pending member list per PRD §5 |
| KPI-EMAIL-05 | Email Delivery Latency | Email dispatched promptly after scheduler trigger | Email sent to SMTP service within ≤ 60 seconds of 10:00 AM trigger per PRD §6 KPIs |
| KPI-EMAIL-06 | SMTP Failure Retry | System retries digest send on SMTP failure | On send failure, system retries up to 3 times at 5-minute intervals; each attempt logged with timestamp and error reason per PRD §5 |
| KPI-EMAIL-07 | Retry Logging | All send attempts (success and failure) are logged | Each attempt writes a log entry: `date`, `attempt_number`, `outcome`, `error_reason` (if failed), `sent_at` (if success) per PRD §5 |
| KPI-EMAIL-08 | Digest Status API | Manager can query whether digest was sent for a given date | `GET /api/v1/digest/status?date=YYYY-MM-DD` returns `digest_sent`, `sent_at`, `recipient`, `submissions_included` per PRD §4 |
| KPI-EMAIL-09 | Manual Trigger | Admin can retrospectively send digest via API | `POST /api/v1/digest/send` with `date` and `recipient_email` executes digest compile and send; returns HTTP 200 with dispatch summary per PRD §4 and PRD §5 |
| KPI-EMAIL-10 | Monthly Delivery Success Rate | SMTP acceptance rate of scheduled digest emails | ≥ 99% of scheduled digest emails accepted by SMTP provider per month (post-retry) per PRD §6 KPIs |

---

### M5 — API Layer & Validation
> Derived from: PRD §4 All Endpoints · PRD §5 All Edge Cases · PRD §6 All Acceptance Criteria

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-API-01 | Error Format Consistency | All API errors follow the defined error schema | 100% of error responses return `{ "status": "error", "code": "<ERROR_CODE>", "message": "<detail>" }` per PRD §4 |
| KPI-API-02 | Date Format Validation | Invalid date query parameters are rejected cleanly | `GET /api/v1/standups?date=10-06-2026` returns HTTP 400 `INVALID_DATE_FORMAT` with format guidance per PRD §5 |
| KPI-API-03 | Future Date Block | Standup submissions for future dates rejected | Server-side date check rejects any submission where server date ≠ today's date with HTTP 422 `VALIDATION_ERROR` per PRD §5 |
| KPI-API-04 | Content-Type Enforcement | API rejects non-JSON request bodies | `POST` requests without `Content-Type: application/json` return HTTP 415; malformed JSON returns HTTP 400 |
| KPI-API-05 | Response Shape Contract | All success responses match the defined response schema | 100% of success responses return `{ "status": "success", "data": {} }` with complete fields per PRD §4 |
| KPI-API-06 | Submission Rate Throughput | API handles concurrent submissions without data corruption | 3 simultaneous `POST /api/v1/standups` from 3 different members all return HTTP 201; no records lost or overwritten |

---

### M6 — Data Persistence
> Derived from: PRD §3 Flow A (server-side save) · PRD §5 Duplicate check, Zero Data Loss · PRD §6 KPI — Zero Data Loss, AC-2

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-DB-01 | Submission Record Integrity | All successfully submitted standups are persisted correctly | 100% of HTTP 201 responses correspond to a database record retrievable via `GET /api/v1/standups`; no phantom 201s per PRD §6 |
| KPI-DB-02 | Unique Constraint Enforcement | Database-level guard against duplicate member+date records | DB unique constraint on `(member_email, date)` prevents duplicate writes even if service-layer guard is bypassed per PRD §5 |
| KPI-DB-03 | Timestamp Accuracy | Server-side `submitted_at` timestamp is accurate | `submitted_at` field stored in UTC ISO 8601 format; within ±2 seconds of actual submission time per PRD §4 |
| KPI-DB-04 | Data Retention | Submitted standup records persist for digest retrieval | All records created on date `D` are retrievable via `GET /api/v1/standups?date=D` at any point on day `D` and beyond per PRD §6 KPI — Zero Data Loss |
| KPI-DB-05 | Digest Data Survives SMTP Failure | Standup data is not lost if email send fails | After 3 failed SMTP retry attempts, all standup records remain fully intact in DB and retrievable per PRD §5 |

---

### M7 — Error Handling & Operational Reliability
> Derived from: PRD §5 All Edge Cases · PRD §7 Limitations & Risks · PRD §6 AC-7

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-OPS-01 | Scheduler Uptime Recovery | Missed 10:00 AM job can be retroactively triggered | After server restart following downtime, admin manually calls `POST /api/v1/digest/send` with missed date; digest dispatched successfully per PRD §5 and PRD §7 |
| KPI-OPS-02 | Unhandled Error Containment | Unhandled server errors return safe HTTP 500 response | Any uncaught exception returns HTTP 500 with generic message; no stack traces or internal details exposed in response body |
| KPI-OPS-03 | Log Completeness | All dispatch attempts and errors are logged | Every `POST /api/v1/digest/send` attempt (manual or scheduled) writes a log entry with date, outcome, attempt number, and error detail per PRD §5 |
| KPI-OPS-04 | Graceful Empty State | System operates correctly with zero submissions in DB | All endpoints return valid, well-formed responses when no standup records exist for a queried date; no null pointer errors per PRD §5 |
| KPI-OPS-05 | Concurrent Request Safety | Simultaneous submissions from multiple members handled correctly | 3 simultaneous POST requests from 3 different members result in exactly 3 DB records; no race condition causes data loss or duplicate key error per PRD §6 AC-1 |

---

### M8 — Slack /standup Bot (V2)
> Derived from: PRD §8 Slack Bot Integration · PRD §6 V2 KPIs

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-SLACK-01 | Modal Submission Success | User submits standup via Slack modal successfully | `/standup` slash command opens modal; valid submission returns HTTP 200 to Slack; entry stored with `source: "slack"` per PRD §8.3 |
| KPI-SLACK-02 | Duplicate Prevention in Slack | Slack submissions respect same-day duplicate rule | Second modal submission from same user on same day returns ephemeral message "Already submitted today" per PRD §8.3 |
| KPI-SLACK-03 | Member Mapping Accuracy | Slack user email maps correctly to team member config | Submission via Slack user `U12345` with email `user@company.com` correctly identifies configured member per PRD §8.2 |
| KPI-SLACK-04 | Form Field Consistency | Slack modal fields match web form fields | Modal includes Yesterday / Today / Blockers fields with same validation rules as web form per PRD §8.3 |
| KPI-SLACK-05 | Webhook Validation | Slack requests verified with signing secret | All incoming Slack requests validated with `SLACK_SIGNING_SECRET`; invalid signatures return HTTP 401 per PRD §8.4 |

---

### M9 — AI Blocker Detection (V2)
> Derived from: PRD §8 AI Blocker Detection · PRD §6 V2 KPIs

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-AI-01 | Blocker Detection Accuracy | AI correctly identifies blockers with proper scoring | Blocker sentences like "waiting on API" return `severity: "HIGH"`, `confidence: 0.9`; non-blockers return `severity: "NONE"` per PRD §8.4 |
| KPI-AI-02 | Confidence Threshold Enforcement | Low-confidence predictions are rejected | AI predictions with `confidence < 0.7` are auto-rejected; 0.7-0.89 flagged for review per PRD §8.5 |
| KPI-AI-03 | Manager Alert Delivery | High-severity blockers trigger alerts | Blockers with `severity: "HIGH"` and `confidence > 0.9` send immediate notification to manager via WebSocket/email per PRD §8.5 |
| KPI-AI-04 | Blocker Dashboard Display | AI-flagged blockers visible in dedicated UI | `/manager/blockers` page renders all flagged blockers with severity color-coding (red/amber/green) and confidence score per PRD §8.5 |
| KPI-AI-05 | Rate Limit Compliance | AI analysis respects quota limits | Maximum 30 AI analysis requests per minute; excess requests queued or rejected gracefully per PRD §8.5 |

---

### M10 — Sprint Velocity Analytics (V2)
> Derived from: PRD §8 Sprint Analytics

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-ANALYTICS-01 | Velocity Trend Accuracy | Sprint velocity calculated correctly from historical data | `GET /api/v1/analytics/sprint?date=YYYY-MM-DD` returns accurate `velocity_score` based on completed tasks per PRD §8.6 |
| KPI-ANALYTICS-02 | Analytics Load Time | Analytics endpoint responds within threshold | `GET /api/v1/analytics/sprint` p95 response time < 500 ms per PRD §8.7 |
| KPI-ANALYTICS-03 | Trend Visualization | Analytics chart renders with historical data | `/manager/analytics` displays 30-day rolling velocity trend with proper date labels and color coding per PRD §8.7 |
| KPI-ANALYTICS-04 | Data Aggregation Accuracy | Analytics aggregates across multiple sprint cycles | When 3+ standups exist for the same member across dates, analytics correctly calculates completion rates per PRD §8.6 |

---

### M11 — Kudos System (V2)
> Derived from: PRD §8 Kudos System

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-KUDOS-01 | Kudos Submission Success | Kudos are submitted and stored successfully | `POST /api/v1/kudos` with valid `from_member`, `to_member`, and `message` returns HTTP 201 with kudos ID per PRD §8.8 |
| KPI-KUDOS-02 | Notification Delivery | Kudos recipients receive real-time notifications | WebSocket emits `kudos_received` event to recipient within 1 second of submission per PRD §8.8 |
| KPI-KUDOS-03 | Leaderboard Accuracy | Kudos leaderboard ranks correctly | `GET /api/v1/kudos/leaderboard` returns members sorted by points descending; ties broken by total count per PRD §8.9 |
| KPI-KUDOS-04 | Kudos Feed Display | Kudos feed renders with recent entries | `/kudos/feed` shows last 20 kudos with sender, recipient, message, and timestamp per PRD §8.9 |
| KPI-KUDOS-05 | Point Decay Compliance | Kudos points decay after 30 days | Kudos older than 30 days have points reduced by 50%; verified via leaderboard API per PRD §8.8 |

---

### M12 — Searchable Archive (V2)
> Derived from: PRD §8 Archive System

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| KPI-ARCHIVE-01 | Search Response Time | Archive search returns results within threshold | `GET /api/v1/archive/search?q=term&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` p95 < 1000 ms per PRD §8.10 |
| KPI-ARCHIVE-02 | Full-Text Search Accuracy | Search queries match relevant standups | Query "API bug" returns standups containing "fixed API bug" or similar variations per PRD §8.10 |
| KPI-ARCHIVE-03 | Date Filter Compliance | Date range filters return correct results | Archive search with `date_from` and `date_to` returns only standups within that range per PRD §8.10 |
| KPI-ARCHIVE-04 | CSV Export Success | Archive exports as CSV correctly | `GET /api/v1/archive/export?format=csv` returns downloadable CSV with all standup fields per PRD §8.10 |
| KPI-ARCHIVE-05 | Member Filter Accuracy | Member filter returns correct results | Archive search with `member_email` returns only that member's submissions per PRD §8.10 |

---

# Development Timeline

| Sprint | Focus Area | Deliverables |
|---|---|---|
| **Sprint 1** | Foundation — DB Schema, Config, API Skeleton | SQLite schema (`standups` table, `digest_log` table); static team member config loader; Express app setup; `GET /api/v1/standups/members` endpoint; environment variable structure (`.env.example`) |
| **Sprint 2** | Core Submission — Form + API | `POST /api/v1/standups` with full validation (empty fields, duplicate check, unknown member, future date); `GET /api/v1/standups?date=` with pending/submitted breakdown; service-layer duplicate guard + DB unique constraint |
| **Sprint 3** | Manager View — Digest UI | `GET /api/v1/standups` full response with `submitted_count`, `pending_count`, member cards; Manager Digest HTML page (`/manager/digest`) — grouped cards, pending section, blocker highlighting; date filter |
| **Sprint 4** | Email Digest — Scheduler + Manual Trigger | HTML email template with submitted entries + pending members section; `POST /api/v1/digest/send` manual trigger; node-cron job at 10:00 AM weekdays; Nodemailer SMTP integration; 3-retry logic; digest log writes |
| **Sprint 5** | Slack Bot Integration (V2) | `POST /api/v1/slack/events` endpoint; Slack Bolt app with `/standup` command; modal view with Yesterday/Today/Blockers; email-to-member mapping; duplicate prevention for Slack submissions |
| **Sprint 6** | AI Blocker Detection (V2) | `POST /api/v1/blockers/analyze` endpoint; AI service integration; severity/confidence scoring; manager alerts via WebSocket; Blocker Dashboard at `/manager/blockers` |
| **Sprint 7** | Sprint Analytics (V2) | `GET /api/v1/analytics/sprint` endpoint; velocity calculation logic; Analytics Dashboard at `/manager/analytics` with trend charts |
| **Sprint 8** | Kudos System (V2) | `kudos` table schema; `POST /api/v1/kudos` endpoint; Socket.IO integration for notifications; Kudos Feed at `/kudos/feed`; Leaderboard at `/kudos/leaderboard`; point decay job |
| **Sprint 9** | Archive System (V2) | FTS5 index on standups table; `GET /api/v1/archive/search` endpoint; `GET /api/v1/archive/export` endpoint; Archive UI at `/archive` with filters |
| **Sprint 10** | QA, Edge Cases & Hardening | Full test coverage for all V2 features; concurrent submission safety; SMTP failure simulation; AI rate limiting verification; end-to-end demo for all modules |

---

# Success Criteria (V1 + V2)

| Category | Success Metric | Target |
|---|---|---|
| **Submission Completeness** | All 3 demo team members successfully submit standup via form or Slack | 3 × HTTP 201 returned; 3 records in DB per PRD §6 AC-1 |
| **Duplicate Prevention** | Second submission by same member on same day is blocked (both web and Slack) | HTTP 409 `DUPLICATE_SUBMISSION` returned; DB record count unchanged per PRD §6 AC-2 |
| **Manager Digest Accuracy** | Manager digest view shows all 3 submissions grouped correctly | All 3 cards rendered with name, timestamp, all fields; pending section empty per PRD §6 AC-3 |
| **Email Digest Delivery** | Automated digest email sent within 60 seconds of 10:00 AM trigger | Email received by manager address within ≤ 60 seconds of scheduled trigger per PRD §6 AC-4 |
| **Zero-Submission Email** | Digest sent even when no members have submitted | Email dispatched listing all members as pending per PRD §6 AC-5 |
| **Validation Enforcement** | Empty field submissions rejected with no DB record | HTTP 422 returned; form highlights empty fields; 0 partial records in DB per PRD §6 AC-6 |
| **SMTP Retry Resilience** | System retries up to 3 times on email failure; data preserved | 3 retry log entries written; all standup records intact after max retries per PRD §6 AC-7 |
| **Unknown Member Rejection** | Submissions from unconfigured members are blocked | HTTP 404 `MEMBER_NOT_FOUND` returned; 0 records stored per PRD §6 AC-8 |
| **API Response Latency** | Submission endpoint responds within threshold | `POST /api/v1/standups` p95 < 300 ms per PRD §6 KPIs |
| **Digest Load Time** | Manager digest API responds within threshold | `GET /api/v1/standups` p95 < 200 ms per PRD §6 KPIs |
| **Monthly Email Reliability** | Scheduled digests successfully delivered each month | ≥ 99% SMTP acceptance rate per PRD §6 KPIs |
| **Scheduler Reliability** | Cron job fires on schedule every weekday | Triggers within ±60 seconds of 10:00 AM on 100% of weekdays per PRD §6 KPIs |
| **V2: Slack Bot Success Rate** | Slack modal submissions stored correctly | 100% of valid Slack submissions return HTTP 200 and store data per PRD §8.3 |
| **V2: AI Detection Precision** | AI correctly identifies blockers | ≥ 90% precision on blocker detection; confidence threshold enforced per PRD §8.5 |
| **V2: Analytics Accuracy** | Sprint velocity reflects actual completion rate | Velocity score within ±5% of manual calculation per PRD §8.6 |
| **V2: Kudos Engagement** | Kudos system drives recognition | ≥ 70% of team members give/receive kudos within first month per PRD §8.8 |
| **V2: Archive Search Relevance** | Archive search returns relevant results | ≥ 85% relevance for search queries containing keywords from standup content per PRD §8.10 |
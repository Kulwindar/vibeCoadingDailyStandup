# KPI Document
# Daily Standup System

> **Version:** 1.0 | **Date:** 2026-06-10
> **Author:** Senior Product Manager
> **Source PRD:** `agents/standup_prd.md` v1.0
> **Audience:** Engineering, QA, UAT, Product, Stakeholders

> **Cross-Reference Key:**
> - `PRD §1` = Problem Statement
> - `PRD §2` = Solution Overview & Core Features
> - `PRD §3` = User Flows (A, B, C)
> - `PRD §4` = API Design
> - `PRD §5` = Edge Cases & Error Handling
> - `PRD §6` = KPIs & Acceptance Criteria

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
| KPI-EMAIL-09 | Manual Trigger | Admin can retroactively send digest via API | `POST /api/v1/digest/send` with `date` and `recipient_email` executes digest compile and send; returns HTTP 200 with dispatch summary per PRD §4 and PRD §5 |
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

# Development Timeline

| Sprint | Focus Area | Deliverables |
|---|---|---|
| **Sprint 1** | Foundation — DB Schema, Config, API Skeleton | SQLite schema (`standups` table, `digest_log` table); static team member config loader; Express app setup; `GET /api/v1/standups/members` endpoint; environment variable structure (`.env.example`) |
| **Sprint 2** | Core Submission — Form + API | `POST /api/v1/standups` with full validation (empty fields, duplicate check, unknown member, future date); `GET /api/v1/standups?date=` with pending/submitted breakdown; service-layer duplicate guard + DB unique constraint |
| **Sprint 3** | Manager View — Digest UI | `GET /api/v1/standups` full response with `submitted_count`, `pending_count`, member cards; Manager Digest HTML page (`/manager/digest`) — grouped cards, pending section, blocker amber highlight, date filter |
| **Sprint 4** | Email Digest — Scheduler + Manual Trigger | HTML email template with submitted entries + pending members section; `POST /api/v1/digest/send` manual trigger; node-cron job at 10:00 AM weekdays; Nodemailer SMTP integration; 3-retry logic with 5-minute intervals; digest log writes |
| **Sprint 5** | QA, Edge Cases & Hardening | `GET /api/v1/digest/status` endpoint; invalid date format handling; zero-submission digest; SMTP failure simulation and retry verification; concurrent submission safety test; end-to-end demo: 3 members submit → manager views digest → email dispatched |

---

# Success Criteria

| Category | Success Metric | Target |
|---|---|---|
| **Submission Completeness** | All 3 demo team members successfully submit standup via form | 3 × HTTP 201 returned; 3 records in DB per PRD §6 AC-1 |
| **Duplicate Prevention** | Second submission by same member on same day is blocked | HTTP 409 `DUPLICATE_SUBMISSION` returned; DB record count unchanged per PRD §6 AC-2 |
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

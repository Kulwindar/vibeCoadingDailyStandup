# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Daily Standup System

> **Version:** 2.0 | **Date:** 2026-06-10
> **Author:** Senior Product Manager
> **Status:** Draft — Pending Stakeholder Review
> **Audience:** Product, Engineering, QA, UAT, Stakeholders

---

## 1. Problem Statement

* **The Issue:** A remote team has no structured daily standup process — updates are scattered across chat messages, emails, and ad-hoc calls, making it impossible to track blockers, progress, or team availability in a consistent, searchable format.
* **Target User:** Remote **team members** who need a frictionless daily channel to share their progress and blockers, and **managers** who need a consolidated view of all team activity every morning without chasing individuals.
* **Impact:** Without a structured standup system, managers lose ~30–45 minutes daily chasing status updates, critical blockers go unnoticed until they escalate, and there is no historical record of team activity for retrospectives or performance reviews. A missed blocker for even one day can delay sprint delivery for the entire team.

---

## 2. Solution Overview

* **Value Prop:** A lightweight web-based Daily Standup System that gives every team member a simple 3-field form to submit their daily update, gives managers a real-time grouped digest of all submissions, and automatically delivers a formatted email summary at 10:00 AM every day — requiring zero manual coordination.

* **Core Features (V1):**
  * **Standup Submission Form:** A clean 3-field form where team members submit: (1) what they completed yesterday, (2) what they plan to work on today, and (3) any blockers they are facing. One submission per team member per day enforced.
  * **Team Member List:** A roster view showing which team members have submitted their standup for the current day and which are still pending — giving managers instant visibility into submission status.
  * **Manager Daily Digest View:** A centralized manager dashboard showing all submitted standups for the current day, grouped by team member, with timestamp, completion status, and blocker highlights.
  * **Automated Email Digest at 10:00 AM:** A scheduled job that compiles all standup submissions received by 10:00 AM each day and sends a formatted email digest to the manager, listing each team member's update or marking them as "No submission received" if absent.

* **V2 Features (Additive):**
  * **Slack /standup Bot:** Team members can submit standups via Slack modal (`/standup` slash command), with automatic email-to-member mapping and duplicate prevention.
  * **AI Blocker Detection:** Natural language processing analyzes blocker text for severity and confidence, triggers manager alerts for high-severity blockers, and displays flagged items on a dedicated dashboard.
  * **Sprint Velocity Analytics:** Automated calculation of sprint velocity from standup data, with trend visualization and historical reporting.
  * **Kudos System:** Lightweight peer recognition system with real-time notifications, feed display, leaderboard, and point decay mechanics.
  * **Searchable Archive:** Full-text search across all standup history with date/member filters and CSV/JSON export capabilities.

---

## 3. User Flow

### Flow A — Team Member Submits Daily Standup

1. **Trigger:** Team member opens the Daily Standup web app at the start of their workday.
2. **Action:** Team member navigates to the **Standup Submission Form** — the default landing page.
3. **Process:**
   - Team member selects their name from the pre-configured team member dropdown (no login required).
   - Team member fills in three fields:
     - **Yesterday:** "What did you complete yesterday?"
     - **Today:** "What are you planning to work on today?"
     - **Blockers:** "Any blockers or impediments?" (can be "None")
   - Team member clicks **Submit Standup**.
   - System validates all fields are non-empty.
   - System checks: has this team member already submitted today? If yes → shows error "You have already submitted your standup for today."
   - System saves the standup record with a server-side timestamp.
   - System responds with a success confirmation screen: "✅ Standup submitted! See you tomorrow."
4. **Outcome:** Team member's update is saved and immediately visible in the Manager Digest View.

### Flow B — Manager Reviews Today's Digest

1. **Trigger:** Manager opens the Daily Standup web app or clicks the link in the email digest.
2. **Action:** Manager navigates to the **Manager Digest View** (`/manager/digest`).
3. **Process:**
   - System loads all standup submissions for the current calendar day.
   - Submissions are displayed as grouped cards — one card per team member.
   - Each card shows: team member name, submission timestamp, Yesterday / Today / Blockers fields.
   - Team members who have NOT submitted are listed in a separate **"Pending"** section with status badge "Awaiting Submission".
   - Blockers field is highlighted in amber if the value is not "None" / not empty.
4. **Outcome:** Manager has a complete, real-time picture of all team member status for the day in under 10 seconds.

### Flow C — Automated Email Digest Dispatch at 10:00 AM

1. **Trigger:** Scheduled job fires at 10:00 AM server local time every weekday.
2. **Action:** System collects all standup submissions created since midnight of the current day.
3. **Process:**
   - For each configured team member: if a submission exists → include their Yesterday / Today / Blockers in the digest. If no submission → mark as "No submission received by 10:00 AM."
   - System composes the email digest with a formatted HTML template.
   - System dispatches the email to the configured manager email address via SMTP/email service.
   - System logs the dispatch event: timestamp, recipient, submission count, any send errors.
4. **Outcome:** Manager receives a clean, formatted email at 10:00 AM every morning with all team updates — no manual action required.

### Flow D — Slack Standup Submission (V2)

1. **Trigger:** Team member types `/standup` in Slack.
2. **Action:** Slack opens a modal with the standup form fields.
3. **Process:**
   - Modal displays Yesterday / Today / Blockers text inputs.
   - Team member fills fields and clicks Submit.
   - Slack sends view submission to backend.
   - System maps Slack user email to configured team member.
   - System validates fields (empty/rejection logic identical to web form).
   - System checks same-day duplicate (respects web form's duplicate prevention).
   - System saves entry with `source: "slack"` flag.
   - System sends ephemeral confirmation to Slack user.
4. **Outcome:** Standup saved with Slack source attribution; visible in Manager Digest and Email Digest.

### Flow E — AI Blocker Detection & Manager Alert (V2)

1. **Trigger:** Standup submission completed (via web or Slack).
2. **Action:** AI service analyzes the blockers text.
3. **Process:**
   - System extracts blocker text from submission.
   - AI service returns `severity: "HIGH"|"MEDIUM"|"LOW"|"NONE"` and `confidence: 0-1`.
   - If `confidence < 0.7`, result is auto-rejected.
   - If `severity: "HIGH"` and `confidence >= 0.9`, manager receives real-time alert via WebSocket.
   - All AI results stored in `blocker_predictions` table.
   - Blocker Dashboard (`/manager/blockers`) displays all flagged items with confidence scores.
4. **Outcome:** Managers proactively notified of high-severity blockers; dashboard provides overview for triage.

### Flow F — Sprint Velocity Analytics Review (V2)

1. **Trigger:** Manager navigates to `/manager/analytics`.
2. **Action:** Manager views velocity trend chart.
3. **Process:**
   - System calculates velocity score from archived standups.
   - Velocity = (completed items this sprint) / (total team members) / (working days).
   - Chart displays 30-day rolling trend.
   - Manager can filter by date range.
4. **Outcome:** Manager gains insight into team throughput and sprint performance trends.

### Flow G — Kudos Recognition & Leaderboard (V2)

1. **Trigger:** Team member wants to recognize a peer.
2. **Action:** Team member navigates to `/kudos/give` or uses Kudos feed.
3. **Process:**
   - Giver selects recipient from team member dropdown.
   - Giver enters recognition message (max 500 chars).
   - System validates both fields.
   - System stores kudos with timestamp.
   - Recipient receives real-time notification via WebSocket.
   - Kudos appear on `/kudos/feed` and `/kudos/leaderboard`.
   - Points decay after 30 days of inactivity.
4. **Outcome:** Peer recognition encouraged; leaderboard drives healthy competition.

### Flow H — Archive Search & Export (V2)

1. Trigger: Manager or team member needs historical standup data.
2. Action: Navigate to `/archive` and enter search query.
3. Process:
   - Search supports full-text query, date range, and member filters.
   - Results display as paginated standup cards.
   - Export button downloads CSV or JSON of results.
   - Archive index uses SQLite FTS5 for performance.
4. Outcome: Historical data easily accessible for retrospectives and reporting.

---

## 4. API Design

> **Base URL:** `/api/v1`
> **Content-Type:** `application/json`
> **Error Format:** `{ "status": "error", "code": "<ERROR_CODE>", "message": "<detail>" }`

---

### Standup Submissions (V1)

* `POST /api/v1/standups`
  * **Description:** Submit a daily standup entry for a team member.
  * **Payload:**
    ```json
    {
      "member_name": "Priya Sharma",
      "member_email": "priya@company.com",
      "yesterday": "Completed the login page UI and merged PR #42.",
      "today": "Working on the standup form component and API integration.",
      "blockers": "Waiting on design review for the manager digest layout."
    }
    ```
  * **Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "uuid",
        "member_name": "Priya Sharma",
        "member_email": "priya@company.com",
        "submitted_at": "2026-06-10T08:45:00Z",
        "date": "2026-06-10"
      }
    }
    ```
  * **Response (409 Conflict — duplicate submission):**
    ```json
    {
      "status": "error",
      "code": "DUPLICATE_SUBMISSION",
      "message": "Priya Sharma has already submitted a standup for today (2026-06-10)."
    }
    ```
  * **Response (422 Unprocessable — missing fields):**
    ```json
    {
      "status": "error",
      "code": "VALIDATION_ERROR",
      "message": "All fields (yesterday, today, blockers) are required and cannot be empty."
    }
    ```

---

* `GET /api/v1/standups?date=2026-06-10`
  * **Description:** Retrieve all standup submissions for a given date (defaults to today if no date param provided). Manager-facing endpoint.
  * **Query Params:** `date` (optional, ISO format `YYYY-MM-DD`, defaults to today's date)
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "date": "2026-06-10",
        "total_members": 3,
        "submitted_count": 2,
        "pending_count": 1,
        "submissions": [
          {
            "id": "uuid-1",
            "member_name": "Priya Sharma",
            "member_email": "priya@company.com",
            "yesterday": "Completed login page UI.",
            "today": "Working on standup form.",
            "blockers": "Waiting on design review.",
            "submitted_at": "2026-06-10T08:45:00Z"
          },
          {
            "id": "uuid-2",
            "member_name": "Arjun Mehta",
            "member_email": "arjun@company.com",
            "yesterday": "Fixed the database connection bug.",
            "today": "Writing unit tests for the API layer.",
            "blockers": "None",
            "submitted_at": "2026-06-10T09:10:00Z"
          }
        ],
        "pending": [
          {
            "member_name": "Sara Khan",
            "member_email": "sara@company.com",
            "status": "AWAITING_SUBMISSION"
          }
        ]
      }
    }
    ```

---

* `GET /api/v1/standups/members`
  * **Description:** Retrieve the list of all configured team members and their submission status for today.
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "date": "2026-06-10",
        "members": [
          { "name": "Priya Sharma", "email": "priya@company.com", "submitted": true, "submitted_at": "2026-06-10T08:45:00Z" },
          { "name": "Arjun Mehta", "email": "arjun@company.com", "submitted": true, "submitted_at": "2026-06-10T09:10:00Z" },
          { "name": "Sara Khan", "email": "sara@company.com", "submitted": false, "submitted_at": null }
        ]
      }
    }
    ```

---

### Email Digest (V1)

* `POST /api/v1/digest/send`
  * **Description:** Manually trigger the email digest dispatch (used by the scheduler at 10:00 AM; also available for admin/testing purposes).
  * **Payload:**
    ```json
    {
      "date": "2026-06-10",
      "recipient_email": "manager@company.com"
    }
    ```
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "date": "2026-06-10",
        "recipient": "manager@company.com",
        "submissions_included": 2,
        "pending_members": ["Sara Khan"],
        "sent_at": "2026-06-10T10:00:05Z"
      }
    }
    ```
  * **Response (500 — email delivery failure):**
    ```json
    {
      "status": "error",
      "code": "EMAIL_SEND_FAILED",
      "message": "Failed to dispatch email digest. SMTP error: connection timeout. Digest data preserved for retry."
    }
    ```

---

* `GET /api/v1/digest/status?date=2026-06-10`
  * **Description:** Check whether the email digest has been sent for a given date.
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "date": "2026-06-10",
        "digest_sent": true,
        "sent_at": "2026-06-10T10:00:05Z",
        "recipient": "manager@company.com",
        "submissions_included": 2
      }
    }
    ```

---

## V2 API Endpoints

### Slack Bot (M8)

* `POST /api/v1/slack/events`
  * **Description:** Receive Slack Events API callbacks for slash command and view submissions.
  * **Headers:** `X-Slack-Signature`, `X-Slack-Request-Timestamp` (validated against `SLACK_SIGNING_SECRET`).
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "standup_id": "uuid",
        "member_name": "Priya Sharma",
        "source": "slack"
      }
    }
    ```

---

### AI Blocker Detection (M9)

* `POST /api/v1/blockers/analyze`
  * **Description:** Analyze blocker text for severity and confidence.
  * **Payload:**
    ```json
    {
      "standup_id": "uuid-1",
      "blockers": "Waiting on design review for the manager digest layout."
    }
    ```
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "standup_id": "uuid-1",
        "severity": "MEDIUM",
        "confidence": 0.87,
        "analysis": "Blocker relates to design review dependency.",
        "flagged": true
      }
    }
    ```
  * **Response (200 OK — low confidence):**
    ```json
    {
      "status": "success",
      "data": {
        "standup_id": "uuid-1",
        "severity": "UNKNOWN",
        "confidence": 0.45,
        "analysis": null,
        "flagged": false
      }
    }
    ```

* `GET /api/v1/blockers?date=2026-06-10&severity=HIGH`
  * **Description:** Retrieve all flagged blockers for a given date and severity level.
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "date": "2026-06-10",
        "blockers": [
          {
            "standup_id": "uuid-1",
            "member_name": "Priya Sharma",
            "severity": "HIGH",
            "confidence": 0.92,
            "blockers": "Database migration blocked by missing permissions.",
            "analyzed_at": "2026-06-10T08:46:00Z"
          }
        ]
      }
    }
    ```

---

### Sprint Velocity Analytics (M10)

* `GET /api/v1/analytics/sprint?date=2026-06-10`
  * **Description:** Get sprint velocity analytics for the sprint containing the given date.
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "sprint_id": "sprint-2026-06-04",
        "start_date": "2026-06-04",
        "end_date": "2026-06-17",
        "velocity_score": 2.4,
        "completed_tasks": 12,
        "working_days": 10,
        "team_members": 3,
        "trend": [
          {"date": "2026-06-04", "velocity": 2.0},
          {"date": "2026-06-05", "velocity": 2.5}
        ]
      }
    }
    ```

---

### Kudos System (M11)

* `POST /api/v1/kudos`
  * **Description:** Submit kudos recognition for a team member.
  * **Payload:**
    ```json
    {
      "from_member": "priya@company.com",
      "to_member": "arjun@company.com",
      "message": "Thanks for fixing the database bug so quickly!"
    }
    ```
  * **Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "kudos-uuid-1",
        "from_member": "Priya Sharma",
        "to_member": "Arjun Mehta",
        "message": "Thanks for fixing the database bug so quickly!",
        "points": 10,
        "created_at": "2026-06-10T09:15:00Z"
      }
    }
    ```

* `GET /api/v1/kudos/leaderboard`
  * **Description:** Get kudos points leaderboard.
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "leaderboard": [
          {"name": "Arjun Mehta", "email": "arjun@company.com", "points": 45, "count": 4},
          {"name": "Priya Sharma", "email": "priya@company.com", "points": 35, "count": 3}
        ]
      }
    }
    ```

* `GET /api/v1/kudos/feed?limit=20`
  * **Description:** Get recent kudos feed.
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "kudos": [
          {
            "id": "kudos-uuid-1",
            "from_member": "Priya Sharma",
            "to_member": "Arjun Mehta",
            "message": "Thanks for fixing the database bug!",
            "points": 10,
            "created_at": "2026-06-10T09:15:00Z"
          }
        ],
        "total": 2
      }
    }
    ```

---

### Searchable Archive (M12)

* `GET /api/v1/archive/search?q=API&date_from=2026-06-01&date_to=2026-06-14&member_email=priya@company.com`
  * **Description:** Full-text search across standup archive.
  * **Query Params:** `q` (search query), `date_from`, `date_to`, `member_email` (all optional).
  * **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "query": "API",
        "results": [
          {
            "id": "uuid-1",
            "member_name": "Priya Sharma",
            "date": "2026-06-10",
            "yesterday": "Completed the API integration for the standup form.",
            "today": "Working on error handling.",
            "blockers": "None"
          }
        ],
        "total": 1,
        "page": 1,
        "total_pages": 1
      }
    }
    ```

* `GET /api/v1/archive/export?date_from=2026-06-01&date_to=2026-06-14&format=csv`
  * **Description:** Export archived standups as CSV or JSON.
  * **Response (200 OK):** CSV or JSON file download with all standup fields.

---

## 5. Edge Cases & Error Handling

* **Duplicate Submission (same member, same day):** Team member submits the form a second time on the same calendar day → System checks by `member_email + date` combination before saving → Returns HTTP 409 `DUPLICATE_SUBMISSION` with message identifying the member and date → Form displays inline error: "You have already submitted your standup for today." Existing submission is preserved unchanged.

* **Empty / Blank Field Submission:** Team member submits the form with one or more fields left blank or containing only whitespace → Server-side validation trims all fields and checks for non-empty content → Returns HTTP 422 `VALIDATION_ERROR` → Form highlights the empty field(s) in red with the message "This field is required."

* **Email Digest SMTP Failure:** Scheduled job fires at 10:00 AM but SMTP server is unavailable or returns an error → System logs the failure event with timestamp and error reason → Digest data (all submissions) is retained in DB → System retries delivery after 5 minutes (up to 3 attempts total) → After 3 failed attempts, system logs a `DIGEST_SEND_FAILED` event; no further automatic retries.

* **No Submissions by 10:00 AM:** Scheduled job fires but zero team members have submitted by 10:00 AM → Email digest is still sent to the manager → Email body states: "No standups were submitted by 10:00 AM today. Members pending: [list of all configured members]." → Digest dispatch is logged as successful (0 submissions included).

* **Partial Team Submission (some members missing):** Some team members have submitted and some have not by 10:00 AM → Email digest includes all received submissions in full → Pending members listed at the bottom of the email as "No submission received by 10:00 AM." → Manager Digest View shows real-time pending status separately.

* **Invalid Date Parameter on GET /standups:** Manager queries digest for a date in an invalid format (e.g., `date=10-06-2026`) → System returns HTTP 400 `INVALID_DATE_FORMAT` with message: "Date must be in YYYY-MM-DD format (e.g., 2026-06-10)."

* **Unrecognised Team Member Name/Email:** Team member submits with a name/email combination not in the pre-configured member list → System returns HTTP 404 `MEMBER_NOT_FOUND` with message: "No team member found with this name and email. Please contact your manager." → Submission is rejected; no record stored.

* **Future Date Submission:** Team member submits a standup for a future date (attempted via API directly) → System validates that `date` on server matches today's date only → Returns HTTP 422 `VALIDATION_ERROR`: "Standup submissions are only accepted for today's date."

* **Scheduler Missed Fire (server downtime at 10:00 AM):** Server was down at exactly 10:00 AM → Missed digest log is recorded on server restart → Admin can manually trigger `POST /api/v1/digest/send` with the missed date to dispatch the digest retroactively.

---

## 6. KPIs & Acceptance Criteria

### Key Performance Indicators (KPIs)

* **Standup Submission Rate:** ≥ 90% of configured team members submit their standup before 10:00 AM on any given weekday.
* **Form Submission Latency:** `POST /api/v1/standups` responds in < 300 ms (p95) under normal load.
* **Email Digest Delivery Time:** Email digest dispatched within ≤ 60 seconds of the 10:00 AM scheduled trigger.
* **Email Delivery Success Rate:** ≥ 99% of scheduled digest emails successfully delivered (SMTP accepted) per month.
* **Duplicate Submission Block Rate:** 100% of duplicate same-day submissions for the same member are rejected with HTTP 409 before storage.
* **Manager Digest Load Time:** `GET /api/v1/standups` responds in < 200 ms (p95) for up to 50 team members.
* **Zero Data Loss:** 100% of successfully submitted standups are present in the manager digest view and the email digest for the same day.
* **Scheduler Reliability:** Scheduled digest job fires within ±60 seconds of 10:00 AM on 100% of scheduled weekdays.
* **V2: Slack Bot Success Rate:** 100% of valid Slack submissions return HTTP 200 and store data.
* **V2: AI Detection Precision:** ≥ 90% precision on blocker detection; confidence threshold enforced.
* **V2: Analytics Accuracy:** Velocity score within ±5% of manual calculation.
* **V2: Kudos Engagement:** ≥ 70% of team members give/receive kudos within first month.
* **V2: Archive Search Relevance:** ≥ 85% relevance for search queries.

### Acceptance Criteria

* [ ] GIVEN 3 configured team members exist, WHEN each submits the standup form with valid `yesterday`, `today`, and `blockers` values, THEN all 3 submissions return HTTP 201 and are stored with a server-side `submitted_at` timestamp.

* [ ] GIVEN a team member has already submitted their standup today, WHEN they attempt to submit again, THEN the system returns HTTP 409 `DUPLICATE_SUBMISSION` and no duplicate record is created in the database.

* [ ] GIVEN at least 1 standup submission exists for today, WHEN the manager navigates to the Manager Digest View (`/manager/digest`), THEN all submitted standups are displayed as grouped cards with member name, timestamp, and all three fields visible, and all non-submitted members are listed in a "Pending" section.

* [ ] GIVEN all 3 team members have submitted their standups before 10:00 AM, WHEN the 10:00 AM scheduled job fires, THEN a formatted email digest is sent to the configured manager email address containing all 3 team members' entries within ≤ 60 seconds of the scheduled trigger time.

* [ ] GIVEN zero team members have submitted by 10:00 AM, WHEN the scheduled email job fires, THEN the email digest is still sent and clearly states that no submissions were received, listing all configured members as pending.

* [ ] GIVEN the standup form is submitted with one or more empty fields, WHEN the user clicks Submit, THEN the system returns HTTP 422 `VALIDATION_ERROR` and the form highlights the empty field(s) — no partial record is stored.

* [ ] GIVEN the SMTP server is unavailable when the digest job fires, WHEN the send attempt fails, THEN the system retries up to 3 times at 5-minute intervals and logs each attempt; the standup data is not lost regardless of send outcome.

* [ ] GIVEN a team member submits with a name/email not in the pre-configured team member list, WHEN they submit the form, THEN the system returns HTTP 404 `MEMBER_NOT_FOUND` and rejects the submission without storing any data.

---

## 7. Limitations & Risks

* **Technical:**
  * No authentication system in v1.0 — team member identity is based on name/email selection from a pre-configured dropdown; API endpoints are not access-controlled and could be called directly with any payload.
  * Email delivery depends on a third-party SMTP provider (e.g., SendGrid, Mailgun, NodeMailer + SMTP relay); provider outages will affect digest delivery regardless of retry logic.
  * Scheduler relies on server uptime — if the application server is down at exactly 10:00 AM, the job will be missed and requires manual retroactive trigger via `POST /api/v1/digest/send`.
  * No real-time push updates to the Manager Digest View — manager must manually refresh the page to see new submissions; no WebSocket or polling in v1.0.
  * Team member list is statically configured (environment variable or config file) — no in-app UI to add/remove members in v1.0.

* **Business / Operational:**
  * System is designed for a single team with a single manager — no multi-team, multi-manager, or org hierarchy support in v1.0; scaling to multiple teams requires a v2.0 redesign.
  * 10:00 AM scheduler fires based on server timezone — if the team is distributed across multiple timezones, a single fixed send time may be too early or too late for some members; no per-timezone scheduling in v1.0.
  * No audit history or edit capability — once a standup is submitted, it cannot be corrected by the team member; any change requires manual DB intervention by an admin.
  * No reminder or escalation system to prompt team members who have not submitted before 10:00 AM — manager must manually follow up with pending members.
  * Standup data is stored indefinitely with no archival or data retention policy defined in v1.0 — this may become a storage concern over long periods and should be addressed before production deployment.

---

## 8. V2 Feature Requirements

### V2-Feature M8 — Slack /standup Bot

* **Slack App Configuration:** Requires `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, and `SLACK_APP_TOKEN` in `.env`.
* **Slash Command:** `/standup` triggers a modal with three fields: Yesterday, Today, Blockers.
* **Modal Submission:** Slack sends view submission payload to `POST /api/v1/slack/events`.
* **Email Mapping:** Slack user's email (via `users.info` API) mapped to configured team member.
* **Duplicate Prevention:** Same-day duplicate check applied to Slack submissions.
* **Ephemeral Responses:** Submit success/failure communicated via ephemeral Slack message.

### V2-Feature M9 — AI Blocker Detection

* **Service Integration:** Connects to OpenAI GPT-4 or Anthropic Claude via `AI_API_KEY`.
* **Severity Levels:** `HIGH` (confidence ≥ 0.9), `MEDIUM` (0.8-0.89), `LOW` (0.7-0.79), `NONE` (< 0.7 auto-rejected).
* **Manager Alerts:** High-severity blockers trigger real-time WebSocket notification.
* **Blocker Dashboard:** `/manager/blockers` displays all flagged blockers with severity color-coding.
* **Confidence Threshold:** Predictions with `confidence < 0.7` are rejected; 0.7-0.89 require review flag.

### V2-Feature M10 — Sprint Velocity Analytics

* **Velocity Calculation:** `velocity = completed_tasks / working_days / team_members`.
* **Sprint Boundaries:** Two-week sprints by default (configurable via `SPRINT_LENGTH_DAYS`).
* **Trend Chart:** 30-day rolling velocity trend with interactive date filters.
* **Analytics Endpoint:** `GET /api/v1/analytics/sprint?date=YYYY-MM-DD` returns sprint metrics.
* **Cache TTL:** Analytics cached for 5 minutes to reduce computation overhead.

### V2-Feature M11 — Kudos System

* **Kudos Points:** 10 points per kudos; decay 50% after 30 days of inactivity.
* **Real-time Notifications:** Socket.IO emits `kudos_received` event to recipient.
* **Leaderboard:** `/kudos/leaderboard` ranks members by total points.
* **Feed:** `/kudos/feed` displays recent kudos activity.
* **Rate Limiting:** Max 5 kudos per giver per day to prevent spam.

### V2-Feature M12 — Searchable Archive

* **Full-Text Search:** SQLite FTS5 index on `yesterday`, `today`, `blockers` fields.
* **Filters:** Date range (`date_from`, `date_to`), member email (`member_email`).
* **Export Formats:** CSV and JSON export via `format` query parameter.
* **Archive UI:** `/archive` page with search bar, filter controls, and results display.
* **Default Range:** 90-day maximum range to prevent performance issues.
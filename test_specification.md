# Test Specification - Daily Standup System

This document outlines the test cases and verification criteria for the Daily Standup System, cross-referenced against the Product Requirements Document (`standup_prd.md`) and KPI Matrix (`standup_kpi.md`).

---

## 1. Registry & Database Initialization (`FEAT-001`)

### TS-REG-01: Database Schema Creation
* **Feature Covered**: `FEAT-001` (Database Initialization)
* **Type**: Integration
* **Preconditions**: SQLite database file `database.sqlite` does not exist.
* **Steps**:
  1. Boot the application server.
  2. Verify file creation on the filesystem.
  3. Query database tables list.
* **Expected Result**: 
  - `database.sqlite` is generated at the project root.
  - Tables `standups` and `digest_logs` are created with correct columns, types, and constraints.

### TS-REG-02: Team Member List Fetching
* **Feature Covered**: `FEAT-001` (Registry Retrieval API)
* **Type**: Integration / API
* **Preconditions**: Server is running, database is empty.
* **Steps**:
  1. Perform a `GET` request to `/api/v1/standups/members`.
* **Expected Result**:
  - HTTP Status: `200 OK`.
  - JSON payload status is `200`, message is `"success"`.
  - Response array contains exactly the 3 pre-configured team members:
    - Priya Sharma (`priya@company.com`)
    - Arjun Mehta (`arjun@company.com`)
    - Sara Khan (`sara@company.com`)
  - All members have `submitted: false` and `submitted_at: null`.

### TS-REG-03: Roster Dropdown Loading
* **Feature Covered**: `FEAT-001` (Roster Selector)
* **Type**: UI / E2E
* **Preconditions**: Frontend and backend servers are running.
* **Steps**:
  1. Open the Daily Standup form landing page.
  2. Click on the "Select Your Name" dropdown.
* **Expected Result**:
  - Dropdown options match the active team member list.
  - No empty or unconfigured entries appear.
  - Dropdown renders correctly without blocking UI threads.

---

## 2. Standup Submission (`FEAT-002`)

### TS-SUB-01: Successful Submission Flow
* **Feature Covered**: `FEAT-002` (Standup Submission)
* **Type**: Integration / E2E
* **Preconditions**: Member has not submitted today.
* **Steps**:
  1. Send `POST /api/v1/standups` with payload:
     ```json
     {
       "member_name": "Priya Sharma",
       "member_email": "priya@company.com",
       "yesterday": "Implemented login page UI.",
       "today": "Working on standup form.",
       "blockers": "None"
     }
     ```
* **Expected Result**:
  - HTTP Status: `201 Created`.
  - Database stores a new row in `standups` table with generated UUID and UTC timestamp.
  - Frontend renders the confirmation screen: `"✅ Standup submitted! See you tomorrow."`.

### TS-SUB-02: Duplicate Submission Rejection
* **Feature Covered**: `FEAT-002` (Duplicate Check)
* **Type**: Integration / API
* **Preconditions**: Member has already submitted today.
* **Steps**:
  1. Send identical payload as `TS-SUB-01` for the second time on the same calendar day.
* **Expected Result**:
  - HTTP Status: `409 Conflict`.
  - JSON response body returns error code `"DUPLICATE_SUBMISSION"`.
  - Database rejects transaction; no duplicate record is created.
  - Frontend form displays: `"You have already submitted your standup for today."`.

### TS-SUB-03: Empty Field Validation
* **Feature Covered**: `FEAT-002` (Blank Field Validation)
* **Type**: Unit / UI
* **Steps**:
  1. Leave any of the fields (`yesterday`, `today`, `blockers`) blank or containing only whitespace.
  2. Click "Submit Daily Standup".
* **Expected Result**:
  - HTTP Status: `422 Unprocessable Entity`.
  - JSON response body returns error code `"VALIDATION_ERROR"`.
  - Form validation blocks submission; fields are highlighted in red with `"This field is required."` helper text.

### TS-SUB-04: Unconfigured Email Rejection
* **Feature Covered**: `FEAT-002` (Registry Protection)
* **Type**: Integration / API
* **Steps**:
  1. Send `POST /api/v1/standups` with unregistered email `fakeuser@company.com`.
* **Expected Result**:
  - HTTP Status: `404 Not Found`.
  - JSON response returns error code `"MEMBER_NOT_FOUND"`.
  - Submission rejected; database remains unchanged.

### TS-SUB-05: Direct Future-Date Block
* **Feature Covered**: `FEAT-002` (Date Boundaries)
* **Type**: Integration / API
* **Steps**:
  1. Send `POST /api/v1/standups` with a future date parameter (if bypassed via API client).
* **Expected Result**:
  - HTTP Status: `422 Unprocessable Entity` or system ignores client-provided dates, enforcing server-side `submitted_at` UTC timestamps.

---

## 3. Manager Digest Dashboard (`FEAT-003`)

### TS-MGR-01: Digest Submissions Grouping
* **Feature Covered**: `FEAT-003` (Manager Dashboard UI)
* **Type**: UI / E2E
* **Preconditions**: Two members have submitted, one member is pending.
* **Steps**:
  1. Open Dashboard route `/manager/digest` (or click tab).
* **Expected Result**:
  - Dashboard shows 2 active grouped cards inside the submissions section.
  - Renders correct name, timestamp, and answers for each member.
  - Widget header indicates: `Total: 3`, `Submitted: 2`, `Pending: 1`.

### TS-MGR-02: Blocker Amber Highlight
* **Feature Covered**: `FEAT-003` (Blocker Highlight)
* **Type**: UI / Visual
* **Preconditions**: Member A submitted blockers as `"None"`. Member B submitted blockers as `"Waiting on design review"`.
* **Steps**:
  1. Observe card lists on the Manager Dashboard.
* **Expected Result**:
  - Member A's blocker section has a clean, plain border/background.
  - Member B's blocker section is visually highlighted in **amber** (using CSS classes/styles).

### TS-MGR-03: Pending Roster Section
* **Feature Covered**: `FEAT-003` (Pending Roster)
* **Type**: UI
* **Preconditions**: Sara Khan has not submitted today.
* **Steps**:
  1. View the "Pending" section at the bottom/sidebar of the dashboard.
* **Expected Result**:
  - Sara Khan's name and email are displayed under `"Awaiting Submission"`.
  - Status badge states `"Awaiting Submission"`.

### TS-MGR-04: Date Filter Query
* **Feature Covered**: `FEAT-003` (Date Filter)
* **Type**: Integration / UI
* **Steps**:
  1. Input `2026-06-10` into the date picker.
  2. Verify network request triggers `GET /api/v1/standups?date=2026-06-10`.
* **Expected Result**:
  - HTTP Status: `200 OK`.
  - UI updates to display historical cards and pending status for June 10, 2026.

### TS-MGR-05: Invalid Date Query Format
* **Feature Covered**: `FEAT-003` (Date Validation)
* **Type**: Integration / API
* **Steps**:
  1. Perform a manual request to `/api/v1/standups?date=10-06-2026` (invalid format).
* **Expected Result**:
  - HTTP Status: `400 Bad Request`.
  - JSON response returns error code `"INVALID_DATE_FORMAT"` and helpful format validation error text.

### TS-MGR-06: Zero Submissions Empty State
* **Feature Covered**: `FEAT-003` (Empty State)
* **Type**: UI
* **Preconditions**: No submissions recorded for the selected date.
* **Steps**:
  1. Select a date with zero records.
* **Expected Result**:
  - UI displays empty state illustration or text: `"No submissions yet for today."`
  - Pending section lists all 3 pre-configured team members.

---

## 4. Automated Email Digest & Scheduler (`FEAT-004`)

### TS-EMAIL-01: Cron Trigger Scheduling
* **Feature Covered**: `FEAT-004` (Cron Scheduler)
* **Type**: Integration
* **Preconditions**: Cron scheduler is registered.
* **Steps**:
  1. Configure target schedule to trigger locally.
  2. Observe scheduler trigger log output.
* **Expected Result**:
  - Scheduler fires within ±60 seconds of the configured time (10:00 AM weekdays).
  - Triggers email dispatch logic automatically.

### TS-EMAIL-02: SMTP Fail Fallback (Ethereal)
* **Feature Covered**: `FEAT-004` (Nodemailer Transporter)
* **Type**: Integration / Unit
* **Preconditions**: `.env` file does not define SMTP credentials.
* **Steps**:
  1. Trigger email digest dispatch.
* **Expected Result**:
  - Application generates Ethereal test account via `nodemailer.createTestAccount()`.
  - Transporter resolves successfully; mail sends via mock sandbox without crash.

### TS-EMAIL-03: SMTP Failure Retry Logic
* **Feature Covered**: `FEAT-004` (Retry Mechanism)
* **Type**: Integration / Unit
* **Preconditions**: SMTP server is configured but unreachable.
* **Steps**:
  1. Trigger email digest.
* **Expected Result**:
  - Initial send fails.
  - Fail outcome logged to database table `digest_logs` with attempt number `1`.
  - Timeout event schedules retry in 5 minutes.
  - System retries up to 3 times before logging final failure outcome `FAILED`.

### TS-EMAIL-04: Manual Dispatch Endpoint
* **Feature Covered**: `FEAT-004` (Manual Trigger)
* **Type**: Integration / API
* **Steps**:
  1. Send `POST /api/v1/digest/send` with payload:
     ```json
     {
       "date": "2026-06-11",
       "recipient_email": "manager@company.com"
     }
     ```
* **Expected Result**:
  - HTTP Status: `200 OK`.
  - System compiles entries, dispatches email to designated address, and returns summary payload containing count, date, and `sent_at` timestamp.

### TS-EMAIL-05: Status Retrieval Endpoint
* **Feature Covered**: `FEAT-004` (Digest Status Query)
* **Type**: Integration / API
* **Preconditions**: Email digest was successfully sent for date `2026-06-11`.
* **Steps**:
  1. Query `GET /api/v1/digest/status?date=2026-06-11`.
* **Expected Result**:
  - HTTP Status: `200 OK`.
  - Response JSON returns: `{ digest_sent: true, sent_at: "...", recipient: "manager@company.com", submissions_included: 2 }`.

---

## 5. Security & API Enforcement (General)

### TS-SEC-01: Content-Type Enforcement
* **Feature Covered**: API Layer
* **Type**: Integration / API
* **Steps**:
  1. Send `POST /api/v1/standups` without `Content-Type: application/json` header.
* **Expected Result**:
  - HTTP Status: `415 Unsupported Media Type` or `400 Bad Request` depending on parser configuration.

### TS-SEC-02: Database Query Injection Block
* **Feature Covered**: API Layer
* **Type**: Integration / Security
* **Steps**:
  1. Send queries containing SQL injection payloads (e.g., `/api/v1/standups?date=2026-06-11'; DROP TABLE standups;--`).
* **Expected Result**:
  - System safely escapes parameters. No database tables are dropped, and query returns `400 Bad Request` due to invalid date format validation.

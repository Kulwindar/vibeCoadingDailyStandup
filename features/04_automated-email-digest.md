# Feature: Automated Email Digest & Scheduler

## Feature ID
`FEAT-004`

## Purpose
Ensure daily standup submissions are compiled and sent directly to the manager's inbox at a scheduled time (10:00 AM every weekday) with robust error handling, automated retries on SMTP failures, logging, and a manual API trigger.

## User Stories
* **As a manager**, I want to receive a clean, structured email digest containing all team updates at 10:00 AM every weekday so that I don't have to log into the web app to gather updates.
* **As a manager**, I want the email to list team members who did not submit their update so that I know who was absent or needs checking.
* **As an administrator/manager**, I want to manually trigger the digest email via an API endpoint so that I can retroactively dispatch the email if the scheduler was down.
* **As a developer**, I want SMTP failures to trigger retries and write persistent logs so that email delivery is reliable and issues can be diagnosed.

## Functional Requirements
1. **Cron Scheduler**:
   - Run a scheduled job using `node-cron` configured to fire at `10:00 AM` on weekdays (Monday through Friday, `0 10 * * 1-5`) server local time.
2. **Email Compilation**:
   - Query all submissions made on the current calendar day.
   - Match submissions against the configured member roster.
   - Compile an HTML email with a responsive template:
     - Group submissions by team member.
     - Include Yesterday, Today, and Blockers (highlight blocker in amber if not "None").
     - Add a dedicated section at the bottom listing members with "No submission received by 10:00 AM."
3. **Nodemailer SMTP Transporter**:
   - Establish SMTP connections using environmental variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
   - If SMTP variables are missing, automatically fall back to creating an Ethereal Email test account to prevent application crashes.
4. **Retry Mechanism & Logging**:
   - On mail delivery failure, write a failure log in the database `digest_logs` and reschedule a retry attempt after 5 minutes.
   - Support a maximum of 3 send attempts.
   - If all 3 attempts fail, log the final `DIGEST_SEND_FAILED` outcome and cease automatic retries.
   - For all successful or failed attempts, log: unique ID, date, attempt number, outcome (`SUCCESS` or `FAILED`), error message, and execution timestamp.
5. **Manual Trigger & Status APIs**:
   - Provide `POST /api/v1/digest/send` to allow manual compilation and sending.
   - Provide `GET /api/v1/digest/status` to check whether the digest has been successfully sent for a given date.

## Validation Rules
* **API Payload Validation**:
  - `POST /api/v1/digest/send` requires a valid `date` (format `YYYY-MM-DD`) and `recipient_email` (valid email format).
  - `GET /api/v1/digest/status` requires `date` as a query parameter in `YYYY-MM-DD` format.

## Edge Cases
* **SMTP Server Down**: The system schedules a retry in 5 minutes. If it fails 3 times, it stops retrying and saves a log detailing the SMTP connection timeout/error.
* **Zero Submissions at 10:00 AM**: Send the email digest anyway, stating: "No standups were submitted by 10:00 AM today." List all configured team members in the pending section.
* **Partial Submissions**: Include the updates of members who completed submissions, and list the remaining members in the "Awaiting Submission" footer.
* **Scheduler Missed Fire**: If the server is offline at 10:00 AM, the cron job does not run. The manager can manually hit the `POST /api/v1/digest/send` endpoint to trigger it retroactively.

## Dependencies
* `FEAT-001` (Team Member Registry and Database Schema).
* `FEAT-002` (Standup Submission Form and API).
* `FEAT-003` (Manager Digest API).
* `node-cron`, `nodemailer` dependencies.

## API Requirements
### `POST /api/v1/digest/send`
* **Description**: Manually compile and send the daily digest.
* **Payload**:
  ```json
  {
    "date": "2026-06-10",
    "recipient_email": "manager@company.com"
  }
  ```
* **Response (200 OK)**:
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
* **Response (500 Internal Server Error — SMTP failure)**:
  ```json
  {
    "status": "error",
    "code": "EMAIL_SEND_FAILED",
    "message": "Failed to dispatch email digest. SMTP error: connection timeout. Digest data preserved for retry."
  }
  ```

---

### `GET /api/v1/digest/status`
* **Description**: Check whether the digest has been successfully sent for a given date.
* **Query Params**: `date` (required, `YYYY-MM-DD` format)
* **Response (200 OK)**:
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

## Database Impact
* **Table Reads**: Reads from `standups` to gather today's updates.
* **Table Writes**: Inserts a log entry into `digest_logs` for each send attempt.

## UI Components
* Optional admin dashboard controls to view log records and trigger retroactive sends (API-only in v1.0).

## Security Requirements
* **Secure Environment Variables**: `SMTP_PASS` and other secrets must be kept out of code repositories and configured via `.env` files.
* **Validation**: Input emails and dates are validated on backend routes.

## Acceptance Criteria
* **AC-1**: GIVEN all 3 configured team members submit their standups before 10:00 AM, WHEN the clock reaches 10:00 AM on a weekday, THEN the cron job triggers, compiles the HTML email, and dispatches the digest to the manager's email address within 60 seconds.
* **AC-2**: GIVEN a weekday at 10:00 AM where zero submissions have been received, WHEN the scheduler triggers, THEN the digest email is sent listing all team members as pending.
* **AC-3**: GIVEN the SMTP server is down when the digest triggers, WHEN the email fails to send, THEN the system schedules a retry attempt in 5 minutes, increments the `attempt_number` in `digest_logs`, and records the failed outcome.
* **AC-4**: GIVEN the server was down at 10:00 AM, WHEN the server restarts, THEN an administrator can send a POST request to `/api/v1/digest/send` to retroactively dispatch the email, returning HTTP 200 on success.

## Definition of Done
* Cron scheduler initialized and tested using mock/virtual time or reduced scheduling intervals.
* Nodemailer configured with secure variables and tested using Ethereal Email accounts.
* Retry mechanism schedules next attempts on failure and terminates after 3 attempts.
* Attempt logging verified in the SQLite database `digest_logs` table.
* Manual send and status endpoints implemented and verified through unit tests.

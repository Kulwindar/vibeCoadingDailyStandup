# Feature: Standup Submission

## Feature ID
`FEAT-002`

## Purpose
Provide a frictionless, validation-secured interface and API endpoint for team members to submit their daily standup updates, outlining yesterday's accomplishments, today's goals, and any current blockers.

## User Stories
* **As a team member**, I want to fill out a clean, 3-field form and submit my daily standup update so that my manager is kept informed about my progress.
* **As a system**, I want to validate that all submitted fields are filled out and that I haven't already submitted today, so that my updates are meaningful and duplicates are blocked.
* **As a team member**, I want to see a clear confirmation screen after a successful submission so that I know my updates were saved.

## Functional Requirements
1. **Frontend Submission Form**:
   - Provide a dark-mode glassmorphic page displaying a dropdown to select the member name.
   - Display three text area fields for:
     - **Yesterday**: "What did you complete yesterday?"
     - **Today**: "What are you planning to work on today?"
     - **Blockers**: "Any blockers or impediments?"
   - Support a default text value of `"None"` for the Blockers field.
2. **Server-Side Validation**:
   - Validate that the submitted email belongs to a pre-configured member in the registry.
   - Trim all text inputs and verify that no fields are left empty or containing only whitespace.
   - Enforce a strict one-submission-per-member-per-day rule.
   - Restrict submissions to the current calendar date (the system should reject future or past dates sent via the API directly).
3. **Data Recording**:
   - Generate a UUID for the submission.
   - Timestamp the submission with the server-side UTC time.
   - Save the record in the SQLite `standups` table.

## Validation Rules
* **Required Fields**: `member_name`, `member_email`, `yesterday`, `today`, and `blockers` must be present.
* **Field Checks**: 
  - `yesterday`, `today`, and `blockers` must contain at least 1 non-whitespace character after trimming.
  - `member_email` must match an active email in `src/config/members.json`.
* **Date Check**: Submissions must be for today's calendar date (`YYYY-MM-DD` on server).

## Edge Cases
* **Duplicate Submission (Same Day)**: If a member attempts to submit again on the same day, block the write, return HTTP 409 `DUPLICATE_SUBMISSION`, and show the form error: "You have already submitted your standup for today."
* **Whitespace-only Submission**: If a member enters only spaces in a text field, reject the submission, return HTTP 422 `VALIDATION_ERROR`, and highlight the empty field in red with "This field is required."
* **Unregistered Member Submitting**: If someone POSTs to `/api/v1/standups` with a non-existent email address, return HTTP 404 `MEMBER_NOT_FOUND`.
* **Direct Future-Date API Call**: If a client attempts to bypass the UI to submit a future date, reject with HTTP 422 `VALIDATION_ERROR`.
* **Concurreny/Double-Submit Click**: Under high concurrency or multiple rapid button clicks, database-level unique constraint on `(member_email, date)` must catch and reject duplicates.

## Dependencies
* `FEAT-001` (Team Member Registry and Database Schema).
* Yup + Formik (for frontend form handling and validation).
* Yup (for backend endpoint payload validation).

## API Requirements
### `POST /api/v1/standups`
* **Description**: Submit a daily standup entry for a team member.
* **Payload**:
  ```json
  {
    "member_name": "Priya Sharma",
    "member_email": "priya@company.com",
    "yesterday": "Completed the login page UI.",
    "today": "Working on the standup form component.",
    "blockers": "None"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "c1f76da7-b86a-4d7a-8fbb-574d6c4d7bb1",
      "member_name": "Priya Sharma",
      "member_email": "priya@company.com",
      "submitted_at": "2026-06-10T08:45:00Z",
      "date": "2026-06-10"
    }
  }
  ```
* **Response (409 Conflict — duplicate submission)**:
  ```json
  {
    "status": "error",
    "code": "DUPLICATE_SUBMISSION",
    "message": "Priya Sharma has already submitted a standup for today (2026-06-10)."
  }
  ```
* **Response (422 Unprocessable Entity — validation error)**:
  ```json
  {
    "status": "error",
    "code": "VALIDATION_ERROR",
    "message": "All fields (yesterday, today, blockers) are required and cannot be empty."
  }
  ```
* **Response (404 Not Found — unrecognized member)**:
  ```json
  {
    "status": "error",
    "code": "MEMBER_NOT_FOUND",
    "message": "No team member found with this name and email. Please contact your manager."
  }
  ```

## Database Impact
* **Table Writes**: Inserts a new row into the `standups` table with fields `id`, `member_name`, `member_email`, `yesterday`, `today`, `blockers`, `submitted_at`, `date`. Enforces unique constraint index on `(member_email, date)`.

## UI Components
* **Roster Selection Dropdown**: Form field populated from the registered member list.
* **Text Input Areas**: Interactive areas for yesterday's work, today's goals, and blocker status.
* **Error Banner & Inline Alerts**: Displays field validation states and system errors in red.
* **Confirmation Banner**: success message screen displayed on HTTP 201 response.

## Security Requirements
* **Input Sanitization**: Strip HTML tags from all input fields to prevent XSS.
* **Roster Binding**: Only allow submissions where name/email match values in the database/JSON registry.

## Acceptance Criteria
* **AC-1**: GIVEN a team member selects their name from the dropdown, WHEN they submit the form with valid data, THEN the form submits, returns HTTP 201, and shows the success screen: "✅ Standup submitted! See you tomorrow."
* **AC-2**: GIVEN a team member has already submitted their standup for today, WHEN they click Submit again, THEN the server rejects it with HTTP 409 `DUPLICATE_SUBMISSION` and the form displays: "You have already submitted your standup for today."
* **AC-3**: GIVEN any required form field is empty or contains only whitespace, WHEN the user attempts to submit, THEN the form rejects the submission with HTTP 422, highlights the problematic field(s) in red, and prints: "This field is required."

## Definition of Done
* Backend validation tests for required fields, duplicate records, unregistered members, and future-date records are passing.
* Database unique index constraint verified.
* Frontend form validation (Yup) matches backend rules.
* Successful submission verified end-to-end (Form -> API -> SQLite).

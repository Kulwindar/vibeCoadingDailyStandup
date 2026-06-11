# Feature: Team Member Registry & Database Initialization

## Feature ID
`FEAT-001`

## Purpose
Set up the persistence layer and manage the roster of pre-configured team members who are authorized to submit daily standups. This provides a baseline roster from which the UI dropdown is populated and ensures that only registered members can make submissions.

## User Stories
* **As a system**, I want to initialize the database tables on startup so that submissions and digest logs can be safely persisted.
* **As a team member**, I want to select my name from a pre-configured roster on the form so that I do not need to manually enter my name/email and risk typos.
* **As a manager**, I want to view a list of all configured team members and their today's submission status so that I can see who is active and who is missing.

## Functional Requirements
1. **Database Initialization**: 
   - On server startup, automatically initialize a local SQLite database file named `database.sqlite` (using `better-sqlite3`).
   - Create the `standups` and `digest_logs` tables if they do not already exist.
2. **Registry Configuration**:
   - Read a static JSON file located at `src/config/members.json` containing the pre-configured team members on server boot.
   - Pre-configured members:
     - Priya Sharma (`priya@company.com`)
     - Arjun Mehta (`arjun@company.com`)
     - Sara Khan (`sara@company.com`)
3. **Registry Retrieval API**:
   - Expose a REST endpoint to fetch all team members along with their submission status for the current day.
   - If a member has submitted, include their `submitted_at` timestamp and set `submitted: true`.
   - If a member has not submitted, set `submitted: false` and `submitted_at: null`.

## Validation Rules
* **Roster Schema**: `src/config/members.json` must be a valid JSON array of objects, where each object contains a non-empty `name` (string) and a valid `email` (string).
* **Roster Modification**: Roster cannot be updated via the API in v1.0. Any manual changes require restarting the server.

## Edge Cases
* **Database File Missing/Corrupt**: The application should gracefully handle creating a new database file and schemas if missing.
* **Empty Roster File**: If `members.json` is missing or empty, the server should fail to start and log a critical initialization error.
* **Server Restart on Active Workday**: Roster retrieval must not be affected by server restarts, and existing daily submissions must remain intact.

## Dependencies
* Node.js, Express, `better-sqlite3`, TypeScript configuration.

## API Requirements
### `GET /api/v1/standups/members`
* **Description**: Retrieve the list of all configured team members and their submission status for today.
* **Response (200 OK)**:
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
* **Response (500 Internal Server Error)**:
  ```json
  {
    "status": "error",
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to retrieve team member registry status."
  }
  ```

## Database Impact
* **Table Creation**:
  - `standups` table schema:
    ```sql
    CREATE TABLE IF NOT EXISTS standups (
      id TEXT PRIMARY KEY,
      member_name TEXT NOT NULL,
      member_email TEXT NOT NULL,
      yesterday TEXT NOT NULL,
      today TEXT NOT NULL,
      blockers TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(member_email, date)
    );
    ```
  - `digest_logs` table schema:
    ```sql
    CREATE TABLE IF NOT EXISTS digest_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      error_reason TEXT,
      sent_at TEXT
    );
    ```

## UI Components
* **Roster Selector**: Dropdown selection element on the Standup Submission Form populated from the API response of `GET /api/v1/standups/members`.

## Security Requirements
* **SQL Injection**: Use parameterized SQL statements for all queries.
* **Data Privacy**: Pre-configured registry is read-only via API; no endpoints exist in v1.0 to delete or modify team members.

## Acceptance Criteria
* **AC-1**: GIVEN the backend is starting up, WHEN the database file `database.sqlite` does not exist, THEN the system automatically creates the file and initializes the `standups` and `digest_logs` tables.
* **AC-2**: GIVEN a client sends a GET request to `/api/v1/standups/members`, THEN the system returns a status code of 200 and a JSON payload containing the 3 pre-configured team members and their today's submission statuses.
* **AC-3**: GIVEN a team member has successfully submitted their standup for today, WHEN `/api/v1/standups/members` is requested, THEN that member's entry has `submitted` as `true` and the correct ISO-8601 UTC timestamp in `submitted_at`.

## Definition of Done
* Database setup script verified and runs successfully on startup.
* JSON config loader parses `src/config/members.json` properly.
* Unit tests verify `GET /api/v1/standups/members` response shape and contents.
* SQLite schema integrity verified.

# Feature: Manager Digest Dashboard

## Feature ID
`FEAT-003`

## Purpose
Provide a centralized web dashboard and API for managers to view daily standup submissions in real-time, instantly spot blockers, filter by specific dates, and identify team members who have not yet submitted their updates.

## User Stories
* **As a manager**, I want a centralized dashboard showing all standups submitted today so that I can review team updates in under 10 seconds.
* **As a manager**, I want blockers to be highlighted on the dashboard so that I can easily spot and remove team roadblocks.
* **As a manager**, I want to see a separate list of team members who haven't submitted their updates yet so that I know who I need to follow up with.
* **As a manager**, I want to filter submissions by date so that I can review updates from previous workdays.

## Functional Requirements
1. **Manager Dashboard Page**:
   - Provide a clean dashboard route `/manager/digest` or equivalent.
   - Fetch submissions for the selected date from the backend.
   - Display a high-level summary at the top showing the total team members count, submitted count, and pending count.
2. **Submissions Listing**:
   - Render each team member's submission as a card showing:
     - Team member name & email.
     - Submission timestamp (formatted to local time).
     - Yesterday, Today, and Blockers content.
   - Highlight the card's blocker section in **amber** if the text is not `"None"`, not empty, or contains blocker indicators.
3. **Pending Roster**:
   - Display team members who have not submitted today in a separate, dedicated "Pending" section with an "Awaiting Submission" status badge.
4. **Historical Date Filtering**:
   - Render a date picker/selector allowing the manager to filter updates by a specific date.
   - Default to today's date if no filter is applied.

## Validation Rules
* **Date Filter Format**: The date query parameter sent to the backend must be in `YYYY-MM-DD` format. Any invalid format must trigger HTTP 400 `INVALID_DATE_FORMAT`.

## Edge Cases
* **Zero Submissions State**: If no submissions have been made for the queried date, render an empty state message: "No submissions yet for today. All team members are pending."
* **Invalid Date Formats**: If a user enters an invalid date in the query string (e.g. `/api/v1/standups?date=10-06-2026`), return HTTP 400 `INVALID_DATE_FORMAT` and display an error alert on the UI.
* **Future Date Query**: Allow querying future dates, which will return 0 submissions and list all configured members as pending.

## Dependencies
* `FEAT-001` (Team Member Registry and Database Schema).
* `FEAT-002` (Standup Submission Form and API).

## API Requirements
### `GET /api/v1/standups`
* **Description**: Retrieve all standup submissions for a given date. Manager-facing endpoint.
* **Query Params**: `date` (optional, ISO format `YYYY-MM-DD`, defaults to today's server date)
* **Response (200 OK)**:
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
          "yesterday": "Fixed database connection bug.",
          "today": "Writing unit tests for API.",
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
* **Response (400 Bad Request — invalid date format)**:
  ```json
  {
    "status": "error",
    "code": "INVALID_DATE_FORMAT",
    "message": "Date must be in YYYY-MM-DD format (e.g., 2026-06-10)."
  }
  ```

## Database Impact
* **Table Reads**: Executes a select query on the `standups` table filtered by `date = ?`.

## UI Components
* **Header Summary Widgets**: Visual counters showing total team, submitted, and pending counts.
* **Submission Cards Grid**: Individual cards layout representing submitted standup content.
* **Amber Warning Blocker CSS**: Highlight border/background styling for active blockers.
* **Pending Members List**: Sidebar or section displaying names of team members who are outstanding.
* **DatePicker Control**: Accessible control to trigger database queries for different dates.

## Security Requirements
* **API Validation**: Parameterized SQL queries to block SQL injection via the date query string.
* **Input Sanitization**: Escape outputs in cards to prevent injection attacks (XSS).

## Acceptance Criteria
* **AC-1**: GIVEN team members have submitted standups for today, WHEN the manager opens the Dashboard, THEN the system displays a card for each submission containing the team member's name, timestamp, and their answers to the three questions.
* **AC-2**: GIVEN a team member has written a blocker that is not `"None"`, WHEN the card is rendered on the Dashboard, THEN the blockers section is styled with an amber background and warning indicator.
* **AC-3**: GIVEN one or more team members have not submitted their daily update, WHEN the manager opens the Dashboard, THEN those members are listed in the "Pending" section under the status "Awaiting Submission".
* **AC-4**: GIVEN the manager selects a past date using the date picker, WHEN the request completes, THEN the dashboard displays the exact historical submissions and pending list for that specific calendar date.

## Definition of Done
* Backend route `GET /api/v1/standups` handles date queries, empty states, and validation errors correctly.
* Unit tests mock database retrievals and verify correct JSON payload structure.
* UI page built with Tailwind CSS/CSS containing all widgets, cards, and datepicker.
* Blocker highlight styles apply correctly when blockers contain roadblocks.

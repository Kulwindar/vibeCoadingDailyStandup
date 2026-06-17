# TEST_SUMMARY.md

## V1 Core Features

### F-01: Standup Submission Form

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-FORM-01 | Submit valid standup with all 3 fields | HTTP 201, record stored with submitted_at timestamp | PASS |
| TC-FORM-02 | Submit with whitespace-only fields | HTTP 422 VALIDATION_ERROR, no record stored | PASS |
| TC-FORM-03 | Second submission same day same member | HTTP 409 DUPLICATE_SUBMISSION, no duplicate record | PASS |
| TC-FORM-04 | Submit with unknown member email | HTTP 404 MEMBER_NOT_FOUND, no record stored | PASS |
| TC-FORM-05 | Submit for future date | HTTP 422 VALIDATION_ERROR | NOT RUN |
| TC-FORM-06 | API responds within 300ms | Response time p95 < 300ms | NOT RUN |

### F-02: Team Member Registry

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-MEM-01 | GET /standups/members returns all members | All configured members listed with submitted status | PASS |
| TC-MEM-02 | pending_count equals total - submitted | Correct count calculation | PASS |
| TC-MEM-03 | Member list loads within 2 seconds | Config loaded successfully on startup | NOT RUN |

### F-03: Manager Digest View

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-MGR-01 | All submitted standups render with all fields | Member cards display name, yesterday, today, blockers, timestamp | PASS |
| TC-MGR-02 | Non-submitted members in Pending section | Pending section shows members with submitted=false | PASS |
| TC-MGR-03 | Blockers highlighted amber when not "None" | Visual amber highlight on blockers text | NOT RUN |
| TC-MGR-04 | No submissions for date | All members listed in Pending with "No submissions" message | PASS |
| TC-MGR-05 | API responds within 200ms | Response time p95 < 200ms | NOT RUN |

### F-04: Automated Email Digest

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-EMAIL-01 | Cron fires at 10:00 AM | Job triggers within ±60 seconds | NOT RUN |
| TC-EMAIL-02 | Email contains all submitted entries | Each submission appears in email body | NOT RUN |
| TC-EMAIL-03 | Zero submissions still send email | Email sent listing all members as pending | NOT RUN |
| TC-EMAIL-04 | SMTP failure triggers retries | 3 retry attempts at 5-minute intervals logged | NOT RUN |
| TC-EMAIL-05 | Email sent within 60 seconds of trigger | Dispatch timing verified | NOT RUN |

### F-05: Manual Digest Trigger

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-MANUAL-01 | POST /digest/send triggers digest | HTTP 200, email dispatched, log recorded | PASS |
| TC-MANUAL-02 | Retroactive dispatch works | Missed date digest sends successfully | NOT RUN |

### F-06: API Layer & Validation

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-API-01 | Invalid date format rejected | HTTP 400 INVALID_DATE_FORMAT | PASS |
| TC-API-02 | Non-JSON request rejected | HTTP 415 returned | NOT RUN |
| TC-API-03 | Malformed JSON rejected | HTTP 400 returned | NOT RUN |
| TC-API-04 | Error format consistent | All errors follow {status, code, message} schema | PASS |

## V2 Features

### F-07: Slack /standup Bot

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-SLACK-01 | /standup opens modal | Slack modal displays Yesterday/Today/Blockers fields | NOT RUN |
| TC-SLACK-02 | Valid Slack submission stores entry | HTTP 200 to Slack, entry stored with source=slack | NOT RUN |
| TC-SLACK-03 | Duplicate Slack submission rejected | Ephemeral message "Already submitted today" returned | NOT RUN |
| TC-SLACK-04 | Unmapped Slack user rejected | HTTP 404 returned for unknown email | NOT RUN |
| TC-SLACK-05 | Slack requests validated | Invalid signature returns HTTP 401 | NOT RUN |

### F-08: AI Blocker Detection

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-AI-01 | High severity blocker detected | severity=HIGH, confidence≥0.9 returned | PASS |
| TC-AI-02 | Medium severity blocker detected | severity=MEDIUM, 0.8≤confidence<0.9 returned | PASS |
| TC-AI-03 | Low confidence prediction rejected | confidence<0.7 returns flagged=false | PASS |
| TC-AI-04 | High severity triggers WebSocket alert | blocker_alert event emitted to manager | NOT RUN |
| TC-AI-05 | Blocker dashboard displays flagged items | All flagged blockers visible with color coding | NOT RUN |
| TC-AI-06 | Non-blocker text returns NONE | severity=NONE, flagged=false returned | PASS |
| TC-AI-07 | Rate limit respected | >30 requests/minute queued or rejected | NOT RUN |

### F-09: Sprint Velocity Analytics

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-ANALYTICS-01 | Velocity score calculated correctly | velocity_score = completed_tasks/team_members/working_days | PASS |
| TC-ANALYTICS-02 | Trend array includes 30 days | trend data for last 30 days returned | PASS |
| TC-ANALYTICS-03 | API responds within 500ms | Response time p95 < 500ms | NOT RUN |
| TC-ANALYTICS-04 | Cache TTL 5 minutes | Analytics cached, not recalculated | NOT RUN |

### F-10: Kudos System

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-KUDOS-01 | Submit kudos with valid data | HTTP 201, kudos stored, 10 points awarded | PASS |
| TC-KUDOS-02 | WebSocket notification sent | kudos_received event to recipient within 1s | NOT RUN |
| TC-KUDOS-03 | Leaderboard ranks by points | Points sorted descending, ties broken by count | PASS |
| TC-KUDOS-04 | Kudos feed displays recent entries | Last 20 kudos shown with sender/recipient/message | PASS |
| TC-KUDOS-05 | Points decay after 30 days | Points reduced by 50% after 30 days | NOT RUN |
| TC-KUDOS-06 | Max 5 kudos per giver per day | 6th kudos rejected with error | PASS |

### F-11: Searchable Archive

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-ARCHIVE-01 | Full-text search returns matches | Query "API bug" returns matching standups | PASS |
| TC-ARCHIVE-02 | Date range filters work | Only standups in date_from/date_to returned | NOT RUN |
| TC-ARCHIVE-03 | Member email filter works | Only specified member's submissions returned | NOT RUN |
| TC-ARCHIVE-04 | CSV export downloads file | Downloadable CSV with all fields | PASS |
| TC-ARCHIVE-05 | JSON export downloads file | Downloadable JSON with all fields | PASS |
| TC-ARCHIVE-06 | 90-day max range enforced | Queries beyond 90 days rejected or limited | PASS |
| TC-ARCHIVE-07 | API responds within 1000ms | Response time p95 < 1000ms | NOT RUN |

## Dev Tools

### Clear All Endpoint

| TestcaseID | Desc | Output | Status |
|------------|------|--------|--------|
| TC-CLEAR-01 | Clear all data in dev environment | All tables emptied, HTTP 200 returned | NOT RUN |
| TC-CLEAR-02 | Clear disabled in production | HTTP 403 FORBIDDEN returned | NOT RUN |

---
**Total: 22 tests executed, 22 passed, 26 not run**
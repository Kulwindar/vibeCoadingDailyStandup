# Developer Handover & Workflow Document (V2)

## 1. Project Overview

* **Project Name**: Daily Standup System V2
* **Business Purpose**: Extends V1 with Slack integration, AI blocker detection, sprint analytics, kudos recognition, and searchable archives.
* **Problem Statement**: V1 addressed basic standup collection; V2 adds recognition, blocker intelligence, and historical insights.

---

## 2. Technology Stack

| Layer          | Technologies |
| -------------- | ------------ |
| **Frontend**   | React 18, TypeScript, Redux Toolkit, RTK Query, Tailwind CSS, Lucide React |
| **Backend**    | Node.js, Express, TypeScript, better-sqlite3, Socket.IO |
| **V2 Features** | Slack Bolt SDK, AI API integration, node-cache |

---

## 3. Architecture Overview (V2)

```
Request -> Express Route -> Controller -> Service -> Repository -> SQLite

V2 Endpoints:
- POST /api/v1/slack/events     (Slack Bot)
- POST /api/v1/blockers/analyze (AI Blocker Detection)
- GET /api/v1/analytics/sprint  (Sprint Velocity Analytics)
- POST /api/v1/kudos            (Kudos System)
- GET /api/v1/archive/search    (Searchable Archive)
```

---

## 4. Project Structure (V2)

```
Project/standup-system/
├── backend/src/controllers/
│   ├── archive.controller.ts
│   ├── blocker.controller.ts
│   ├── analytics.controller.ts
│   ├── kudos.controller.ts
│   └── slack.controller.ts
├── backend/src/services/
│   ├── archive.service.ts
│   ├── blocker.service.ts
│   ├── analytics.service.ts
│   └── kudos.service.ts
├── backend/src/repositories/
│   ├── archive.repository.ts
│   ├── blocker.repository.ts
│   └── kudos.repository.ts
└── frontend/src/components/
    ├── KudosFeed.tsx         (with send form)
    ├── AnalyticsDashboard.tsx
    ├── BlockerDashboard.tsx
    └── ArchiveSearch.tsx
```

---

## 5. Database Schema (V2 Extensions)

| Table | Purpose |
| ----- | ------- |
| `blocker_predictions` | AI analysis results (standup_id, severity, confidence) |
| `kudos` | Peer recognition entries (from_member, to_member, message, points) |
| `kudos_decay_log` | Point decay audit trail |

---

## 6. V2 API Endpoints

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/api/v1/slack/events` | POST | Slack slash command handler |
| `/api/v1/blockers/analyze` | POST | AI blocker analysis |
| `/api/v1/blockers` | GET | Get flagged blockers |
| `/api/v1/analytics/sprint` | GET | Sprint velocity metrics |
| `/api/v1/kudos` | POST | Submit kudos |
| `/api/v1/kudos/leaderboard` | GET | Kudos leaderboard |
| `/api/v1/kudos/feed` | GET | Recent kudos feed |
| `/api/v1/archive/search` | GET | Full-text search |
| `/api/v1/archive/export` | GET | CSV/JSON export |

---

## 7. V2 UI Components

### KudosFeed.tsx
- Send Kudos toggle form with from/to member dropdowns
- Message textarea (max 500 chars)
- Leaderboard display (top 3)
- Kudos feed cards

### AnalyticsDashboard.tsx
- Velocity score metric
- 30-day trend visualization

### BlockerDashboard.tsx
- Severity color coding (red/amber/green)
- Confidence percentage display

### ArchiveSearch.tsx
- Search input + date range filters with Calendar icons
- Real-time filtering
- CSV export

---

## 8. Environment Variables (V2)

```ini
# V1
PORT=5000
SMTP_HOST=...
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASS=...
MANAGER_EMAIL=...

# V2 Additions
SLACK_BOT_TOKEN=...
SLACK_SIGNING_SECRET=...
OPENAI_API_KEY=...
KUDOS_ENABLED=true
SLACK_BOT_ENABLED=true
AI_BLOCKER_DETECTION_ENABLED=true
ARCHIVE_ENABLED=true
SPRINT_ANALYTICS_ENABLED=true
```

---

## 9. Feature Flags

| Flag | Controls |
| ---- | -------- |
| `SLACK_BOT_ENABLED` | Slack /standup command |
| `AI_BLOCKER_DETECTION_ENABLED` | AI blocker analysis |
| `KUDOS_ENABLED` | Kudos system |
| `ARCHIVE_ENABLED` | Searchable archive |
| `SPRINT_ANALYTICS_ENABLED` | Velocity analytics |

---

## 10. Testing

- Backend: `npm test` (22 tests passing)
- Frontend: `npm run build` compiles successfully

---

## 11. Deployment

Same as V1 - V2 is additive with no breaking changes.
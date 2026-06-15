## 1. Code & Execution Constraints
* **No Auto-Commit:** DO NOT commit, push, or modify repository code directly.
* **No Unauthorized Commands:** DO NOT execute any terminal commands, scripts, or installations without explicit user confirmation first.
* **Frontend Stack:** React, TypeScript, Redux Toolkit, Tailwind CSS, Jest, React Testing Library
* **Backend Stack:** Node.js 20 LTS, Express.js, REST API (`/api/v1`), node-cron, Nodemailer
* **Slack Integration:** Slack Bolt SDK for JavaScript, Slack Events API, Slack Web API
* **AI Integration:** OpenAI GPT-4 API or Anthropic Claude API for natural language processing

## 2. Guardrails & Token Optimization
* **No Guessing/Assumptions:** DO NOT write code based on incomplete information.
* **Clarification First:** If architecture, requirements, or data structures are ambiguous, STOP and ask clarifying questions. Eliminate wasteful iterations.
* **Backward Compatibility:** V2 features must be additive; existing V1 functionality must remain unchanged and fully functional.
* **Feature Flags:** All V2 features must use feature flags (e.g., `SLACK_BOT_ENABLED`, `AI_BLOCKER_DETECTION_ENABLED`, `SPRINT_ANALYTICS_ENABLED`, `KUDOS_ENABLED`, `ARCHIVE_ENABLED`) to allow progressive rollout.

## 3. Code Quality Standards
* **Modular:** Write single-responsibility, highly decoupled components/functions.
* **Maintainable:** Prioritize clean, self-documenting code with predictable data flows over clever, dense logic.
* **Extensibility:** Design all new modules (Slack, AI, Analytics, Kudos, Archive) with clear interfaces to enable future enhancements.

## V2 Additions — New Modules & Constraints

### V2-Feature Slack Bot Module (M8)
* **Slack Modal Framework:** Use Slack's `views.open` API for standup modal submissions.
* **Bot Token Scope:** Requires `chat:write`, `commands`, `users:read`, `views:write` scopes.
* **No Slash Command Modifications:** Slack slash command `/standup` must not alter existing web form behavior.

### V2-Feature AI Blocker Detection Module (M9)
* **External API Key:** Requires `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env`.
* **Confidence Threshold:** AI predictions with `confidence < 0.7` must be auto-rejected; 0.7–0.89 requires manager review flag.
* **Rate Limiting:** AI analysis capped at 30 requests/minute to prevent quota exhaustion.

### V2-Feature Sprint Analytics Module (M10)
* **Historical Data:** Requires `GET /api/v1/analytics/sprint` endpoint returning aggregated velocity metrics.
* **Cache Layer:** In-memory cache with 5-minute TTL for analytics calculations.

### V2-Feature Kudos System Module (M11)
* **Realtime Notifications:** Kudos notifications delivered via WebSocket (Socket.IO) or Server-Sent Events.
* **Reputation Rules:** Kudos points decay after 30 days of inactivity; stored in separate `kudos` table.

### V2-Feature Archive Module (M12)
* **Search Engine:** Full-text SQLite FTS5 index on standup content for fast filtering.
* **Export Formats:** CSV export via `GET /api/v1/archive/export?format=csv`; JSON export via `format=json`.
* **Date Range Filter:** Archive queries limited to 90-day ranges by default to prevent performance degradation.
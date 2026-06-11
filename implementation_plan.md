# Implementation Plan - Daily Standup System Development

Implement the Daily Standup System inside [Project/standup-system](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system), split into a Node.js/Express backend and a React/TypeScript frontend. The backend will use SQLite (`better-sqlite3`) and Nodemailer, and the frontend will use Redux Toolkit, Tailwind CSS, Formik, and Yup.

---

## User Review Required

> [!IMPORTANT]
> **API Response Format Harmonization:** The backend persona mandates responses matching `{ status: number, data: any, message: string }`, while the PRD specifies `{ status: "success" | "error", data?: any, code?: string, message?: string }`. We will harmonize these into:
> - Success: `{ status: 200, data: { ... }, message: "success" }`
> - Error: `{ status: <HTTP_CODE>, data: null, message: "<ERROR_CODE>: <error detail>" }`
> This fulfills both the persona contract structure and provides the client-side error code and message.

> [!WARNING]
> **Email Cron Job Testing:** The node-cron job is scheduled for 10:00 AM on weekdays. To allow manual and automated verification, we expose `POST /api/v1/digest/send` to trigger the digest sending mechanism immediately for a given date.

---

## Open Questions

- **SMTP Server Configuration for Demo/Testing:** Do we have real SMTP relay credentials to configure in `.env`, or should we use `Nodemailer.createTestAccount()` (Ethereal Email) as a fallback when SMTP variables are not set? We propose to use Ethereal Email fallback automatically to facilitate immediate testing.
- **Initial Member List Source:** The static team member registry will be loaded on server startup. We propose storing this list in a JSON configuration file `src/config/members.json` with Priya Sharma, Arjun Mehta, and Sara Khan as the default 3 team members.

---

## Proposed Changes

### Backend Component

Implement the standard clean architectural flow: `Route -> Middleware -> Controller -> Service -> Repository -> Database`.

#### [NEW] [package.json](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/package.json)
Initialize Node.js + TS dependencies: `express`, `better-sqlite3`, `cors`, `dotenv`, `helmet`, `node-cron`, `nodemailer`, `yup`. DevDependencies: `typescript`, `@types/express`, `@types/better-sqlite3`, `@types/node-cron`, `@types/nodemailer`, `ts-node-dev`, `jest`, `supertest`, `@types/jest`, `@types/supertest`.

#### [NEW] [tsconfig.json](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/tsconfig.json)
Configure TypeScript options targeting ES2022.

#### [NEW] [src/app.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/app.ts)
Express application bootstrap, standard middlewares (Cors, Helmet, JSON parsing), API routing prefix `/api/v1`, and centralized error-handling middleware.

#### [NEW] [src/config/db.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/config/db.ts)
Initialize SQLite database connection using `better-sqlite3` and create schemas:
- `standups` (`id` TEXT PRIMARY KEY, `member_name` TEXT, `member_email` TEXT, `yesterday` TEXT, `today` TEXT, `blockers` TEXT, `submitted_at` TEXT, `date` TEXT, UNIQUE(member_email, date))
- `digest_logs` (`id` TEXT PRIMARY KEY, `date` TEXT, `attempt_number` INTEGER, `outcome` TEXT, `error_reason` TEXT, `sent_at` TEXT)

#### [NEW] [src/config/members.json](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/config/members.json)
JSON array listing pre-configured team members:
```json
[
  { "name": "Priya Sharma", "email": "priya@company.com" },
  { "name": "Arjun Mehta", "email": "arjun@company.com" },
  { "name": "Sara Khan", "email": "sara@company.com" }
]
```

#### [NEW] [src/types/index.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/types/index.ts)
Domain interface definitions: `Standup`, `Member`, `DigestLog`, `ApiResponse`.

#### [NEW] [src/validations/standup.validation.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/validations/standup.validation.ts)
Yup schemas for payload validation (`POST /api/v1/standups`, `POST /api/v1/digest/send`).

#### [NEW] [src/repositories/standup.repository.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/repositories/standup.repository.ts)
SQLite queries for fetching, writing, and checking duplicate standup entries.

#### [NEW] [src/repositories/digest.repository.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/repositories/digest.repository.ts)
Queries for saving and checking status of email digest logs.

#### [NEW] [src/services/standup.service.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/services/standup.service.ts)
Business logic for checking member registry, verifying date boundaries, and persisting submissions.

#### [NEW] [src/services/email.service.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/services/email.service.ts)
Nodemailer logic to compile HTML email digest and handle SMTP transport with up to 3 retries (5-min intervals).

#### [NEW] [src/controllers/standup.controller.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/controllers/standup.controller.ts)
Controller handling requests for `/api/v1/standups`, `/api/v1/standups/members`, `/api/v1/digest/send`, `/api/v1/digest/status`.

#### [NEW] [src/routes/standup.routes.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/routes/standup.routes.ts)
Route bindings mapping endpoints to controller handlers, incorporating validation middleware.

#### [NEW] [src/jobs/digest.job.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/backend/src/jobs/digest.job.ts)
Scheduled node-cron job firing at `0 10 * * 1-5` (10:00 AM, Monday-Friday) to trigger the email digest dispatch service.

---

### Frontend Component

Set up a React + TypeScript project with Redux Toolkit and Tailwind CSS.

#### [NEW] [package.json](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/frontend/package.json)
React setup using Vite. Dependencies: `react`, `react-dom`, `@reduxjs/toolkit`, `react-redux`, `formik`, `yup`, `tailwindcss`, `lucide-react`. DevDependencies: `typescript`, `@types/react`, `@types/react-dom`, `vite`, `jest`, `react-testing-library`.

#### [NEW] [src/store/index.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/frontend/src/store/index.ts)
Redux state configuration integrating RTK Query services.

#### [NEW] [src/services/api.ts](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/frontend/src/services/api.ts)
RTK Query API definitions covering `/api/v1` backend endpoints.

#### [NEW] [src/components/Form.tsx](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/frontend/src/components/Form.tsx)
Standup Submission Form component styled with dark mode glassmorphism layout, featuring member dropdown list, inputs for 3 standup fields, Yup-driven real-time validation, and loading/error feedback.

#### [NEW] [src/components/Dashboard.tsx](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/frontend/src/components/Dashboard.tsx)
Manager Daily Digest view showing real-time list of submitted members as cards (with amber blocker styling) and pending members list in separate section, complete with date filter picker.

#### [NEW] [src/App.tsx](file:///d:/vibe%20code/vibe-coading-2/Project/standup-system/frontend/src/App.tsx)
Main shell routing between the Standup Submission form and Manager Digest Dashboard.

---

## Verification Plan

### Automated Tests
- **Backend API Tests:** Use Jest + Supertest to verify:
  - `POST /api/v1/standups` returns 201 on valid input, 409 on duplicate, 404 on invalid member.
  - `GET /api/v1/standups/members` returns correct list.
  - API validation schemas prevent invalid/future dates.
- **Frontend Tests:** Unit tests verifying Form submit blocks and validation error states using Jest and React Testing Library.

### Manual Verification
1. Start backend server (`npm run dev` in backend directory).
2. Start frontend dev server (`npm run dev` in frontend directory).
3. Open frontend in browser.
4. Select team member, submit standup successfully.
5. Try to submit again for same member, verify duplicate error message.
6. Open manager digest page, check card data representation, date selector, and pending member list.
7. Trigger manual email dispatch via Postman or frontend button, verify Nodemailer output log.

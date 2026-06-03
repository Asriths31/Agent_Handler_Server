# Backend Service - Agent Task Distribution Engine

This is the backend API service for the Agent Lead and Task Distribution application. It manages user authentication, user-partitioned agent management, real-time Bloom Filter lookup checking for usernames, and modulo round-robin lead distribution from uploaded spreadsheets.

## Technical Architecture

- **Runtime**: Node.js (ES Modules syntax).
- **Web Framework**: Express.js.
- **Database**: MongoDB via Mongoose ODM.
- **Cache / Lookup**: Custom in-memory FNV-1a Bloom Filter for username checks.
- **Authentication**: JWT token verification based on HttpOnly secure cookie sessions.
- **Spreadsheet Parsing**: `xlsx` (SheetJS) for binary excel files, and `csv-parser` for CSV streams.

---

## API Endpoints

All requests should be prefixed with `/api`. Protected routes require a valid JWT session token provided either via the `token` cookie or as a `Bearer` header in the `Authorization` header.

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description | Payload / Query |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/check-username` | Public | Checks username availability using the Bloom Filter | Query: `username` |
| **POST** | `/register` | Public | Registers a new user account | JSON: `{ username, email, password }` |
| **POST** | `/login` | Public | Authenticates credentials and sets HttpOnly cookie | JSON: `{ email, password }` |
| **POST** | `/logout` | Public | Clears HttpOnly JWT session cookie | None |

### 2. Agent Management (`/api/agents`)

All agent routes are partitioned by the authenticated user (`req.user._id`).

| Method | Endpoint | Auth | Description | Payload |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Private | Fetches all agents registered under this user | None |
| **POST** | `/` | Private | Adds a new agent for this user | JSON: `{ name, email, mobile, password }` |
| **PUT** | `/:id` | Private | Modifies an agent's details (restricted to owner) | JSON: `{ name, email, mobile, password? }` |
| **DELETE** | `/:id` | Private | Deletes agent and all their assigned tasks | None |

### 3. Task Management (`/api/tasks`)

All task operations are partitioned by the authenticated user (`req.user._id`).

| Method | Endpoint | Auth | Description | Payload / Response |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/upload` | Private | Uploads CSV/XLS/XLSX sheet and distributes valid rows | Form-data: `file` |
| **GET** | `/template` | Private | Downloads spreadsheet upload template | File download (`tasks_template.xlsx`) |
| **GET** | `/grouped` | Private | Gets agents grouped with their assigned tasks | None |
| **GET** | `/stats` | Private | Gets metrics (total agents, tasks, pending, completed) | None |
| **PATCH** | `/:id/complete` | Private | Marks a specific task as completed (restricted to owner) | None |
| **DELETE** | `/:id` | Private | Deletes a task (restricted to owner) | None |

---

## Core Infrastructure

### 1. Bloom Filter Cache (`src/utils/bloomFilter.js`)
- Initializes on server startup by loading all existing usernames from MongoDB.
- Employs FNV-1a non-cryptographic hashes ($k = 4$ hash functions, $m = 10000$ bits).
- When checks are made:
  - If the filter returns `false` (does not exist), the response returns immediately without query overhead.
  - If the filter returns `true` (possible match), it falls back to MongoDB to handle false positives.
- Re-seeding via `npm run seed` touches `server.js` automatically, restarting nodemon and syncing the cache.

### 2. Lead Distribution logic (`src/services/distributionService.js`)
- Uses round-robin scheduling.
- Active agents are fetched and sorted.
- Tasks are mapped to agents modulo-wise:
  $$\text{agentId} = \text{agents}[i \pmod{\text{agents.length}}].\_id$$
- All tasks are saved with the user's ID to keep data completely partitioned.

### 3. Validation Feedback
- If an uploaded spreadsheet fails validation (invalid formats, missing required fields, batch or database duplicates), the system writes the errors to a temporary virtual workbook using `xlsx` and sends it back to the client.
- Headers are set (`X-Error-File`, `X-Imported-Count`, `X-Error-Count`) so the frontend can display statistics and download the errors ledger.

---

## Environment Configuration

Configure a `.env` file in the root of the `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_signing_key
```

## Running the backend
- Install: `npm install`
- Seed Admin: `npm run seed`
- Run dev: `npm run dev`

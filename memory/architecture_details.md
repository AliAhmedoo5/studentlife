# System Architecture & API Details

## 1. Stack Breakdown

The application is built using a decoupled layout:
- **Frontend**: Single Page Application (SPA) built using **React** and **Vite**. Styles are written in **Vanilla CSS** (`src/index.css`) with HSL variables. Data is synced to the backend asynchronously while retaining browser `localStorage` as an offline buffer.
- **Backend**: **FastAPI** Python server running on `http://localhost:5000` via **Uvicorn**.
- **Database**: **SQLite** (`backend/finance.db`). Stores all tables persistently.

```
+------------------------------------------+
|            React SPA (Vite)              |
|        (Dashboard, Ledger, Chat UI)      |
+--------------------o---------------------+
                     | HTTP POST / GET
                     v
+--------------------o---------------------+
|            FastAPI Backend               |
|      (CORS Enabled, Ports: 5000)         |
+---------o----------------------o---------+
          |                      |
     (GET / POST)           (GET / POST)
          |                      |
          v                      v
+---------o------------+
| SQLite Database      |
| (finance.db)         |
+----------------------+
```

---

## 2. API Endpoints

The FastAPI backend exposes the following CORS-enabled endpoints:

### 1. `GET /api/health`
Checks the server and SDK health.
- **Response**:
  ```json
  {
    "status": "ready",
    "api_key_configured": true,
    "api_key_valid": true
  }
  ```

### 2. `GET /api/finance-data`
Fetches the current student's budgets, expenses, and savings goals from SQLite. If the database is empty, it automatically triggers seeding.

### 3. `POST /api/sync-data`
Accepts the full JSON state and writes it to SQLite in a single transaction.

### 4. `POST /api/reset-data`
Wipes all tables and re-seeds default data. Returns the seeded dataset.

### 5. `POST /api/parse-expense`
Parses a natural language string using a Python-based parser in `backend/server.py` to extract expense details.
- **Request**: `{ "text": "grocery 23.50 yesterday" }`

---

## 3. Resilience & Offline Fallbacks

To ensure absolute stability, the **API Layer (`src/utils/api.js`)** implements automatic, graceful fallbacks:
- During mount, the frontend requests `/api/finance-data`. If the server is offline, the client continues using `localStorage` data transparently, keeping all features active.
- The UI renders an **Offline Mode** alert banner showing connection state, allowing manual retries once the FastAPI server starts.
- Sync operations save changes to `localStorage` and attempt to write to SQLite. If sync fails, the user is notified with an offline warning, and the local browser storage maintains the user's state.

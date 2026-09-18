# SentinelCore SecureOps — Node/Express Backend (MERN)

This is a MERN-stack (MongoDB + Express + Node) port of the original
Spring Boot backend. The React frontend (`Cloud Security Monitoring
System-Frontend`) does **not** need any code changes — it already
talks to `http://localhost:8080/api/...`, and this server listens on
the same port with the same routes.

## 1. Setup

```bash
cd mern-backend
npm install
cp .env.example .env
```

Edit `.env` if needed (defaults assume a local MongoDB on
`mongodb://localhost:27017/secureopsprojectes`).

## 2. Run MongoDB

Use a local install, or Docker:

```bash
docker run -d -p 27017:27017 --name secureops-mongo mongo:7
```

Or use MongoDB Atlas and put the connection string in `MONGO_URI`.

## 3. Seed an admin user (optional but recommended)

```bash
npm run seed
```

Creates `admin@sentinelcore.com` / `Admin@123` with role `ADMIN`.

## 4. Run the server

```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```

Server runs on `http://localhost:8080`, matching `server.port=8080`
from the original `application.properties`.

## 5. Point the React frontend at it

No changes needed — `Cloud Security Monitoring System-Frontend/src/api/axios.js`
already points to `http://localhost:8080/api`. Just run:

```bash
cd "Cloud Security Monitoring System-Frontend"
npm install
npm run dev
```

---

## Endpoint Map (Spring Boot → Node/Express)

| Endpoint | Method | Roles | Notes |
|---|---|---|---|
| `/api/auth/register` | POST | Public | |
| `/api/auth/login` | POST | Public | Returns JWT (24h expiry) |
| `/api/assets` | GET/POST | USER+/ADMIN+ITSM | |
| `/api/assets/:id` | GET/PUT/DELETE | varies | DELETE = ADMIN only |
| `/api/assets/discover` | GET | ADMIN, ITSM | |
| `/api/assets/scan?subnet=` | GET | ADMIN, ITSM | **Now actually implemented** (TCP sweep) — the original Java version's `scanNetwork()` was a stub returning `null` |
| `/api/assets/search?keyword=` | GET | ADMIN, ITSM, USER | |
| `/api/assets/department/:d`, `/owner/:o`, `/status/:s`, `/health/:h`, `/my-assets/:u`, `/dashboard/:d` | GET | ADMIN, ITSM, USER | |
| `/api/dashboard` | GET | ADMIN, ITSM, USER | Live CPU/mem/disk/network of the host, rest mirrors original hardcoded values |
| `/api/dashboard/charts?days=N` | GET | ADMIN, ITSM, USER | **New** — the frontend called this but the Spring backend never implemented it |
| `/api/users/profile` | GET | ADMIN, ITSM, USER | |
| `/api/users` | GET | ADMIN, ITSM, USER | |
| `/api/users/:id` | GET/PUT/DELETE | ADMIN (GET/DELETE), ADMIN+ITSM (PUT) | |
| `/api/profile-data` | GET/PUT | authenticated | **New** — `ProfileController.java` existed but was fully commented out |
| `/api/profile-data/password` | PUT | authenticated | **New** |
| `/api/settings` | GET/PUT | authenticated | **New** — per-user settings, didn't exist in Spring backend |
| `/api/alerts/recent` | GET | authenticated | **New** — used by the notification bell in `Navbar.jsx` |
| `/api/alerts` | POST | ADMIN, ITSM | |
| `/api/alerts/:id` | PUT | ADMIN, ITSM | |

## Known ported quirks (kept intentionally, per original design)

- **Asset hardware stats reflect the backend server**, not a real
  remote client device — `createAsset`/`updateAsset`/`discoverAssets`
  all read the Node process's own CPU/RAM/disk/network via
  `systeminformation`/`os`, exactly like the Java version did via
  OSHI. This was flagged as a design issue in the original app but
  kept for parity per request.
- **Dashboard numbers are mostly static** (`incidents`, `vulnerabilities`,
  `securityScore`, `activities`, `recommendations`) — only CPU/mem/disk/
  network/process-count are real, matching `DashboardServiceImpl.java`.
- **`/api/dashboard/charts`** generates deterministic day-by-day
  series for incidents/vulnerabilities since there's no dedicated
  incident/vulnerability collection in this system yet — plug in
  real collections there when you build those features out.

## Project Structure

```
mern-backend/
├── server.js                     # entry point
├── src/
│   ├── app.js                    # express app + route wiring + CORS
│   ├── config/db.js               # mongoose connection
│   ├── models/                   # User, Asset, Alert (Mongoose schemas)
│   ├── middleware/auth.js         # authenticate (JWT) + authorize (roles)
│   ├── controllers/               # route handler logic (services + controllers merged)
│   ├── routes/                    # express routers per resource
│   ├── utils/
│   │   ├── jwt.js                 # token generate/verify
│   │   ├── systemStats.js         # os/systeminformation helpers (OSHI equivalent)
│   │   ├── asyncHandler.js        # try/catch wrapper for async routes
│   │   └── seed.js                # creates a default admin user
│   └── scheduler/                 # node-cron jobs (OSHI discovery equivalent)
```

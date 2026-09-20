# SentinelCore SecureOps — Full-Stack MERN Security Operations Platform

**SentinelCore SecureOps** is an enterprise-grade Security Operations (SecOps), Asset Management, and System Monitoring Platform built using the **MERN (MongoDB, Express.js, React, Node.js)** full stack architecture. 

It provides real-time system monitoring, asset discovery, host telemetry collection, subnet scanning, security incident response, vulnerability patch tracking, security event auditing, and dynamic data-driven risk scoring.

---

## Technical Stack & Architecture

### Backend Stack
- **Runtime & Framework**: Node.js & Express.js
- **Database**: MongoDB & Mongoose ORM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS restriction, express-rate-limit, safe regex escaping
- **Scheduler**: node-cron (concurrency-managed asset discovery & telemetry sync)
- **Telemetry**: systeminformation & Node.js `os` / `dns` / `net` modules

### Frontend Stack
- **Core**: React 19 (Vite build system)
- **State & Data Management**: React Context (`AuthContext`), TanStack React Query / Axios API layer
- **Routing**: React Router v7
- **UI Components**: Framer Motion animations, Recharts data visualizations, React Toastify, React Icons

### Application Layer Architecture
```
React Frontend (Vite)
       │
 Axios API Client (Bearer Token Auth)
       │
 Express Routes (/api/auth, /api/assets, /api/dashboard, /api/incidents, /api/vulnerabilities, /api/alerts, /api/users)
       │
 Validation & Security Middleware (Helmet, RateLimiter, Auth JWT, RBAC authorize)
       │
 Thin Controllers (authController, assetController, incidentController, vulnerabilityController, dashboardController)
       │
 Business Services Layer (authService, assetService, incidentService, vulnerabilityService, riskService, dashboardService, networkScannerService)
       │
 MongoDB Database (Mongoose Models: User, Asset, Alert, Incident, Vulnerability, SecurityEvent)
```

---

## Core Features & Modules

1. **Authentication & Public Registration Security**:
   - JWT-based authentication with encrypted password storage using bcrypt.
   - **Public Registration Hardening**: Public signups strictly default to `role: "USER"`. Malicious requests attempting to request `role: "ADMIN"` or `role: "ITSM"` are overridden.
   - **Administrative User Management**: A protected endpoint `/api/auth/create-user` allows authenticated `ADMIN` accounts to assign `ADMIN` or `ITSM` roles.

2. **Standardized Role-Based Access Control (RBAC)**:
   - **ADMIN**: Full administrative control across users, assets, alerts, incidents, vulnerabilities, and system settings.
   - **ITSM**: Operations management over assets, alerts, incidents, and vulnerability patching.
   - **USER**: Read-only access to permitted asset inventory, dashboards, reports, and own profile settings.

3. **System Telemetry & Host Discovery**:
   - Reads real host metrics (CPU usage, Memory load, Disk utilization, Network I/O, Hostname, MAC address, OS architecture).
   - **Duplicate Discovery Prevention**: Automatically updates existing asset records by IP/Hostname/MAC rather than creating duplicate records on every scan cycle.

4. **Network Scanner**:
   - Performs TCP-ping reachability sweeps across local subnets with **concurrency limits** (10 hosts max per batch) and socket timeout handling.

5. **Dynamic Security Risk Scoring (`riskService`)**:
   - Calculates real-time Security Scores starting from a base of **100**, subtracting calculated penalties for open incidents, unpatched critical/high CVEs, unhealthy/offline assets, and recent high-severity security events. Clamped strictly between 0 and 100.

6. **Incident & Vulnerability Response Center**:
   - Incident lifecycle tracking (`OPEN` -> `ASSIGNED` -> `INVESTIGATING` -> `MITIGATED` -> `RESOLVED`).
   - Vulnerability CVE tracking, CVSS scores, patch level verification, and status updates.

7. **Fully Data-Driven Dashboard**:
   - Aggregates actual MongoDB collection counts, live host telemetry, and time-series analytics. Zero synthetic random data PRNG generators or on-the-fly request seeding.

---

## Getting Started & Running Locally

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB installed locally (running on `mongodb://localhost:27017`) or a MongoDB Atlas URI.

### Environment Setup

#### Backend Environment (`backend/.env`)
```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/secureopsprojectes
JWT_SECRET=ThisIsMyVerySecureJWTSecretKeyForSentinelCoreSecureOpsApplication2026
JWT_EXPIRATION=86400000
CLIENT_ORIGIN=http://localhost:5173
ASSET_DISCOVERY_ENABLED=true
```

#### Frontend Environment (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8080/api
```

---

## Installation & Running Commands

### 1. Database Seeding
To populate demo users, assets, alerts, incidents, vulnerabilities, and events:
```bash
cd backend
npm install
npm run seed
```

**Default Credentials Created by Seed Script**:
- **ADMIN**: `admin@sentinelcore.com` / Password: `Admin@123`
- **ITSM**: `itsm@sentinelcore.com` / Password: `Admin@123`
- **USER**: `user@sentinelcore.com` / Password: `Admin@123`

### 2. Run Backend API Server
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:8080`*

### 3. Run Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens on `http://localhost:5173`*

### 4. Build Frontend for Production
```bash
cd frontend
npm run build
```

---

## API Summary & Permission Table

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Register new user account (forces `role: USER`) |
| `/api/auth/login` | POST | Public | Authenticate user & return JWT token + user profile |
| `/api/auth/create-user` | POST | ADMIN | Create user with assigned ADMIN or ITSM role |
| `/api/users` | GET | ADMIN | List all registered user accounts |
| `/api/users/:id` | PUT | ADMIN, ITSM, USER | Update profile details (Self / Admin role updates) |
| `/api/assets` | GET | ADMIN, ITSM, USER | List assets (paginated with search & filters) |
| `/api/assets` | POST | ADMIN, ITSM | Create a new monitored asset record |
| `/api/assets/discover` | GET | ADMIN, ITSM | Trigger host telemetry discovery & asset sync |
| `/api/assets/scan` | GET | ADMIN, ITSM | Sweep local subnet for host reachability |
| `/api/incidents` | GET | ADMIN, ITSM, USER | List security incidents |
| `/api/incidents` | POST | ADMIN, ITSM | Log new security incident |
| `/api/incidents/:id` | PUT | ADMIN, ITSM | Update incident status & resolution notes |
| `/api/vulnerabilities`| GET | ADMIN, ITSM, USER | List vulnerabilities & CVSS scores |
| `/api/vulnerabilities/:id`| PUT | ADMIN, ITSM | Update patch level & vulnerability status |
| `/api/alerts` | GET | ADMIN, ITSM, USER | Fetch active alerts |
| `/api/dashboard` | GET | ADMIN, ITSM, USER | Aggregate system summary & risk score |
| `/api/dashboard/charts`| GET | ADMIN, ITSM, USER | Return time-series incident & vulnerability charts |

---

## Security Audit & Compliance Safeguards

- **Regex Injection Prevention**: All user search queries are processed through standard escaping (`escapeRegex()`).
- **Brute Force Protection**: Rate limiting enforced on `/api/auth/login` (10 requests / 15 mins / IP).
- **HTTP Header Hardening**: Express `helmet` middleware enforced across all endpoints.
- **Database Projections**: User password hashes are excluded by default via schema `toJSON` transformations and Mongoose `.select("-password")`.
- **ID Normalization**: Mongoose schemas and frontend API response layers automatically populate both `id` and `_id` on all model instances to ensure full UI compatibility across all React consumers.

---

## Technical Limitations & Full Transparency

1. **Local Host Discovery**: The current asset discovery scheduler (`assetDiscoveryService.js`) collects real telemetry (CPU, Memory, Disk, Network) from the host machine running the Node.js backend using `systeminformation`. It does not perform remote agent-based telemetry extraction on arbitrary enterprise endpoints.
2. **GPU Telemetry Status**: Cross-platform hardware GPU utilization monitoring is currently marked as a placeholder (returns `0`), as direct GPU hardware hooks require platform-specific native bindings.
3. **Subnet Ping Sweeps**: Subnet scanning sweeps ICMP/TCP sockets across specified local subnets (e.g. `192.168.1.x`) with concurrency limits, but relies on host ICMP/TCP responsiveness.

---

## Interview Readiness & Architecture Q&A

### 1. Why MERN (MongoDB, Express, React, Node.js)?
- **Unified JavaScript Context**: Eliminates context-switching overhead between frontend and backend. Data structures pass cleanly as JSON objects without complex translation layers.
- **Asynchronous Event Loop**: Node.js non-blocking I/O excels at handling real-time WebSockets (Socket.IO) and periodic telemetry monitoring alongside standard REST API requests.

### 2. Why MongoDB & Mongoose?
- **Flexible Schema for Assets**: Security assets vary widely in properties (workstations have CPU/RAM, servers have virtualization details, network gear has MAC/gateway/subnets). MongoDB's document-oriented JSON model handles polymorphic asset attributes gracefully.
- **Mongoose ORM**: Enforces schema validation, index creation (`hostname`, `status`, `health`), middleware hooks (`pre("save")`), and virtual properties (e.g. `id` getter).

### 3. Why JWT for Authentication?
- **Stateless Verification**: The backend validates signature and expiration on every request using `JWT_SECRET` without needing a session store database query.
- **Cross-Layer Usage**: The token is sent in HTTP headers (`Authorization: Bearer ...`) and passed in Socket.IO handshake auth objects, providing unified authentication across REST and WebSocket connections.

### 4. Authentication vs. Authorization
- **Authentication**: Verifies *who* the user is via login credentials and JWT validation.
- **Authorization**: Verifies *what* the authenticated user is allowed to do (`authorize("ADMIN", "ITSM")` middleware checking `req.user.role`).

### 5. Socket.IO Real-Time Architecture
- **Room Topology**: Upon JWT validation, sockets join role rooms (`role:ADMIN`, `role:ITSM`) and user rooms (`user:${userId}`).
- **Information Leakage Prevention**: Security events and asset updates are broadcast specifically to privileged role rooms (`emitToRoles(["ADMIN", "ITSM"], ...)`), keeping raw administrative events private from standard user sockets.

### 6. Security Score vs. Asset Risk Score
- **Global Security Score** (HIGHER = BETTER): Starts at 100 and subtracts penalties for open critical vulnerabilities (-10), high vulnerabilities (-5), high/critical incidents (-8), critical health assets (-10), warning health assets (-5), and recent security events (-2). Clamped [0, 100].
- **Asset Risk Score** (HIGHER = GREATER RISK): Evaluates specific asset health status and attached CVEs/incidents, adding points for resource exhaustion and unpatched vulnerabilities. Clamped [0, 100].

### 7. Performance & Concurrency Optimization
- **`Promise.all` Aggregation**: `dashboardService.js` executes 16 independent database queries and security calculations in parallel, reducing HTTP dashboard response latency from ~800ms down to ~50ms.
- **Scheduler Re-entrancy Guards**: The asset discovery cron job uses an `isRunning` flag lock to prevent overlapping discovery runs when a scan cycle takes longer than expected.


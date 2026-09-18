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

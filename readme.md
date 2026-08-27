# MiniPlane ✈️

> A high-performance, developer-first project management system inspired by Plane and Linear. Built with TypeScript, Node.js, Express, PostgreSQL, Prisma, and React 19.

---

## 🌟 Overview

**MiniPlane** is a modern issue-tracking and engineering workspace management tool designed to streamline sprint planning, task prioritization, team collaboration, and project velocity tracking.

### ✨ Key Features:
- 🔐 **Authentication & Security**: JWT-based session auth, bcrypt password hashing, auth rate-limiting (`express-rate-limit`), secure password reset flow via Mailtrap SMTP.
- 🏢 **Multi-Tier RBAC**: Workspace Roles (`ADMIN`, `MEMBER`) and granular Project Roles (`ADMIN`, `MEMBER`, `VIEWER`) with auto-admin override and zero-leak `404` unauthorized protections.
- ⚡ **Atomic Concurrency Key Generation**: Sequence keys (`TECH-1`, `TECH-2`, `WEB-14`) generated atomically inside Prisma `$transaction` blocks to prevent race conditions.
- 📊 **Dynamic Dashboard & Progress Charts**: Compact at-a-glance dashboard with SVG animated Velocity Donut Charts (Projects & Personal workloads), quick metrics, and priority ticket feeds.
- 💬 **Comments & Activity Timelines**: Real-time audit logs tracking field modifications (state, priority, assignee) and threaded markdown discussion comments.
- 🎨 **Modern SaaS UI & Dark Mode**: Aurora night-theme, glassmorphism card layouts, floating interactive search modals, and responsive mobile-ready viewports.

---

## 🏗️ Architecture & Monorepo Layout

```
Plane project/
├── server/                 # Express REST API (TypeScript + Prisma + PostgreSQL)
│   ├── prisma/             # Prisma Schema & Database Seeder
│   ├── src/
│   │   ├── controllers/    # Request handlers & JSON responses
│   │   ├── middleware/     # Auth, RBAC, Rate-limiting, Error Handlers
│   │   ├── routes/         # Express routing definitions
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── services/       # Core business logic & Prisma DB operations
│   │   └── lib/            # Mailer, Permissions, Auth tokens, AppError
│   └── tests/              # Vitest + Supertest integration test suite
│
├── web/                    # React 19 Frontend (Vite + React Query + Lucide)
│   ├── src/
│   │   ├── components/     # UI Components, Modals, Donut Chart, Layouts
│   │   ├── context/        # Toast Notifications & Theme Providers
│   │   ├── features/       # API clients, Queries, and Mutations
│   │   ├── pages/          # Dashboard, Projects, Members, MyTickets, Settings, Auth
│   │   ├── store/          # Redux Toolkit store & slices
│   │   └── styling/        # Aurora Night CSS tokens, Layouts, and Animations
│
├── .agents/                # Project Specs, Guidelines, and PR Documentation
└── docker-compose.yml      # Local PostgreSQL 16 container setup
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express, TypeScript, PostgreSQL 16, Prisma ORM, Zod, JWT, bcrypt, Nodemailer |
| **Frontend** | React 19, Vite, TypeScript, TanStack React Query v5, Redux Toolkit, Lucide React, CSS3 Glassmorphism |
| **Testing** | Vitest, Supertest, Prisma Client Testing |
| **Tools** | Docker Compose, Mailtrap SMTP |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **Docker**: For running PostgreSQL locally
- **npm** or **pnpm**

### 2. Database Configuration (Docker)
Start the PostgreSQL container:
```bash
docker compose up -d
```

### 3. Backend Setup (`server/`)
```bash
cd server
npm install

# Setup environment file
cp .env.example .env

# Run Prisma database migrations and seed default data
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```
*Backend runs on `http://localhost:5000`*
*Interactive Swagger API Playground runs at `http://localhost:5000/api-docs`*

### 4. Frontend Setup (`web/`)
```bash
cd ../web
npm install

# Start Vite frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Environment Variables

### `server/.env`
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/miniplane?schema=public"
JWT_SECRET="super-secret-jwt-key-for-development"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"

# Mailtrap SMTP for Password Resets
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-username"
SMTP_PASS="your-mailtrap-password"
SMTP_FROM="no-reply@miniplane.io"
FRONTEND_URL="http://localhost:5173"
```

## 📡 API Reference Summary

For a fully comprehensive endpoints breakdown, Zod schemas, HTTP status scenarios, and JSON request/response payload examples, see the detailed [API Documentation Reference](file:///d:/Plane%20project/API_DOCUMENTATION.md).

### Authentication (`/api/v1/auth`)
- `POST /register` — Create a new user account & join default workspace
- `POST /login` — Authenticate credentials & receive JWT token (Rate limited)
- `GET /me` — Get current logged-in user profile & workspace role
- `POST /forgot-password` — Send 1-hour secure password reset email via Mailtrap
- `POST /reset-password` — Verify reset token & update user password

### Projects (`/api/v1/projects`)
- `GET /` — List accessible projects with issue counts and current user role
- `POST /` — Create a project and initialize its default 5 issue states (`Backlog`, `Todo`, `In Progress`, `Done`, `Cancelled`)
- `GET /:projectId` — Fetch project details
- `PATCH /:projectId` — Update project name/description (Admin only)
- `POST /:projectId/archive` — Archive project
- `POST /:projectId/unarchive` — Restore archived project
- `DELETE /:projectId` — Soft-delete project

### Issues / Tickets (`/api/v1/issues` & `/api/v1/projects/:projectId/issues`)
- `GET /projects/:projectId/issues` — Flat list or grouped issue view (`?groupBy=state`)
- `POST /projects/:projectId/issues` — Create issue with atomic sequence key (`TECH-1`)
- `GET /issues/:issueId` — Get single issue with assignee, state, comments, and activities
- `PATCH /issues/:issueId` — Update issue properties & log timeline activities
- `DELETE /issues/:issueId` — Soft-delete issue (`deletedAt`)
- `GET /me/issues` — List all open tickets assigned to the logged-in user

### Comments & Audit Logs
- `GET /issues/:issueId/comments` — List comments for an issue
- `POST /issues/:issueId/comments` — Add a discussion comment
- `PATCH /issues/:issueId/comments/:commentId` — Edit author's comment
- `DELETE /issues/:issueId/comments/:commentId` — Delete comment
- `GET /issues/:issueId/activities` — Fetch audit activity log

---

## 🧪 Testing

Run backend automated test suite (concurrency locks, permissions, RBAC):
```bash
cd server
npm test
```

Type-checking verification:
```bash
# Backend
cd server && npx tsc --noEmit

# Frontend
cd web && npx tsc -b
```

---

## 📜 License
MIT License. Built for engineering teams seeking fast, distraction-free sprint management.

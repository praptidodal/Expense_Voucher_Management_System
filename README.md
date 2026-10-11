# Expense Desk — Corporate Expense Voucher Management System

A full-stack web application for managing employee expense voucher submissions, director approvals, and accounts-team auditing (provisional product name: **Expense Desk**).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Roles and Access](#roles-and-access)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Database Setup (MySQL)](#database-setup-mysql)
7. [Environment Configuration](#environment-configuration)
8. [Database Migrations](#database-migrations)
9. [Running the Application](#running-the-application)
10. [Test Accounts (Development Only)](#test-accounts-development-only)
11. [REST API Reference](#rest-api-reference)
12. [Voucher Lifecycle](#voucher-lifecycle)
13. [Validation Rules](#validation-rules)
14. [Project Structure](#project-structure)
15. [Known Limitations](#known-limitations)

---

## Project Overview

**Expense Desk** enables:

- **Employees** to create, save, and submit expense vouchers with a digital signature.
- **Directors** to review submitted vouchers and approve or reject them with a mandatory signature or rejection reason.
- **Accounts** staff to audit all vouchers across the organization in a unified workspace.

All access is role-protected via JWT-based authentication. The application is built as a decoupled frontend (React) and backend (Express) with Prisma ORM and a local MySQL database.

---

## Roles and Access

| Role | Workspace Route | Capabilities |
|---|---|---|
| `EMPLOYEE` | `/vouchers` | Create, edit, delete **draft** vouchers; submit own vouchers; view own vouchers only |
| `DIRECTOR` | `/director` | View all org vouchers; approve submitted vouchers (director signature required); reject with mandatory reason |
| `ACCOUNTS` | `/accounts` | View all org vouchers (read-only); search, filter, sort; view approval and rejection metadata |

---

## Features

### Authentication
- Email and password login with JWT access tokens (`7d` expiry)
- Passwords stored as bcrypt hashes (cost factor 12)
- Token validated on every request via `Authorization: Bearer <token>` header
- `/api/auth/me` endpoint validates session and returns user profile
- Role-based redirects on login (each role lands on their own workspace)

### Employee Workspace
- Create expense vouchers (draft or direct submit)
- Save drafts — multiple save steps allowed before submission
- Upload an employee signature image (PNG or JPEG, max 2 MB, magic-byte validated)
- Submit a draft — voucher becomes immutable on submission
- Edit or delete own draft vouchers; no modification after submission
- List only own vouchers; cannot see other employees' vouchers

### Director Dashboard
- KPI summary cards: Total, Pending, Approved, Rejected
- Sortable and searchable voucher table
- Review each submitted voucher's full details
- Approve with a director signature image upload (PNG/JPEG, 2 MB limit)
- Reject with a mandatory rejection reason text
- Transitions are validated: cannot approve a draft, cannot re-approve/re-reject a decided voucher

### Accounts Dashboard
- View all organization vouchers — all statuses, all employees
- Search by voucher number, employee name, or title
- Filter by status (All / Pending / Approved / Rejected) and department
- Sort by date, amount, or status
- View full voucher details including both signature panels, approval date, and rejection reason
- Strictly read-only — no create, edit, delete, submit, approve, or reject

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router DOM v7 |
| UI | Lucide React icons, custom CSS design system |
| Backend | Node.js, Express 4, TypeScript |
| ORM | Prisma 6 (MySQL provider) |
| Database | MySQL 8 |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| File handling | Node.js `fs`, base64 decoding, magic-byte validation |

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **MySQL** 8.x running locally (or accessible via network)
- A MySQL user with privileges to create databases and tables

---

## Database Setup (MySQL)

Connect to MySQL and create the database:

```sql
CREATE DATABASE IF NOT EXISTS expense_voucher_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Grant access to your MySQL user (replace as needed)
GRANT ALL PRIVILEGES ON expense_voucher_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Environment Configuration

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

**`backend/.env.example`:**

```env
PORT=5050
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/expense_voucher_db"

JWT_SECRET=replace_with_a_secure_random_secret_in_production
```

> **Never commit `backend/.env`.** It is listed in `.gitignore`. Use a strong random string for `JWT_SECRET` in any environment beyond local development.

---

## Database Migrations

From the `backend/` directory, run Prisma migrations to create the schema:

```bash
cd backend
npx prisma migrate deploy
```

Or in development, push the schema directly:

```bash
npx prisma db push
```

Generate the Prisma Client after any schema change:

```bash
npx prisma generate
```

To seed development test accounts:

```bash
npm run seed
```

---

## Running the Application

### Backend

```bash
cd backend
npm install
npm run build
node dist/index.js
# Listens on http://localhost:5050
```

For development with hot-reload:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Listens on http://localhost:5173 (or the next available port)
```

Both servers must be running simultaneously. The frontend calls the backend at `http://localhost:5050/api`.

---

## Test Accounts (Development Only)

> ⚠️ These credentials are for local development only. Remove or rotate them before any production or shared deployment.

| Email | Role | Password |
|---|---|---|
| `employee@prachay.com` | `EMPLOYEE` | `Password@123` |
| `director@prachay.com` | `DIRECTOR` | `Password@123` |
| `accounts@prachay.com` | `ACCOUNTS` | `Password@123` |

Seed these accounts using `npm run seed` from the `backend/` directory.

---

## REST API Reference

All routes (except `/api/health`) require a valid JWT sent as:

```
Authorization: Bearer <token>
```

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Login — returns `{ token, user }` |
| `GET` | `/api/auth/me` | Any | Returns the authenticated user's profile |

### Vouchers

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/api/vouchers` | DIRECTOR, ACCOUNTS | List all org vouchers (supports `search`, `status`, `department`, `sortBy`, `sortOrder` query params) |
| `GET` | `/api/vouchers/my` | EMPLOYEE | List the authenticated employee's own vouchers |
| `GET` | `/api/vouchers/:id` | Any (ownership enforced for EMPLOYEE) | Get a single voucher by ID |
| `POST` | `/api/vouchers` | EMPLOYEE | Create a voucher (body: `action: 'draft' | 'submit'`) |
| `PUT` | `/api/vouchers/:id` | EMPLOYEE | Update a draft voucher (body: `action: 'draft' | 'submit'`) |
| `DELETE` | `/api/vouchers/:id` | EMPLOYEE | Delete a draft voucher |
| `POST` | `/api/vouchers/:id/submit` | EMPLOYEE | Submit a draft voucher (validates all required fields) |
| `POST` | `/api/vouchers/:id/approve` | DIRECTOR | Approve a submitted voucher (body: `directorSignaturePath`) |
| `POST` | `/api/vouchers/:id/reject` | DIRECTOR | Reject a submitted voucher (body: `rejectionReason`) |

### Signatures

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/api/vouchers/upload-signature` | EMPLOYEE, DIRECTOR | Upload signature image (body: `fileData` as base64 data URL) |
| `GET` | `/api/signatures/:filename` | Any authenticated | Retrieve a stored signature image |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Server health check |

---

## Voucher Lifecycle

```
CREATE (EMPLOYEE)
      │
      ▼
   [DRAFT] ──── edit / delete (EMPLOYEE only) ──── [DRAFT]
      │
      │  submit (all required fields + employee signature)
      ▼
 [SUBMITTED]
      │
   ┌──┴──┐
   │     │
   ▼     ▼
[APPROVED] [REJECTED]
(Director  (Director
 signature  rejection
 required)  reason
             required)
```

- Only **DRAFT** vouchers can be edited or deleted.
- Once **SUBMITTED**, the voucher is locked for the employee.
- **APPROVED** and **REJECTED** are terminal states — no further transitions are permitted.
- The Director cannot approve a DRAFT, re-approve an APPROVED, or re-reject a REJECTED voucher.

---

## Validation Rules

### Voucher Submission Requirements

| Field | Rule |
|---|---|
| `title` | Required, non-empty string |
| `department` | Required, non-empty string |
| `expenseDate` | Required, valid date |
| `amount` | Required, positive number greater than zero |
| `employeeSignaturePath` | Required — must upload a signature before submitting |

### Signature Upload

- Format: PNG or JPEG only (validated by file magic bytes, not file extension)
- Maximum size: 2 MB
- Filenames are server-generated UUIDs; user-supplied filenames are ignored
- Stored in `backend/uploads/signatures/` (excluded from version control)
- Served via authenticated endpoint to prevent unauthorized access

### Director Approval

- `directorSignaturePath` is required and must be a valid non-empty string

### Director Rejection

- `rejectionReason` is required and must be a non-empty string

---

## Project Structure

```
Expense_Voucher_Management_System/
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example               # Environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (User, Voucher models)
│   │   └── seed.ts                # Dev-only test account seeder
│   └── src/
│       ├── index.ts               # Express app entry point
│       ├── config/env.ts          # Environment variable loading
│       ├── db/prisma.ts           # Prisma client singleton
│       ├── middleware/auth.ts     # authenticateToken + requireRole middleware
│       ├── routes/
│       │   ├── auth.ts            # /api/auth routes
│       │   ├── health.ts          # /api/health route
│       │   └── voucher.ts         # /api/vouchers + /api/signatures routes
│       ├── controllers/
│       │   ├── auth.ts            # Login, /me handlers
│       │   └── voucher.ts         # Full CRUD + approve/reject + signature upload
│       ├── types/auth.ts          # JwtPayload, express Request augmentation
│       └── utils/voucherNumber.ts # Sequential voucher number generator
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                # Route definitions + RoleBasedRedirect
│       ├── main.tsx
│       ├── api/
│       │   ├── authApi.ts         # login(), getMe()
│       │   └── voucherApi.ts      # All voucher API client functions
│       ├── context/
│       │   ├── AuthContext.tsx    # JWT storage, user state, login/logout
│       │   └── useAuth.ts         # useAuth() hook
│       ├── types/
│       │   ├── auth.ts            # User, Role types
│       │   └── voucher.ts         # Voucher, DirectorStats interfaces
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppHeader.tsx  # Nav bar with role-aware links
│       │   │   └── PageContainer.tsx
│       │   ├── routing/
│       │   │   └── ProtectedRoute.tsx  # Auth + role guard
│       │   ├── ui/                # Button, Card, Badge, Input, etc.
│       │   └── vouchers/
│       │       └── AuthenticatedSignatureImage.tsx
│       └── pages/
│           ├── LoginPage.tsx              # Role-aware post-login redirect
│           ├── NotFoundPage.tsx
│           ├── employee/
│           │   ├── EmployeeVouchersPage.tsx  # Employee voucher list
│           │   ├── VoucherFormPage.tsx       # Create / edit voucher form
│           │   └── VoucherDetailsPage.tsx    # Employee voucher detail view
│           ├── director/
│           │   ├── DirectorDashboardPage.tsx     # Director KPI + voucher table
│           │   └── DirectorVoucherReviewPage.tsx # Approve / reject form
│           └── accounts/
│               ├── AccountsDashboardPage.tsx     # Accounts KPI + search/filter table
│               └── AccountsVoucherDetailsPage.tsx # Read-only voucher detail
│
└── docs/
    ├── Full_Stack_Developer_Internship_Assignment_PSPL.pdf
    └── implementation-plan.md
```

---

## Known Limitations

- **No email notifications.** Employees are not notified when their voucher is approved or rejected.
- **No pagination.** All vouchers are returned in a single response. For large datasets, server-side pagination should be added.
- **Signature image storage is local.** Uploaded images are stored in `backend/uploads/signatures/`. A cloud object store (e.g. S3) would be needed for multi-server deployments.
- **JWT tokens are not revocable.** Logging out only removes the token from `localStorage`. A token blocklist or refresh-token pattern would be needed for production.
- **No HTTPS.** The development setup uses plain HTTP. HTTPS via a reverse proxy (nginx, Caddy) is required before any deployment.
- **Single MySQL instance.** There is no read replica, connection pooling (e.g. PgBouncer), or failover configured.
- **No audit log.** There is no record of who changed a voucher's status or when intermediate edits occurred.
- **Test accounts use a shared password.** This is intentional for local development only and must be changed before any shared or production deployment.

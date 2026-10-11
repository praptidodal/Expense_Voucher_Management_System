# Expense Desk — Corporate Expense Voucher Management System

Expense Desk is a full-stack corporate finance web application designed to digitize and govern the employee expense reimbursement lifecycle. The system enforces strict role-based access control (RBAC), end-to-end data integrity, cryptographic/digital signature capture, immutable post-submission records, and dedicated audit capabilities across three organizational roles: **Employee**, **Director**, and **Accounts**.

---

## Table of Contents

1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Role-Based Features](#2-role-based-features)
3. [Technology Stack](#3-technology-stack)
4. [Prerequisites](#4-prerequisites)
5. [Database Setup (MySQL)](#5-database-setup-mysql)
6. [Database Schema Documentation](#6-database-schema-documentation)
7. [Environment Configuration](#7-environment-configuration)
8. [Database Migrations & Seeding](#8-database-migrations--seeding)
9. [Development Test Accounts](#9-development-test-accounts)
10. [Running the Application](#10-running-the-application)
11. [REST API Reference](#11-rest-api-reference)
12. [Voucher Lifecycle & Validation Rules](#12-voucher-lifecycle--validation-rules)
13. [Project Directory Structure](#13-project-directory-structure)
14. [Known Limitations](#14-known-limitations)

---

## 1. Project Overview & Problem Statement

Manual and spreadsheet-based corporate expense management processes often suffer from:
- Lack of auditability and lost physical receipts or signatures.
- Missing approval hierarchies, allowing improper expense authorizations.
- Accidental tampering with expense amounts and line items after submission.
- Fragmented visibility between employees, approving executives, and finance auditors.

**Expense Desk** addresses these challenges by implementing:
- A multi-tier state machine (`DRAFT` → `SUBMITTED` → `APPROVED` / `REJECTED`).
- Server-side immutability: once submitted, expense details cannot be modified or deleted.
- Mandatory digital signature image capture (validated via magic bytes) for both employee submission and director approval.
- Mandatory, audited rejection remarks when a claim is declined.
- Segregated, role-specific workspaces preventing privilege escalation.

---

## 2. Role-Based Features

### Employee Workspace (`/vouchers`)
- **KPI Summary Cards (6):** Total Claims, Drafts, Pending Approval, Approved, Rejected Claims, and Total Amount Claimed.
- **Draft Management:** Create, save, edit, and delete draft expense vouchers across multiple sessions.
- **Signature Capture:** Upload a handwritten signature image (PNG or JPEG, up to 2 MB) before submission.
- **Submission:** Validate all required fields and submit. The voucher transitions to `SUBMITTED` and becomes permanently locked against edits or deletions.
- **Scoped Visibility:** Employees can access and view only their own expense claims.
- **Filtering & Reset:** Filter vouchers by category with single-click reset.

### Director Dashboard (`/director`)
- **KPI Summary Cards (5):** Pending Approval Count, Approved Today, Rejected Today, Total Pending Amount, and Total Vouchers.
- **Organization-Wide Review Queue:** Inspect all submitted vouchers across departments with employee details, receipt descriptions, and employee signature.
- **Approval Workflow:** Approve claims with mandatory Director digital signature upload and recorded timestamp.
- **Rejection Workflow:** Reject claims with mandatory structured rejection remarks.
- **State Protection:** Terminal validation prevents re-approving, re-rejecting, or deciding on unsubmitted drafts.
- **Multi-Criteria Search & Filter:** Filter by department, category, date range (`startDate` to `endDate`), amount range (`minAmount` to `maxAmount`), and keyword search.
- **Recent Voucher Activity:** Instant quick-toggle view for recent organizational decisions.

### Accounts Workspace (`/accounts`)
- **KPI Summary Cards (5):** Total Vouchers, Pending Approval, Approved Vouchers, Rejected Vouchers, and Total Approved Expense Amount.
- **Audit & Reimbursement Inspection:** Unified read-only access to all vouchers across all statuses and departments.
- **Signature & Audit Inspection:** Inspect employee signatures, director signatures, approval timestamps, and rejection reasons.
- **Strict Read-Only Enforcement:** Accounts staff cannot create, edit, delete, submit, approve, or reject vouchers (guaranteed at both UI and API middleware levels).
- **Advanced Filtering & Sorting:** Filter by status, department, category, date range, amount range, keyword search, and column sorting.
- **Recent Approved Vouchers:** Quick-toggle view dedicated to recently approved claims ready for payout.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | 19.2 | Component-driven user interface |
| **Language (Frontend)** | TypeScript | 5.8+ | Strict client-side typing |
| **Build Tool & Bundler** | Vite | 8.3 | Hot Module Replacement (HMR) and optimized production bundling |
| **Routing** | React Router DOM | 7.18 | Role-based declarative routing and navigation guards |
| **Icons & Styling** | Lucide React / Modern CSS | 1.55 | Corporate finance oatmeal/navy design system |
| **Backend Runtime** | Node.js | 18+ (tested v24) | Server-side JavaScript runtime |
| **Backend Framework** | Express | 4.21 | RESTful API routing and middleware pipeline |
| **Language (Backend)** | TypeScript | 5.8+ | Server-side static typing and compile-time checks |
| **ORM** | Prisma | 6.4 | Type-safe schema definition, migrations, and query generation |
| **Database** | MySQL | 8.0+ | Relational persistence with ACID compliance |
| **Authentication** | JWT (`jsonwebtoken`) | 9.0 | Stateless bearer token authentication (7-day validity) |
| **Password Hashing** | `bcryptjs` | 3.0 | Salted password hashing (cost factor 10-12) |
| **File Processing** | Node.js `fs` | Native | Base64 decode and magic-byte signature validation |

---

## 4. Prerequisites

Before setting up the project, ensure your environment has:
- **Node.js:** v18.0.0 or later (recommended: Node.js LTS or v20+)
- **npm:** v9.0.0 or later
- **MySQL:** v8.0 or later running locally (or reachable over network)

---

## 5. Database Setup (MySQL)

Log in to your MySQL server (via MySQL CLI, MySQL Workbench, or your preferred client):

```sql
-- Create database with utf8mb4 encoding
CREATE DATABASE IF NOT EXISTS expense_voucher_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create/grant permissions to your application user (adjust credentials as needed)
CREATE USER IF NOT EXISTS 'expense_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON expense_voucher_db.* TO 'expense_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 6. Database Schema Documentation

The relational database schema is managed via Prisma ORM with MySQL. It consists of two relational models (`users`, `vouchers`) and two enums (`Role`, `VoucherStatus`).

### 6.1 Enums

#### `Role`
| Value | Description |
|---|---|
| `EMPLOYEE` | Standard staff member; can author, edit drafts, and submit own vouchers |
| `DIRECTOR` | Executive reviewer; can view all organization vouchers, approve with signature, or reject |
| `ACCOUNTS` | Finance auditor; read-only access to all organization claims for verification |

#### `VoucherStatus`
| Value | Description |
|---|---|
| `DRAFT` | Editable work-in-progress voucher owned by the creating employee |
| `SUBMITTED` | Locked voucher awaiting Director decision |
| `APPROVED` | Terminal state; authorized by Director with signature and approval date |
| `REJECTED` | Terminal state; declined by Director with mandatory rejection reason |

---

### 6.2 Table: `users` (Model: `User`)

Stores identity credentials, organizational roles, and department assignments.

| Field | Database Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `VARCHAR(191)` | No | `uuid()` | Primary Key (UUID v4) |
| `name` | `VARCHAR(191)` | No | None | Employee full name |
| `email` | `VARCHAR(191)` | No | None | Unique login email address (`UNIQUE INDEX`) |
| `passwordHash` | `VARCHAR(191)` | No | None | Bcrypt-hashed password |
| `role` | `ENUM(Role)` | No | `'EMPLOYEE'` | Access role (`EMPLOYEE`, `DIRECTOR`, `ACCOUNTS`) |
| `department` | `VARCHAR(191)` | Yes | `NULL` | Assigned organizational department |
| `createdAt` | `DATETIME(3)` | No | `now()` | Record creation timestamp |
| `updatedAt` | `DATETIME(3)` | No | Auto-updated | Record modification timestamp |

- **Primary Key:** `PRIMARY KEY (id)`
- **Unique Constraints:** `UNIQUE INDEX (email)`
- **Relationships:** One-to-many with `vouchers` (`User.vouchers` → `Voucher.employeeId`).

---

### 6.3 Table: `vouchers` (Model: `Voucher`)

Stores expense voucher headers, line amounts, approval metadata, and file paths.

| Field | Database Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `VARCHAR(191)` | No | `uuid()` | Primary Key (UUID v4) |
| `voucherNumber` | `VARCHAR(191)` | No | None | Sequential tracking code e.g. `EV-YYYYMMDD-XXXX` (`UNIQUE INDEX`) |
| `employeeId` | `VARCHAR(191)` | No | None | Foreign Key referencing `users(id)` |
| `voucherDate` | `DATETIME(3)` | No | `now()` | Date the voucher was created |
| `expenseDate` | `DATETIME(3)` | No | None | Date the actual expense was incurred |
| `department` | `VARCHAR(191)` | No | None | Department against which the claim is filed |
| `title` | `VARCHAR(191)` | No | None | Brief title / summary of expense |
| `category` | `VARCHAR(191)` | Yes | `NULL` | Expense category (Travel, Meals, Office Supplies, etc.) |
| `description` | `TEXT` | Yes | `NULL` | Detailed business justification / notes |
| `amount` | `DECIMAL(12, 2)` | No | None | Claimed expense amount in INR (positive value) |
| `employeeSignaturePath` | `VARCHAR(191)` | Yes | `NULL` | Relative storage path to employee signature image |
| `status` | `ENUM(VoucherStatus)` | No | `'DRAFT'` | Current workflow status (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`) |
| `directorSignaturePath` | `VARCHAR(191)` | Yes | `NULL` | Relative storage path to director approval signature image |
| `approvalDate` | `DATETIME(3)` | Yes | `NULL` | Timestamp when Director approved the voucher |
| `rejectionReason` | `TEXT` | Yes | `NULL` | Mandatory remarks recorded upon rejection |
| `createdAt` | `DATETIME(3)` | No | `now()` | Record creation timestamp |
| `updatedAt` | `DATETIME(3)` | No | Auto-updated | Record modification timestamp |

- **Primary Key:** `PRIMARY KEY (id)`
- **Unique Constraints:** `UNIQUE INDEX (voucherNumber)`
- **Foreign Key:** `FOREIGN KEY (employeeId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes:**
  - `INDEX (employeeId)`: Fast lookup for employee's own vouchers.
  - `INDEX (status)`: Fast filtering by voucher workflow state.
  - `INDEX (expenseDate)`: Fast date-range queries.
  - `INDEX (department)`: Fast department-level filtering.

---

## 7. Environment Configuration

### 7.1 Backend Configuration (`backend/.env`)

Copy the template from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Define values according to your local environment:

```env
# Server Port & Environment
PORT=5050
NODE_ENV=development

# Allowed CORS Origins (comma-separated frontend origins)
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175

# MySQL Database Connection String
DATABASE_URL="mysql://expense_user:your_secure_password@localhost:3306/expense_voucher_db"

# JWT Authentication Secret
JWT_SECRET=replace_with_a_secure_random_secret_in_production
```

> **Security Note:** `backend/.env` is excluded by `.gitignore`. Never commit production credentials or production JWT secrets to source control.

### 7.2 Frontend Configuration (`frontend/.env`)

Copy the template from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

```env
# Base URL for Backend API
VITE_API_BASE_URL=http://localhost:5050/api
```

---

## 8. Database Migrations & Seeding

All commands below should be executed from the `backend/` directory:

1. **Apply Prisma Migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   *(For development database prototyping, `npx prisma db push` may also be used.)*

2. **Generate the Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Seed Initial Test Users:**
   ```bash
   npm run seed
   ```

---

## 9. Development Test Accounts

> ⚠️ **DEVELOPMENT AND LOCAL TESTING ONLY**  
> The following accounts are provisioned exclusively for local verification and grading. In production deployments, change or remove these accounts.

| Role | Email Address | Password | Name | Department |
|---|---|---|---|---|
| `EMPLOYEE` | `employee@prachay.com` | `Password@123` | Aditi Sharma | Engineering |
| `DIRECTOR` | `director@prachay.com` | `Password@123` | Rajesh Mehta | Executive Leadership |
| `ACCOUNTS` | `accounts@prachay.com` | `Password@123` | Suresh Patel | Finance & Accounts |

---

## 10. Running the Application

### 10.1 Running the Backend

```bash
cd backend
npm install

# Compile TypeScript
npm run build

# Start production server (port 5050)
npm start
```

*For local development with auto-reloading:*
```bash
npm run dev
```

### 10.2 Running the Frontend

```bash
cd frontend
npm install

# Start Vite development server (port 5173 or next available)
npm run dev
```

*To build and preview the frontend for production:*
```bash
npm run build
npm run preview
```

Open your browser at `http://localhost:5173` (or the URL printed by Vite).

---

## 11. REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` HTTP header containing a valid JWT.

### 11.1 Authentication Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate with `{ email, password }`, returns JWT and user profile |
| `GET` | `/api/auth/me` | Authenticated | Validate session and retrieve current authenticated user details |

### 11.2 Voucher Management Endpoints

| Method | Endpoint | Required Role | Purpose |
|---|---|---|---|
| `GET` | `/api/vouchers/my` | `EMPLOYEE` | Retrieve all vouchers created by the authenticated employee |
| `GET` | `/api/vouchers` | `DIRECTOR`, `ACCOUNTS` | Retrieve organization vouchers (supports query parameters below) |
| `GET` | `/api/vouchers/:id` | Authenticated | Retrieve complete details of a single voucher (ownership enforced for employees) |
| `POST` | `/api/vouchers` | `EMPLOYEE` | Create a voucher (body: `action: 'draft' \| 'submit'`) |
| `PUT` | `/api/vouchers/:id` | `EMPLOYEE` | Update a `DRAFT` voucher (cannot modify submitted vouchers) |
| `DELETE` | `/api/vouchers/:id` | `EMPLOYEE` | Delete a `DRAFT` voucher (cannot delete submitted vouchers) |
| `POST` | `/api/vouchers/:id/submit` | `EMPLOYEE` | Submit a draft voucher for Director review (requires signature) |
| `POST` | `/api/vouchers/:id/approve` | `DIRECTOR` | Approve submitted voucher with `{ directorSignaturePath }` |
| `POST` | `/api/vouchers/:id/reject` | `DIRECTOR` | Reject submitted voucher with `{ rejectionReason }` |

#### Supported Query Parameters for `GET /api/vouchers`:
- `search`: Keyword search matching voucher number, title, employee name, or department.
- `status`: Filter by status (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`).
- `department`: Filter by specific department name.
- `category`: Filter by expense category (e.g., `Travel`, `Meals`, `Equipment`).
- `startDate` & `endDate`: Filter by expense date range (`YYYY-MM-DD`).
- `minAmount` & `maxAmount`: Filter by amount range.
- `sortBy` & `sortOrder`: Sort by field (`expenseDate`, `amount`, `status`, `voucherNumber`) in `asc` or `desc` order.

### 11.3 Digital Signature & File Endpoints

| Method | Endpoint | Required Role | Purpose |
|---|---|---|---|
| `POST` | `/api/vouchers/upload-signature` | `EMPLOYEE`, `DIRECTOR` | Upload signature image payload as base64 data URL; returns stored relative path |
| `GET` | `/api/signatures/:filename` | Authenticated | Securely retrieve uploaded signature image files |

### 11.4 System Health Endpoint

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | System liveness probe returning status and server timestamp |

---

## 12. Voucher Lifecycle & Validation Rules

### 12.1 Lifecycle State Machine

```
   ┌─────────────────────────────────────────────────────────┐
   │                       EMPLOYEE                          │
   │                                                         │
   │  CREATE ──► [ DRAFT ] ◄───► EDIT / DELETE (Draft Only)  │
   │               │                                         │
   │               │ submit (validates fields + signature)   │
   │               ▼                                         │
   │         [ SUBMITTED ] (Permanently locked)              │
   └───────────────┬─────────────────────────────────────────┘
                   │
                   │ DIRECTOR REVIEW
                   ▼
         ┌───────────────────┐
         │                   │
         ▼                   ▼
   [ APPROVED ]        [ REJECTED ]
   (Requires Director  (Requires mandatory
    signature upload)   rejection reason)
```

### 12.2 Validation Rules

1. **Expense Line Validation:**
   - `title`: Mandatory non-empty string.
   - `department`: Mandatory non-empty string.
   - `expenseDate`: Mandatory valid ISO date.
   - `amount`: Mandatory positive numeric value (`> 0.00`).
2. **Submission Rule:**
   - Must contain an uploaded `employeeSignaturePath`.
   - Once submitted, employee-entered fields are strictly immutable across all roles.
3. **Approval Rule:**
   - Only `SUBMITTED` vouchers can be approved.
   - Must include a valid `directorSignaturePath`.
   - Transitions directly to terminal `APPROVED` status with timestamp.
4. **Rejection Rule:**
   - Only `SUBMITTED` vouchers can be rejected.
   - Must include non-empty `rejectionReason` text.
   - Transitions directly to terminal `REJECTED` status.
5. **Signature Image Integrity:**
   - Allowed formats: PNG (`89 50 4E 47`) and JPEG (`FF D8 FF`), verified by inspection of binary magic bytes.
   - Maximum upload size: 2 MB.
   - Filenames are generated server-side using secure UUIDs; client filenames are discarded.
   - Files are stored in `backend/uploads/signatures/` and served through authenticated routes only.

---

## 13. Project Directory Structure

```
Expense_Voucher_Management_System/
├── .gitignore                      # Git exclusion rules
├── README.md                       # Definitive documentation
│
├── backend/
│   ├── .env.example                # Backend environment template
│   ├── package.json                # Backend dependencies & scripts
│   ├── tsconfig.json               # Backend TypeScript configuration
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma relational schema
│   │   ├── seed.ts                 # Test accounts seeder
│   │   └── migrations/             # Versioned SQL migration history
│   └── src/
│       ├── index.ts                # Server bootstrap & port listener
│       ├── app.ts                  # Express app, middleware, route registration
│       ├── config/
│       │   └── env.ts              # Environment variable validation
│       ├── db/
│       │   └── prisma.ts           # PrismaClient database connection singleton
│       ├── middleware/
│       │   ├── auth.ts             # JWT authentication & requireRole guards
│       │   └── errorHandler.ts     # Global HTTP error handler
│       ├── routes/
│       │   ├── auth.ts             # /api/auth routes
│       │   ├── health.ts           # /api/health route
│       │   └── voucher.ts          # /api/vouchers & /api/signatures routes
│       ├── controllers/
│       │   ├── auth.ts             # Login & session controller
│       │   └── voucher.ts          # Voucher CRUD, decision, & signature handlers
│       ├── types/
│       │   └── auth.ts             # Auth & Express Request type definitions
│       └── utils/
│           └── voucherNumber.ts    # Sequential voucher number generator
│
└── frontend/
    ├── .env.example                # Frontend environment template
    ├── index.html                  # HTML shell
    ├── package.json                # Frontend dependencies & scripts
    ├── vite.config.ts              # Vite configuration
    ├── tsconfig.json               # Frontend TypeScript configuration
    ├── public/
    │   └── favicon.svg             # Application logo
    └── src/
        ├── main.tsx                # React DOM root entry point
        ├── App.tsx                 # Route declarations & role-based redirects
        ├── index.css               # Global CSS reset
        ├── styles/
        │   └── theme.css           # Design tokens, color palette, responsive grid
        ├── api/
        │   └── voucherApi.ts       # Typed voucher API client methods
        ├── config/
        │   └── api.ts              # API base URL configuration
        ├── context/
        │   ├── AuthContext.tsx     # Session state, JWT storage, login/logout
        │   ├── authContextDef.ts   # Context type definitions
        │   └── useAuth.ts          # useAuth custom hook
        ├── types/
        │   ├── auth.ts             # User & Role types
        │   └── voucher.ts          # Voucher, filter, & stats type definitions
        ├── components/
        │   ├── layout/             # AppHeader, AppLayout, PageContainer, SectionHeader
        │   ├── routing/            # ProtectedRoute role guard
        │   ├── ui/                 # Button, Card, Badge, Input, Select, Textarea
        │   └── vouchers/           # SignatureUploader, AuthenticatedSignatureImage
        └── pages/
            ├── LoginPage.tsx       # Corporate Sign In page
            ├── NotFoundPage.tsx    # 404 handler
            ├── employee/           # Voucher list, form, and detail views
            ├── director/           # Review dashboard and approval/rejection views
            └── accounts/           # Accounts audit dashboard and detail views
```

---

## 14. Known Limitations

The following items are verified design boundaries of the current implementation:
- **Local File Storage:** Uploaded signatures are stored on the local filesystem (`backend/uploads/signatures/`). A production cloud deployment with multiple server nodes would require an object storage service (such as AWS S3 or Google Cloud Storage).
- **Stateless JWT Tokens:** Authentication tokens are stateless with a 7-day expiration. Revocation prior to expiration (e.g., immediate token blacklisting upon logout) is not implemented.
- **Single-Page Table Loading:** All vouchers matching query filters are returned in a single response without cursor/offset pagination. For very large historical datasets, server-side pagination should be introduced.
- **Email Notifications:** The application does not dispatch email notifications upon submission, approval, or rejection. Status changes are communicated via real-time dashboard queries.
- **Transport Security:** Local development communicates over unencrypted HTTP. HTTPS termination via a reverse proxy (e.g., NGINX or Caddy) is required for production deployment.

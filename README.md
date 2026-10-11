# Expense Desk — Expense Voucher Management System

Expense Desk is a full-stack web application for managing corporate employee expense reimbursement vouchers. It provides a structured workflow across three organizational roles: **Employee**, **Director**, and **Accounts**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Roles, Screens, and Permissions](#2-roles-screens-and-permissions)
3. [Technology Stack](#3-technology-stack)
4. [Prerequisites](#4-prerequisites)
5. [MySQL Database Setup](#5-mysql-database-setup)
6. [Database Schema Documentation](#6-database-schema-documentation)
7. [Environment Configuration](#7-environment-configuration)
8. [Database Migrations and Seeding](#8-database-migrations-and-seeding)
9. [Development Test Accounts](#9-development-test-accounts)
10. [Running the Application](#10-running-the-application)
11. [REST API Reference](#11-rest-api-reference)
12. [Voucher Lifecycle and Validation Rules](#12-voucher-lifecycle-and-validation-rules)
13. [Assumptions Made During Development](#13-assumptions-made-during-development)
14. [Project Directory Structure](#14-project-directory-structure)

---

## 1. Project Overview

Expense Desk addresses common challenges in manual expense management, including lost paperwork, missing authorization checks, untracked modifications, and lack of visibility across departments.

The system provides:
- A clear voucher status workflow: `DRAFT` → `SUBMITTED` → `APPROVED` / `REJECTED`.
- Role-based access control ensuring users access only authorized screens and actions.
- Mandatory signature image uploads for employee submission and director approval.
- Mandatory rejection reason recording when a claim is declined.
- Post-submission immutability: employee-entered details cannot be edited or deleted once submitted.

---

## 2. Roles, Screens, and Permissions

### Employee (`/vouchers`)
- **Required Screens:**
  - **Dashboard & My Vouchers (`/vouchers`):** Summary metrics, personal voucher list, status filters, search, and category filter.
  - **Create Voucher (`/vouchers/new`):** Expense details entry, draft saving, signature image upload, and submission.
  - **Voucher Details (`/vouchers/:id`):** View submitted voucher details, employee signature image, status, and rejection reason if applicable.
  - **Edit Draft Voucher (`/vouchers/:id/edit`):** Edit existing draft vouchers prior to submission.
- **Permissions:**
  - Can view only their own vouchers.
  - Can create, save, edit, and delete draft vouchers.
  - Can submit draft vouchers with an uploaded signature image.
  - Cannot edit or delete vouchers once submitted or decided.

### Director (`/director`)
- **Required Screens:**
  - **Dashboard (`/director`):** Summary metrics (pending review, approved today, rejected today, pending amount, total vouchers).
  - **Pending Approvals & All Vouchers (`/director`):** Organization-wide voucher list with status tabs, department, category, date, and amount range filters.
  - **Voucher Details & Review (`/director/vouchers/:id`):** Review employee claim, inspect employee signature image, approve with director signature image, or reject with a reason.
- **Permissions:**
  - Can view all submitted vouchers across all employees and departments.
  - Can approve submitted vouchers (requires director signature image upload).
  - Can reject submitted vouchers (requires non-empty rejection reason).
  - Cannot modify employee-entered voucher information.
  - Cannot act on draft vouchers or re-decide already approved/rejected vouchers.

### Accounts (`/accounts`)
- **Required Screens:**
  - **Dashboard (`/accounts`):** Summary metrics (total vouchers, pending approval, approved count, rejected count, total approved amount).
  - **All Vouchers (`/accounts`):** Organization-wide auditing table with search, status, department, category, date range, and amount range filters.
  - **Voucher Details (`/accounts/vouchers/:id`):** Read-only inspection of vouchers, including employee signature image, director signature image, approval date, and rejection reason.
- **Permissions:**
  - Read-only access across the entire organization.
  - Cannot create, edit, delete, submit, approve, or reject vouchers.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 19.2 | User interface components |
| Language (Frontend) | TypeScript | 5.8+ | Static typing for client code |
| Bundler & Dev Server | Vite | 8.3 | Build tool and development server |
| Routing | React Router DOM | 7.18 | Client-side routing and protected route guards |
| UI Icons & Styling | Lucide React / CSS | 1.55 | UI icons and custom responsive design system |
| Backend Runtime | Node.js | 20.19+ or 22.12+ | Server execution environment |
| Backend Framework | Express | 4.21 | RESTful API routing and middleware |
| Language (Backend) | TypeScript | 5.8+ | Static typing for server code |
| ORM | Prisma | 6.4 | Database schema management and queries |
| Database | MySQL | 8.0+ | Relational data persistence |
| Authentication | JSON Web Tokens (`jsonwebtoken`) | 9.0 | Stateless bearer token authentication |
| Password Hashing | `bcryptjs` | 3.0 | Secure password hashing |
| File Handling | Node.js `fs` | Native | Local storage and binary magic-byte validation |

---

## 4. Prerequisites

- **Node.js:** `20.19+` or `22.12+` (consistent with Vite 8 requirements)
- **npm:** `10+`
- **MySQL:** `8.0+` running locally or accessible via network

---

## 5. MySQL Database Setup

Log in to MySQL and create the database:

```sql
CREATE DATABASE IF NOT EXISTS expense_voucher_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'expense_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON expense_voucher_db.* TO 'expense_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 6. Database Schema Documentation

The database schema is defined in `backend/prisma/schema.prisma` and managed via Prisma migrations.

### 6.1 Enums

- **`Role`:** `EMPLOYEE`, `DIRECTOR`, `ACCOUNTS`
- **`VoucherStatus`:** `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`

### 6.2 Table: `users` (Model: `User`)

| Field | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `VARCHAR(191)` | No | `uuid()` | Primary Key |
| `name` | `VARCHAR(191)` | No | — | User full name |
| `email` | `VARCHAR(191)` | No | — | Unique login email (`UNIQUE INDEX`) |
| `passwordHash` | `VARCHAR(191)` | No | — | Bcrypt password hash |
| `role` | `ENUM(Role)` | No | `'EMPLOYEE'` | Role assignment |
| `department` | `VARCHAR(191)` | Yes | `NULL` | Organizational department |
| `createdAt` | `DATETIME(3)` | No | `now()` | Record creation timestamp |
| `updatedAt` | `DATETIME(3)` | No | Auto | Record update timestamp |

- **Primary Key:** `PRIMARY KEY (id)`
- **Unique Constraints:** `UNIQUE INDEX (email)`
- **Relationships:** One-to-many with `vouchers` (`User.vouchers` → `Voucher.employeeId`).

### 6.3 Table: `vouchers` (Model: `Voucher`)

| Field | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `VARCHAR(191)` | No | `uuid()` | Primary Key |
| `voucherNumber` | `VARCHAR(191)` | No | — | Unique sequential number e.g. `EV-YYYYMMDD-XXXX` (`UNIQUE INDEX`) |
| `employeeId` | `VARCHAR(191)` | No | — | Foreign Key referencing `users(id)` |
| `voucherDate` | `DATETIME(3)` | No | `now()` | Voucher creation date |
| `expenseDate` | `DATETIME(3)` | No | — | Date of expense |
| `department` | `VARCHAR(191)` | No | — | Department for the claim |
| `title` | `VARCHAR(191)` | No | — | Expense title |
| `category` | `VARCHAR(191)` | Yes | `NULL` | Expense category |
| `description` | `TEXT` | Yes | `NULL` | Business justification notes |
| `amount` | `DECIMAL(12, 2)` | No | — | Claimed amount in INR (> 0) |
| `employeeSignaturePath` | `VARCHAR(191)` | Yes | `NULL` | Path to employee signature image file |
| `status` | `ENUM(VoucherStatus)` | No | `'DRAFT'` | Workflow status |
| `directorSignaturePath` | `VARCHAR(191)` | Yes | `NULL` | Path to director signature image file |
| `approvalDate` | `DATETIME(3)` | Yes | `NULL` | Approval timestamp |
| `rejectionReason` | `TEXT` | Yes | `NULL` | Reason text if rejected |
| `createdAt` | `DATETIME(3)` | No | `now()` | Record creation timestamp |
| `updatedAt` | `DATETIME(3)` | No | Auto | Record update timestamp |

- **Primary Key:** `PRIMARY KEY (id)`
- **Unique Constraints:** `UNIQUE INDEX (voucherNumber)`
- **Foreign Key:** `FOREIGN KEY (employeeId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
- **Indexes:**
  - `INDEX (employeeId)`: Employee voucher lookups
  - `INDEX (status)`: Status filtering
  - `INDEX (expenseDate)`: Date range queries
  - `INDEX (department)`: Department queries

---

## 7. Environment Configuration

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=5050
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
DATABASE_URL="mysql://expense_user:your_password@localhost:3306/expense_voucher_db"
JWT_SECRET=replace_with_a_secure_random_secret_in_production
```

- `PORT`: Server port (default: `5050`).
- `JWT_SECRET`: Secret key used for signing JWTs.
- `JWT_EXPIRES_IN`: Optional token lifetime (defaults to `24h` if not set).

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_BASE_URL=http://localhost:5050/api
```

---

## 8. Database Migrations and Seeding

Run the following commands from the `backend/` directory:

1. **Apply Migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
3. **Seed Initial Test Users:**
   ```bash
   npm run seed
   ```

---

## 9. Development Test Accounts

> **Development & Evaluation Only:** These test accounts are pre-seeded for local evaluation.

| Role | Email | Password | Name | Department |
|---|---|---|---|---|
| `EMPLOYEE` | `employee@prachay.com` | `Password@123` | Aditi Sharma | Engineering |
| `DIRECTOR` | `director@prachay.com` | `Password@123` | Rajesh Mehta | Executive Leadership |
| `ACCOUNTS` | `accounts@prachay.com` | `Password@123` | Suresh Patel | Finance & Accounts |

---

## 10. Running the Application

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

For development mode with hot reload:
```bash
npm run dev
```
The backend listens on `http://localhost:5050`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For production build and preview:
```bash
npm run build
npm run preview
```
The frontend listens on `http://localhost:5173` (or the next open Vite port).

---

## 11. REST API Reference

All protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates user; returns `{ token, user }` |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile |

### Vouchers

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/vouchers/my` | `EMPLOYEE` | List authenticated employee's vouchers |
| `GET` | `/api/vouchers` | `DIRECTOR`, `ACCOUNTS` | List organization vouchers (supports query parameters) |
| `GET` | `/api/vouchers/:id` | Authenticated | Retrieve voucher details (ownership enforced for Employee) |
| `POST` | `/api/vouchers` | `EMPLOYEE` | Create voucher (`action: 'draft' \| 'submit'`) |
| `PUT` | `/api/vouchers/:id` | `EMPLOYEE` | Update draft voucher |
| `DELETE` | `/api/vouchers/:id` | `EMPLOYEE` | Delete draft voucher |
| `POST` | `/api/vouchers/:id/submit` | `EMPLOYEE` | Submit draft voucher (requires signature) |
| `POST` | `/api/vouchers/:id/approve` | `DIRECTOR` | Approve voucher (`{ directorSignaturePath }`) |
| `POST` | `/api/vouchers/:id/reject` | `DIRECTOR` | Reject voucher (`{ rejectionReason }`) |

**Supported query parameters for `GET /api/vouchers`:**
`search`, `status`, `department`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy`, `sortOrder`.

### Signatures & Health

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/vouchers/upload-signature` | `EMPLOYEE`, `DIRECTOR` | Upload base64 signature image; returns relative path |
| `GET` | `/api/signatures/:filename` | Authenticated | Retrieve stored signature image file |
| `GET` | `/api/health` | Public | Liveness probe returning `{ status, timestamp }` |

---

## 12. Voucher Lifecycle and Validation Rules

### Lifecycle Workflow

```
[ DRAFT ] ──(Submit with signature)──► [ SUBMITTED ]
   │                                         │
   ├─ Edit Draft                             ├─► [ APPROVED ] (with Director signature)
   └─ Delete Draft                           └─► [ REJECTED ] (with Rejection reason)
```

### Validation Rules

1. **Voucher Fields:** `title`, `department`, and `expenseDate` are mandatory. `amount` must be a positive number greater than 0.
2. **Submission:** Requires an uploaded employee signature image. Once submitted, employee-entered fields are immutable.
3. **Director Approval:** Allowed only on `SUBMITTED` vouchers; requires an uploaded director signature image.
4. **Director Rejection:** Allowed only on `SUBMITTED` vouchers; requires a non-empty `rejectionReason`.
5. **Signature Image Requirements:**
   - Supported formats: PNG and JPEG only, verified via binary magic bytes (`89 50 4E 47` for PNG, `FF D8 FF` for JPEG).
   - Maximum file size: 2 MB.
   - Files are stored on the server filesystem in `backend/uploads/signatures/` with server-generated UUID names.

---

## 13. Assumptions Made During Development

1. **Draft Modifiability:** Employees may edit or delete vouchers only while in `DRAFT` status. Once submitted, vouchers cannot be edited or deleted by anyone.
2. **Mandatory Signatures:** Employee signature image is required at submission; Director signature image is required at approval.
3. **Mandatory Rejection Remarks:** Rejecting a voucher strictly requires a non-empty textual reason explaining the decision.
4. **Local File Storage:** Uploaded signature images are stored locally on the server filesystem under `backend/uploads/signatures/`.
5. **Token Lifetime:** JWT tokens default to `24h` expiration unless overridden by `JWT_EXPIRES_IN`.
6. **Sequential Voucher Numbering:** Voucher numbers follow the format `EV-YYYYMMDD-XXXX`, where `XXXX` is a sequential zero-padded index for that date.
7. **Development Credentials:** Pre-seeded test accounts and shared passwords (`Password@123`) are provided solely for development and evaluation.

---

## 14. Project Directory Structure

```
Expense_Voucher_Management_System/
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── app.ts
│       ├── index.ts
│       ├── config/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── routes/
│       ├── types/
│       └── utils/
│
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── public/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── api/
        ├── components/
        ├── config/
        ├── context/
        ├── pages/
        ├── styles/
        └── types/
```

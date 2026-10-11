# Prachay Group Expense Voucher Management System
## Master Implementation Plan & Phase Roadmap

---

## 1. Project Overview & Architecture

The **Prachay Group Expense Voucher Management System** is an enterprise-grade corporate finance web application designed to digitize manual expense voucher reimbursement workflows. The system establishes a strict, role-governed lifecycle spanning voucher creation, multi-tier status tracking, director-level authorization with cryptographic/image signature capture, rejection remark recording, and Accounts team reimbursement auditing.

### 1.1 Architecture & Tech Stack

| Layer | Technology | Key Responsibilities |
|---|---|---|
| **Frontend** | React 19, Vite, TypeScript, React Router DOM v7, Lucide React, Tailwind / Modern CSS | Responsive corporate finance UI, role-based routing, interactive dashboards, dynamic search/filter controls, modal/canvas signature & upload handlers, client-side validation |
| **Backend** | Node.js, Express.js, TypeScript, ts-node-dev | Secure RESTful API, JWT authentication, role-based access control (RBAC), voucher business rule state machine, file upload processing & sanitization |
| **Database & ORM** | MySQL with Prisma ORM | Relational schema integrity, ACID compliance, unique sequence generator for voucher numbers, audit timestamping, indexing on lookup keys |
| **Storage** | Secure Local Static Uploads (with MIME/magic-byte validation) | Storage for employee and director signature image assets, served via authenticated or sanitized static routes |
| **Testing & QA** | TypeScript Compiler (`tsc`), ESLint, Vitest/Jest (API/unit), Supertest, manual end-to-end verification suites | Automated regression prevention, rigorous manual acceptance testing prior to every git commit |

---

## 2. Core Working Principles & Git Workflow

### 2.1 Principle: Single-Feature Granularity
- **Build, test, commit, and push one feature at a time.**
- No phase or multi-feature batching.
- Every feature represents an isolated, verifiable unit of work with clear automated checks and manual testing steps.

### 2.2 Git Branching & Remote Policy
- **Integration Branch:** `main` (strictly stable, deployable).
- **Branch Naming Standard:** `feature/<feature-name>` (e.g., `feature/backend-foundation`, `feature/database-schema`).
- **Feature Lifecycle:**
  1. Verify clean working tree (`git status`).
  2. Confirm prior feature branch is merged.
  3. Fetch and rebase/pull latest `main`.
  4. Create feature branch from latest `main`.
  5. Implement changes strictly within the defined feature scope.
  6. Execute automated verification (`lint`, `type-check`, `build`, `tests`).
  7. Conduct interactive manual testing following reproduction steps.
  8. Present git status, diff, and proposed semantic commit message for explicit approval.
  9. Commit upon approval.
  10. Push and submit PR (when remote is configured and approved).
  11. Await review and merge confirmation before beginning the next branch.
- **Remote Pre-Condition:** The repository currently has no remote configured and has no initial commit. Initial repository baseline commit and remote linking will be performed with explicit user consent before Phase 1 commences.

---

## 3. Comprehensive Feature Roadmap & Branch Strategy

The implementation is structured into 6 sequential phases comprising focused, atomic feature branches.

```mermaid
flowchart TD
    subgraph Phase 0: Baseline & Plan
        P0[Phase 0: Inspection & Implementation Plan]
    end

    subgraph Phase 1: Foundations
        F1[feature/repo-baseline] --> F2[feature/backend-foundation]
        F2 --> F3[feature/database-schema]
    end

    subgraph Phase 2: Authentication & RBAC
        F3 --> F4[feature/auth-backend]
        F4 --> F5[feature/auth-frontend]
    end

    subgraph Phase 3: Core Employee Voucher Lifecycle
        F5 --> F6[feature/voucher-create-draft]
        F6 --> F7[feature/employee-signature-upload]
        F7 --> F8[feature/voucher-submit-workflow]
        F8 --> F9[feature/employee-voucher-management]
    end

    subgraph Phase 4: Director Approval & Rejection Workflow
        F9 --> F10[feature/director-pending-queue]
        F10 --> F11[feature/director-approval-signature]
        F11 --> F12[feature/director-rejection-remarks]
    end

    subgraph Phase 5: Accounts Audit & Advanced Analytics
        F12 --> F13[feature/accounts-voucher-view]
        F13 --> F14[feature/search-filter-bonus]
        F14 --> F15[feature/role-dashboards]
        F15 --> F16[feature/voucher-print-export]
    end

    subgraph Phase 6: Production Polish & Documentation
        F16 --> F17[feature/final-polishing-docs]
    end

    P0 --> F1
```

---

### Detailed Feature Breakdown

#### Phase 1: Repository Baseline & Foundational Infrastructure
---

##### Feature 1.1: Repository Baseline Commit
- **Branch Name:** `feature/repo-baseline`
- **Objective:** Establish the clean initial commit on `main` containing project structure, updated `.gitignore`, and documentation.
- **Included Scope:**
  - Standardize `.gitignore` for node_modules, build artifacts, `.env`, uploads, and macOS metadata.
  - Track `frontend/` initial template and `docs/implementation-plan.md`.
  - Ensure zero tracked secret or artifact files.
- **Excluded Scope:**
  - Backend source implementation, database migrations.
- **Acceptance Criteria:**
  - Working tree is clean.
  - Initial commit successfully recorded on `main` upon approval.
- **Automated Tests:**
  - `cd frontend && npm run lint && npm run build` (Must pass with 0 errors).

##### Feature 1.2: Backend Project Setup & Foundation
- **Branch Name:** `feature/backend-foundation`
- **Objective:** Initialize Node.js + Express + TypeScript backend scaffold with strict typing, configuration handling, error middlewares, and health-check endpoint.
- **Included Scope:**
  - `backend/package.json` with Express, TypeScript, ts-node-dev, dotenv, cors, helmet, zod.
  - `backend/tsconfig.json` with strict type checking.
  - Centralized application configuration (`src/config/index.ts`).
  - Standardized JSON response handler and global error-handling middleware.
  - Base server bootstrap and `/api/health` route.
- **Excluded Scope:**
  - Database connection, authentication routes, business controllers.
- **Acceptance Criteria:**
  - `GET /api/health` returns `200 OK` with JSON `{ status: "ok", timestamp: ... }`.
  - Backend builds with zero TypeScript errors.
- **Automated Tests:**
  - `npm run build` in `backend` succeeds.
  - Supertest / curl check on `/api/health`.

##### Feature 1.3: Database Schema & Prisma Configuration
- **Branch Name:** `feature/database-schema`
- **Objective:** Design and generate the relational database schema using Prisma ORM with MySQL provider, enforcing constraints, enums, indices, and relationships.
- **Included Scope:**
  - `backend/prisma/schema.prisma` defining `User`, `Role` enum (`EMPLOYEE`, `DIRECTOR`, `ACCOUNTS`), `Voucher`, `VoucherStatus` enum (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`), `AuditLog`.
  - Fields for basic details (Voucher Number, Expense Title, Description, Date, Department, Amount), Employee signature path, Director signature path, rejection reason, approval date.
  - Prisma client generation script and database connection utility.
  - Seed script (`prisma/seed.ts`) creating test users for each role.
- **Excluded Scope:**
  - API route handlers, frontend consumption.
- **Acceptance Criteria:**
  - Prisma schema validates (`npx prisma validate`).
  - Database schema applies cleanly via migrations or db push.
  - Seed script successfully populates baseline roles/users.
- **Automated Tests:**
  - `npx prisma validate` passes.
  - Seed execution exits with code 0.

---

#### Phase 2: Authentication & Role-Based Access Control (RBAC)
---

##### Feature 2.1: Authentication & Authorization Backend
- **Branch Name:** `feature/auth-backend`
- **Objective:** Implement secure user authentication with password hashing (bcrypt), JWT issuance, and RBAC middleware.
- **Included Scope:**
  - `POST /api/auth/login` endpoint validating credentials and issuing JWT.
  - `GET /api/auth/me` to retrieve authenticated session and role.
  - `authenticateToken` middleware verifying JWT signatures.
  - `requireRole(roles: Role[])` middleware blocking unauthorized access with 403 Forbidden.
- **Excluded Scope:**
  - User registration (users are seeded corporate accounts), UI login screen.
- **Acceptance Criteria:**
  - Valid credentials return signed JWT and user profile (name, role, department).
  - Invalid credentials return 401 Unauthorized with clean message.
  - RBAC middleware blocks non-permitted roles with 403 Forbidden.
- **Automated Tests:**
  - Integration tests verifying login success, login failure, and role gating.

##### Feature 2.2: Frontend Authentication & Route Guarding
- **Branch Name:** `feature/auth-frontend`
- **Objective:** Implement the corporate login interface, authentication context/store, and role-based protected routes.
- **Included Scope:**
  - Corporate login UI with email/password input, loading states, and error alerts.
  - `AuthContext` maintaining current user, token, and role.
  - `ProtectedRoute` component redirecting unauthenticated users to `/login` and unauthorized roles to a dedicated 403 screen.
  - Role-adaptive top navigation bar with user badge and logout action.
- **Excluded Scope:**
  - Voucher screens.
- **Acceptance Criteria:**
  - Logging in as Employee, Director, or Accounts routes to respective dashboard.
  - Directly navigating to protected URLs without authentication redirects to `/login`.
  - Token persists across page reloads (localStorage / secure cookie).
- **Automated Tests:**
  - `npm run lint` and `npm run build` in `frontend`.

---

#### Phase 3: Employee Voucher Lifecycle (Creation, Draft, Signature, Submission)
---

##### Feature 3.1: Voucher Creation & Draft Management Backend
- **Branch Name:** `feature/voucher-create-draft`
- **Objective:** Implement backend endpoints for creating vouchers, auto-generating unique Voucher Numbers, saving as Draft, and modifying/deleting Drafts.
- **Included Scope:**
  - Unique Voucher Number generation algorithm (`EV-YYYYMMDD-XXXX`).
  - `POST /api/vouchers` (creates voucher with status `DRAFT`).
  - `GET /api/vouchers/my-vouchers` (returns only vouchers where `employeeId == req.user.id`).
  - `GET /api/vouchers/:id` (verifies ownership or elevated role).
  - `PUT /api/vouchers/:id` (strictly allows update ONLY if status is `DRAFT` and user is owner).
  - `DELETE /api/vouchers/:id` (strictly allows delete ONLY if status is `DRAFT` and user is owner).
- **Excluded Scope:**
  - Submission workflow, file uploads.
- **Acceptance Criteria:**
  - New voucher defaults to `DRAFT`.
  - Employee cannot edit or delete vouchers created by other users or vouchers not in `DRAFT` status.
  - Input validations enforced (Department, Expense Title, Expense Date, Amount > 0).
- **Automated Tests:**
  - API tests covering draft creation, validation errors, and ownership enforcement.

##### Feature 3.2: Signature Upload & Media Handling
- **Branch Name:** `feature/employee-signature-upload`
- **Objective:** Implement secure image file upload handling for employee signatures (file input + optional digital signature pad canvas).
- **Included Scope:**
  - Multer upload configuration with strict file size limit (e.g., 2MB) and MIME-type validation (`image/png`, `image/jpeg`, `image/webp`).
  - Secure static serving or controlled retrieval endpoint for uploaded signatures.
  - Frontend signature upload component supporting image drag-and-drop and instant preview.
- **Excluded Scope:**
  - Director approval signature (Phase 4).
- **Acceptance Criteria:**
  - Non-image files or files exceeding size limits are rejected with 400 Bad Request.
  - Successfully uploaded image returns secure file URL/path.
- **Automated Tests:**
  - File upload unit tests verifying allowed/disallowed extensions.

##### Feature 3.3: Voucher Submission Workflow
- **Branch Name:** `feature/voucher-submit-workflow`
- **Objective:** Implement the transition from `DRAFT` to `SUBMITTED` (`PENDING_APPROVAL`), validating that employee signature is present before submission.
- **Included Scope:**
  - `POST /api/vouchers/:id/submit` endpoint.
  - Validation: Employee signature is mandatory before submission.
  - State change: Status transitions from `DRAFT` to `SUBMITTED`.
  - Immutability enforcement: Once submitted, the voucher cannot be edited or deleted by the employee.
- **Excluded Scope:**
  - Director approvals.
- **Acceptance Criteria:**
  - Submitting without signature fails with 422 Unprocessable Entity.
  - Submitted voucher immediately transitions to read-only for the employee.
- **Automated Tests:**
  - API tests confirming status transition and post-submission immutability.

##### Feature 3.4: Employee Voucher Frontend UI
- **Branch Name:** `feature/employee-voucher-management`
- **Objective:** Build Employee screens: Create Voucher, Edit Draft, My Vouchers list, and Voucher Details view.
- **Included Scope:**
  - "Create Voucher" form with real-time validation, date picker, amount formatting, and signature uploader.
  - "My Vouchers" table displaying voucher number, date, title, amount, status badge, and action buttons.
  - "Edit Draft" view accessible only for draft items.
  - "Voucher Details" view displaying read-only audit details, employee signature, and current workflow status.
- **Excluded Scope:**
  - Director and Accounts screens.
- **Acceptance Criteria:**
  - Employee sees only their own vouchers.
  - Edit and Delete actions are visible and active ONLY for `DRAFT` vouchers.
  - Submitted vouchers display status badge ("Pending Approval") with no edit controls.
- **Automated Tests:**
  - Frontend lint and build pass.

---

#### Phase 4: Director Approval & Rejection Workflow
---

##### Feature 4.1: Director Pending Queue & Voucher List
- **Branch Name:** `feature/director-pending-queue`
- **Objective:** Implement backend endpoints and frontend views for the Director to monitor all vouchers across the company with dedicated Pending Approval queue.
- **Included Scope:**
  - `GET /api/vouchers/all` (accessible by Director and Accounts).
  - `GET /api/vouchers/pending` (filtered to `SUBMITTED` status).
  - Director Pending Approval list UI and All Vouchers review table.
  - Read-only protection: Director cannot edit employee-entered voucher details (amount, title, date).
- **Excluded Scope:**
  - Approval and rejection mutation actions.
- **Acceptance Criteria:**
  - Director can view all vouchers across all employees.
  - Employee details are displayed immutably.
- **Automated Tests:**
  - RBAC verification that employees cannot access `/api/vouchers/all`.

##### Feature 4.2: Director Approval with Signature Backend & UI
- **Branch Name:** `feature/director-approval-signature`
- **Objective:** Implement voucher approval workflow requiring Director signature image upload and recording approval date.
- **Included Scope:**
  - `POST /api/vouchers/:id/approve` endpoint accepting Director signature file/data.
  - Validation: Director signature is mandatory before approval.
  - State transition: Status becomes `APPROVED`, `approvalDate = now()`.
  - Frontend Approval Modal with signature file upload/pad and confirmation dialog.
- **Excluded Scope:**
  - Rejection workflow.
- **Acceptance Criteria:**
  - Approval without Director signature is rejected by backend with 422 Unprocessable Entity.
  - Approved voucher stores Director signature and timestamp.
  - Approved voucher transitions to permanently immutable status.
- **Automated Tests:**
  - Integration tests for approval flow and signature validation.

##### Feature 4.3: Director Rejection with Mandatory Remarks
- **Branch Name:** `feature/director-rejection-remarks`
- **Objective:** Implement voucher rejection workflow requiring mandatory rejection reasons.
- **Included Scope:**
  - `POST /api/vouchers/:id/reject` endpoint requiring non-empty `rejectionReason`.
  - State transition: Status becomes `REJECTED`.
  - Frontend Rejection Modal with reason input and validation.
  - Rejection remark display on Voucher Details view for both Director and Employee.
- **Excluded Scope:**
  - Accounts reimbursement actions.
- **Acceptance Criteria:**
  - Rejection without reason fails with 422 Unprocessable Entity.
  - Employee can view the exact rejection reason on their voucher details screen.
- **Automated Tests:**
  - API tests confirming rejection without reason is rejected, and with reason succeeds.

---

#### Phase 5: Accounts Audit, Advanced Search & Analytics Dashboards
---

##### Feature 5.1: Accounts Team Audit & Monitoring View
- **Branch Name:** `feature/accounts-voucher-view`
- **Objective:** Implement Accounts team dashboard and voucher inspection interface with strict read-only guarantees.
- **Included Scope:**
  - Accounts voucher list showing all vouchers with approval status, employee details, and approved reimbursement amounts.
  - Comprehensive Voucher Details modal/page displaying both Employee signature and Director approval signature.
  - Strict server-side and client-side guards preventing Accounts users from mutating (creating, editing, deleting, approving) vouchers.
- **Excluded Scope:**
  - Search and filter logic (Feature 5.2).
- **Acceptance Criteria:**
  - Accounts users can view all organization vouchers.
  - Accounts users have 0 mutation capabilities (attempting POST/PUT/DELETE returns 403).
  - Signatures of both parties are clearly rendered.
- **Automated Tests:**
  - Supertest assertions that Accounts role cannot perform create, edit, approve, or reject.

##### Feature 5.2: Multi-Criteria Search & Filter Engine (Bonus Point)
- **Branch Name:** `feature/search-filter-bonus`
- **Objective:** Implement enterprise search, filtering, and sorting across backend endpoints and frontend data tables.
- **Included Scope:**
  - Query parameters supported on voucher list endpoints:
    - `search` (Voucher Number, Employee Name, Expense Title)
    - `department`
    - `category`
    - `status` (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`)
    - `dateFrom` & `dateTo`
    - `minAmount` & `maxAmount`
    - `sortBy` & `sortOrder`
  - Dynamic UI filter bar with instant debounce, reset filters button, and sortable table columns.
- **Excluded Scope:**
  - PDF/Print export.
- **Acceptance Criteria:**
  - Filtering by status, department, and date range returns accurate subsets.
  - Empty search results display friendly "No vouchers found" state.
- **Automated Tests:**
  - Backend query tests verifying filter combinations.

##### Feature 5.3: Role-Specific Executive Dashboards
- **Branch Name:** `feature/role-dashboards`
- **Objective:** Implement specialized executive KPI metric cards and activity feeds tailored to each role.
- **Included Scope:**
  - **Employee Dashboard:** Total Vouchers, Draft Vouchers, Pending Approval, Approved Vouchers, Rejected Vouchers, Total Amount Claimed (scoped to user).
  - **Director Dashboard:** Pending Approval Count, Approved Today, Rejected Today, Total Pending Amount, Recent Voucher Activity (organization-wide).
  - **Accounts Dashboard:** Total Vouchers, Pending Approval, Approved Vouchers, Rejected Vouchers, Total Approved Expense Amount, Recent Approved Vouchers (organization-wide).
  - Backend `/api/dashboard/stats` endpoint returning role-calculated metrics with single aggregation query.
- **Excluded Scope:**
  - Print/export.
- **Acceptance Criteria:**
  - Metric calculations match exact database totals.
  - Employee metrics never leak organizational totals.
- **Automated Tests:**
  - Metric aggregation tests against seeded data.

##### Feature 5.4: Voucher Print & Download (Optional/Bonus)
- **Branch Name:** `feature/voucher-print-export`
- **Objective:** Provide print-optimized format and downloadable voucher summary for corporate recordkeeping.
- **Included Scope:**
  - CSS `@media print` print-ready voucher invoice template.
  - "Print / Save as PDF" button on Voucher Details screen for Accounts and Director.
  - Clean corporate layout with header, company info, breakdown table, and dual signature blocks.
- **Excluded Scope:**
  - External paid PDF generation services.
- **Acceptance Criteria:**
  - Triggering print opens browser print preview with cleanly formatted expense voucher sheet.
- **Automated Tests:**
  - Frontend lint and build verification.

---

#### Phase 6: Production Polish, Security Audit & Documentation
---

##### Feature 6.1: End-to-End Polish, Security Hardening & Documentation
- **Branch Name:** `feature/final-polishing-docs`
- **Objective:** Complete end-to-end regression testing, security review, clean sample data scripts, `.env.example`, and comprehensive `README.md`.
- **Included Scope:**
  - Security hardening: Helmet headers, rate limiting, sanitization.
  - Error boundary components and toast notification system.
  - `.env.example` files for backend and frontend.
  - Root `README.md` with:
    - Architecture diagram and project overview
    - Step-by-step local setup instructions
    - Database schema diagrams and Prisma migration guide
    - Complete REST API documentation with sample request/response payloads
    - Business rules and explicit assumptions
    - Test credentials for all three roles
- **Acceptance Criteria:**
  - Zero lint, type-check, or build errors across backend and frontend.
  - All assignment PDF requirements fulfilled with 100% adherence.
- **Automated Tests:**
  - Complete workspace lint, typecheck, and test pass.

---

## 4. Rigorous Quality & Security Matrix

### 4.1 Backend-Enforced Security Guarantees
1. **Zero Client Trust:** All authorization and business checks occur in backend middlewares and service layers, never solely in React state.
2. **Tenant & Data Isolation:** Employees are strictly scoped by `req.user.id`. SQL/Prisma queries enforce `WHERE employeeId = currentUser.id`.
3. **State Machine Immutability:**
   - `DRAFT`: Editable/deletable only by owner.
   - `SUBMITTED`: Read-only to owner. Director cannot edit details, only approve/reject.
   - `APPROVED` / `REJECTED`: Permanently locked from modifications.
4. **Signature File Security:**
   - Validate file headers / MIME-types (not just extensions).
   - Enforce 2MB file size ceiling.
   - Store with randomized UUID filenames to prevent path traversal and overwriting.
5. **Rejection Remarks:** Enforce non-empty string trimmed validation on rejection.

---

## 5. Environment & Dependencies Analysis

### 5.1 Environment Prerequisites
- **Node.js:** v24.17.0 (Installed)
- **npm:** 11.13.0 (Installed)
- **Git:** 2.50.1 (Installed, initialized on `main`)
- **Database:** MySQL (Assignment specifies MySQL with Prisma ORM).

### 5.2 Database Configuration Strategy
- Since MySQL is required by the project specifications, we will provide a standard `.env.example` configured for MySQL (`mysql://user:password@localhost:3306/expense_voucher_db`).
- In environments where a local MySQL server is not running or during local offline testing, we can provide a smooth switch mechanism (e.g. Docker compose or Prisma SQLite fallback for local verification if preferred by user).

---

## 6. Unresolved Questions & Business Rule Confirmations

Before starting implementation in Phase 1, the following design decisions are documented for user alignment:

1. **Database Server Choice:**
   - Does the local development machine already have a running MySQL service (or Docker container), or should we configure a Docker Compose for MySQL / offer SQLite during early development before pointing to MySQL?
2. **GitHub Remote Configuration:**
   - The current repository does not have a `git remote` configured. Would you like to create and link a remote GitHub repository now, or complete the initial local commits first?
3. **Digital Signature Input Mechanism:**
   - Should the system support image file upload exclusively (PNG/JPG of physical signature), or also an interactive HTML5 canvas signature pad where users can draw their signature and save as an image? (The assignment specifies "Image Upload", supporting both provides a superior user experience).
4. **Expense Categories & Departments:**
   - Proposed default corporate departments: *Engineering, Finance, Marketing, Operations, Human Resources, Sales*.
   - Proposed default expense categories: *Travel, Meals & Entertainment, Office Supplies, Software & Subscriptions, Training & Certifications, Client Hospitality, Miscellaneous*.

---

## 7. Immediate Next Step: Phase 0 Approval

Upon your review and explicit approval of this Master Implementation Plan, we will proceed to:
1. Initialize the baseline git commit on `main` (`feature/repo-baseline` or baseline commit).
2. Configure git remote if you provide the repository URL.
3. Begin Feature 1.2 (`feature/backend-foundation`).

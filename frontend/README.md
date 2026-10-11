# Prachay Group — Expense Voucher Management System (Frontend)

Enterprise corporate finance frontend application for the Expense Voucher Management System, built with React, Vite, TypeScript, and Lucide React.

## Current Stage

- **Phase:** Phase 1 — Shared Frontend Foundation & UI System
- **Status:** Core design tokens, typography, layout primitives, and accessible form controls are established. Full voucher workflow, authentication, routing, and backend integrations will be implemented in subsequent phases.

## Technology Stack

- **Framework:** React 19 (TypeScript)
- **Bundler & Tooling:** Vite 8
- **Routing:** React Router DOM v7 (installed for upcoming navigation phases)
- **Icons:** Lucide React
- **Linter & Type Checker:** ESLint 10, TypeScript 5.8+

## Prerequisites

- Node.js >= 20.x (tested on v24.17.0)
- npm >= 10.x (tested on 11.13.0)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run local development server:**
   ```bash
   npm run dev
   ```
   Open the displayed localhost URL (default: `http://localhost:5173` or `http://localhost:5175`).

3. **Run code linter:**
   ```bash
   npm run lint
   ```

4. **Run TypeScript build & bundle check:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## Directory Structure

```
frontend/
├── public/                 # Static assets (corporate favicon)
├── src/
│   ├── components/
│   │   ├── layout/         # AppHeader, PageContainer, SectionHeader
│   │   └── ui/             # Button, Card, StatusBadge, FormGroup, Input, Select, Textarea
│   ├── styles/             # theme.css (tokens, typography, corporate palette)
│   ├── App.tsx             # Design system foundation showcase screen
│   ├── index.css           # Global reset and theme import
│   └── main.tsx            # Application entry point
├── eslint.config.js        # ESLint flat config
├── index.html              # HTML shell
├── package.json            # Scripts & dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

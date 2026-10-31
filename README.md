# FinOS – AI-Powered Financial Intelligence Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald.svg)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-blue.svg)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-indigo.svg)](https://prisma.io)
[![Accounting](https://img.shields.io/badge/Accounting-Ind%20AS%20%2F%20Schedule%20III-teal.svg)](https://mca.gov.in)
[![Hackathon](https://img.shields.io/badge/Hackathon-Production%20Ready-purple.svg)](https://github.com)

**FinOS** is an enterprise-grade AI financial intelligence, automated bank reconciliation, and cash flow governance platform built for Indian enterprises, startups, and growing businesses.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **SQLite** (with seamless PostgreSQL migration support), **SheetJS (`xlsx`)**, and **Recharts**.

---

## 🏆 Hackathon Demonstration Status: Stages 1–6 Fully Complete

FinOS has been developed across 6 rigorous stages with **100% verified functionality** (no static mockups, no fabricated AI figures, deterministic double-entry calculations):

- **Stage 1**: Enterprise Financial Dashboard, Multi-Account Ledgers & Authentication
- **Stage 2**: Financial Data Management, Ingestion Pipeline (CSV/Excel) & Calculation Engine
- **Stage 3**: Automated Multi-Factor Bank Reconciliation & Duplicate Detection
- **Stage 4**: Deterministic Financial Risk Detection & Prophet-Style Cash Flow Forecasting
- **Stage 5**: Floating AI Financial Assistant, Verified Ledger Context & AI Recommendations
- **Stage 6**: Statutory Financial Reports, Schedule III P&L, SheetJS Multi-Sheet Excel & PDF Export, In-App Notifications & Security Hardening

---

## 🚀 Key Modules & Capabilities

### 1. Financial Reports & Audit Pack (`/reports`)
Generates 9 verified financial reports directly from database records:
1. **Daily Financial Summary**: Daily operational inflows, disbursements, transaction volume, and closing liquidity.
2. **Weekly Financial Summary**: 7-day rolling cash velocity, weekday distribution, and expense drivers.
3. **Monthly Financial Summary**: Consolidated performance, operating burn rate, runway impact, and category variances.
4. **Profit & Loss Report (Schedule III)**: Companies Act 2013 compliant format with EBITDA and tax provisions.
5. **Cash Flow Report (Ind AS 7 / AS-3)**: Operating, investing, and financing cash activities with opening/closing balances.
6. **Expense Analysis Report**: Departmental expenditure breakdown, average ticket size, and top payouts.
7. **Revenue Analysis Report**: Customer realization, top paying clients, and billing streams.
8. **Bank Reconciliation Statement (BRS)**: Bank statement vs general ledger comparison, timing differences, and matches.
9. **Comprehensive Financial Risk Report**: Audit findings, duplicate payment hazards, liquidity runways, and health scores.

### 2. Dedicated Schedule III Profit & Loss Statement (`/profit-loss`)
- Standardized Indian corporate accounting P&L compliant with the **Companies Act 2013** and Ministry of Corporate Affairs (MCA).
- **Part I: Revenue from Operations & Other Income** (Gross Revenue).
- **Part II: Categorized Operating Expenses**:
  - Cost of Materials / Direct Service Costs
  - Employee Benefits Expense (Salaries, Bonuses, PF/ESI)
  - Other Operating Expenses (Cloud infrastructure, Rent, SaaS, Legal, Marketing)
  - Operating EBITDA & EBITDA Margin %
  - Finance Costs & Bank Charges
  - Depreciation & Amortization
- **Statutory Provisions**:
  - Profit Before Tax (PBT)
  - Corporate Income Tax (@ 25.0% under Section 115BAA of Income Tax Act, 1961)
  - Profit After Tax (PAT) / Net Profit & Net Margin %
- **Comparative Analysis**: Current Period vs Previous Period with absolute variance (₹) and percentage variance.

### 3. Native Excel (.xlsx) & PDF Export
- **Multi-Sheet Excel Export**: Generates `.xlsx` workbooks using SheetJS (`xlsx`) featuring:
  - Formatted "Executive Summary" sheet with metadata, KPIs, and audit notes.
  - Dedicated sheets for ledger breakdowns with auto-fitted column widths and bold totals.
  - Endpoint: `GET /api/reports/export?type=<REPORT_TYPE>&period=<PERIOD>`.
- **Print / PDF Layout**: Clean print stylesheet (`@media print`) that removes application chrome, reformats cards into white-paper audit formats, handles page breaks, and includes official corporate headers.

### 4. In-App Notifications & Alert Center
- **Interactive Notification Center**: Dropdown bell in the header with unread count badge, category icons (Critical, Warning, Success, Info), and direct deep-linking to relevant modules.
- **Auto-Sync Engine (`src/lib/notification-service.ts`)**: Scans active risks, cash shortages, unmatched reconciliation items, and recent imports to generate real-time actionable notifications.
- **SQLite Persistence**: Stores read/unread status with full mark-as-read and mark-all-read API capabilities (`PATCH /api/notifications`).

### 5. Conversational AI Financial Assistant
- **Floating AI Copilot**: Accessible on all dashboard pages with a high-contrast fintech robot launcher.
- **Strict Anti-Hallucination Grounding**: Always injects verified database balances, monthly revenues, burn rates, and risks into context.
- **Model Flexibility**: Automatically connects to Google Gemini 1.5 Pro / Flash if `GEMINI_API_KEY` is provided; seamlessly falls back to a deterministic financial reasoning engine if offline.

### 6. Automated Bank Reconciliation & Duplicate Detection (`/reconciliation`)
- **Multi-Factor Scoring (0–100 points)**:
  - Reference / UTR Match: 40 points
  - Exact Amount Match: 30 points
  - Date Proximity (±3 days): 20 points
  - Narration Similarity (Levenshtein + Token Jaccard): 10 points
- Categorizes matches into High Confidence (≥90), Medium Confidence (70–89), and Manual Review (<70).
- Identifies duplicate payments, ambiguous matches, and one-sided bank transactions.

---

## 🔒 Security Hardening & Best Practices

- **Zero Secrets Committed**: `.gitignore` strictly excludes `.env`, `*.db`, `node_modules`, and local build directories.
- **Template Configuration**: `.env.example` provides complete documentation without leaking sensitive credentials.
- **Multi-Tenant Data Isolation**: Every transaction, reconciliation record, notification, and chat session is scoped to a specific `businessId`.
- **SQL Injection Prevention**: All database interactions execute via Prisma ORM parameterized queries.
- **Server-Side API Key Protection**: Third-party API keys (Gemini / OpenAI) remain strictly server-side and are never exposed to browser clients.

---

## 💾 Database Architecture & Production Migration

### Local Development (SQLite)
Default configuration uses a zero-configuration SQLite database (`dev.db`).
```bash
# Push schema changes
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Production Deployment (PostgreSQL / Supabase / Neon / AWS RDS)
FinOS is 100% compatible with PostgreSQL:
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update your `.env` file:
   ```bash
   DATABASE_URL="postgresql://user:password@hostname:5432/finos_db?sslmode=require"
   ```
3. Run the Prisma migration:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## 🧪 Comprehensive Automated Test Suites

FinOS includes **50 automated test scenarios** covering every stage of the platform:

| Test Suite | File | Scenarios | Status |
| :--- | :--- | :--- | :--- |
| **Stage 2** | `scripts/test-stage2.js` | CSV/Excel ingestion, column mapping, accounting rules, refunds | **10 / 10 PASSED** |
| **Stage 3** | `scripts/test-stage3.js` | Bank reconciliation, multi-factor scoring, duplicate detection | **10 / 10 PASSED** |
| **Stage 4** | `scripts/test-stage4.js` | Expense spikes, unusual transactions, cash flow forecasting | **8 / 8 PASSED** |
| **Stage 5** | `scripts/test-stage5.js` | AI Assistant, anti-hallucination verification, recommendations | **10 / 10 PASSED** |
| **Stage 6** | `scripts/test-stage6.js` | 9 Reports, Schedule III P&L, SheetJS Excel export, Notifications | **12 / 12 PASSED** |
| **MASTER E2E** | `scripts/test-e2e-all.js` | Complete end-to-end regression across all stages | **50 / 50 PASSED** |

### Run Automated Tests
```bash
# Run Master Regression Suite (Stages 1–6)
node scripts/test-e2e-all.js

# Or run individual stage test suites
node --experimental-strip-types scripts/test-stage2.js
node --experimental-strip-types scripts/test-stage3.js
node --experimental-strip-types scripts/test-stage4.js
node --experimental-strip-types scripts/test-stage5.js
node --experimental-strip-types scripts/test-stage6.js
```

---

## 💻 Running the Application

### Prerequisites
- Node.js 18+ or 20+ (Node 22 recommended)
- npm or pnpm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Setup database and load demo data
npx prisma generate
npx prisma db push

# 3. Start development server
npm run dev

# 4. Open in browser
http://localhost:3000
```

### One-Click Demo Access
- Visit `http://localhost:3000/login`
- Click **"Instant Demo Login"** to enter the fully populated *BharatTech Retail & Cloud Solutions Pvt Ltd* demo workspace.
- Click **"Reload Demo Data"** in the top navigation at any time to reset and refresh the realistic test dataset.

# Al-Meezan — Zakat & Welfare Management System

A high-performance, Shariah-compliant web application designed to plan, allocate, track, and audit Annual Zakat and Welfare Disbursements with real-time mathematical linkage, 1-click status transitions, and complete multi-year audit compliance.

---

## 🌟 Key Features

### 1. Executive Dashboard & Budget Tracker
- **Top 5 KPI Metric Cards**: Annual Planned Zakat Pool, Total Actually Paid, Total Remaining Balance, Zakatable Assets, and Voluntary Sadqa Outflow.
- **Dynamic 2.5% Shariah Wealth Pool Engine**: Auto-computes ₹8,27,500 mandatory pool from ₹3.31 Cr net zakatable assets across 12 asset classes (Bank Balances, Gold XAU, Silver, Shares, Receivables, Loans).
- **Manual Target Budget Override**: Allows trustees to configure custom annual envelopes (e.g. ₹40,00,000) or toggle back to the raw 2.5% pool.
- **Category Cap Tracking**: Real-time alert banners if category allocations exceed the total annual budget cap.
- **Historical Trajectory (2020 – 2026)**: Multi-year comparisons directly from audited financial records.

### 2. Category Summary & Drilldown Reports
- **View Toggle Switch**:
  - **View A (Consolidated Summary)**: High-level view showing 9 standardized categories, planned budget, actual paid, pending amount, disbursing account, and % of 2.5% pool.
  - **View B (Detailed Drilldown)**: Grouped category cards expanding every individual beneficiary and school student with their current standard, school name, individual fee, verification state, and 1-click inline action.
- **Employee Outflow Reconciliation**: Section 1 employee bank transfer reconciliation table (Sidra, Sana, Misbah, Farheen, Fahim, Fiza, Shariqa, Alfahad, etc.).

### 3. Distribution Entry Form (Operator Workspace)
- **Step 1: Beneficiary Profile Autocomplete**: Search across 54+ recipients with auto-fetched category, school, coordinator, location, phone, and verification state.
- **Step 2: 4-Year Historical Lookup**: Auto-displays 2022, 2023, 2024, and 2025 past disbursements before authorizing new funds.
- **Step 3: Current Year Entry Form**: Default status is strictly **`Not Paid`** (Red badge) until money is transferred. Includes instant **"One-Click: Save & Mark as Paid"** button.

### 4. Beneficiary Master Directory & Verification Audit
- Filterable and searchable registry of all 54+ demo beneficiaries + extended recipients.
- **Interactive Audit Modal**: Re-verify candidates, switch statuses (`Verified`, `Under Re-Verification`, `Cancel / Rejected`), and record case notes.
- Register new beneficiary profiles with complete data validation.

### 5. Live Distribution Ledger (Transactional Journal)
- Full log with multi-filter toolbar (Year, Category, Payment Status, Funding Account).
- **One-Click "Mark as Paid" Toggle**: Changes badge from Red to Green, stamps payment date, fires celebration confetti, and instantly updates dashboard KPI cards and category pending balances.
- CSV / Excel export and print view.

### 6. Bank Balance & 2.5% Shariah Wealth Valuator
- Live inline editor for 12 asset classes as on 14-02-2026.
- Shariah principles reference guide covering Nisab thresholds and Hawl requirements.

### 7. Central Master Data Management
- Full management for Categories, Funding Accounts, Reference Coordinators, and the Aurangabad Slum Ration Kit recipient list.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

The output will be generated in the `dist` folder.

---

## 🌐 Deploy to Vercel

### Method 1: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Method 2: Via GitHub / Vercel Dashboard
1. Push this repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project**.
3. Import this repository.
4. Framework Preset will be automatically detected as **Vite**.
5. Click **Deploy** — your application will be live in under 60 seconds!

---

## 🛠️ Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS with custom Islamic Emerald & Gold aesthetic
- **Icons:** Lucide React
- **Animations:** GSAP & Canvas-Confetti
- **State & Storage:** React Context API with LocalStorage persistence & instant Reset option

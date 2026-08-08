# Kabir Ind PU College for Women — Administration System

College administration web app for **Kabir Independent PU College for Women**
(A Unit of Islamic Information Centre). Developed by **Al-Majeed Algorithms**.

## Modules

| Module | What it does |
| --- | --- |
| **Dashboard** | Overview of students, staff, fees received, expenses and annual deficit for the selected academic year |
| **Students** | Admission register (Sl.#, class, combination, language, agreed/paid/due) with search and class filter; every student has a full **profile page** with the complete **fee register** — actual/agreed amount, deficit, admission payment and 1st/2nd/3rd instalments (amount, date, receipt #, mode of payment), grand total, due amount, remarks — plus payment analytics |
| **Teachers & Staff** | Register with Employee ID, Job Type, designation, subject, qualification, DOB, blood group, Aadhar, salary, and a **working schedule & lecture time table** (which days each member works + per-day periods). Full **profile page**, active-vs-left tracking with an **attrition rate**, and active-only salary totals |
| **Finance** | A single hub for everything financial, organised into four tabs (see below) |
| **Settings** | Editable college identity (name, unit, address, phone, email, logo) that flows into the app header and every exported/printed letterhead |

The Dashboard adds an **Outstanding Dues** list (students ranked by pending
amount) and an **Expenses by Category** breakdown. Add / edit / delete actions
give **toast** confirmations, and destructive actions use an on-brand confirm
dialog. Students can be **sorted** by any column and **filtered by fee status**
(cleared / partly paid / unpaid). All financial figures are colour-coded
green / yellow / red for cleared / partial / unpaid.

### The Finance hub

All money-related work lives on one page, split into tabs:

| Tab | What it does |
| --- | --- |
| **Overview** | Fees collected / due, expenses, salary outgo and net position at a glance, an expense-trend chart, class-wise fee-register progress and a balance-sheet snapshot |
| **Monthly Expenses** | 12 default categories (Salaries … Miscellaneous) plus **user-added custom categories**, across the June–May academic year, with automatic row/column/annual totals |
| **Balance Sheet** | Per-year I PUC / II PUC actual amount, amount received and deficit, annual summary with expenses; can auto-fill from student fee records |
| **Import & Export** | Smart CSV **import** (auto-detects and allocates — see below), full **Backup & Restore** of the entire database as one JSON file, plus CSV / Word / print export of every register on the college letterhead |

### Excel / CSV import with column mapping

Upload an **Excel (.xlsx)** or **CSV** file on Finance → Import & Export. For record
lists (students, teachers & staff) the app opens a **column-mapping** step: it
pre-fills the obvious matches and lets you choose exactly which source column feeds
each attribute (or skip it), with a live preview — so any spreadsheet layout imports
cleanly. Matrix sheets (monthly expenses, balance sheet) are recognised
automatically. Existing records are updated in place rather than duplicated
(students by admission number or name, staff by name); unknown expense categories
are created automatically.

The **Academic Year** selector in the top bar switches every module between
years (June through May, e.g. 2025-26).

## Design

- **Primary colour:** Azure blue `#3A6EA5` (midpoint between light blue and navy)
- **Secondary colour:** Goldenrod `#DAA520`
- **Text:** black and white only
- Hairline borders and transparent (outline) buttons throughout

## Running

```bash
npm install
npm run dev      # development server
npm run build    # production build (dist/)
```

## Data storage & Firebase

The app runs in two modes automatically, both behind one data layer
(`src/store.js`):

- **Local mode** (default, no credentials) — data in the browser's
  `localStorage`, no login. Used by the preview link.
- **Firebase mode** (credentials present) — an **admin login** (Firebase
  Authentication, email/password) and cloud storage in **Cloud Firestore**,
  deployable to **Firebase Hosting**.

To go live, add your Firebase web config (via a `.env` file or
`src/firebaseConfig.js`) and follow **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**.
No UI changes are needed — the store switches modes on its own.

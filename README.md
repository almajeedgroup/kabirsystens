# Kabir Ind PU College for Women — Administration System

College administration web app for **Kabir Independent PU College for Women**
(A Unit of Islamic Information Centre). Developed by **Al-Majeed Algorithms**.

## Modules

| Module | What it does |
| --- | --- |
| **Dashboard** | Overview of students, staff, fees received, expenses and annual deficit for the selected academic year |
| **Students** | Admission register (Sl.#, class, combination, language, agreed/paid/due) with search and class filter; every student has a full **profile page** with the complete **fee register** — actual/agreed amount, deficit, admission payment and 1st/2nd/3rd instalments (amount, date, receipt #, mode of payment), grand total, due amount, remarks — plus payment analytics |
| **Teachers & Staff** | Faculty register with designation, subject, qualification and salary; every member has a full **profile page** |
| **Finance** | A single hub for everything financial, organised into four tabs (see below) |

### The Finance hub

All money-related work lives on one page, split into tabs:

| Tab | What it does |
| --- | --- |
| **Overview** | Fees collected / due, expenses, salary outgo and net position at a glance, an expense-trend chart, class-wise fee-register progress and a balance-sheet snapshot |
| **Monthly Expenses** | 12 default categories (Salaries … Miscellaneous) plus **user-added custom categories**, across the June–May academic year, with automatic row/column/annual totals |
| **Balance Sheet** | Per-year I PUC / II PUC actual amount, amount received and deficit, annual summary with expenses; can auto-fill from student fee records |
| **Import & Export** | Smart CSV **import** (auto-detects and allocates — see below), plus CSV / Word / print export of every register on the college letterhead |

### Smart CSV import

Upload any CSV on the Finance → Import & Export tab and the app inspects its
headers to recognise which kind of sheet it is — **fee register, student list,
teachers & staff list, monthly expense sheet or balance sheet** — then maps every
column to the right field and allocates the records to the correct domain for the
selected academic year. A preview confirms the detection before anything is saved.
Existing records are updated in place rather than duplicated (students by admission
number or name, staff by name, expense categories by description — unknown
categories are created automatically).

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

## Data storage

Phase 1 stores all data in the browser's `localStorage` behind a single data
layer (`src/store.js`). Phase 2 will replace that layer with **Firebase
Firestore**, add **Firebase Authentication** for sign-in, and deploy on
**Firebase Hosting** — no UI changes required because all reads/writes already
go through the store's API.

# Kabir Ind PU College for Women — Administration System

College administration web app for **Kabir Independent PU College for Women**
(A Unit of Islamic Information Centre). Developed by **Al-Majeed Algorithms**.

## Modules

| Module | What it does |
| --- | --- |
| **Dashboard** | Overview of students, staff, fees received, expenses and annual deficit for the selected academic year |
| **Students** | Admission register with search and class filter; every student has a full **profile page** (photo, guardian, contact, fee progress) |
| **Teachers & Staff** | Faculty register with designation, subject, qualification and salary; every member has a full **profile page** |
| **Monthly Expenses** | 12 default expense categories (Salaries … Miscellaneous) plus **user-added custom categories**, across the June–May academic year, with automatic row/column/annual totals and a dashboard chart |
| **Balance Sheet** | Per-year I PUC / II PUC actual amount, amount received and deficit, annual summary with expenses; can auto-fill from student fee records |
| **Reports & Export** | Every register downloadable as CSV or a Word report on the college letterhead; every page is print/PDF ready (Ctrl+P) |

The **Academic Year** selector in the top bar switches every module between
years (June through May, e.g. 2025-26).

## Design

- **Primary colour:** Azure blue `#007FFF`
- **Secondary colour:** Goldenrod `#DAA520`
- **Text:** black and white only

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

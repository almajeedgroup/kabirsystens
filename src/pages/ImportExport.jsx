import { useRef, useState } from 'react';
import {
  getData, getBalanceSheet, setBalanceSheet, expensesAnnualTotal, paidTotal, dueAmount, feeDeficit,
  importStudents, importStaffMembers, importExpenses, exportAllData, importAllData,
} from '../store.js';
import { parseCSV, detectDomain, mapRows } from '../utils/csv.js';
import {
  parseFile, FIELD_SETS, TYPE_LABELS, guessMapping, buildRecords, suggestType,
} from '../utils/importer.js';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import {
  EXPENSE_CATEGORIES, MONTHS, monthLabel, formatINR, PAYMENT_STAGES,
} from '../constants.js';
import { exportCSV, exportWord, downloadBlob } from '../utils/export.js';
import {
  DownloadIcon, UploadIcon, PrintIcon, StudentsIcon, TeachersIcon, WalletIcon, ScaleIcon, ReportIcon, RupeeIcon,
} from '../components/Icons.jsx';

function studentRows(students, year) {
  const list = students.filter((s) => s.year === year);
  return [
    ['Adm. No.', 'Name', 'Guardian', 'Class', 'Combination', 'Language', 'Phone', 'Email', 'Address', 'Agreed Amount', 'Total Paid', 'Due Amount'],
    ...list.map((s) => [
      s.admissionNo,
      s.name,
      s.guardianName,
      s.className,
      s.combination,
      s.language,
      s.phone,
      s.email,
      s.address,
      s.agreedAmount,
      paidTotal(s),
      dueAmount(s),
    ]),
  ];
}

// Column-for-column reproduction of the college's fee register sheet.
function feeRegisterRows(students, year) {
  const list = students.filter((s) => s.year === year);
  const header = [
    'Sl.#', 'Name', 'Class', 'Combination', 'Language',
    'Actual Amount', 'Agreed Amount', 'Deficit',
    'Fee Payment Date', 'Receipt #', 'Mode of Payment', 'Fee Paid at the Time of Admission',
    '1st Instalment', 'Fee Payment Date', 'Receipt #', 'Mode of Payment',
    '2nd Instalment', 'Fee Payment Date', 'Receipt #', 'Mode of Payment',
    '3rd Instalment', 'Fee Payment Date', 'Receipt #', 'Mode of Payment',
    'Grand Total', 'Due Amount', 'Remarks',
  ];
  const rows = list.map((s, i) => {
    const p = (k) => s.payments?.[k] || {};
    const adm = p('admission');
    const insts = ['inst1', 'inst2', 'inst3'].flatMap((k) => {
      const inst = p(k);
      return [inst.amount, inst.date, inst.receipt, inst.mode];
    });
    return [
      i + 1, s.name, s.className, s.combination, s.language,
      s.actualAmount, s.agreedAmount, feeDeficit(s),
      adm.date, adm.receipt, adm.mode, adm.amount,
      ...insts,
      paidTotal(s), dueAmount(s), s.remarks,
    ];
  });
  return [header, ...rows];
}

function staffRows(staff) {
  return [
    [
      'Employee ID', 'Name', 'Job Type', 'Designation', 'Subject', 'Qualification',
      'Date of Birth', 'Blood Group', 'Aadhar No.', 'Phone', 'Email', 'Address',
      'Joining Date', 'Monthly Salary', 'Status', 'Date of Leaving',
      'Working Hours', 'Working Days', 'Time Table',
    ],
    ...staff.map((s) => [
      s.employeeId, s.name, s.jobType, s.designation, s.subject, s.qualification,
      s.dob, s.bloodGroup, s.aadhar, s.phone, s.email, s.address,
      s.joinDate, s.salary, (s.status || 'active') === 'left' ? 'Left' : 'Active', s.exitDate || '',
      s.workingHours, (s.workingDays || []).join(' '),
      Object.entries(s.timeTable || {}).filter(([, v]) => v).map(([d, v]) => `${d}: ${v}`).join(' | '),
    ]),
  ];
}

function expenseRows(expenses, categories, year) {
  const yearData = expenses[year] || {};
  const header = ['Description', ...MONTHS.map((_, mi) => monthLabel(year, mi)), 'Total'];
  const rows = categories.map((cat) => {
    const months = MONTHS.map((_, mi) => Number(yearData[cat]?.[mi] || 0));
    return [cat, ...months, months.reduce((a, b) => a + b, 0)];
  });
  const totals = MONTHS.map((_, mi) =>
    categories.reduce((a, cat) => a + Number(yearData[cat]?.[mi] || 0), 0)
  );
  rows.push(['MONTHLY TOTAL', ...totals, totals.reduce((a, b) => a + b, 0)]);
  return [header, ...rows];
}

function balanceRows(sheet, expensesTotal) {
  const iDef = Number(sheet.iPucActual) - Number(sheet.iPucReceived);
  const iiDef = Number(sheet.iiPucActual) - Number(sheet.iiPucReceived);
  return [
    ['Class', 'Actual Amount', 'Amount Received', 'Deficit'],
    ['I PUC', sheet.iPucActual, sheet.iPucReceived, iDef],
    ['II PUC', sheet.iiPucActual, sheet.iiPucReceived, iiDef],
    [
      'TOTAL',
      Number(sheet.iPucActual) + Number(sheet.iiPucActual),
      Number(sheet.iPucReceived) + Number(sheet.iiPucReceived),
      iDef + iiDef,
    ],
    ['EXPENSES', expensesTotal, '', ''],
  ];
}

export default function ImportExport({ year }) {
  const { students, staff, expenses, customCategories } = getData();
  const categories = [...EXPENSE_CATEGORIES, ...customCategories];
  const sheet = getBalanceSheet(year);
  const expensesTotal = expensesAnnualTotal(year);
  const toast = useToast();
  const confirm = useConfirm();

  // ---- Import state ----
  const [preview, setPreview] = useState(null); // expenses/balance auto-detect: {detection, mapped, fileName}
  const [mapState, setMapState] = useState(null); // list mapping: {type, headers, rows, mapping, fileName}
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState('');
  const fileRef = useRef(null);
  const backupRef = useRef(null);

  // ---- Full backup & restore ----
  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(exportAllData(), null, 2)], { type: 'application/json' });
    downloadBlob(`kabir-college-backup-${new Date().toISOString().slice(0, 10)}.json`, blob);
    toast('Backup downloaded');
  };

  const onRestore = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ok = await confirm({
      title: 'Restore from backup?',
      message: 'This replaces ALL current data — students, teachers, expenses, balance sheets and settings — with the contents of the backup file. Consider downloading a backup of the current data first.',
      confirmLabel: 'Restore',
      danger: true,
    });
    if (!ok) return;
    try {
      const parsed = JSON.parse(await file.text());
      const { students: sc, staff: tc } = importAllData(parsed);
      toast(`Restored ${sc} students and ${tc} staff`);
    } catch (err) {
      toast(err.message || 'Could not read this backup file', 'error');
    }
  };

  // Choose which record type to map a sheet's columns onto.
  const openMapping = (type, headers, rows, fileName) => {
    setMapState({ type, headers, rows, mapping: guessMapping(type, headers), fileName });
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    setImportResult('');
    let parsed;
    try {
      parsed = await parseFile(file); // { headers, rows }
    } catch (err) {
      setImportError(err.message || 'Could not read this file.');
      return;
    }
    const { headers, rows } = parsed;
    if (!headers.length || !rows.length) {
      setImportError('The file appears to be empty or has no data rows.');
      return;
    }

    // Matrix-shaped sheets (monthly expenses, balance sheet) go straight to a
    // simple confirm; record lists go through the column-mapping step.
    const matrix = [headers, ...rows];
    const detection = detectDomain(matrix);
    if (detection && (detection.type === 'expenses' || detection.type === 'balance')) {
      const mapped = mapRows(matrix, detection);
      const count = Array.isArray(mapped) ? mapped.length : Object.keys(mapped).length;
      if (!count) {
        setImportError(`Detected "${detection.label}" but found no usable rows.`);
        return;
      }
      setPreview({ detection, mapped, fileName: file.name });
      return;
    }

    const type = detection && detection.type === 'staff' ? 'staff' : suggestType(headers);
    openMapping(type, headers, rows, file.name);
  };

  const confirmImport = () => {
    const { detection, mapped } = preview;
    let msg = '';
    if (detection.type === 'expenses') {
      const { rows, cells } = importExpenses(year, mapped, categories);
      msg = `Monthly Expenses (${year}): ${rows} categories, ${cells} amounts imported.`;
    } else if (detection.type === 'balance') {
      setBalanceSheet(year, mapped);
      msg = `Balance Sheet (${year}) updated.`;
    }
    setPreview(null);
    setImportResult(msg);
    toast(msg, 'success');
  };

  // Apply a column-mapped list import.
  const confirmMapping = () => {
    const { type, rows, mapping } = mapState;
    const records = buildRecords(type, rows, mapping);
    let msg = '';
    if (type === 'students') {
      const { added, updated } = importStudents(records, year);
      msg = `Students (${year}): ${added} added, ${updated} updated.`;
    } else {
      const { added, updated } = importStaffMembers(records);
      msg = `Teachers & Staff: ${added} added, ${updated} updated.`;
    }
    setMapState(null);
    setImportResult(msg);
    toast(msg, 'success');
  };

  const mappedRequiredMissing = mapState
    ? FIELD_SETS[mapState.type].some((f) => f.required && (mapState.mapping[f.key] == null || mapState.mapping[f.key] < 0))
    : false;
  const mapPreview = mapState ? buildRecords(mapState.type, mapState.rows.slice(0, 3), mapState.mapping) : [];

  const items = [
    {
      icon: StudentsIcon,
      title: `Student Register — ${year}`,
      desc: 'Every student admitted for the year, with contact and fee details.',
      csv: () => exportCSV(`students-${year}.csv`, studentRows(students, year)),
      word: () =>
        exportWord(`students-${year}.doc`, `Student Register ${year}`, [
          { rows: studentRows(students, year) },
        ]),
    },
    {
      icon: RupeeIcon,
      title: `Fee Register — ${year}`,
      desc: 'The full fee register: actual/agreed/deficit, admission payment and all three instalments with dates, receipts and payment modes, grand total, due and remarks.',
      csv: () => exportCSV(`fee-register-${year}.csv`, feeRegisterRows(students, year)),
      word: () =>
        exportWord(`fee-register-${year}.doc`, `Fee Register ${year}`, [
          { rows: feeRegisterRows(students, year) },
        ]),
    },
    {
      icon: TeachersIcon,
      title: 'Teachers & Staff Register',
      desc: 'All members with designation, subject, qualification and salary.',
      csv: () => exportCSV('teachers-staff.csv', staffRows(staff)),
      word: () => exportWord('teachers-staff.doc', 'Teachers & Staff Register', [{ rows: staffRows(staff) }]),
    },
    {
      icon: WalletIcon,
      title: `Monthly Expenses — ${year}`,
      desc: 'Category-wise expenses for every month, including custom categories.',
      csv: () => exportCSV(`expenses-${year}.csv`, expenseRows(expenses, categories, year)),
      word: () =>
        exportWord(`expenses-${year}.doc`, `Monthly Expenses ${year}`, [
          { rows: expenseRows(expenses, categories, year) },
        ]),
    },
    {
      icon: ScaleIcon,
      title: `Balance Sheet — ${year}`,
      desc: 'I PUC / II PUC actual, received and deficit, with annual expenses.',
      csv: () => exportCSV(`balance-sheet-${year}.csv`, balanceRows(sheet, expensesTotal)),
      word: () =>
        exportWord(`balance-sheet-${year}.doc`, `Balance Sheet ${year}`, [
          { rows: balanceRows(sheet, expensesTotal) },
        ]),
    },
    {
      icon: ReportIcon,
      title: `Complete Annual Report — ${year}`,
      desc: 'One Word document: balance sheet, expenses, students, teachers & staff.',
      word: () =>
        exportWord(`annual-report-${year}.doc`, `Annual Report ${year}`, [
          { title: 'Balance Sheet', rows: balanceRows(sheet, expensesTotal) },
          { title: 'Monthly Expenses', rows: expenseRows(expenses, categories, year) },
          { title: 'Fee Register', rows: feeRegisterRows(students, year) },
          { title: 'Student Register', rows: studentRows(students, year) },
          { title: 'Teachers & Staff Register', rows: staffRows(staff) },
        ]),
    },
  ];

  const previewCount = preview
    ? Array.isArray(preview.mapped)
      ? preview.mapped.length
      : 1
    : 0;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Import Data (Excel / CSV)</h3>
            <div className="sub">
              Upload an Excel (.xlsx) or CSV file — students, a fee register, teachers &amp; staff,
              monthly expenses or a balance sheet. For record lists you choose which column maps to
              which field, so any spreadsheet layout imports cleanly into academic year {year}.
            </div>
          </div>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <UploadIcon size={16} /> Choose File
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={onFile}
            style={{ display: 'none' }}
            aria-label="Import Excel or CSV file"
          />
        </div>
        <div className="card-body">
          {importError && <div className="notice error">{importError}</div>}
          {importResult && <div className="notice ok">✓ {importResult}</div>}
          {!importError && !importResult && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-50)' }}>
              Matching records are updated instead of duplicated — students by admission number
              or name, staff by name, expense categories by their description (new categories
              are created automatically).
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Backup &amp; Restore</h3>
            <div className="sub">
              Save a complete backup of everything in the system as a single file, and restore it
              on any device. Keep regular backups — data lives in this browser until Firebase is connected.
            </div>
          </div>
          <div className="btn-row">
            <button className="btn ghost" onClick={downloadBackup}>
              <DownloadIcon size={16} /> Download Backup
            </button>
            <button className="btn" onClick={() => backupRef.current?.click()}>
              <UploadIcon size={16} /> Restore Backup
            </button>
            <input
              ref={backupRef}
              type="file"
              accept="application/json,.json"
              onChange={onRestore}
              style={{ display: 'none' }}
              aria-label="Restore backup file"
            />
          </div>
        </div>
        <div className="card-body">
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-50)' }}>
            The backup includes every student, teacher, expense, balance sheet and your college
            settings. Restoring replaces all current data.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Export &amp; Reports</h3>
            <div className="sub">
              Download registers as CSV (opens in Excel) or as Word reports on the college letterhead.
            </div>
          </div>
          <button className="btn ghost" onClick={() => window.print()}>
            <PrintIcon size={16} /> Print
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Contents</th>
                <th scope="col">Download</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ icon: ItemIcon, title, desc, csv, word }) => (
                <tr key={title}>
                  <td>
                    <div className="person-cell">
                      <span className="stat-icon" style={{ width: 36, height: 36 }}>
                        <ItemIcon size={17} />
                      </span>
                      <span className="cell-strong">{title}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-70)' }}>{desc}</td>
                  <td>
                    <div className="btn-row">
                      {csv && (
                        <button className="btn subtle small" onClick={csv}>
                          <DownloadIcon size={15} /> CSV
                        </button>
                      )}
                      <button className="btn gold small" onClick={word}>
                        <DownloadIcon size={15} /> Word
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <Modal title="Confirm Import" onClose={() => setPreview(null)} wide>
          <p style={{ marginTop: 0, fontSize: '0.9rem' }}>
            <strong>{preview.fileName}</strong> was recognised as{' '}
            <span className="badge solid">{preview.detection.label}</span>
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            {Array.isArray(preview.mapped) ? (
              <>
                <strong>{previewCount}</strong> record{previewCount === 1 ? '' : 's'} will be
                allocated to <strong>{preview.detection.label}</strong>
                {['students', 'feeRegister', 'expenses'].includes(preview.detection.type) && (
                  <> for academic year <strong>{year}</strong></>
                )}
                . Existing matches will be updated, everything else added.
              </>
            ) : (
              <>The balance sheet figures for <strong>{year}</strong> will be replaced with the imported values.</>
            )}
          </p>
          {Array.isArray(preview.mapped) && (
            <div className="table-wrap" style={{ border: 'var(--hairline)', borderRadius: 8, marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    {Object.keys(preview.mapped[0])
                      .filter((k) => k !== 'payments' && k !== 'months')
                      .slice(0, 6)
                      .map((k) => <th scope="col" key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.mapped.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      {Object.entries(r)
                        .filter(([k]) => k !== 'payments' && k !== 'months')
                        .slice(0, 6)
                        .map(([k, v]) => <td key={k}>{String(v) || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => setPreview(null)}>Cancel</button>
            <button className="btn" onClick={confirmImport}>
              <UploadIcon size={15} /> Import {Array.isArray(preview.mapped) ? `${previewCount} record${previewCount === 1 ? '' : 's'}` : 'balance sheet'}
            </button>
          </div>
        </Modal>
      )}

      {mapState && (
        <Modal title="Map Columns & Import" onClose={() => setMapState(null)} wide>
          <div className="map-head">
            <div>
              <strong>{mapState.fileName}</strong>
              <span className="meta"> · {mapState.rows.length} rows · {mapState.headers.length} columns</span>
            </div>
            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              Import as:
              <select
                value={mapState.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setMapState((m) => ({ ...m, type, mapping: guessMapping(type, m.headers) }));
                }}
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-50)', margin: '0 0 14px' }}>
            Choose which column from your file goes into each field. We pre-filled the obvious ones —
            adjust any of them. Set unwanted fields to <em>“skip”</em>. Only mapped fields are stored.
          </p>

          <div className="map-fields">
            {FIELD_SETS[mapState.type].map((f) => (
              <label className="map-row" key={f.key}>
                <span className="map-label">
                  {f.label}{f.required && <span className="req"> *</span>}
                </span>
                <select
                  value={mapState.mapping[f.key] ?? -1}
                  onChange={(e) =>
                    setMapState((m) => ({ ...m, mapping: { ...m.mapping, [f.key]: Number(e.target.value) } }))
                  }
                >
                  <option value={-1}>— skip —</option>
                  {mapState.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {mapPreview.length > 0 && (
            <>
              <div className="map-label" style={{ margin: '16px 0 6px' }}>Preview (first {mapPreview.length})</div>
              <div className="table-wrap" style={{ border: 'var(--hairline)', borderRadius: 8 }}>
                <table>
                  <thead>
                    <tr>
                      {(mapState.type === 'students'
                        ? ['name', 'className', 'combination', 'agreedAmount']
                        : ['name', 'employeeId', 'designation', 'jobType']
                      ).map((k) => <th scope="col" key={k}>{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {mapPreview.map((r, i) => (
                      <tr key={i}>
                        {(mapState.type === 'students'
                          ? ['name', 'className', 'combination', 'agreedAmount']
                          : ['name', 'employeeId', 'designation', 'jobType']
                        ).map((k) => <td key={k}>{String(r[k] ?? '') || '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {mappedRequiredMissing && (
            <div className="notice error" style={{ marginTop: 14 }}>
              Map the required field(s) marked * before importing.
            </div>
          )}

          <div className="btn-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn ghost" onClick={() => setMapState(null)}>Cancel</button>
            <button className="btn" onClick={confirmMapping} disabled={mappedRequiredMissing}>
              <UploadIcon size={15} /> Import into {TYPE_LABELS[mapState.type]}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

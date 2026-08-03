import { useState } from 'react';
import { getData, setExpense, getExpense, addCategory, removeCategory } from '../store.js';
import { EXPENSE_CATEGORIES, MONTHS, monthLabel, formatINR } from '../constants.js';
import { PlusIcon, TrashIcon } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';

export default function Expenses({ year, embedded = false }) {
  const { expenses, customCategories } = getData();
  const toast = useToast();
  const confirm = useConfirm();
  const yearData = expenses[year] || {};
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState('');

  const categories = [...EXPENSE_CATEGORIES, ...customCategories];

  const rowTotal = (cat) =>
    Object.values(yearData[cat] || {}).reduce((a, b) => a + Number(b || 0), 0);
  const colTotal = (mi) =>
    categories.reduce((a, cat) => a + Number(yearData[cat]?.[mi] || 0), 0);
  const grandTotal = categories.reduce((a, cat) => a + rowTotal(cat), 0);

  const submitCategory = (e) => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast(`The category "${name}" already exists`, 'error');
      return;
    }
    addCategory(name);
    setNewCat('');
    setAdding(false);
    toast(`Added category "${name}"`);
  };

  const dropCategory = async (cat) => {
    const ok = await confirm({
      title: 'Remove category?',
      message: `Remove "${cat}"? Its recorded amounts in every academic year will be deleted.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) {
      removeCategory(cat);
      toast(`Removed category "${cat}"`);
    }
  };

  return (
    <>
      <div className={embedded ? 'section-head' : 'page-head'}>
        <div>
          {!embedded && <h2>Monthly Expenses</h2>}
          <p style={embedded ? { marginTop: 0 } : undefined}>
            Category-wise spending for {year} (June–May). Type an amount in any cell — totals update instantly.
          </p>
        </div>
        <button className="btn gold" onClick={() => setAdding(true)}>
          <PlusIcon size={17} /> Add Category
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 240px))' }}>
        <div className="stat-card">
          <div>
            <div className="label">Annual Total · {year}</div>
            <div className="value">₹ {formatINR(grandTotal)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Categories</div>
            <div className="value">{categories.length}</div>
            <div className="hint">{customCategories.length} custom</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="expense-table">
            <thead>
              <tr>
                <th scope="col" className="sticky-col">Description</th>
                {MONTHS.map((_, mi) => (
                  <th scope="col" className="num" key={mi}>{monthLabel(year, mi)}</th>
                ))}
                <th scope="col" className="num">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat}>
                  <td className="sticky-col">
                    {cat}
                    {customCategories.includes(cat) && (
                      <span className="cat-actions no-print">
                        <button
                          className="icon-btn danger"
                          style={{ width: 26, height: 26 }}
                          onClick={() => dropCategory(cat)}
                          aria-label={`Remove category ${cat}`}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </span>
                    )}
                  </td>
                  {MONTHS.map((_, mi) => (
                    <td className="num" key={mi}>
                      <input
                        className="cell-input"
                        type="number"
                        min="0"
                        aria-label={`${cat} for ${monthLabel(year, mi)}`}
                        value={getExpense(year, cat, mi)}
                        onChange={(e) => setExpense(year, cat, mi, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="num cell-strong">{formatINR(rowTotal(cat))}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td className="sticky-col">Monthly Total (₹)</td>
                {MONTHS.map((_, mi) => (
                  <td className="num" key={mi}>{formatINR(colTotal(mi))}</td>
                ))}
                <td className="num">{formatINR(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <Modal title="Add Expense Category" onClose={() => setAdding(false)}>
          <form onSubmit={submitCategory}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label className="field">
                Category Name <span className="req">*</span>
                <input
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="e.g. Stationery, Repairs, Events"
                  autoFocus
                  required
                />
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-50)', marginTop: 0 }}>
              The new category appears in the expense sheet for every academic year and in all reports.
            </p>
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn ghost" type="button" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn" type="submit">Add Category</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

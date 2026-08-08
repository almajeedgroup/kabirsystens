import { COLLEGE } from '../constants.js';
import { getSettings } from '../store.js';

// Trigger a file download for a Blob. Robust across browsers:
//  - revokes the object URL on a delay (revoking immediately cancels the
//    download in Chromium/WebKit — this was the "nothing downloads" bug);
//  - falls back to opening the content in a new tab when the anchor's
//    download attribute is unsupported or blocked (e.g. sandboxed frames).
export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const cleanup = () => setTimeout(() => URL.revokeObjectURL(url), 15000);

  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  // Inside an embedded frame the browser blocks anchor downloads, so open
  // the file in a new tab where it can be saved. On a normal page, download.
  if (inIframe) {
    const win = window.open(url, '_blank');
    if (win) {
      cleanup();
      return;
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.target = '_blank';
  a.style.display = 'none';
  document.body.appendChild(a);
  try {
    a.click();
  } catch {
    window.open(url, '_blank');
  }
  a.remove();
  cleanup();
}

const download = downloadBlob;

// rows: array of arrays; first row is the header.
export function exportCSV(filename, rows) {
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  download(filename, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
}

// sections: [{ title, rows }] where rows[0] is the header row.
export function exportWord(filename, docTitle, sections) {
  const tableHTML = (rows) => {
    const [head, ...body] = rows;
    const th = head.map((h) => `<th>${h}</th>`).join('');
    const trs = body
      .map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`)
      .join('');
    return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
  };

  const s = getSettings();
  const name = (s.collegeName || COLLEGE.name).toUpperCase();
  const unit = (s.unit || COLLEGE.unit).toUpperCase();
  const contact = [s.address, s.phone, s.email].filter(Boolean).join('  ·  ');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${docTitle}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #000; }
  .letterhead { text-align: center; border-bottom: 3px solid #3A6EA5; padding-bottom: 12px; margin-bottom: 8px; }
  .letterhead h1 { color: #3A6EA5; margin: 0; font-size: 22pt; }
  .letterhead .unit { color: #000; font-size: 10pt; margin: 2px 0; }
  .letterhead .sub { background: #DAA520; color: #000; display: inline-block; padding: 2px 14px; font-size: 11pt; font-weight: bold; }
  .letterhead .contact { color: #000; font-size: 8.5pt; margin-top: 4px; }
  h2 { color: #3A6EA5; font-size: 14pt; border-left: 6px solid #DAA520; padding-left: 8px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
  th { background: #3A6EA5; color: #fff; padding: 6px 8px; border: 1px solid #000; font-size: 10pt; }
  td { padding: 5px 8px; border: 1px solid #000; font-size: 10pt; }
  .footer { margin-top: 24px; font-size: 8pt; text-align: center; color: #000; }
</style></head>
<body>
  <div class="letterhead">
    <h1>${name}</h1>
    <div class="sub">FOR WOMEN</div>
    <div class="unit">${unit}</div>
    ${contact ? `<div class="contact">${contact}</div>` : ''}
  </div>
  <h2>${docTitle}</h2>
  <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  ${sections.map((sec) => `${sec.title ? `<h2>${sec.title}</h2>` : ''}${tableHTML(sec.rows)}`).join('')}
  <div class="footer">Software by ${COLLEGE.developer}</div>
</body></html>`;

  download(filename, new Blob([html], { type: 'application/msword' }));
}

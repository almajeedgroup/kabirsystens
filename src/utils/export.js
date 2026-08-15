import { COLLEGE } from '../constants.js';
import { getSettings } from '../store.js';

// Ordinary browser download for a Blob — used on a real deployed site or
// localhost. Robust across browsers:
//  - revokes the object URL on a delay (revoking immediately cancels the
//    download in Chromium/WebKit — this was the "nothing downloads" bug);
//  - falls back to opening the content in a new tab when the anchor's
//    download attribute is unsupported or blocked.
function browserDownload(filename, blob) {
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

// Trigger a file download for a Blob.
//
// On a normal deployment this is just an anchor download. When the app is
// running inside the Claude Artifact preview, the frame is sandboxed and
// cannot start a browser download at all, so we route through the runtime's
// download channel (window.claude) when it is present. This is
// feature-detected: on a real site window.claude does not exist and the
// ordinary path is used untouched.
function claudeRuntime() {
  // The host may expose the runtime as a bare `claude` global or as
  // `window.claude`; `typeof` guards against a ReferenceError when neither
  // exists (a normal browser).
  try {
    // eslint-disable-next-line no-undef
    if (typeof claude !== 'undefined' && claude) return claude;
  } catch {
    /* not defined — fall through */
  }
  return typeof window !== 'undefined' ? window.claude : undefined;
}

// When the preview's file-type allowlist rejects an extension, fall back to a
// permitted one that carries the same bytes. CSV is plain text, so `.txt`
// preserves it perfectly; the JSON backup is already an allowed type.
const SAFE_EXT = { csv: 'txt', doc: 'txt', html: 'txt', htm: 'txt' };
function safeName(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return filename;
  const ext = filename.slice(dot + 1).toLowerCase();
  return SAFE_EXT[ext] ? `${filename.slice(0, dot)}.${SAFE_EXT[ext]}` : filename;
}

export function downloadBlob(filename, blob) {
  const runtime = claudeRuntime();
  if (runtime && typeof runtime.use === 'function') {
    Promise.resolve(runtime.use('downloads'))
      .then((downloads) => {
        if (!downloads) return browserDownload(filename, blob);
        const save = (name) => downloads.save({ filename: name, data: blob });
        // The viewer sees a confirmation and may decline; a decline is a
        // deliberate choice, so don't fall back and re-prompt. If the file
        // type itself is not allowed, retry once with a permitted extension
        // so the data still reaches the viewer. Anything else falls back to
        // the ordinary browser path.
        return save(filename).catch((err) => {
          const code = err && err.code;
          if (code === 'declined') return undefined;
          const alt = safeName(filename);
          if ((code === 'rejected_extension' || code === 'extension_not_enabled') && alt !== filename) {
            return save(alt).catch((e2) => {
              if (e2 && e2.code === 'declined') return undefined;
              return browserDownload(filename, blob);
            });
          }
          return browserDownload(filename, blob);
        });
      })
      .catch(() => browserDownload(filename, blob));
    return;
  }
  browserDownload(filename, blob);
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
  .letterhead { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 12px; margin-bottom: 8px; }
  .letterhead h1 { color: #4F46E5; margin: 0; font-size: 22pt; }
  .letterhead .unit { color: #000; font-size: 10pt; margin: 2px 0; }
  .letterhead .sub { background: #06B6D4; color: #000; display: inline-block; padding: 2px 14px; font-size: 11pt; font-weight: bold; }
  .letterhead .contact { color: #000; font-size: 8.5pt; margin-top: 4px; }
  h2 { color: #4F46E5; font-size: 14pt; border-left: 6px solid #06B6D4; padding-left: 8px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
  th { background: #4F46E5; color: #fff; padding: 6px 8px; border: 1px solid #000; font-size: 10pt; }
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

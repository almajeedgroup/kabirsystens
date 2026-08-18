import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType, ImageRun,
} from 'docx';
import { COLLEGE } from '../constants.js';
import { getSettings } from '../store.js';
import { logoToPng } from '../assets/collegeLogo.js';

// Decode a "data:...;base64,xxxx" URL into raw bytes for docx image embedding.
function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const b64 = dataUrl.slice(comma + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const INDIGO = '4F46E5';
const CYAN = '06B6D4';

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
// preserves it perfectly. Binary formats (.docx) are NOT remapped — a .docx
// renamed to .txt would just be unreadable, so it falls through instead.
const SAFE_EXT = { csv: 'txt' };
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

// Build one docx table from a matrix whose first row is the header.
function docxTable(rows) {
  const [head, ...body] = rows;
  const border = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
  const borders = { top: border, bottom: border, left: border, right: border };

  const headerRow = new TableRow({
    tableHeader: true,
    children: head.map((h) => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: INDIGO, color: 'auto' },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({
        children: [new TextRun({ text: String(h ?? ''), bold: true, color: 'FFFFFF', size: 18 })],
      })],
    })),
  });

  const bodyRows = body.map((r, ri) => new TableRow({
    children: head.map((_, ci) => new TableCell({
      shading: ri % 2 ? { type: ShadingType.CLEAR, fill: 'F3F4FB', color: 'auto' } : undefined,
      margins: { top: 30, bottom: 30, left: 80, right: 80 },
      children: [new Paragraph({
        children: [new TextRun({ text: String(r[ci] ?? ''), size: 18 })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [headerRow, ...bodyRows],
  });
}

// sections: [{ title, rows }] where rows[0] is the header row.
// Produces a genuine .docx that opens cleanly in Word, Pages and Google Docs.
export async function exportWord(filename, docTitle, sections) {
  const s = getSettings();
  const name = (s.collegeName || COLLEGE.name).toUpperCase();
  const unit = (s.unit || COLLEGE.unit).toUpperCase();
  const contact = [s.address, s.phone, s.email].filter(Boolean).join('  ·  ');
  const centred = (children) => new Paragraph({ alignment: AlignmentType.CENTER, children });

  // Letterhead logo: the uploaded college logo if there is one, otherwise the
  // built-in crest. Rendered to PNG so it embeds in the document.
  let logoPara = null;
  try {
    const png = await logoToPng(320, s.logo || undefined);
    if (png) {
      logoPara = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new ImageRun({
          data: dataUrlToBytes(png),
          transformation: { width: 84, height: 84 },
        })],
      });
    }
  } catch {
    logoPara = null;
  }

  const head = [
    ...(logoPara ? [logoPara] : []),
    centred([new TextRun({ text: name, bold: true, color: INDIGO, size: 40 })]),
    centred([new TextRun({ text: 'FOR WOMEN', bold: true, color: CYAN, size: 20 })]),
    centred([new TextRun({ text: unit, size: 18 })]),
    ...(contact ? [centred([new TextRun({ text: contact, size: 15, color: '555555' })])] : []),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INDIGO, space: 6 } },
      children: [],
    }),
    new Paragraph({ spacing: { before: 160 }, heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: docTitle, bold: true, color: INDIGO, size: 30 })] }),
    new Paragraph({ children: [new TextRun({
      text: `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      italics: true, size: 16, color: '666666' })] }),
  ];

  const bodyBlocks = sections.flatMap((sec) => [
    ...(sec.title ? [new Paragraph({ spacing: { before: 220, after: 60 }, heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: sec.title, bold: true, color: INDIGO, size: 24 })] })] : []),
    docxTable(sec.rows),
    new Paragraph({ children: [] }),
  ]);

  const foot = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 },
    children: [new TextRun({ text: `Software by ${COLLEGE.developer}`, size: 14, color: '999999' })] })];

  const doc = new Document({
    creator: COLLEGE.developer,
    title: docTitle,
    sections: [{ children: [...head, ...bodyBlocks, ...foot] }],
  });

  const blob = await Packer.toBlob(doc);
  download(filename, blob);
}

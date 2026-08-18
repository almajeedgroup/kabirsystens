// The college crest, drawn as a self-contained SVG string so the *same*
// artwork can be used three ways: rendered in the app (Logo.jsx), rasterised
// to a PNG for embedding in Word exports, and printed on the letterhead.
//
// A laurel wreath around a torch "K" monogram, with the college name arched
// below and a "FOR WOMEN" banner — matching the printed college crest.

const NAVY = '#17285B';
const GOLD = '#C6A15B';
const GREY = '#98A0AE';

// Cubic Bézier helpers, used to lay laurel leaves along each branch.
function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
}
function bezierAngle(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function branch(mirror) {
  // Control points for the left branch; mirrored across x=100 for the right.
  const mx = (x) => (mirror ? 200 - x : x);
  const p0 = [mx(100), 176];
  const p1 = [mx(56), 172];
  const p2 = [mx(36), 118];
  const p3 = [mx(52), 54];
  const stem = `M${p0[0]},${p0[1]} C${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`;
  let leaves = '';
  const N = 9;
  for (let i = 1; i <= N; i++) {
    const t = i / (N + 1);
    const [cx, cy] = bezier(p0, p1, p2, p3, t);
    const ang = bezierAngle(p0, p1, p2, p3, t);
    // Outer leaf leans away from the stem, inner leaf toward the centre.
    const outer = ang + (mirror ? 55 : -55);
    const inner = ang + (mirror ? -35 : 35);
    leaves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="8" ry="3.1" transform="rotate(${outer.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    leaves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="6.5" ry="2.6" transform="rotate(${inner.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  }
  return { stem, leaves };
}

export function collegeLogoSvg() {
  const L = branch(false);
  const R = branch(true);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Kabir Ind PU College crest">
  <defs>
    <path id="kicArc" d="M40,108 A62,62 0 0 0 160,108" fill="none"/>
  </defs>
  <g fill="none" stroke="${NAVY}" stroke-width="3.4" stroke-linecap="round">
    <path d="${L.stem}"/>
    <path d="${R.stem}"/>
  </g>
  <g fill="${NAVY}">
    ${L.leaves}
    ${R.leaves}
  </g>
  <!-- torch flame -->
  <path d="M112,44 C104,54 108,66 120,72 C130,62 128,50 112,44 Z" fill="${GOLD}"/>
  <!-- K monogram -->
  <rect x="82" y="58" width="10" height="74" rx="1.5" fill="${NAVY}"/>
  <polygon points="92,96 120,64 134,64 100,102" fill="${GREY}"/>
  <polygon points="100,100 132,134 118,134 92,104" fill="${NAVY}"/>
  <!-- arched college name -->
  <text fill="${NAVY}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="13.5" letter-spacing="0.5">
    <textPath href="#kicArc" startOffset="50%" text-anchor="middle">KABIR IND PU COLLEGE</textPath>
  </text>
  <!-- banner -->
  <rect x="70" y="150" width="60" height="15" rx="2" fill="${NAVY}"/>
  <text x="100" y="161" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-size="9" font-weight="700" letter-spacing="2.5" text-anchor="middle">FOR WOMEN</text>
</svg>`;
}

// Rasterise the crest (or a supplied logo data URL) to a PNG data URL, so it
// can be embedded in a Word document. Returns null if rendering isn't possible
// (e.g. no DOM). `src` overrides the crest with an uploaded logo.
export function logoToPng(size = 320, src) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') { resolve(null); return; }
    const img = new Image();
    let url = null;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Fit the source into a square, preserving aspect ratio.
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        if (url) URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => { if (url) URL.revokeObjectURL(url); resolve(null); };
    if (src) {
      img.src = src;
    } else {
      url = URL.createObjectURL(new Blob([collegeLogoSvg()], { type: 'image/svg+xml' }));
      img.src = url;
    }
  });
}

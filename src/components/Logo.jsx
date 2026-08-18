import { collegeLogoSvg } from '../assets/collegeLogo.js';

// Renders the college crest. On a dark background (`dark`), the navy crest is
// placed on a light disc so it stays legible.
export default function Logo({ size = 48, dark = false }) {
  const pad = dark ? Math.round(size * 0.12) : 0;
  return (
    <span
      className="college-logo"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        padding: pad,
        borderRadius: dark ? '50%' : 0,
        background: dark ? '#FFFFFF' : 'transparent',
        boxSizing: 'border-box',
      }}
      // The crest is a trusted, self-authored constant SVG string.
      dangerouslySetInnerHTML={{ __html: collegeLogoSvg() }}
    />
  );
}

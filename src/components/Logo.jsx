import { COLLEGE_LOGO } from '../assets/logo.js';

// The college crest. `src` lets callers show an uploaded logo instead.
export default function Logo({ size = 48, src }) {
  return (
    <img
      className="college-logo"
      src={src || COLLEGE_LOGO}
      alt="Kabir Ind PU College crest"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

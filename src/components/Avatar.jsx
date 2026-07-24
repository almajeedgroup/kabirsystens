const PALETTE_INDEX = ['#007FFF', '#0059B3', '#DAA520', '#0F4C81', '#3399FF'];

export default function Avatar({ name = '', photo, size = 40 }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  const hue = PALETTE_INDEX[(name.length + (name.charCodeAt(0) || 0)) % PALETTE_INDEX.length];

  if (photo) {
    return (
      <img
        className="avatar"
        src={photo}
        alt=""
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials || '•'}
    </span>
  );
}

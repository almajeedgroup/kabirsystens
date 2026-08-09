const PALETTE_INDEX = ['#4F46E5', '#3B82F6', '#06B6D4', '#6366F1', '#0EA5E9'];

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

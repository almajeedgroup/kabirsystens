// Emblem inspired by the college crest: laurel wreath around a torch monogram.
export default function Logo({ size = 48, dark = false }) {
  const ring = dark ? '#FFFFFF' : '#1B2A5E';
  const flame = '#DAA520';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Kabir Ind PU College emblem"
    >
      {/* laurel wreath */}
      <g stroke={ring} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M25 78 C12 62, 12 38, 25 22" />
        <path d="M75 78 C88 62, 88 38, 75 22" />
      </g>
      <g fill={ring}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`l${i}`}
            cx={20 - i * 0.8}
            cy={70 - i * 9}
            rx="4.5"
            ry="2.2"
            transform={`rotate(${-40 + i * 10} ${20 - i * 0.8} ${70 - i * 9})`}
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`r${i}`}
            cx={80 + i * 0.8}
            cy={70 - i * 9}
            rx="4.5"
            ry="2.2"
            transform={`rotate(${40 - i * 10} ${80 + i * 0.8} ${70 - i * 9})`}
          />
        ))}
      </g>
      {/* torch */}
      <path
        d="M50 20 C46 26, 45 30, 50 35 C55 30, 54 26, 50 20 Z"
        fill={flame}
      />
      <rect x="47.5" y="37" width="5" height="26" rx="2" fill={flame} />
      {/* monogram strokes */}
      <path d="M42 40 L42 62 M42 50 L56 38 M44 52 L58 64" stroke={dark ? '#FFFFFF' : '#8A8FA3'} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

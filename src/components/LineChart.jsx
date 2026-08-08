import { useState } from 'react';
import { formatINR } from '../constants.js';

// Smooth multi-series line chart in the reference dashboard style: soft grid,
// gradient area under the primary line, rounded markers, hover crosshair.
export default function LineChart({ labels, series, height = 260 }) {
  const [hover, setHover] = useState(null);

  const W = 960;
  const H = height;
  const pad = { top: 20, right: 16, bottom: 30, left: 46 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const niceMax = max * 1.15;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);

  const n = labels.length;
  const x = (i) => pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v) => pad.top + plotH - (v / niceMax) * plotH;

  const short = (v) =>
    v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v));

  // Smooth path via Catmull-Rom → Bézier.
  const smooth = (vals) => {
    const pts = vals.map((v, i) => [x(i), y(v)]);
    if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const hasData = allValues.some((v) => v > 0);
  const primary = series[0];

  return (
    <div className="chart-wrap">
      {series.length > 1 && (
        <div className="chart-legend" style={{ marginBottom: 8 }}>
          {series.map((s) => (
            <span key={s.name}>
              <span className="legend-dot" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="lc-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={primary.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={primary.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#000" strokeOpacity={i === 0 ? 0.16 : 0.06} />
            {(hasData || i === 0) && (
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">{short(t)}</text>
            )}
          </g>
        ))}

        {/* primary area fill */}
        {hasData && (
          <path
            d={`${smooth(primary.values)} L${x(n - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`}
            fill="url(#lc-area)"
          />
        )}

        {series.map((s) => (
          <path key={s.name} d={smooth(s.values)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* hover layer */}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={x(i) - plotW / n / 2}
            y={pad.top}
            width={plotW / n}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + plotH} stroke={primary.color} strokeOpacity="0.35" strokeDasharray="4 4" />
        )}
        {hover !== null &&
          series.map((s) => (
            <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] || 0)} r="5" fill="#fff" stroke={s.color} strokeWidth="2.5" />
          ))}

        {labels.map((lab, i) => (
          <text key={i} x={x(i)} y={H - 9} textAnchor="middle" className="chart-tick">{lab}</text>
        ))}
      </svg>

      {hover !== null && (
        <div className="chart-tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <span key={s.name}>{s.name}: ₹ {formatINR(s.values[hover] || 0)}</span>
          ))}
        </div>
      )}
      {!hasData && <div className="chart-empty">No data recorded yet for this year</div>}
    </div>
  );
}

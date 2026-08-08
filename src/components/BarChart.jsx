import { useState } from 'react';
import { formatINR } from '../constants.js';

// Single-series bar chart (monthly totals). Azure bars on white surface,
// rounded data-ends, per-bar hover tooltip, recessive grid.
export default function BarChart({ labels, values, height = 220 }) {
  const [hover, setHover] = useState(null);

  const W = 960;
  const H = height;
  const pad = { top: 26, right: 12, bottom: 26, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const max = Math.max(...values, 1);
  const niceMax = max * 1.1;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);

  const n = values.length;
  const slot = plotW / n;
  const barW = Math.min(slot * 0.55, 44);
  const maxIdx = values.indexOf(Math.max(...values));
  const hasData = values.some((v) => v > 0);

  const x = (i) => pad.left + i * slot + (slot - barW) / 2;
  const y = (v) => pad.top + plotH - (v / niceMax) * plotH;

  const short = (v) =>
    v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v));

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Monthly expense totals">
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#000"
              strokeOpacity={i === 0 ? 0.28 : 0.08}
            />
            {(hasData || i === 0) && (
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">
                {short(t)}
              </text>
            )}
          </g>
        ))}
        {values.map((v, i) => {
          const bh = Math.max((v / niceMax) * plotH, v > 0 ? 3 : 0);
          const active = hover === i;
          return (
            <g key={i}>
              {/* hit target larger than the mark */}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {v > 0 && (
                <path
                  d={`M${x(i)},${pad.top + plotH}
                      L${x(i)},${y(v) + 4}
                      Q${x(i)},${y(v)} ${x(i) + 4},${y(v)}
                      L${x(i) + barW - 4},${y(v)}
                      Q${x(i) + barW},${y(v)} ${x(i) + barW},${y(v) + 4}
                      L${x(i) + barW},${pad.top + plotH} Z`}
                  fill={active ? '#6d28d9' : '#7c3aed'}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {(i === maxIdx && hasData && v > 0) && (
                <text x={x(i) + barW / 2} y={y(v) - 7} textAnchor="middle" className="chart-label">
                  ₹{short(v)}
                </text>
              )}
              <text
                x={pad.left + i * slot + slot / 2}
                y={H - 8}
                textAnchor="middle"
                className="chart-tick"
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tooltip" style={{ left: `${((pad.left + hover * slot + slot / 2) / W) * 100}%` }}>
          <strong>{labels[hover]}</strong>
          <span>₹ {formatINR(values[hover])}</span>
        </div>
      )}
      {!hasData && <div className="chart-empty">No expenses recorded yet for this year</div>}
    </div>
  );
}

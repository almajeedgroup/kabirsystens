// Compact legend explaining the traffic-light figure colours.
const DEFAULT = [
  ['good', 'Cleared / positive'],
  ['caution', 'Partly paid'],
  ['warn', 'Unpaid / shortfall'],
];

export default function StatusLegend({ items = DEFAULT }) {
  return (
    <div className="status-legend" aria-hidden="true">
      {items.map(([status, label]) => (
        <span key={label}>
          <span className={`dot dot-${status}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

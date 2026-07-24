// Traffic-light status for financial figures:
//   good (green) · caution (yellow) · warn (red)
// Kept separate from the app's azure/goldenrod accent so the colours read
// purely as status, not decoration.

// Money collected against an agreed/total amount.
//   fully collected → good · nothing collected → warn · partway → caution
export function collectionStatus(paid, total) {
  const p = Number(paid) || 0;
  const t = Number(total) || 0;
  if (t <= 0 && p <= 0) return ''; // nothing to judge yet
  if (t > 0 && p >= t) return 'good';
  if (p <= 0) return 'warn';
  return 'caution';
}

// Amount still owed. Cleared → good · fully outstanding → warn · partway → caution.
export function dueStatus(paid, agreed) {
  return collectionStatus(paid, agreed);
}

// A signed figure where positive is good (a surplus / net position).
export function signStatus(value) {
  const v = Number(value) || 0;
  if (v > 0) return 'good';
  if (v < 0) return 'warn';
  return 'caution';
}

// Class string for a figure's status ('' → inherit the default ink colour).
export function figClass(status) {
  return status ? `fig fig-${status}` : '';
}

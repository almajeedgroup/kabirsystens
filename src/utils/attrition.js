// Staff attrition helpers.
//
// A member is "active" unless explicitly marked left. Attrition rate is the
// share of all members on record who have left:
//     attrition % = (members who left) / (all members ever on roll) × 100
// "Left this year" counts leavers whose date of leaving falls in the given
// academic year (June–May).

export function isActive(member) {
  return (member.status || 'active') !== 'left';
}

// Academic-year window for a label like "2025-26" → [Jun 1 2025, Jun 1 2026).
function yearWindow(year) {
  const start = Number(String(year).slice(0, 4));
  return [new Date(start, 5, 1), new Date(start + 1, 5, 1)];
}

export function attritionStats(staff, year) {
  const total = staff.length;
  const left = staff.filter((s) => !isActive(s));
  const active = total - left.length;
  const rate = total > 0 ? (left.length / total) * 100 : 0;

  let leftThisYear = 0;
  if (year) {
    const [from, to] = yearWindow(year);
    leftThisYear = left.filter((s) => {
      if (!s.exitDate) return false;
      const d = new Date(s.exitDate);
      return d >= from && d < to;
    }).length;
  }

  return { total, active, left: left.length, rate, leftThisYear };
}

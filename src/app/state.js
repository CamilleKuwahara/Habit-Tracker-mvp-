export const defaultState = {
  habits: [],
  checks: {},
  chartWindowDays: 30,
};

// ---------- Date helpers ----------
const pad2 = (n) => String(n).padStart(2, "0");

export function toISODate(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso) {
  // Safer parse; avoids weird results if iso is invalid
  const parts = String(iso).split("-").map(Number);
  if (parts.length !== 3 || parts.some((x) => !Number.isFinite(x))) {
    return new Date(NaN);
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// good enough for local IDs (not cryptographically secure)
export function uid() {
  return `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

// ---------- Habit logic ----------
export function isHabitActiveOnDate(habit, isoDate) {
  // Active if created on/before date and not deleted yet (or deleted after date)
  return (
    habit.createdAt <= isoDate &&
    (habit.deletedAt == null || habit.deletedAt > isoDate)
  );
}

export function getActiveHabitsForDate(state, isoDate) {
  return state.habits.filter((h) => isHabitActiveOnDate(h, isoDate));
}

export function getChecksForDate(state, isoDate) {
  // Ensure the date bucket exists (your code expects this mutation)
  const existing = state.checks[isoDate];
  if (existing && typeof existing === "object") return existing;

  state.checks[isoDate] = {};
  return state.checks[isoDate];
}

export function getCompletionForDate(state, isoDate) {
  const active = getActiveHabitsForDate(state, isoDate);
  const checks = getChecksForDate(state, isoDate);

  let done = 0;
  for (const h of active) {
    if (checks[h.id] === true) done++;
  }

  const total = active.length;
  const rate = total === 0 ? 0 : (done / total) * 100;

  return { done, total, rate };
}

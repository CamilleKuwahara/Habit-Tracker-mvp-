import { defaultState } from "./state.js";

const VERSION = "v1";
const keyFor = (userId) => `habitTracker:${userId}:${VERSION}`;

function normalizeState(raw) {
  return {
    habits: Array.isArray(raw?.habits) ? raw.habits : [],
    checks: raw?.checks && typeof raw.checks === "object" ? raw.checks : {},
    chartWindowDays: Number.isFinite(raw?.chartWindowDays)
      ? raw.chartWindowDays
      : defaultState.chartWindowDays,
  };
}

export function loadState(userId) {
  const raw = localStorage.getItem(keyFor(userId));
  if (!raw) return { ...defaultState };

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return { ...defaultState };
  }
}

export function saveState(userId, state) {
  // normalize before saving so storage stays consistent over time
  localStorage.setItem(keyFor(userId), JSON.stringify(normalizeState(state)));
}

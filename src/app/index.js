import { publishDailySummary } from "../feed/feed.js"; // adjust path
import { account } from "../auth/appwrite"; // adjust path

import { loadState, saveState } from "./storage.js";
import {
  uid,
  toISODate,
  fromISODate,
  getActiveHabitsForDate,
  getChecksForDate,
  getCompletionForDate,
} from "./state.js";
import { drawChart } from "./chart.js";

function mustGet(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

const WEEKDAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];
const todayISO = () => toISODate(new Date());

export function mountHabitApp(userId) {
  // ---- DOM ----
  const ui = {
    habitInput: mustGet("habitInput"),
    addHabitBtn: mustGet("addHabitBtn"),
    habitList: mustGet("habitList"),
    datePicker: mustGet("datePicker"),
    todayBtn: mustGet("todayBtn"),
    dayLabel: mustGet("dayLabel"),
    todayRateEl: mustGet("todayRate"),
    todayCountsEl: mustGet("todayCounts"),
    resetBtn: mustGet("resetBtn"),
    exportBtn: mustGet("exportBtn"),
    windowDaysEl: mustGet("windowDays"),
    canvas: mustGet("chart"),
  };

  // Publish UI (optional elements — don’t crash if not present)
  const publishBtn = document.getElementById("publishBtn");
  const shareToggle = document.getElementById("shareHabitsToggle");
  const publishStatus = document.getElementById("publishStatus");

  const ctx = ui.canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // ---- State ----
  let state = loadState(userId);
  let selectedDate = todayISO();
  ui.datePicker.value = selectedDate;

  function commitAndRender() {
    saveState(userId, state);
    ui.windowDaysEl.textContent = String(state.chartWindowDays);

    const d = fromISODate(selectedDate);
    const weekday = WEEKDAYS_JP[d.getDay()] ?? "";
    ui.dayLabel.textContent = `${selectedDate}（${weekday}）のチェック`;

    const { done, total, rate } = getCompletionForDate(state, selectedDate);
    ui.todayRateEl.innerHTML = `${Math.round(rate)}<small>%</small>`;
    ui.todayCountsEl.innerHTML = `${done} <small>/ ${total}</small>`;

    renderHabitList();
    drawChart({ canvas: ui.canvas, ctx, state, selectedDate });
  }

  function renderHabitList() {
    ui.habitList.innerHTML = "";
    const active = getActiveHabitsForDate(state, selectedDate);
    const checks = getChecksForDate(state, selectedDate);

    if (active.length === 0) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.style.padding = "10px 2px";
      empty.textContent = "まだ習慣がありません。左上から追加してください。";
      ui.habitList.appendChild(empty);
      return;
    }

    for (const h of active) {
      const item = document.createElement("div");
      item.className = "habit-item";

      const left = document.createElement("div");
      left.className = "habit-left";
      left.style.cursor = "pointer";
      left.addEventListener("click", () => toggleCheck(h.id));

      const box = document.createElement("div");
      box.className = "chk" + (checks[h.id] ? " on" : "");
      box.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      const name = document.createElement("div");
      name.className = "habit-name";
      name.textContent = h.name;

      left.appendChild(box);
      left.appendChild(name);

      const actions = document.createElement("div");
      actions.className = "habit-actions";

      const del = document.createElement("button");
      del.className = "icon-btn btn-danger";
      del.title = "削除";
      del.innerHTML = "🗑";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteHabit(h.id);
      });

      actions.appendChild(del);

      item.appendChild(left);
      item.appendChild(actions);
      ui.habitList.appendChild(item);
    }
  }

  function addHabit() {
    const name = ui.habitInput.value.trim();
    if (!name) return;

    state.habits.push({
      id: uid(),
      name,
      createdAt: todayISO(),
      deletedAt: null,
    });

    ui.habitInput.value = "";
    commitAndRender();
  }

  function deleteHabit(habitId) {
    const h = state.habits.find((x) => x.id === habitId);
    if (!h) return;

    h.deletedAt = todayISO();

    const checks = getChecksForDate(state, selectedDate);
    delete checks[habitId];

    commitAndRender();
  }

  function toggleCheck(habitId) {
    const checks = getChecksForDate(state, selectedDate);
    checks[habitId] = !checks[habitId];
    commitAndRender();
  }

  function resetAll() {
    if (!confirm("全データを削除します。よろしいですか？")) return;

    state.habits = [];
    state.checks = {};
    state.chartWindowDays = 30;

    selectedDate = todayISO();
    ui.datePicker.value = selectedDate;
    commitAndRender();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-${userId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---- Publish helpers ----
  function getHabitsDoneNamesForDate() {
    const active = getActiveHabitsForDate(state, selectedDate);
    const checks = getChecksForDate(state, selectedDate);
    return active.filter((h) => checks[h.id] === true).map((h) => h.name);
  }

  async function publishToday() {
    try {
      if (!publishBtn) return;

      const today = todayISO();
      if (selectedDate !== today) {
        if (publishStatus)
          publishStatus.textContent = "You can only publish today's tracker.";
        return;
      }

      publishBtn.disabled = true;
      if (publishStatus) publishStatus.textContent = "Publishing...";

      const { done, total, rate } = getCompletionForDate(state, selectedDate);
      const shareHabits = !!shareToggle?.checked;
      const habitsDone = shareHabits ? getHabitsDoneNamesForDate() : [];

      let displayName = "";
      try {
        const u = await account.get();
        displayName = u?.name || "";
      } catch {
        displayName = "";
      }

      await publishDailySummary({
        userId,
        displayName,
        date: selectedDate,
        done,
        total,
        rate: Math.round(rate),
        shareHabits,
        habitsDone,
      });

      if (publishStatus) publishStatus.textContent = "✅ Published!";
    } catch (e) {
      if (publishStatus)
        publishStatus.textContent = `Publish failed: ${e?.message || e}`;
    } finally {
      if (publishBtn) publishBtn.disabled = false;
    }
  }

  // ---- Event handlers (named so cleanup works) ----
  const onAddClick = () => addHabit();
  const onHabitKeydown = (e) => {
    if (e.key === "Enter") addHabit();
  };
  const onDateChange = () => {
    selectedDate = ui.datePicker.value || todayISO();
    commitAndRender();
  };
  const onTodayClick = () => {
    selectedDate = todayISO();
    ui.datePicker.value = selectedDate;
    commitAndRender();
  };
  const onResetClick = () => resetAll();
  const onExportClick = () => exportJSON();

  const onPublishClick = () => publishToday();

  // Debounced resize redraw
  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawChart({ canvas: ui.canvas, ctx, state, selectedDate });
    }, 100);
  };

  // ---- Attach listeners ----
  ui.addHabitBtn.addEventListener("click", onAddClick);
  ui.habitInput.addEventListener("keydown", onHabitKeydown);
  ui.datePicker.addEventListener("change", onDateChange);
  ui.todayBtn.addEventListener("click", onTodayClick);
  ui.resetBtn.addEventListener("click", onResetClick);
  ui.exportBtn.addEventListener("click", onExportClick);
  window.addEventListener("resize", onResize);

  publishBtn?.addEventListener("click", onPublishClick);

  // Initial render
  commitAndRender();

  // ---- Cleanup ----
  return function cleanup() {
    ui.addHabitBtn.removeEventListener("click", onAddClick);
    ui.habitInput.removeEventListener("keydown", onHabitKeydown);
    ui.datePicker.removeEventListener("change", onDateChange);
    ui.todayBtn.removeEventListener("click", onTodayClick);
    ui.resetBtn.removeEventListener("click", onResetClick);
    ui.exportBtn.removeEventListener("click", onExportClick);
    window.removeEventListener("resize", onResize);
    clearTimeout(resizeTimer);

    publishBtn?.removeEventListener("click", onPublishClick);

    ui.habitList.innerHTML = "";
    ui.dayLabel.textContent = "";
    ui.todayRateEl.innerHTML = `0<small>%</small>`;
    ui.todayCountsEl.innerHTML = `0 <small>/ 0</small>`;
  };
}

import { loadFeed } from "./feed.js";

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function niceDate(iso) {
  // "2026-02-05" -> keep as-is, or customize later
  return iso || "";
}

function makePostCard(p) {
  const name = p.displayName?.trim() || "Someone";
  const date = niceDate(p.date);
  const done = Number(p.done ?? 0);
  const total = Number(p.total ?? 0);
  const rate = Number(p.rate ?? 0);

  const showHabits = !!p.shareHabits && Array.isArray(p.habitsDone) && p.habitsDone.length > 0;
  const habits = showHabits ? p.habitsDone : [];

  const wrap = document.createElement("article");
  wrap.className = "feed-card";

  // Header row (name + date)
  const header = document.createElement("div");
  header.className = "feed-head";
  header.innerHTML = `
    <div class="feed-title">
      <div class="feed-name">${escapeHtml(name)}</div>
      <div class="feed-date muted">${escapeHtml(date)}</div>
    </div>
  `;

  // Stats row
  const stats = document.createElement("div");
  stats.className = "feed-stats";
  stats.innerHTML = `
    <div class="feed-pill"><span class="muted">Completion</span><b>${rate}%</b></div>
    <div class="feed-pill"><span class="muted">Checked</span><b>${done} / ${total}</b></div>
  `;

  // Optional habits
  const details = document.createElement("div");
  details.className = "feed-details";
  details.innerHTML = showHabits
    ? `<div class="muted">✅ ${escapeHtml(habits.join(", "))}</div>`
    : `<div class="muted">Habit names hidden</div>`;

  wrap.appendChild(header);
  wrap.appendChild(stats);
  wrap.appendChild(details);

  return wrap;
}

export function mountFeedUI() {
  const listEl = document.getElementById("feedList");
  const statusEl = document.getElementById("feedStatus");
  const refreshBtn = document.getElementById("refreshFeedBtn");

  if (!listEl || !statusEl || !refreshBtn) return () => {};

  async function refresh() {
    try {
      statusEl.textContent = "Loading feed...";
      listEl.innerHTML = "";

      const res = await loadFeed({ limit: 50 });
      const docs = res?.documents || [];

      if (docs.length === 0) {
        statusEl.textContent = "No posts yet. Publish today to be the first!";
        return;
      }

      statusEl.textContent = `${docs.length} updates`;

      docs.forEach((p, idx) => {
        const card = makePostCard(p);
        listEl.appendChild(card);

        // Divider between posts
        if (idx !== docs.length - 1) {
          const hr = document.createElement("div");
          hr.className = "feed-divider";
          listEl.appendChild(hr);
        }
      });
    } catch (e) {
      statusEl.textContent = `Feed failed to load: ${e?.message || e}`;
    }
  }

  const onRefreshClick = () => refresh();
  refreshBtn.addEventListener("click", onRefreshClick);
  refresh();

  return () => refreshBtn.removeEventListener("click", onRefreshClick);
}

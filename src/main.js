import "./styles/app.css";
import { mountHabitApp } from "./app/index.js";
import { injectAuthUI, showAuth, hideAuth } from "./auth/ui.js";
import { checkSession, wireAuth } from "./auth/session.js";

const root = document.getElementById("app");

// 1) Always render the app shell so mountHabitApp can find the DOM nodes
root.innerHTML = `
  <header class="flex items-end justify-between gap-4 px-5 py-5 max-w-[1100px] mx-auto">
    <div>
      <h1>Habit Tracker</h1>
      <div class="sub">習慣を追加して、日付ごとにチェック。達成率(%)を線グラフで可視化します（localStorage保存）。</div>
    </div>

    <div class="flex items-center gap-2">
      <a href="/feed.html" class="btn-ghost">News Feed</a>
      <div id="userBadge" class="muted">Not logged in</div>
      <button id="accountBtn" class="btn-ghost">Account</button>
    </div>
  </header>

  <main class="wrap" id="appWrap">
    <!-- Left: habits & controls -->
    <section class="card">
      <div class="hd">
        <h2>習慣の管理</h2>
        <button class="btn-ghost" id="exportBtn" title="JSONを書き出し">Export</button>
      </div>
      <div class="bd">
        <div class="row">
          <input id="habitInput" type="text" placeholder="例: 走る / 読書 / ストレッチ" maxlength="60" />
          <button id="addHabitBtn">追加</button>
        </div>

        <div class="habits" id="habitList"></div>

        <div class="hint">
          ✅ クリックでチェック切り替え / 🗑 削除（過去のグラフ整合性のため「非表示化」扱い）<br/>
          日付ごとに達成率（チェック数 ÷ その日に有効な習慣数）を計算します。
        </div>

        <div class="footer-actions">
          <button class="btn-danger" id="resetBtn" title="全データ削除">Reset</button>
        </div>
      </div>
    </section>

    <!-- Right: daily + chart -->
    <section class="card">
      <div class="hd">
        <h2>日付別チェック & グラフ</h2>
        <div class="row">
          <input id="datePicker" type="date" />
          <button class="btn-ghost" id="todayBtn">今日</button>
        </div>
      </div>
      <div class="bd">
        <div class="muted" id="dayLabel"></div>

        <div class="stats">
          <div class="pill">
            <div class="k">今日の達成率</div>
            <div class="v" id="todayRate">0<small>%</small></div>
          </div>
          <div class="pill">
            <div class="k">チェック数 / 有効習慣数</div>
            <div class="v" id="todayCounts">0 <small>/ 0</small></div>
          </div>
          <div class="pill">
            <div class="k">表示期間</div>
            <div class="v"><span id="windowDays">30</span><small>日</small></div>
          </div>
        </div>

        <div class="hint" style="margin-top: 10px;">
          🔒 Private habits are saved on this device. Publishing posts a public summary.
        </div>

        <div class="row" style="margin-top: 10px; gap: 10px; align-items:center;">
          <label class="muted" style="display:flex; gap:8px; align-items:center;">
            <input id="shareHabitsToggle" type="checkbox" />
            Share habit names
          </label>

          <button id="publishBtn" class="btn-ghost">Publish today</button>
        </div>

        <div id="publishStatus" class="muted" style="margin-top: 8px;"></div>

        <div class="graph-wrap">
          <div class="muted" style="margin:12px 0 8px;">達成率(%)の推移（直近30日）</div>
          <canvas id="chart" width="1200" height="520" aria-label="達成率の線グラフ"></canvas>
        </div>
      </div>
    </section>
  </main>
`;

// 2) Auth overlay
injectAuthUI();

const appWrap = document.getElementById("appWrap");
appWrap.style.display = "none";

// Track current mounted user + cleanup
let currentUserId = null;
let cleanupHabitApp = null;

function openAuthOverlay() {
  // Logged in: show "Go back home" + Logout
  // Logged out: show login/signup form
  const loggedIn = !!currentUserId;
  window.__authUI?.setHomeMode?.(loggedIn);
  window.__authUI?.setLogoutVisible?.(loggedIn);
  showAuth();
}

document.getElementById("accountBtn").addEventListener("click", openAuthOverlay);

function mountForUser(user) {
  const userId = user.$id;

  cleanupHabitApp?.();
  cleanupHabitApp = null;

  currentUserId = userId;

  console.log("✅ Logged in user:", user);

  const badge = document.getElementById("userBadge");
  if (badge) badge.textContent = `Logged in: ${user.name || user.email}`;

  appWrap.style.display = "";

  cleanupHabitApp = mountHabitApp(userId);

  // Ensure overlay is in "logged-in" mode if opened
  window.__authUI?.setHomeMode?.(true);
  window.__authUI?.setLogoutVisible?.(true);

  console.log("✅ Habit app mounted for:", userId);
}

// 4) Check existing session
checkSession((user) => {
  console.log("✅ Session found");
  mountForUser(user);
});

// 5) Wire login/signup/logout
wireAuth(
  (user) => {
    console.log("✅ Logged in via UI");
    mountForUser(user);

    // close overlay after successful login/signup
    hideAuth();
  },
  () => {
    console.log("✅ Logged out");

    cleanupHabitApp?.();
    cleanupHabitApp = null;

    currentUserId = null;
    appWrap.style.display = "none";

    const badge = document.getElementById("userBadge");
    if (badge) badge.textContent = "Not logged in";

    // Reset overlay mode
    window.__authUI?.setHomeMode?.(false);
    window.__authUI?.setLogoutVisible?.(false);

    // close overlay after logout
    hideAuth();
  }
);

import "../styles/app.css";
import { injectAuthUI } from "../auth/ui.js";
import { checkSession, wireAuth } from "../auth/session.js";
import { mountFeedUI } from "./feedUI.js";

const root = document.getElementById("app");

root.innerHTML = `
  <header class="px-5 py-5">
    <div class="max-w-[760px] mx-auto flex items-end justify-between gap-4">
      <div>
        <h1>News Feed</h1>
        <div class="sub">Shared habit summaries (login required)</div>
      </div>

      <div class="flex items-center gap-2">
        <div id="userBadge" class="muted">Not logged in</div>
        <a href="/" class="btn-ghost">← Back</a>
        <button id="accountBtn" class="btn-ghost">Account</button>
      </div>
    </div>
  </header>

  <main class="px-5 pb-10" id="feedWrap">
    <div class="max-w-[760px] mx-auto">
      <section class="card">
        <div class="hd">
          <h2>Recent updates</h2>
          <div class="row" style="gap:8px; align-items:center;">
            <button class="btn-ghost" id="refreshFeedBtn">Refresh</button>
          </div>
        </div>

        <div class="bd">
          <div id="feedStatus" class="muted" style="margin-bottom:10px;"></div>
          <div id="feedList"></div>
        </div>
      </section>
    </div>
  </main>
`;

// Auth overlay
injectAuthUI();
document.getElementById("accountBtn").addEventListener("click", () => {
  document.getElementById("authOverlay")?.classList.remove("hidden");
});

const feedWrap = document.getElementById("feedWrap");
feedWrap.style.display = "none";

let cleanupFeedUI = null;

function onLoggedIn(user) {
  const badge = document.getElementById("userBadge");
  if (badge) badge.textContent = `Logged in: ${user.name || user.email}`;

  feedWrap.style.display = "";
  cleanupFeedUI?.();
  cleanupFeedUI = mountFeedUI();
}

function onLoggedOut() {
  cleanupFeedUI?.();
  cleanupFeedUI = null;
  feedWrap.style.display = "none";

  const badge = document.getElementById("userBadge");
  if (badge) badge.textContent = "Not logged in";
}

checkSession(onLoggedIn);
wireAuth(onLoggedIn, onLoggedOut);

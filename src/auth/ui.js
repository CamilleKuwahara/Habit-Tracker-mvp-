export function injectAuthUI() {
  const overlay = document.createElement("div");
  overlay.id = "authOverlay";
  overlay.className = "fixed inset-0 z-50 hidden";

  overlay.innerHTML = `
    <!-- Backdrop (click to close) -->
    <div id="authBackdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

    <div class="relative min-h-full flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 class="text-white text-sm font-semibold">Account</h2>

          <div class="flex items-center gap-2">
            <button id="logoutBtn"
              class="hidden text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10">
              Logout
            </button>

          </div>
        </div>

        <div class="p-6">
          <p id="authStatus" class="text-xs text-slate-300 mb-4">
            Please log in to continue.
          </p>

          <!-- Auth form (logged OUT) -->
          <div id="authFormWrap">
            <div id="signupFields">
              <label class="block text-xs text-slate-300 mb-2">First name</label>
              <input id="firstNameInput"
                class="w-full mb-4 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white"
                type="text" placeholder="ex. Jane" />

              <label class="block text-xs text-slate-300 mb-2">Last name</label>
              <input id="lastNameInput"
                class="w-full mb-4 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white"
                type="text" placeholder="ex. Doe" />
            </div>

            <label class="block text-xs text-slate-300 mb-2">Email</label>
            <input id="authEmail" type="email" placeholder="you@example.com"
              class="w-full mb-4 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-400/60" />

            <label class="block text-xs text-slate-300 mb-2">Password</label>
            <input id="authPassword" type="password" placeholder="********"
              class="w-full mb-5 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-400/60" />

            <div class="flex gap-2">
              <div id="signupWrap" class="flex-1">
                <button id="signupBtn"
                  class="w-full rounded-xl px-4 py-3 text-sm font-medium bg-blue-500/80 text-white hover:bg-blue-500">
                  Sign up
                </button>
              </div>

              <button id="loginBtn"
                class="flex-1 rounded-xl px-4 py-3 text-sm font-medium bg-white/10 text-white hover:bg-white/15 border border-white/10">
                Log in
              </button>
            </div>

            <p class="text-[11px] text-slate-400 mt-4 leading-relaxed">
              MVP: Email/Password login. After login, Habit Tracker shows.
            </p>
          </div>

          <!-- Logged IN view -->
          <div id="homeWrap" class="hidden">
            <button id="goHomeBtn"
              class="w-full rounded-xl px-4 py-3 text-sm font-medium bg-white/10 text-white hover:bg-white/15 border border-white/10">
              Go back home
            </button>

            <p class="text-[11px] text-slate-400 mt-4 leading-relaxed">
              You’re already signed in.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // close helpers
  const close = () => hideAuth();
  document.getElementById("authBackdrop")?.addEventListener("click", close);
  document.getElementById("goHomeBtn")?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

export function showAuth() {
  document.getElementById("authOverlay")?.classList.remove("hidden");
}
export function hideAuth() {
  document.getElementById("authOverlay")?.classList.add("hidden");
}
export function setAuthStatus(text) {
  const el = document.getElementById("authStatus");
  if (el) el.textContent = text;
}

export function setLogoutVisible(visible) {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.classList.toggle("hidden", !visible);
}

export function setSignupVisible(visible) {
  const signupWrap = document.getElementById("signupWrap");
  const signupFields = document.getElementById("signupFields");
  if (signupWrap) signupWrap.classList.toggle("hidden", !visible);
  if (signupFields) signupFields.classList.toggle("hidden", !visible);
}

// NEW
export function setHomeMode(isLoggedIn) {
  const authForm = document.getElementById("authFormWrap");
  const homeWrap = document.getElementById("homeWrap");

  if (authForm) authForm.classList.toggle("hidden", isLoggedIn);
  if (homeWrap) homeWrap.classList.toggle("hidden", !isLoggedIn);
}

// bridge (so main.js can call it)
window.__authUI = window.__authUI || {};
window.__authUI.setHomeMode = setHomeMode;
window.__authUI.setLogoutVisible = setLogoutVisible;
window.__authUI.setSignupVisible = setSignupVisible;

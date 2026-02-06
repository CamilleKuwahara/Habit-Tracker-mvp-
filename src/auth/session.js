import { account } from "./appwrite";
import { ID } from "appwrite";

import {
  showAuth,
  hideAuth,
  setAuthStatus,
  setLogoutVisible,
  setSignupVisible,
} from "./ui";

// Small helper: safer element lookup
function byId(id) {
  return document.getElementById(id);
}

function setLoggedInUI(user) {
  hideAuth();
  setLogoutVisible(true);
  setSignupVisible(false);
  setAuthStatus(`Logged in as ${user.email}`);
}

function setLoggedOutUI() {
  setLogoutVisible(false);
  setSignupVisible(true);
  setAuthStatus("Please log in to continue.");
  showAuth();
}

function getEmailPassword() {
  const email = byId("authEmail")?.value?.trim() ?? "";
  const password = byId("authPassword")?.value ?? "";
  return { email, password };
}

function getFullName() {
  const first = byId("firstNameInput")?.value?.trim() ?? "";
  const last = byId("lastNameInput")?.value?.trim() ?? "";
  return `${first} ${last}`.trim();
}

export async function checkSession(onLoggedIn) {
  try {
    const user = await account.get();
    setLoggedInUI(user);
    onLoggedIn(user);
  } catch {
    setLoggedOutUI();
  }
}

export function wireAuth(onLoggedIn, onLoggedOut) {
  const signupBtn = byId("signupBtn");
  const loginBtn = byId("loginBtn");
  const logoutBtn = byId("logoutBtn");

  if (!signupBtn || !loginBtn || !logoutBtn) {
    // Fail loudly in dev so you notice broken IDs immediately
    console.warn("Auth UI missing required buttons.");
    return;
  }

  signupBtn.addEventListener("click", async () => {
    try {
      const { email, password } = getEmailPassword();
      if (!email || !password) {
        setAuthStatus("Please enter email and password.");
        return;
      }

      const fullName = getFullName();
      await account.create(ID.unique(), email, password, fullName);
      await account.createEmailPasswordSession(email, password);

      const user = await account.get();
      setLoggedInUI(user);
      onLoggedIn(user);
    } catch (e) {
      // Appwrite returns 409 when email already exists
      if (e?.code === 409) {
        setAuthStatus("Account already exists. Please log in instead.");
        byId("authPassword")?.focus();
        return;
      }
      setAuthStatus(`Signup failed: ${e?.message || e}`);
    }
  });

  loginBtn.addEventListener("click", async () => {
    try {
      const { email, password } = getEmailPassword();
      if (!email || !password) {
        setAuthStatus("Please enter email and password.");
        return;
      }

      await account.createEmailPasswordSession(email, password);

      const user = await account.get();
      setLoggedInUI(user);
      onLoggedIn(user);
    } catch (e) {
      setAuthStatus(`Login failed: ${e?.message || e}`);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await account.deleteSession("current");
    } catch {
      // even if this fails, we still reset UI
    } finally {
      setLogoutVisible(false);
      setSignupVisible(true);
      showAuth();
      setAuthStatus("Logged out.");
      onLoggedOut?.();
    }
  });
}

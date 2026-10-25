(() => {
  const SUPABASE_URL = "https://oetwropgvxkwbolnqbil.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9LPDM6GXY9xeSZ-b6vnufA_tuAwSoCI";
  const AUTH_KEY = "liner_auth_session";
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

  const style = document.createElement("style");
  style.textContent = `
    #vyla-supabase-login[hidden], #vyla-profile-menu[hidden] { display:none !important; }
    #vyla-supabase-login {
      position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center;
      overflow:auto; padding:24px; color:#f5f5f7; font:14px Inter,system-ui,sans-serif;
      background:rgba(12,12,14,.86); backdrop-filter:blur(34px) saturate(135%);
      -webkit-font-smoothing:antialiased;
    }
    #vyla-supabase-login * , #vyla-profile-menu * { box-sizing:border-box; }
    #vyla-supabase-login .login-card {
      width:min(760px,100%); display:grid; grid-template-columns:260px 1fr; gap:8px;
      padding:8px; overflow:hidden; border:1px solid rgba(255,255,255,.09);
      border-radius:20px; background:rgba(30,30,33,.78);
      box-shadow:0 24px 80px rgba(0,0,0,.38); backdrop-filter:blur(42px);
    }
    #vyla-supabase-login .brand {
      display:flex; flex-direction:column; justify-content:flex-end; min-height:390px;
      padding:24px; border:1px solid rgba(255,255,255,.06); border-radius:14px;
      background:radial-gradient(ellipse at 20% 15%,rgba(35,131,226,.3),transparent 53%),rgba(255,255,255,.025);
    }
    #vyla-supabase-login .brand-mark {
      display:grid; place-items:center; width:38px; height:38px; margin-bottom:auto;
      border:1px solid rgba(255,255,255,.14); border-radius:12px;
      color:#fff; background:rgba(35,131,226,.32); font-size:17px; font-weight:700;
    }
    #vyla-supabase-login h1 { margin:0 0 9px; font-size:26px; line-height:1.12; letter-spacing:-.045em; }
    #vyla-supabase-login p { color:#a7a7ad; font-size:12px; line-height:1.55; }
    #vyla-supabase-login .form-side { padding:22px 26px; }
    #vyla-supabase-login .tabs { display:flex; gap:4px; padding:4px; margin:0 0 23px; border-radius:9px; background:rgba(0,0,0,.18); }
    #vyla-supabase-login button { font:inherit; cursor:pointer; }
    #vyla-supabase-login .tab {
      flex:1; padding:8px; border:0; border-radius:7px; color:#aaaab1;
      background:transparent; font-size:12px;
    }
    #vyla-supabase-login .tab[aria-selected="true"] { color:#f5f5f7; background:rgba(255,255,255,.1); }
    #vyla-supabase-login .form { display:grid; gap:13px; }
    #vyla-supabase-login label { display:grid; gap:6px; color:#c5c5ca; font-size:11px; }
    #vyla-supabase-login input {
      width:100%; padding:10px 11px; outline:0; border:1px solid rgba(255,255,255,.11);
      border-radius:8px; color:#f5f5f7; background:rgba(0,0,0,.17); font:12px Inter,system-ui,sans-serif;
    }
    #vyla-supabase-login input:focus { border-color:rgba(35,131,226,.8); }
    #vyla-supabase-login .submit {
      padding:10px 14px; border:1px solid rgba(255,255,255,.08); border-radius:8px;
      color:white; background:#2383e2; font-size:12px; font-weight:600;
    }
    #vyla-supabase-login .submit:disabled { opacity:.55; cursor:wait; }
    #vyla-supabase-login .error {
      padding:10px 11px; border:1px solid rgba(255,123,139,.3); border-radius:8px;
      color:#ffd3d7; background:rgba(255,91,111,.09); font-size:12px; line-height:1.5;
    }
    #vyla-supabase-login .hint { margin:14px 0 0; font-size:11px; }
    #vyla-profile-button {
      position:fixed; top:8px; right:14px; z-index:2147482999; display:grid;
      place-items:center; width:38px; height:38px; overflow:hidden; padding:0;
      border:1px solid rgba(255,255,255,.16); border-radius:50%; color:#fff;
      background:rgba(35,35,39,.78); font:600 13px Inter,system-ui,sans-serif;
      cursor:pointer; backdrop-filter:blur(20px); box-shadow:0 4px 16px rgba(0,0,0,.2);
    }
    #vyla-profile-button img { width:100%; height:100%; object-fit:cover; }
    #vyla-profile-menu {
      position:fixed; top:54px; right:12px; z-index:2147483000;
      width:min(340px,calc(100vw - 24px)); max-height:calc(100vh - 70px); overflow:auto;
      padding:16px; border:1px solid rgba(255,255,255,.1); border-radius:14px;
      color:#f5f5f7; background:rgba(27,27,30,.94);
      box-shadow:0 20px 60px rgba(0,0,0,.4); backdrop-filter:blur(36px) saturate(140%);
      font:12px Inter,system-ui,sans-serif;
    }
    #vyla-profile-menu h2 { margin:0 0 4px; font-size:16px; letter-spacing:-.02em; }
    #vyla-profile-menu p { color:#a7a7ad; font-size:11px; line-height:1.5; }
    #vyla-profile-menu form { display:grid; gap:10px; }
    #vyla-profile-menu label { display:grid; gap:5px; color:#c5c5ca; font-size:10px; }
    #vyla-profile-menu input, #vyla-profile-menu textarea {
      width:100%; padding:9px 10px; outline:0; border:1px solid rgba(255,255,255,.11);
      border-radius:8px; color:#f5f5f7; background:rgba(0,0,0,.18);
      font:11px Inter,system-ui,sans-serif;
    }
    #vyla-profile-menu textarea { min-height:65px; resize:vertical; }
    #vyla-profile-menu input:focus, #vyla-profile-menu textarea:focus { border-color:rgba(35,131,226,.8); }
    #vyla-profile-menu .avatar-row { display:flex; align-items:center; gap:11px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,.08); }
    #vyla-profile-menu .avatar-preview { width:46px; height:46px; border:1px solid rgba(255,255,255,.13); border-radius:50%; object-fit:cover; background:#29292e; }
    #vyla-profile-menu .actions { display:flex; gap:8px; }
    #vyla-profile-menu .save, #vyla-profile-menu .logout {
      padding:8px 11px; border:1px solid rgba(255,255,255,.1); border-radius:8px;
      color:#f5f5f7; background:rgba(255,255,255,.07); font-size:11px;
    }
    #vyla-profile-menu .save { border-color:transparent; background:#2383e2; }
    #vyla-profile-menu .feedback { overflow-wrap:anywhere; }
    @media(max-width:620px) {
      #vyla-supabase-login { padding:12px; }
      #vyla-supabase-login .login-card { grid-template-columns:1fr; max-width:420px; }
      #vyla-supabase-login .brand { min-height:125px; padding:16px; }
      #vyla-supabase-login .brand-mark { margin-bottom:20px; }
      #vyla-supabase-login h1 { font-size:22px; }
      #vyla-supabase-login .brand p { margin-bottom:0; }
      #vyla-supabase-login .form-side { padding:16px; }
    }
    @media(prefers-reduced-motion:reduce) {
      #vyla-supabase-login *, #vyla-profile-menu * { scroll-behavior:auto !important; }
    }
  `;
  document.head.append(style);

  const login = document.createElement("div");
  login.id = "vyla-supabase-login";
  login.hidden = true;
  login.innerHTML = `
    <section class="login-card" aria-label="VeloMusic account">
      <div class="brand"><div class="brand-mark">V</div><h1>Your music,<br>your way.</h1><p>Sign in to your VeloMusic account.</p></div>
      <div class="form-side">
        <div class="tabs" role="tablist">
          <button class="tab" type="button" data-mode="login" aria-selected="true">Sign in</button>
          <button class="tab" type="button" data-mode="signup" aria-selected="false">Create account</button>
        </div>
        <div class="login-form"></div>
      </div>
    </section>`;
  document.body.append(login);

  const profileButton = document.createElement("button");
  profileButton.id = "vyla-profile-button";
  profileButton.type = "button";
  profileButton.setAttribute("aria-label", "Open profile");
  profileButton.hidden = true;
  document.body.append(profileButton);

  const profileMenu = document.createElement("section");
  profileMenu.id = "vyla-profile-menu";
  profileMenu.hidden = true;
  profileMenu.setAttribute("aria-label", "Your profile");
  document.body.append(profileMenu);

  let mode = "login";
  let pending = false;
  let supabaseSession = readAppSession();
  let profile = null;
  let feedback = "";

  login.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-mode]");
    if (tab) {
      mode = tab.dataset.mode;
      renderLogin();
    }
  });
  login.addEventListener("submit", (event) => {
    if (!event.target.matches(".form")) return;
    event.preventDefault();
    void submitLogin(new FormData(event.target));
  });
  profileButton.addEventListener("click", () => {
    profileMenu.hidden = !profileMenu.hidden;
    if (!profileMenu.hidden) renderProfileMenu();
  });
  profileMenu.addEventListener("submit", (event) => {
    if (!event.target.matches("form")) return;
    event.preventDefault();
    void saveProfile(new FormData(event.target), event.target.elements.avatar.files[0]);
  });
  profileMenu.addEventListener("click", (event) => {
    if (event.target.closest("[data-logout]")) void signOut();
  });
  document.addEventListener("click", (event) => {
    if (!profileMenu.hidden && !profileMenu.contains(event.target) && event.target !== profileButton) {
      profileMenu.hidden = true;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") profileMenu.hidden = true;
  });
  window.addEventListener("hashchange", updateRoute);
  window.addEventListener("popstate", updateRoute);

  renderLogin();
  updateRoute();
  if (supabaseSession) {
    void refreshSession()
      .then(loadProfile)
      .catch((error) => {
        console.error("Could not load the Supabase profile:", error);
        feedback = error.message;
        renderProfileMenu();
      });
  }

  function routeIsLogin() {
    return window.location.pathname.replace(/\/+$/, "") === "/login"
      || /(?:^|#)\/login(?:[/?]|$)/.test(window.location.hash);
  }

  function updateRoute() {
    const isLogin = routeIsLogin();
    login.hidden = !isLogin;
    document.documentElement.classList.toggle("vyla-supabase-login-open", isLogin);
    let root = document.getElementById("root");
    if (root) root.style.visibility = isLogin ? "hidden" : "";
    profileButton.hidden = isLogin || !supabaseSession;
    if (isLogin) renderLogin();
    if (!isLogin && supabaseSession) void loadProfile().catch((error) => {
      console.error("Could not load the Supabase profile:", error);
      feedback = error.message;
      renderProfileMenu();
    });
  }

  function readAppSession() {
    try {
      const session = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      return session?.supabaseAccount && session.accessToken && session.refreshToken
        ? session
        : null;
    } catch (error) {
      console.error("Could not read the account session:", error);
      return null;
    }
  }

  function saveAppSession(session) {
    supabaseSession = session;
    try {
      if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      else localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Could not save the account session:", error);
      throw new Error("This browser could not save your sign-in. Check its storage settings.");
    }
  }

  async function authRequest(path, body) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.msg || result.message || result.error_description || result.error || `Supabase authentication failed (${response.status})`);
    }
    return result;
  }

  function saveLoginForm() {
    const form = login.querySelector(".form");
    return form ? new FormData(form) : new FormData();
  }

  function renderLogin() {
    for (const tab of login.querySelectorAll("[data-mode]")) {
      tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
    }
    const fields = mode === "signup"
      ? `<label>Username<input name="username" autocomplete="username" pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" required placeholder="music_fan"></label>
         <label>Display name<input name="display_name" maxlength="60" required placeholder="Your name"></label>`
      : "";
    const email = saveLoginForm().get("email") || "";
    login.querySelector(".login-form").innerHTML = `
      ${feedback ? `<div class="error" role="alert">${escapeHtml(feedback)}</div>` : ""}
      <form class="form">
        <label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254" value="${escapeHtml(email)}"></label>
        ${fields}
        <label>Password<input name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="8" required></label>
        ${mode === "signup" ? `<label>Confirm password<input name="confirm_password" type="password" autocomplete="new-password" minlength="8" required></label>` : ""}
        <button class="submit" type="submit" ${pending ? "disabled" : ""}>${pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <p class="hint">${mode === "signup" ? "Email confirmation must be disabled in Supabase Authentication settings if you want to sign up without a confirmation email." : "Your VeloMusic account uses Supabase authentication."}</p>`;
  }

  async function submitLogin(data) {
    if (pending) return;
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    if (!email || !password) {
      feedback = "Enter your email and password.";
      renderLogin();
      return;
    }
    if (mode === "signup" && password !== data.get("confirm_password")) {
      feedback = "The passwords do not match.";
      renderLogin();
      return;
    }
    pending = true;
    feedback = "";
    renderLogin();
    try {
      const result = mode === "login"
        ? await authRequest("token?grant_type=password", { email, password })
        : await authRequest("signup", {
          email,
          password,
          data: {
            username: String(data.get("username") || "").trim().toLowerCase(),
            display_name: String(data.get("display_name") || "").trim(),
          },
        });
      if (!result.access_token || !result.refresh_token || !result.user) {
        throw new Error("Supabase did not return a signed-in session. Disable email confirmation under Authentication → Providers → Email, then try again.");
      }
      const appSession = toAppSession(result);
      saveAppSession(appSession);
      supabaseSession = appSession;
      profile = null;
      feedback = "";
      await loadProfile();
      window.location.assign("/");
    } catch (error) {
      console.error("Supabase sign-in failed:", error);
      feedback = error.message;
      pending = false;
      renderLogin();
    }
  }

  function toAppSession(result) {
    const authUser = result.user;
    const metadata = authUser.user_metadata || {};
    return {
      supabaseAccount: true,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      accessTokenExpiresAt: result.expires_at
        ? result.expires_at * 1000
        : Date.now() + (result.expires_in || 3600) * 1000,
      user: {
        id: authUser.id,
        email: authUser.email,
        username: metadata.username || authUser.email?.split("@")[0] || "listener",
        displayName: metadata.display_name || metadata.username || authUser.email?.split("@")[0] || "Listener",
      },
    };
  }

  async function refreshSession() {
    if (!supabaseSession) return null;
    const expiry = Number(supabaseSession.accessTokenExpiresAt || 0);
    if (expiry > Date.now() + 60000) return supabaseSession;
    const refreshed = await authRequest("token?grant_type=refresh_token", {
      refresh_token: supabaseSession.refreshToken,
    });
    const nextSession = toAppSession(refreshed);
    saveAppSession(nextSession);
    return nextSession;
  }

  async function rest(table, { method = "GET", query = "", body, prefer } = {}) {
    await refreshSession();
    if (!supabaseSession) throw new Error("Sign in again to manage your profile.");
    const headers = {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${supabaseSession.accessToken}`,
      "content-type": "application/json",
    };
    if (prefer) headers.prefer = prefer;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.message || payload?.hint || `Supabase request failed (${response.status})`;
      if (payload?.code === "PGRST205" || /public\.profiles.*schema cache|schema cache.*public\.profiles/i.test(message)) {
        throw new Error("The profiles table is missing. Run supabase.sql in the Supabase SQL Editor, then retry.");
      }
      throw new Error(message);
    }
    return payload;
  }

  async function loadProfile() {
    if (!supabaseSession) return null;
    const rows = await rest("profiles", {
      query: `id=eq.${encodeURIComponent(supabaseSession.user.id)}&select=*`,
    });
    profile = rows?.[0] || null;
    feedback = profile ? "" : "Your account is signed in, but its profile row is missing. Run supabase.sql and try again.";
    profileButton.hidden = routeIsLogin();
    renderProfileButton();
    if (!profileMenu.hidden) renderProfileMenu();
    return profile;
  }

  function renderProfileButton() {
    const label = profile?.display_name || profile?.username || supabaseSession?.user?.displayName || "Profile";
    const url = profile?.avatar_path ? avatarUrl(profile.avatar_path) : "";
    profileButton.setAttribute("aria-label", `Open profile for ${label}`);
    profileButton.title = label;
    profileButton.innerHTML = url
      ? `<img src="${escapeHtml(url)}" alt="">`
      : escapeHtml((label.trim()[0] || "V").toUpperCase());
  }

  function renderProfileMenu() {
    if (!supabaseSession) {
      profileMenu.innerHTML = `<h2>Profile</h2><p>Sign in at <a href="/login" style="color:#8dc8ff">/login</a> to set up your profile.</p>`;
      return;
    }
    const displayName = profile?.display_name || supabaseSession.user.displayName || "";
    const username = profile?.username || supabaseSession.user.username || "";
    const avatar = profile?.avatar_path ? avatarUrl(profile.avatar_path) : "";
    profileMenu.innerHTML = `
      <div class="avatar-row">
        <img class="avatar-preview" src="${escapeHtml(avatar || initialsAvatar(displayName || username))}" alt="">
        <div><h2>${escapeHtml(displayName || username || "Your profile")}</h2><p>@${escapeHtml(username)}</p></div>
      </div>
      ${feedback ? `<p class="feedback">${escapeHtml(feedback)}</p>` : ""}
      <form>
        <label>Profile picture<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
        <label>Username<input name="username" value="${escapeHtml(username)}" pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" required></label>
        <label>Display name<input name="display_name" value="${escapeHtml(displayName)}" maxlength="60"></label>
        <label>Bio<textarea name="bio" maxlength="500">${escapeHtml(profile?.bio || "")}</textarea></label>
        <div class="actions"><button class="save" type="submit">Save profile</button><button class="logout" type="button" data-logout>Sign out</button></div>
      </form>`;
  }

  async function saveProfile(data, file) {
    const saveButton = profileMenu.querySelector(".save");
    if (saveButton) saveButton.disabled = true;
    feedback = "";
    try {
      if (!profile) throw new Error("Profile is not available yet. Run supabase.sql if the profiles table has not been created.");
      let avatarPath = profile.avatar_path;
      if (file) avatarPath = await uploadAvatar(file);
      const rows = await rest("profiles", {
        method: "PATCH",
        query: `id=eq.${encodeURIComponent(supabaseSession.user.id)}&select=*`,
        body: {
          username: String(data.get("username") || "").trim().toLowerCase(),
          display_name: String(data.get("display_name") || "").trim(),
          bio: String(data.get("bio") || "").trim(),
          avatar_path: avatarPath,
        },
        prefer: "return=representation",
      });
      profile = rows?.[0] || profile;
      feedback = "Profile saved.";
      renderProfileButton();
    } catch (error) {
      console.error("Could not save the Supabase profile:", error);
      feedback = error.message;
    } finally {
      renderProfileMenu();
    }
  }

  async function uploadAvatar(file) {
    const supportedTypes = new Map([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
      ["image/gif", "gif"],
    ]);
    const extension = supportedTypes.get(file.type);
    if (!extension) throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
    if (file.size > MAX_AVATAR_BYTES) throw new Error("Profile pictures must be 5 MiB or smaller.");
    const path = `${supabaseSession.user.id}/avatar-${Date.now()}.${extension}`;
    await refreshSession();
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${supabaseSession.accessToken}`,
        "content-type": file.type,
        "x-upsert": "true",
      },
      body: file,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || `Avatar upload failed (${response.status}).`);
    return path;
  }

  async function signOut() {
    let revokeError = null;
    try {
      await refreshSession();
      const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          authorization: `Bearer ${supabaseSession.accessToken}`,
        },
      });
      if (!response.ok) throw new Error(`Supabase sign-out failed (${response.status}).`);
    } catch (error) {
      console.error("Could not revoke the Supabase session:", error);
      revokeError = error;
    }
    saveAppSession(null);
    supabaseSession = null;
    profile = null;
    profileMenu.hidden = true;
    profileButton.hidden = true;
    feedback = revokeError ? `Signed out on this device; server revocation failed: ${revokeError.message}` : "";
    window.location.assign("/login");
  }

  function avatarUrl(path) {
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path.split("/").map(encodeURIComponent).join("/")}`;
  }

  function initialsAvatar(label) {
    const initials = escapeHtml((label.trim()[0] || "V").toUpperCase());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#29292e"/><text x="48" y="59" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="600" fill="#f5f5f7">${initials}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }
})();

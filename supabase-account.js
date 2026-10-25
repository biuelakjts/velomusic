(() => {
  const SUPABASE_URL = "https://oetwropgvxkwbolnqbil.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9LPDM6GXY9xeSZ-b6vnufA_tuAwSoCI";
  const AUTH_KEY = "liner_auth_session";
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
  let session = readSession();
  let profile = null;
  let profileButton;
  let profileMenu;
  let feedback = "";
  let pending = false;
  let pendingSignup = null;
  let adminPanel = null;
  let adminSection = "users";

  const style = document.createElement("style");
  style.textContent = `
    #vyla-profile-menu[hidden], #vyla-profile-button[hidden] { display:none !important; }
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
    #vyla-profile-menu *, #vyla-profile-button * { box-sizing:border-box; }
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
      color:#f5f5f7; background:rgba(255,255,255,.07); font:11px Inter,system-ui,sans-serif;
      cursor:pointer;
    }
    #vyla-profile-menu .save { border-color:transparent; background:#2383e2; }
    #vyla-profile-menu .feedback { overflow-wrap:anywhere; }
    #vyla-profile-menu .admin-link { color:#8ec4ff; text-decoration:none; font-size:11px; }
    .vyla-auth-feedback {
      margin:8px 0 0; color:var(--color-accent-primary,#ff6b7a);
      font-size:12px; font-weight:500; line-height:1.4;
    }
    #vyla-admin-panel[hidden] { display:none !important; }
    #vyla-admin-panel {
      position:fixed; inset:0; z-index:2147483001; overflow:auto; padding:clamp(16px,4vw,48px);
      color:#f5f5f7; background:#111114; font:13px Inter,system-ui,sans-serif;
    }
    #vyla-admin-panel * { box-sizing:border-box; }
    #vyla-admin-panel .admin-shell { width:min(1100px,100%); margin:0 auto; }
    #vyla-admin-panel .admin-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }
    #vyla-admin-panel h1 { margin:0; font-size:26px; letter-spacing:-.04em; }
    #vyla-admin-panel h2 { margin:0 0 14px; font-size:16px; }
    #vyla-admin-panel p { color:#a7a7ad; line-height:1.5; }
    #vyla-admin-panel .admin-tabs { display:flex; flex-wrap:wrap; gap:7px; margin:0 0 16px; }
    #vyla-admin-panel button, #vyla-admin-panel a {
      display:inline-flex; align-items:center; justify-content:center; min-height:34px;
      padding:7px 11px; border:1px solid rgba(255,255,255,.12); border-radius:8px;
      color:#f5f5f7; background:rgba(255,255,255,.06); font:inherit; text-decoration:none; cursor:pointer;
    }
    #vyla-admin-panel button:hover, #vyla-admin-panel a:hover { background:rgba(255,255,255,.12); }
    #vyla-admin-panel button[aria-selected="true"] { border-color:#398be6; background:#2376c9; }
    #vyla-admin-panel .admin-card { margin:12px 0; padding:16px; border:1px solid rgba(255,255,255,.1); border-radius:12px; background:#1b1b20; }
    #vyla-admin-panel .admin-row { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 0; border-top:1px solid rgba(255,255,255,.08); }
    #vyla-admin-panel .admin-row:first-child { border-top:0; }
    #vyla-admin-panel .admin-row p { margin:3px 0 0; font-size:11px; }
    #vyla-admin-panel .admin-actions { display:flex; flex-wrap:wrap; gap:7px; }
    #vyla-admin-panel .admin-danger { color:#ff8585; }
    #vyla-admin-panel form { display:grid; gap:10px; max-width:680px; }
    #vyla-admin-panel label { display:grid; gap:5px; color:#c5c5ca; font-size:11px; }
    #vyla-admin-panel input, #vyla-admin-panel textarea, #vyla-admin-panel select {
      width:100%; padding:9px 10px; border:1px solid rgba(255,255,255,.13); border-radius:8px;
      outline:0; color:#f5f5f7; background:#131316; font:12px Inter,system-ui,sans-serif;
    }
    #vyla-admin-panel textarea { min-height:90px; resize:vertical; }
    #vyla-admin-panel input:focus, #vyla-admin-panel textarea:focus, #vyla-admin-panel select:focus { border-color:#398be6; }
    #vyla-admin-panel .admin-error { color:#ff8585; }
    #vyla-admin-panel .admin-ok { color:#70d89a; }
  `;
  document.head.append(style);

  profileButton = document.createElement("button");
  profileButton.id = "vyla-profile-button";
  profileButton.type = "button";
  profileButton.hidden = true;
  profileButton.setAttribute("aria-label", "Open profile");
  document.body.append(profileButton);

  profileMenu = document.createElement("section");
  profileMenu.id = "vyla-profile-menu";
  profileMenu.hidden = true;
  profileMenu.setAttribute("aria-label", "Your profile");
  document.body.append(profileMenu);

  document.addEventListener("submit", onLoginSubmit, true);
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-setting-reset]")) {
      window.setTimeout(() => {
        const keyInput = adminPanel?.querySelector("#admin-setting-form input[name=key]");
        if (keyInput) keyInput.readOnly = false;
      }, 0);
    }

    const form = target.closest("form");
    if (form?.querySelector("#auth-email")) {
      const button = target.closest("button");
      if (button?.type === "button" && !button.hasAttribute("aria-label")) {
        pendingSignup = null;
        removeLoginFeedback(form);
      }
    }

    if (target.closest("#vyla-profile-button")) {
      profileMenu.hidden = !profileMenu.hidden;
      if (!profileMenu.hidden) void loadProfile();
      return;
    }
    if (target.closest("[data-vyla-logout]")) {
      void signOut();
      return;
    }
    if (!profileMenu.hidden && !profileMenu.contains(target) && target !== profileButton) {
      profileMenu.hidden = true;
    }
  });
  document.addEventListener("input", (event) => {
    const form = event.target instanceof Element ? event.target.closest("form") : null;
    if (form?.querySelector("#auth-email")) removeLoginFeedback(form);
  }, true);
  document.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === "avatar") {
      const file = event.target.files?.[0];
      if (file && file.size > MAX_AVATAR_BYTES) {
        feedback = "Profile pictures must be 5 MiB or smaller.";
        renderProfileMenu();
      }
    }
  }, true);
  profileMenu.addEventListener("submit", (event) => {
    if (!event.target.matches("form")) return;
    event.preventDefault();
    void saveProfile(new FormData(event.target), event.target.elements.avatar.files[0]);
  });
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-admin-action]") : null;
    if (!target || !adminPanel) return;
    const action = target.dataset.adminAction;
    if (action === "section") {
      adminSection = target.dataset.section;
      void loadAdminSection();
    } else if (action === "reload") {
      void loadAdminSection();
    } else if (action === "user-role") {
      void updateAdminUser(target.dataset.id, {
        role: target.dataset.value === "admin" ? "user" : "admin",
      });
    } else if (action === "user-suspension") {
      void updateAdminUser(target.dataset.id, {
        is_suspended: target.dataset.value !== "true",
      });
    } else if (action === "playlist-visibility") {
      void updateAdminPlaylist(target.dataset.id, {
        visibility: target.dataset.value === "public" ? "private" : "public",
      });
    } else if (action === "playlist-delete") {
      if (window.confirm("Permanently delete this playlist and its tracks?")) {
        void deleteAdminRecord("playlists", target.dataset.id);
      }
    } else if (action === "setting-edit") {
      const row = adminPanel.querySelector(`[data-setting-key="${CSS.escape(target.dataset.key)}"]`);
      const form = adminPanel.querySelector("#admin-setting-form");
      if (!row || !form) return;
      form.elements.key.value = row.dataset.key;
      form.elements.value.value = row.dataset.value;
      form.elements.is_public.checked = row.dataset.public === "true";
      form.elements.key.readOnly = true;
      form.elements.key.focus();
    } else if (action === "setting-delete") {
      void deleteAdminRecord("app_settings", target.dataset.key, "key");
    } else if (action === "announcement-toggle") {
      void updateAdminAnnouncement(target.dataset.id, { enabled: target.dataset.value !== "true" });
    } else if (action === "announcement-delete") {
      if (window.confirm("Permanently delete this announcement?")) {
        void deleteAdminRecord("announcements", target.dataset.id);
      }
    }
  });
  document.addEventListener("submit", (event) => {
    if (!(event.target instanceof HTMLFormElement)) return;
    if (event.target.id === "admin-setting-form") {
      event.preventDefault();
      void saveAdminSetting(new FormData(event.target));
    } else if (event.target.id === "admin-announcement-form") {
      event.preventDefault();
      void createAdminAnnouncement(new FormData(event.target));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") profileMenu.hidden = true;
  });
  window.addEventListener("auth:changed", () => {
    session = readSession();
    updateProfileButton();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_KEY) {
      session = readSession();
      updateProfileButton();
    }
  });

  updateProfileButton();
  if (session) void loadProfile();
  if (routeIsAdmin()) initializeAdmin();
  const loginObserver = new MutationObserver(() => patchLoginForms());
  loginObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["type", "placeholder", "autocomplete", "inputmode"],
  });
  patchLoginForms();

  async function onLoginSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    patchLoginForms();
    const usernameInput = form.querySelector("#auth-email");
    const signupUsernameInput = form.querySelector("#auth-username");
    const username = usernameInput?.value.trim().toLowerCase() || "";
    const password = form.querySelector("#auth-password")?.value || "";
    const confirmPassword = form.querySelector("#auth-confirm")?.value;
    const signupUsername = signupUsernameInput?.value.trim().toLowerCase();
    const displayName = form.querySelector("#auth-display-name")?.value.trim();

    if (confirmPassword !== undefined && pendingSignup?.alias === username) {
      return;
    }

    if (signupUsernameInput && displayName !== undefined) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!pendingSignup) {
        showLoginFeedback(form, "Your signup details expired. Go back and continue again.");
        return;
      }
      if (!isValidUsername(signupUsername)) {
        showLoginFeedback(form, "Username must be 3–24 characters using letters, numbers, or underscores.");
        return;
      }
      await authenticate(form, "signup", {
        ...pendingSignup,
        username: signupUsername,
        displayName: displayName || signupUsername,
      });
      return;
    }

    if (!usernameInput) return;
    if (confirmPassword !== undefined) {
      const loginAlias = accountAlias(username);
      if (pendingSignup?.alias === loginAlias) {
        pendingSignup = { ...pendingSignup, password, confirmPassword };
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!isValidUsername(username)) {
        showLoginFeedback(form, "Username must be 3–24 characters using letters, numbers, or underscores.");
        return;
      }
      pendingSignup = { username, password, confirmPassword, alias: loginAlias };
      removeLoginFeedback(form);
      setReactInputValue(usernameInput, loginAlias);
      window.setTimeout(() => {
        if (form.isConnected) form.requestSubmit();
      }, 0);
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    await authenticate(form, "login", { username, password });
  }

  async function authenticate(form, kind, data) {
    if (pending) return;
    if (!data.username || !data.password) {
      showLoginFeedback(form, "Enter your username and password.");
      return;
    }
    if (!isValidUsername(data.username)) {
      showLoginFeedback(form, "Username must be 3–24 characters using letters, numbers, or underscores.");
      return;
    }
    if (kind === "signup" && data.password !== data.confirmPassword) {
      showLoginFeedback(form, "The passwords do not match.");
      return;
    }

    pending = true;
    const submit = form.querySelector('button[type="submit"]');
    const previousLabel = submit?.textContent;
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Please wait…";
    }
    removeLoginFeedback(form);
    try {
      const result = kind === "login"
        ? await authRequest("token?grant_type=password", {
          email: accountAlias(data.username),
          password: data.password,
        })
        : await authRequest("signup", {
          email: accountAlias(data.username),
          password: data.password,
          data: { username: data.username, display_name: data.displayName },
        });
      if (!result.access_token || !result.refresh_token || !result.user) {
        throw new Error("Supabase did not return a session. Disable email confirmation in Supabase Authentication settings, then try again.");
      }
      session = toAppSession(result);
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      pendingSignup = null;
      window.dispatchEvent(new Event("auth:changed"));
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (error) {
      console.error("Supabase authentication failed:", error);
      showLoginFeedback(form, error.message);
      if (submit) {
        submit.disabled = false;
        submit.textContent = previousLabel;
      }
    } finally {
      pending = false;
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

  function readSession() {
    try {
      const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      return stored?.supabaseAccount && stored.accessToken && stored.refreshToken
        ? stored
        : null;
    } catch (error) {
      console.error("Could not read the Supabase session:", error);
      return null;
    }
  }

  async function refreshSession() {
    if (!session) throw new Error("Sign in to manage your profile.");
    const expiresAt = Number(session.accessTokenExpiresAt || 0);
    if (expiresAt > Date.now() + 60000) return;
    const refreshed = await authRequest("token?grant_type=refresh_token", {
      refresh_token: session.refreshToken,
    });
    session = toAppSession(refreshed);
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event("auth:changed"));
  }

  async function rest(table, { method = "GET", query = "", body, prefer } = {}) {
    await refreshSession();
    const headers = {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${session.accessToken}`,
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
    if (!session) return;
    try {
      const rows = await rest("profiles", {
        query: `id=eq.${encodeURIComponent(session.user.id)}&select=*`,
      });
      profile = rows?.[0] || null;
      feedback = profile ? "" : "Your Supabase account has no profile yet. Run supabase.sql to create the profile trigger.";
    } catch (error) {
      console.error("Could not load the Supabase profile:", error);
      feedback = error.message;
    }
    updateProfileButton();
    renderProfileMenu();
  }

  function updateProfileButton() {
    profileButton.hidden = !session || routeIsLogin();
    if (!session) return;
    const label = profile?.display_name || profile?.username || session.user.displayName || "Profile";
    const src = profile?.avatar_path ? avatarUrl(profile.avatar_path) : null;
    profileButton.title = label;
    profileButton.setAttribute("aria-label", `Open profile for ${label}`);
    profileButton.innerHTML = src
      ? `<img src="${escapeHtml(src)}" alt="">`
      : escapeHtml((label.trim()[0] || "V").toUpperCase());
  }

  function routeIsLogin() {
    return window.location.pathname.replace(/\/+$/, "") === "/login"
      || /(?:^|#)\/login(?:[/?]|$)/.test(window.location.hash);
  }

  function routeIsAdmin() {
    return window.location.pathname.replace(/\/+$/, "") === "/admin";
  }

  function patchLoginForms() {
    document.querySelectorAll("form").forEach((form) => {
      const input = form.querySelector("#auth-email");
      if (!input) return;
      if (input.type !== "text") input.type = "text";
      if (input.inputMode !== "text") input.inputMode = "text";
      if (input.autocomplete !== "username") input.autocomplete = "username";
      if (input.placeholder !== "Username") input.placeholder = "Username";
      input.setAttribute("aria-label", "Username");
      const label = form.querySelector('label[for="auth-email"]');
      if (label && label.textContent.trim() !== "Username") label.textContent = "Username";
    });
  }

  function accountAlias(username) {
    return `${String(username).trim().toLowerCase()}@users.velomusic.invalid`;
  }

  function isValidUsername(username) {
    return /^[a-z0-9_]{3,24}$/i.test(String(username || ""));
  }

  function setReactInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("Could not prepare the signup form.");
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function initializeAdmin() {
    adminPanel = document.createElement("main");
    adminPanel.id = "vyla-admin-panel";
    document.body.append(adminPanel);
    renderAdminMessage("Checking administrator access…");
    if (!session) {
      renderAdminMessage(
        "Sign in with an administrator account to open this page.",
        `<a href="/login?next=%2Fadmin">Go to login</a>`,
      );
      return;
    }
    void loadAdminSection();
  }

  function renderAdminMessage(message, action = "") {
    if (!adminPanel) return;
    adminPanel.innerHTML = `<div class="admin-shell"><div class="admin-card"><h1>Vyla Admin</h1><p>${escapeHtml(message)}</p>${action}</div></div>`;
  }

  async function loadAdminSection(notice = "") {
    if (!adminPanel || !session) return;
    adminPanel.innerHTML = `<div class="admin-shell"><p>Loading admin tools…</p></div>`;
    try {
      const authorized = await rest("rpc/is_admin", { method: "POST", body: {} });
      if (authorized !== true) {
        renderAdminMessage(
          "Access denied. This Supabase account is not an active administrator.",
          `<a href="/">Back to Vyla</a>`,
        );
        return;
      }
      const sections = {
        users: ["profiles", "select=id,username,display_name,role,is_suspended,created_at&order=created_at.desc&limit=200"],
        playlists: ["playlists", "select=id,title,owner_id,visibility,created_at&order=created_at.desc&limit=200"],
        settings: ["app_settings", "select=key,value,is_public,updated_at&order=key.asc&limit=200"],
        announcements: ["announcements", "select=id,message,enabled,starts_at,ends_at,created_at&order=created_at.desc&limit=200"],
      };
      const [table, query] = sections[adminSection] || sections.users;
      const rows = await rest(table, { query });
      renderAdminPage(adminSection, rows || [], notice);
    } catch (error) {
      console.error("Could not load the admin console:", error);
      renderAdminMessage(
        `Admin console could not load: ${error.message}`,
        `<a href="/">Back to Vyla</a><button type="button" data-admin-action="reload">Retry</button>`,
      );
    }
  }

  function renderAdminPage(section, rows, notice) {
    const tabs = [
      ["users", "Users"],
      ["playlists", "Playlists"],
      ["settings", "App settings"],
      ["announcements", "Announcements"],
    ];
    const content = section === "users" ? renderAdminUsers(rows)
      : section === "playlists" ? renderAdminPlaylists(rows)
        : section === "settings" ? renderAdminSettings(rows)
          : renderAdminAnnouncements(rows);
    adminPanel.innerHTML = `
      <div class="admin-shell">
        <header class="admin-head"><div><h1>Vyla Admin</h1><p>Signed in as @${escapeHtml(profile?.username || session.user.username)}</p></div><a href="/">Back to Vyla</a></header>
        <nav class="admin-tabs" aria-label="Admin sections">
          ${tabs.map(([id, label]) => `<button type="button" data-admin-action="section" data-section="${id}" aria-selected="${id === section}">${label}</button>`).join("")}
          <button type="button" data-admin-action="reload">Refresh</button>
        </nav>
        ${notice ? `<p class="admin-ok" role="status">${escapeHtml(notice)}</p>` : ""}
        <section class="admin-card">${content}</section>
      </div>`;
  }

  function renderAdminUsers(rows) {
    return `<h2>Accounts</h2><p>Manage roles and access. Admin access is still enforced by Supabase RLS.</p>
      ${rows.map((user) => `<div class="admin-row">
        <div><strong>@${escapeHtml(user.username)}</strong><p>${escapeHtml(user.display_name || "No display name")} · ${user.role === "admin" ? "Admin" : "User"}${user.is_suspended ? " · Suspended" : ""}</p></div>
        <div class="admin-actions">
          <button type="button" data-admin-action="user-role" data-id="${escapeHtml(user.id)}" data-value="${escapeHtml(user.role)}"${user.id === session.user.id ? " disabled title=\"You cannot change your own role here\"" : ""}>${user.role === "admin" ? "Remove admin" : "Make admin"}</button>
          <button type="button" data-admin-action="user-suspension" data-id="${escapeHtml(user.id)}" data-value="${user.is_suspended}"${user.id === session.user.id ? " disabled title=\"You cannot suspend your own account here\"" : ""}>${user.is_suspended ? "Restore access" : "Suspend"}</button>
        </div>
      </div>`).join("") || "<p>No accounts found.</p>"}`;
  }

  function renderAdminPlaylists(rows) {
    return `<h2>Playlists</h2><p>Change playlist visibility or remove content. Deleting a playlist also deletes its tracks.</p>
      ${rows.map((playlist) => `<div class="admin-row">
        <div><strong>${escapeHtml(playlist.title)}</strong><p>Owner ${escapeHtml(playlist.owner_id)} · ${escapeHtml(playlist.visibility)}</p></div>
        <div class="admin-actions">
          <button type="button" data-admin-action="playlist-visibility" data-id="${escapeHtml(playlist.id)}" data-value="${escapeHtml(playlist.visibility)}">Make ${playlist.visibility === "public" ? "private" : "public"}</button>
          <button class="admin-danger" type="button" data-admin-action="playlist-delete" data-id="${escapeHtml(playlist.id)}">Delete</button>
        </div>
      </div>`).join("") || "<p>No playlists found.</p>"}`;
  }

  function renderAdminSettings(rows) {
    return `<h2>App settings</h2>
      <form id="admin-setting-form">
        <label>Key<input name="key" minlength="1" maxlength="100" required></label>
        <label>Value (JSON)<textarea name="value" required placeholder='{"enabled":true}'></textarea></label>
        <label><span><input name="is_public" type="checkbox" style="width:auto"> Publicly readable</span></label>
        <div><button type="submit">Save setting</button><button type="reset" data-setting-reset>New setting</button></div>
      </form>
      ${rows.map((setting) => `<div class="admin-row" data-setting-key="${escapeHtml(setting.key)}" data-value="${escapeHtml(JSON.stringify(setting.value))}" data-public="${setting.is_public}">
        <div><strong>${escapeHtml(setting.key)}</strong><p>${setting.is_public ? "Public" : "Admin only"} · ${escapeHtml(JSON.stringify(setting.value))}</p></div>
        <div class="admin-actions"><button type="button" data-admin-action="setting-edit" data-key="${escapeHtml(setting.key)}">Edit</button><button class="admin-danger" type="button" data-admin-action="setting-delete" data-key="${escapeHtml(setting.key)}">Delete</button></div>
      </div>`).join("") || "<p>No app settings have been saved.</p>"}`;
  }

  function renderAdminAnnouncements(rows) {
    return `<h2>Announcements</h2>
      <form id="admin-announcement-form">
        <label>Message<textarea name="message" minlength="1" maxlength="2000" required></textarea></label>
        <label>Starts at (optional)<input name="starts_at" type="datetime-local"></label>
        <label>Ends at (optional)<input name="ends_at" type="datetime-local"></label>
        <label><span><input name="enabled" type="checkbox" style="width:auto" checked> Enabled</span></label>
        <button type="submit">Create announcement</button>
      </form>
      ${rows.map((announcement) => `<div class="admin-row">
        <div><strong>${escapeHtml(announcement.message)}</strong><p>${announcement.enabled ? "Enabled" : "Disabled"}${announcement.starts_at ? ` · Starts ${escapeHtml(new Date(announcement.starts_at).toLocaleString())}` : ""}${announcement.ends_at ? ` · Ends ${escapeHtml(new Date(announcement.ends_at).toLocaleString())}` : ""}</p></div>
        <div class="admin-actions"><button type="button" data-admin-action="announcement-toggle" data-id="${escapeHtml(announcement.id)}" data-value="${announcement.enabled}">${announcement.enabled ? "Disable" : "Enable"}</button><button class="admin-danger" type="button" data-admin-action="announcement-delete" data-id="${escapeHtml(announcement.id)}">Delete</button></div>
      </div>`).join("") || "<p>No announcements yet.</p>"}`;
  }

  async function updateAdminUser(id, changes) {
    if (id === session?.user.id && Object.hasOwn(changes, "role")) {
      return loadAdminSection("Your own administrator role cannot be changed here.");
    }
    await adminMutation("profiles", `id=eq.${encodeURIComponent(id)}`, changes, "PATCH");
  }

  async function updateAdminPlaylist(id, changes) {
    await adminMutation("playlists", `id=eq.${encodeURIComponent(id)}`, changes, "PATCH");
  }

  async function updateAdminAnnouncement(id, changes) {
    await adminMutation("announcements", `id=eq.${encodeURIComponent(id)}`, changes, "PATCH");
  }

  async function deleteAdminRecord(table, value, column = "id") {
    try {
      await rest(table, {
        method: "DELETE",
        query: `${column}=eq.${encodeURIComponent(value)}`,
        prefer: "return=minimal",
      });
      await loadAdminSection("Deleted.");
    } catch (error) {
      console.error(`Could not delete admin record from ${table}:`, error);
      await loadAdminSection(`Could not delete item: ${error.message}`);
    }
  }

  async function adminMutation(table, query, changes, method = "PATCH") {
    try {
      await rest(table, { method, query, body: changes, prefer: "return=representation" });
      await loadAdminSection("Changes saved.");
    } catch (error) {
      console.error(`Could not update admin record in ${table}:`, error);
      await loadAdminSection(`Could not save changes: ${error.message}`);
    }
  }

  async function saveAdminSetting(data) {
    try {
      const key = String(data.get("key") || "").trim();
      const value = JSON.parse(String(data.get("value") || ""));
      if (!key || key.length > 100) throw new Error("Setting keys must contain 1–100 characters.");
      await rest("app_settings", {
        method: "POST",
        query: "on_conflict=key",
        body: { key, value, is_public: data.get("is_public") === "on", updated_by: session.user.id },
        prefer: "resolution=merge-duplicates,return=representation",
      });
      await loadAdminSection("Setting saved.");
    } catch (error) {
      console.error("Could not save app setting:", error);
      await loadAdminSection(`Could not save setting: ${error.message}`);
    }
  }

  async function createAdminAnnouncement(data) {
    try {
      const startsAt = String(data.get("starts_at") || "");
      const endsAt = String(data.get("ends_at") || "");
      await rest("announcements", {
        method: "POST",
        body: {
          message: String(data.get("message") || "").trim(),
          enabled: data.get("enabled") === "on",
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          created_by: session.user.id,
        },
        prefer: "return=representation",
      });
      await loadAdminSection("Announcement created.");
    } catch (error) {
      console.error("Could not create announcement:", error);
      await loadAdminSection(`Could not create announcement: ${error.message}`);
    }
  }

  function renderProfileMenu() {
    if (!session) {
      profileMenu.innerHTML = `<h2>Profile</h2><p>Sign in to edit your profile.</p>`;
      return;
    }
    const name = profile?.display_name || session.user.displayName || "";
    const username = profile?.username || session.user.username || "";
    const src = profile?.avatar_path ? avatarUrl(profile.avatar_path) : initialsAvatar(name || username);
    profileMenu.innerHTML = `
      <div class="avatar-row">
        <img class="avatar-preview" src="${escapeHtml(src)}" alt="">
        <div><h2>${escapeHtml(name || username || "Your profile")}</h2><p>@${escapeHtml(username)}</p></div>
      </div>
      ${feedback ? `<p class="feedback">${escapeHtml(feedback)}</p>` : ""}
      ${profile?.role === "admin" && !profile.is_suspended ? `<p><a class="admin-link" href="/admin">Open admin console</a></p>` : ""}
      <form>
        <label>Profile picture<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
        <label>Username<input name="username" value="${escapeHtml(username)}" pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" required></label>
        <label>Display name<input name="display_name" value="${escapeHtml(name)}" maxlength="60"></label>
        <label>Bio<textarea name="bio" maxlength="500">${escapeHtml(profile?.bio || "")}</textarea></label>
        <div class="actions"><button class="save" type="submit">Save profile</button><button class="logout" type="button" data-vyla-logout>Sign out</button></div>
      </form>`;
  }

  async function saveProfile(data, file) {
    feedback = "";
    try {
      if (!profile) throw new Error("Profile is not available. Run supabase.sql before editing your profile.");
      let avatarPath = profile.avatar_path;
      if (file) avatarPath = await uploadAvatar(file);
      const rows = await rest("profiles", {
        method: "PATCH",
        query: `id=eq.${encodeURIComponent(session.user.id)}&select=*`,
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
    } catch (error) {
      console.error("Could not save the profile:", error);
      feedback = error.message;
    }
    updateProfileButton();
    renderProfileMenu();
  }

  async function uploadAvatar(file) {
    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const extension = extensions[file.type];
    if (!extension) throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
    if (file.size > MAX_AVATAR_BYTES) throw new Error("Profile pictures must be 5 MiB or smaller.");
    await refreshSession();
    const path = `${session.user.id}/avatar-${Date.now()}.${extension}`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${session.accessToken}`,
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
    try {
      await refreshSession();
      const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error(`Supabase sign-out failed (${response.status}).`);
    } catch (error) {
      console.error("Could not revoke Supabase session:", error);
    } finally {
      localStorage.removeItem(AUTH_KEY);
      session = null;
      profile = null;
      window.dispatchEvent(new Event("auth:changed"));
      window.location.assign("/login");
    }
  }

  function showLoginFeedback(form, message) {
    removeLoginFeedback(form);
    const feedbackNode = document.createElement("p");
    feedbackNode.className = "vyla-auth-feedback";
    feedbackNode.setAttribute("role", "alert");
    feedbackNode.textContent = message;
    const passwordField = form.querySelector("#auth-password")?.closest("div");
    if (passwordField) passwordField.after(feedbackNode);
    else form.append(feedbackNode);
  }

  function removeLoginFeedback(form) {
    form.querySelectorAll(".vyla-auth-feedback").forEach((node) => node.remove());
  }

  function avatarUrl(path) {
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path.split("/").map(encodeURIComponent).join("/")}`;
  }

  function initialsAvatar(label) {
    const initial = escapeHtml((label.trim()[0] || "V").toUpperCase());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#29292e"/><text x="48" y="59" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="600" fill="#f5f5f7">${initial}</text></svg>`;
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

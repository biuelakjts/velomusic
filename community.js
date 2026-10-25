(() => {
  const SUPABASE_URL = "https://oetwropgvxkwbolnqbil.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9LPDM6GXY9xeSZ-b6vnufA_tuAwSoCI";
  const SESSION_KEY = "velomusic_supabase_session";
  const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
  const state = {
    session: loadSession(),
    profile: null,
    tab: window.location.pathname === "/admin" ? "admin" : "profile",
    message: "",
    busy: false,
    people: [],
    following: [],
    blocked: [],
    playlists: [],
    tracks: [],
    settings: [],
    adminSettings: [],
    announcements: [],
    adminPlaylists: [],
    users: [],
    publicAnnouncements: [],
  };
  const host = document.createElement("div");
  host.id = "velomusic-community";
  document.body.append(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>
      :host { all: initial; color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      button, input, textarea, select { font: inherit; }
      [hidden] { display: none !important; }
      .launcher { position: fixed; z-index: 2147483000; right: 22px; bottom: 20px; border: 1px solid #ffffff25; border-radius: 999px; padding: 12px 18px; background: #a78bfa; color: #17151d; font-weight: 700; cursor: pointer; box-shadow: 0 8px 30px #0008; }
      .backdrop { position: fixed; z-index: 2147483001; inset: 0; display: grid; place-items: center; padding: 18px; background: #050508bb; backdrop-filter: blur(10px); }
      .panel { width: min(900px, 100%); max-height: min(780px, 94vh); min-height: min(580px, 82vh); display: flex; flex-direction: column; overflow: hidden; color: #f2eff7; background: #111016; border: 1px solid #ffffff1e; border-radius: 22px; box-shadow: 0 30px 100px #000a; }
      header { display:flex; align-items:center; gap:12px; padding:18px 22px; border-bottom:1px solid #ffffff14; }
      header strong { font-size:17px; flex:1; }
      .close, .logout, .tab { cursor:pointer; border:0; color:inherit; background:transparent; }
      .close { font-size:24px; line-height:1; padding:4px 8px; color:#c7bfd3; }
      .layout { min-height:0; display:flex; flex:1; }
      nav { width:175px; flex:none; padding:14px 10px; border-right:1px solid #ffffff14; display:flex; flex-direction:column; gap:4px; }
      .tab { padding:10px 12px; text-align:left; border-radius:10px; color:#aaa4b4; }
      .tab.active, .tab:hover { color:#fff; background:#ffffff12; }
      main { flex:1; min-width:0; overflow:auto; padding:22px; }
      h2 { margin:0 0 6px; font-size:21px; } h3 { margin:20px 0 10px; font-size:15px; }
      p, .muted { color:#aaa4b4; font-size:13px; line-height:1.5; }
      .card { padding:16px; margin:12px 0; border-radius:14px; border:1px solid #ffffff18; background:#ffffff07; }
      .row { display:flex; align-items:center; gap:12px; } .spread { justify-content:space-between; }
      .stack { display:grid; gap:11px; } .inline { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      label { display:grid; gap:6px; color:#c8c1d1; font-size:12px; }
      input, textarea, select { width:100%; padding:10px 12px; border:1px solid #ffffff20; border-radius:9px; outline:none; background:#0b0a0e; color:#fff; }
      input[type="checkbox"], input[type="file"] { width:auto; }
      input:focus, textarea:focus, select:focus { border-color:#a78bfa; }
      textarea { min-height:76px; resize:vertical; }
      button.action { border:0; border-radius:9px; padding:9px 13px; background:#a78bfa; color:#181420; font-weight:700; cursor:pointer; }
      button.secondary { border:1px solid #ffffff24; border-radius:9px; padding:8px 12px; color:#e8e2ef; background:#ffffff0b; cursor:pointer; }
      button.danger { color:#ffb8c0; border-color:#ff7b8b66; }
      button:disabled { opacity:.5; cursor:wait; }
      .avatar { width:58px; height:58px; border-radius:50%; object-fit:cover; background:#292532; }
      .avatar.small { width:38px; height:38px; }
      .item { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #ffffff10; }
      .item:last-child { border-bottom:0; }
      .item-body { min-width:0; flex:1; } .item-body b { display:block; overflow-wrap:anywhere; }
      .badge { padding:4px 8px; color:#d9caff; background:#a78bfa20; border-radius:99px; font-size:11px; }
      .notice { margin:12px 22px 0; padding:10px 12px; border:1px solid #a78bfa55; border-radius:10px; color:#e3d9ff; background:#a78bfa12; font-size:13px; }
      .message { padding:10px 12px; margin-bottom:12px; border-radius:9px; background:#a78bfa18; color:#e1d7ff; font-size:13px; }
      .message.error { color:#ffb9c1; background:#ff667c18; }
      .auth { width:min(430px,100%); margin:auto; padding:26px; }
      .auth h2 { margin-bottom:18px; } .footer { padding:10px 22px; border-top:1px solid #ffffff12; color:#827c8a; font-size:11px; }
      @media(max-width:620px) {
        .backdrop { padding:0; align-items:end; }
        .panel { width:100%; max-height:94vh; min-height:82vh; border-radius:20px 20px 0 0; }
        nav { width:100%; flex-direction:row; overflow:auto; border-right:0; border-bottom:1px solid #ffffff14; padding:8px; }
        .layout { flex-direction:column; } .tab { white-space:nowrap; padding:9px 10px; }
        main { padding:16px; } .notice { margin:10px 16px 0; }
      }
    </style>
    <button class="launcher" type="button" aria-label="Open VeloMusic community">Community</button>
    <div class="backdrop" hidden>
      <section class="panel" role="dialog" aria-modal="true" aria-label="VeloMusic community">
        <header><strong>VeloMusic community</strong><span class="muted connection"></span><button class="close" type="button" aria-label="Close">×</button></header>
        <div class="notice" hidden></div>
        <div class="content"></div>
        <div class="footer">Profiles and social data are stored securely in Supabase.</div>
      </section>
    </div>`;

  const backdrop = root.querySelector(".backdrop");
  const content = root.querySelector(".content");
  const notice = root.querySelector(".notice");
  function openCommunity() {
    backdrop.hidden = false;
    render();
    void refreshAndRender();
  }
  root.querySelector(".launcher").addEventListener("click", openCommunity);
  root.querySelector(".close").addEventListener("click", () => {
    backdrop.hidden = true;
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) backdrop.hidden = true;
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) {
      backdrop.hidden = true;
      root.querySelector(".launcher").focus();
    }
  });
  root.addEventListener("click", handleClick);
  root.addEventListener("submit", handleSubmit);
  root.addEventListener("change", handleChange);
  render();
  if (window.location.pathname === "/admin") {
    openCommunity();
  }

  function loadSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return saved?.access_token && saved?.refresh_token ? saved : null;
    } catch (error) {
      console.error("Could not restore the Supabase session:", error);
      return null;
    }
  }

  function saveSession(session) {
    state.session = session;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function avatarUrl(profile) {
    if (!profile?.avatar_path) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_path.split("/").map(encodeURIComponent).join("/")}`;
  }

  function avatarMarkup(profile, small = false) {
    const url = avatarUrl(profile);
    return `<img class="avatar${small ? " small" : ""}" alt="" ${url ? `src="${escapeHtml(url)}"` : ""}>`;
  }

  async function authRequest(path, body) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || `Authentication failed (${response.status})`);
    return result;
  }

  async function validToken() {
    if (!state.session) throw new Error("Sign in to continue.");
    if (state.session.expires_at > Math.floor(Date.now() / 1000) + 30) {
      return state.session.access_token;
    }
    const refreshed = await authRequest("token?grant_type=refresh_token", {
      refresh_token: state.session.refresh_token,
    });
    saveSession({
      ...refreshed,
      expires_at: Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600),
    });
    return state.session.access_token;
  }

  async function api(table, { method = "GET", query = "", body, prefer } = {}) {
    const token = await validToken();
    const headers = {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };
    if (prefer) headers.prefer = prefer;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message || result?.hint || `Supabase request failed (${response.status})`);
    return result;
  }

  async function fetchProfile() {
    const rows = await api("profiles", {
      query: `id=eq.${encodeURIComponent(state.session.user.id)}&select=*`,
    });
    state.profile = rows?.[0] || null;
  }

  async function refreshAndRender() {
    if (state.session) {
      try {
        await validToken();
        await fetchProfile();
        await loadTab();
      } catch (error) {
        state.message = `Error: ${error.message}`;
        if (/invalid|expired|refresh token/i.test(error.message)) {
          saveSession(null);
          state.profile = null;
        }
      }
    }
    render();
  }

  function render() {
    const isOpen = !backdrop.hidden;
    if (!isOpen) return;
    const connection = root.querySelector(".connection");
    connection.textContent = state.session ? (state.profile?.username ? `@${state.profile.username}` : "Signed in") : "Sign in to sync your community";
    notice.hidden = !state.message;
    notice.textContent = state.message;
    notice.classList.toggle("error", state.message.startsWith("Error:"));
    if (!state.session) {
      content.innerHTML = renderAuth();
      return;
    }
    if (!state.profile) {
      content.innerHTML = `<main><p>${state.message ? "Could not load your account. See the message above, then retry." : "Loading your account…"}</p>${state.message ? `<button class="action" data-action="retry" type="button">Retry</button>` : ""}</main>`;
      return;
    }
    const isSuspended = state.profile?.is_suspended;
    const tabs = isSuspended
      ? []
      : ["profile", "people", "playlists", "saved", "settings", ...(state.profile?.role === "admin" ? ["admin"] : [])];
    content.innerHTML = `
      <div class="layout">
        <nav>${tabs
          .map((tab) => `<button class="tab${state.tab === tab ? " active" : ""}" data-tab="${tab}" type="button">${tab[0].toUpperCase()}${tab.slice(1)}</button>`).join("")}
          <button class="tab" data-action="signout" type="button">Sign out</button>
        </nav>
        <main>${isSuspended
          ? `<h2>Account suspended</h2><p>Your account has been suspended by an administrator. Contact the site owner if you think this is a mistake.</p>`
          : `${state.publicAnnouncements.map((announcement) => `<div class="message">${escapeHtml(announcement.message)}</div>`).join("")}${renderTab()}`}</main>
      </div>`;
  }

  function renderAuth() {
    return `<form class="auth stack" data-form="auth">
      <h2>Sign in or create an account</h2>
      <label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
      <label>Username (for sign up)<input name="username" autocomplete="username" pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" placeholder="music_fan"></label>
      <div class="inline"><button class="action" name="mode" value="login" type="submit" ${state.busy ? "disabled" : ""}>Sign in</button>
      <button class="secondary" name="mode" value="signup" type="submit" ${state.busy ? "disabled" : ""}>Create account</button></div>
      <p>Use a unique password. Email confirmation must be disabled in Supabase Auth settings if you want signup to finish without an email.</p>
    </form>`;
  }

  function renderTab() {
    switch (state.tab) {
      case "profile": return renderProfile();
      case "people": return renderPeople();
      case "playlists": return renderPlaylists();
      case "saved": return renderSaved();
      case "settings": return renderSettings();
      case "admin": return state.profile?.role === "admin" ? renderAdmin() : "<h2>Not authorized</h2>";
      default: return renderProfile();
    }
  }

  function renderProfile() {
    const profile = state.profile || {};
    return `<h2>Your profile</h2><p>Update your public profile and upload an image file for your avatar.</p>
      <form class="card stack" data-form="profile">
        <div class="row">${avatarMarkup(profile)}<label>Upload profile picture<input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label></div>
        <label>Username<input name="username" value="${escapeHtml(profile.username)}" pattern="[A-Za-z0-9_]{3,24}" minlength="3" maxlength="24" required></label>
        <label>Display name<input name="display_name" value="${escapeHtml(profile.display_name)}" maxlength="60"></label>
        <label>Bio<textarea name="bio" maxlength="500">${escapeHtml(profile.bio)}</textarea></label>
        <button class="action" type="submit" ${state.busy ? "disabled" : ""}>Save profile</button>
      </form>
      <div class="card"><span class="badge">${escapeHtml(profile.role || "user")}</span><p>Your username is unique and used to find your profile.</p></div>`;
  }

  function renderPeople() {
    return `<h2>People</h2><p>Search by username. Follow or block other users.</p>
      <form class="inline" data-form="people"><input name="search" placeholder="Find a username" required pattern="[A-Za-z0-9_]{1,24}" maxlength="24"><button class="action" type="submit">Search</button></form>
      <div class="card">${state.people.length ? state.people.map((person) => `<div class="item">${avatarMarkup(person, true)}<div class="item-body"><b>${escapeHtml(person.display_name || person.username)}</b><span class="muted">@${escapeHtml(person.username)}</span>${person.bio ? `<p>${escapeHtml(person.bio)}</p>` : ""}</div><button class="secondary" data-action="${state.following.includes(person.id) ? "unfollow" : "follow"}" data-id="${escapeHtml(person.id)}" type="button">${state.following.includes(person.id) ? "Unfollow" : "Follow"}</button><button class="secondary danger" data-action="${state.blocked.includes(person.id) ? "unblock" : "block"}" data-id="${escapeHtml(person.id)}" type="button">${state.blocked.includes(person.id) ? "Unblock" : "Block"}</button></div>`).join("") : "<p>Search for a username to find people.</p>"}</div>`;
  }

  function renderPlaylists() {
    return `<h2>Your playlists</h2><p>Create public playlists for everyone or private playlists visible only to you.</p>
      <form class="card stack" data-form="playlist">
        <label>Title<input name="title" maxlength="120" required></label>
        <label>Description<textarea name="description" maxlength="1000"></textarea></label>
        <label>Visibility<select name="visibility"><option value="public">Public</option><option value="private">Private</option></select></label>
        <button class="action" type="submit">Create playlist</button>
      </form>
      ${state.playlists.map((playlist) => `<div class="card"><div class="row spread"><div><b>${escapeHtml(playlist.title)}</b> <span class="badge">${escapeHtml(playlist.visibility)}</span><p>${escapeHtml(playlist.description)}</p></div>${playlist.owner_id === state.session.user.id ? `<button class="secondary danger" data-action="delete-playlist" data-id="${escapeHtml(playlist.id)}" type="button">Delete</button>` : ""}</div>
      ${(playlist.playlist_tracks || []).sort((a, b) => a.position - b.position).map((track) => `<div class="item"><div class="item-body"><b>${escapeHtml(track.track_data.title || track.track_data.id || "Track")}</b><span class="muted">${escapeHtml(track.track_data.artist || "")}</span></div></div>`).join("")}
      ${playlist.owner_id === state.session.user.id ? `<form class="inline" data-form="playlist-track" data-playlist="${escapeHtml(playlist.id)}"><input name="track_id" placeholder="Track ID" required><input name="title" placeholder="Track title" required><input name="artist" placeholder="Artist"><button class="secondary" type="submit">Add track</button></form>` : `<span class="muted">By ${escapeHtml(playlist.owner_id)}</span>`}</div>`).join("")}`;
  }

  function renderSaved() {
    return `<h2>Saved tracks</h2><p>Saved tracks sync with your account.</p>
      <form class="card inline" data-form="saved"><input name="track_id" placeholder="Track ID" required><input name="title" placeholder="Track title" required><input name="artist" placeholder="Artist"><button class="action" type="submit">Save track</button></form>
      <div class="card">${state.tracks.length ? state.tracks.map((track) => `<div class="item"><div class="item-body"><b>${escapeHtml(track.track_data.title || track.track_id)}</b><span class="muted">${escapeHtml(track.track_data.artist || "")}</span></div><button class="secondary danger" data-action="unsave" data-id="${escapeHtml(track.track_id)}" type="button">Remove</button></div>`).join("") : "<p>No saved tracks yet.</p>"}</div>`;
  }

  function renderSettings() {
    return `<h2>Account settings</h2><p>Settings are saved to your Supabase account and sync across devices.</p>
      <form class="card stack" data-form="setting">
        <label>Setting name<input name="key" maxlength="100" pattern="[A-Za-z0-9_.-]+" required placeholder="theme"></label>
        <label>Value (JSON)<textarea name="value" required placeholder='"dark"'></textarea></label>
        <button class="action" type="submit">Save setting</button>
      </form>
      <div class="card">${state.settings.map((item) => `<div class="item"><div class="item-body"><b>${escapeHtml(item.key)}</b><span class="muted">${escapeHtml(JSON.stringify(item.value))}</span></div><button class="secondary danger" data-action="delete-setting" data-id="${escapeHtml(item.key)}" type="button">Remove</button></div>`).join("") || "<p>No saved settings yet.</p>"}</div>`;
  }

  function renderAdmin() {
    return `<h2>Admin</h2><p>These controls are restricted by Supabase row-level security to accounts promoted to admin.</p>
      <h3>Global settings</h3><form class="card inline" data-form="admin-setting"><input name="key" placeholder="Setting key" required><input name="value" placeholder="JSON value" required><label class="inline"><input name="is_public" type="checkbox"> Public</label><button class="action" type="submit">Save</button></form>
      <div class="card">${state.adminSettings.map((item) => `<div class="item"><div class="item-body"><b>${escapeHtml(item.key)}</b><span class="muted">${escapeHtml(JSON.stringify(item.value))} · ${item.is_public ? "public" : "admin only"}</span></div></div>`).join("") || "<p>No global settings.</p>"}</div>
      <h3>Announcements</h3><form class="card stack" data-form="announcement"><label>Message<textarea name="message" maxlength="2000" required></textarea></label><label><span><input name="enabled" type="checkbox" checked> Publish now</span></label><button class="action" type="submit">Post announcement</button></form>
      <div class="card">${state.announcements.map((item) => `<div class="item"><div class="item-body"><b>${escapeHtml(item.message)}</b><span class="muted">${item.enabled ? "Published" : "Hidden"}</span></div><button class="secondary" data-action="toggle-announcement" data-id="${escapeHtml(item.id)}" data-enabled="${item.enabled}" type="button">${item.enabled ? "Hide" : "Publish"}</button><button class="secondary danger" data-action="delete-announcement" data-id="${escapeHtml(item.id)}" type="button">Delete</button></div>`).join("") || "<p>No announcements.</p>"}</div>
      <h3>Content moderation</h3><div class="card">${state.adminPlaylists.map((playlist) => `<div class="item"><div class="item-body"><b>${escapeHtml(playlist.title)}</b><span class="muted">${escapeHtml(playlist.visibility)} · owner ${escapeHtml(playlist.owner_id)}</span></div><button class="secondary danger" data-action="delete-admin-playlist" data-id="${escapeHtml(playlist.id)}" type="button">Remove playlist</button></div>`).join("") || "<p>No playlists to moderate.</p>"}</div>
      <h3>Accounts</h3><div class="card">${state.users.map((user) => `<div class="item">${avatarMarkup(user, true)}<div class="item-body"><b>${escapeHtml(user.display_name || user.username)}</b><span class="muted">@${escapeHtml(user.username)} · ${escapeHtml(user.role)}${user.is_suspended ? " · suspended" : ""}</span></div>${user.id !== state.session.user.id ? `<button class="secondary" data-action="role" data-id="${escapeHtml(user.id)}" data-role="${escapeHtml(user.role)}" type="button">${user.role === "admin" ? "Remove admin" : "Make admin"}</button><button class="secondary danger" data-action="suspend-user" data-id="${escapeHtml(user.id)}" data-suspended="${user.is_suspended}" type="button">${user.is_suspended ? "Restore account" : "Suspend"}</button>` : ""}</div>`).join("") || "<p>No accounts.</p>"}</div>`;
  }

  async function loadTab() {
    if (!state.session) return;
    if (state.profile?.is_suspended) return;
    state.publicAnnouncements = await api("announcements", {
      query: "enabled=eq.true&select=id,message&order=created_at.desc",
    });
    switch (state.tab) {
      case "people": break;
      case "playlists":
        state.playlists = await api("playlists", { query: "select=*,playlist_tracks(*)&order=updated_at.desc&limit=50" });
        break;
      case "saved":
        state.tracks = await api("saved_tracks", { query: `user_id=eq.${state.session.user.id}&select=*&order=created_at.desc` });
        break;
      case "settings":
        state.settings = await api("user_settings", { query: `user_id=eq.${state.session.user.id}&select=*&order=key.asc` });
        break;
      case "admin":
        if (state.profile?.role !== "admin") return;
        [state.adminSettings, state.announcements, state.adminPlaylists, state.users] = await Promise.all([
          api("app_settings", { query: "select=*&order=key.asc" }),
          api("announcements", { query: "select=*&order=created_at.desc" }),
          api("playlists", { query: "select=id,title,visibility,owner_id&order=created_at.desc&limit=100" }),
          api("profiles", { query: "select=*&order=created_at.desc" }),
        ]);
        break;
    }
  }

  async function run(action) {
    state.busy = true;
    state.message = "";
    render();
    try {
      await action();
      state.message ||= "Saved.";
      if (state.session) await fetchProfile();
      await loadTab();
    } catch (error) {
      console.error("VeloMusic community action failed:", error);
      state.message = `Error: ${error.message}`;
    } finally {
      state.busy = false;
      render();
    }
  }

  function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async function handleSubmit(event) {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const data = formValues(form);
    await run(async () => {
      switch (form.dataset.form) {
        case "auth": {
          const mode = event.submitter?.value || "login";
          if (mode === "signup") {
            if (data.password.length < 8) throw new Error("Choose a password with at least 8 characters.");
            const result = await authRequest("signup", {
              email: data.email,
              password: data.password,
              data: { username: data.username },
            });
            if (!result.access_token) {
              throw new Error("Signup did not return a session. Disable email confirmation in Supabase Authentication > Providers > Email, then try again.");
            }
            saveSession({ ...result, expires_at: Math.floor(Date.now() / 1000) + (result.expires_in || 3600) });
          } else {
            const result = await authRequest("token?grant_type=password", { email: data.email, password: data.password });
            saveSession({ ...result, expires_at: Math.floor(Date.now() / 1000) + (result.expires_in || 3600) });
          }
          state.tab = window.location.pathname === "/admin" ? "admin" : "profile";
          await fetchProfile();
          state.message = "You are signed in.";
          break;
        }
        case "profile": {
          const file = form.elements.avatar.files[0];
          let avatar_path = state.profile.avatar_path;
          if (file) {
            if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
            if (file.size > AVATAR_MAX_BYTES) throw new Error("Profile pictures must be 5 MiB or smaller.");
            const extension = file.type.split("/")[1].replace("jpeg", "jpg");
            const path = `${state.session.user.id}/avatar-${Date.now()}.${extension}`;
            const token = await validToken();
            const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
              method: "POST",
              headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}`, "content-type": file.type, "x-upsert": "true" },
              body: file,
            });
            if (!upload.ok) throw new Error(`Avatar upload failed (${upload.status}).`);
            avatar_path = path;
          }
          await api("profiles", {
            method: "PATCH",
            query: `id=eq.${state.session.user.id}`,
            body: { username: data.username, display_name: data.display_name || "", bio: data.bio || "", avatar_path },
            prefer: "return=minimal",
          });
          state.message = "Profile updated.";
          break;
        }
        case "people": {
          const username = data.search.toLowerCase();
          const rows = await api("profiles", {
            query: `username=ilike.${encodeURIComponent(username)}&id=neq.${state.session.user.id}&select=id,username,display_name,bio,avatar_path,role&limit=20`,
          });
          state.people = rows;
          const [follows, blocks] = await Promise.all([
            api("follows", { query: `follower_id=eq.${state.session.user.id}&select=following_id` }),
            api("blocks", { query: `blocker_id=eq.${state.session.user.id}&select=blocked_id` }),
          ]);
          state.following = follows.map((row) => row.following_id);
          state.blocked = blocks.map((row) => row.blocked_id);
          state.message = rows.length ? `Found ${rows.length} profile(s).` : "No matching profiles found.";
          break;
        }
        case "playlist": {
          await api("playlists", {
            method: "POST",
            body: { owner_id: state.session.user.id, title: data.title, description: data.description || "", visibility: data.visibility },
            prefer: "return=minimal",
          });
          state.message = "Playlist created.";
          break;
        }
        case "playlist-track": {
          const playlist = await api("playlists", { query: `id=eq.${form.dataset.playlist}&select=id,playlist_tracks(position)` });
          const position = Math.max(-1, ...(playlist[0]?.playlist_tracks || []).map((track) => track.position)) + 1;
          await api("playlist_tracks", {
            method: "POST",
            body: { playlist_id: form.dataset.playlist, position, track_data: { id: data.track_id, title: data.title, artist: data.artist || "" } },
            prefer: "return=minimal",
          });
          state.message = "Track added.";
          break;
        }
        case "saved":
          await api("saved_tracks", {
            method: "POST",
            body: { user_id: state.session.user.id, track_id: data.track_id, track_data: { id: data.track_id, title: data.title, artist: data.artist || "" } },
            prefer: "resolution=merge-duplicates,return=minimal",
          });
          state.message = "Track saved.";
          break;
        case "setting": {
          const value = JSON.parse(data.value);
          await api("user_settings", {
            method: "POST",
            query: "on_conflict=user_id,key",
            body: { user_id: state.session.user.id, key: data.key, value },
            prefer: "resolution=merge-duplicates,return=minimal",
          });
          state.message = "Setting saved.";
          break;
        }
        case "admin-setting":
          await api("app_settings", {
            method: "POST",
            query: "on_conflict=key",
            body: { key: data.key, value: JSON.parse(data.value), is_public: form.elements.is_public.checked, updated_by: state.session.user.id },
            prefer: "resolution=merge-duplicates,return=minimal",
          });
          state.message = "Global setting saved.";
          break;
        case "announcement":
          await api("announcements", {
            method: "POST",
            body: { message: data.message, enabled: form.elements.enabled.checked, created_by: state.session.user.id },
            prefer: "return=minimal",
          });
          state.message = "Announcement saved.";
          break;
      }
    });
  }

  async function handleChange(event) {
    if (event.target.name === "avatar" && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > AVATAR_MAX_BYTES) {
        state.message = "Error: Profile pictures must be 5 MiB or smaller.";
        render();
      }
    }
  }

  async function handleClick(event) {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      state.tab = tab.dataset.tab;
      state.message = "";
      await run(async () => {});
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "retry") {
      state.message = "";
      render();
      await refreshAndRender();
      return;
    }
    await run(async () => {
      switch (action) {
        case "signout":
          let signOutError = null;
          try {
            const token = await validToken();
            const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
              method: "POST",
              headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(`Sign-out failed (${response.status})`);
          } catch (error) {
            console.warn("Supabase sign-out request failed:", error);
            signOutError = error;
          }
          saveSession(null);
          state.profile = null;
          state.message = signOutError
            ? `Error: Signed out locally, but the Supabase session could not be revoked (${signOutError.message}).`
            : "Signed out.";
          return;
        case "follow":
          await api("follows", { method: "POST", body: { follower_id: state.session.user.id, following_id: id }, prefer: "resolution=ignore-duplicates,return=minimal" });
          state.following = [...new Set([...state.following, id])];
          state.message = "Followed.";
          break;
        case "unfollow":
          await api("follows", { method: "DELETE", query: `follower_id=eq.${state.session.user.id}&following_id=eq.${id}` });
          state.following = state.following.filter((followingId) => followingId !== id);
          state.message = "Unfollowed.";
          break;
        case "block":
          if (!confirm("Block this user? Existing follows in either direction will be removed.")) return;
          await api("blocks", { method: "POST", body: { blocker_id: state.session.user.id, blocked_id: id }, prefer: "resolution=ignore-duplicates,return=minimal" });
          state.people = state.people.filter((person) => person.id !== id);
          state.blocked = [...new Set([...state.blocked, id])];
          state.message = "User blocked.";
          break;
        case "unblock":
          await api("blocks", { method: "DELETE", query: `blocker_id=eq.${state.session.user.id}&blocked_id=eq.${id}` });
          state.blocked = state.blocked.filter((blockedId) => blockedId !== id);
          state.message = "User unblocked.";
          break;
        case "delete-playlist":
          if (!confirm("Delete this playlist and its tracks?")) return;
          await api("playlists", { method: "DELETE", query: `id=eq.${id}` });
          state.message = "Playlist deleted.";
          break;
        case "unsave":
          await api("saved_tracks", { method: "DELETE", query: `user_id=eq.${state.session.user.id}&track_id=eq.${encodeURIComponent(id)}` });
          state.message = "Track removed.";
          break;
        case "delete-setting":
          await api("user_settings", { method: "DELETE", query: `user_id=eq.${state.session.user.id}&key=eq.${encodeURIComponent(id)}` });
          state.message = "Setting removed.";
          break;
        case "toggle-announcement":
          await api("announcements", { method: "PATCH", query: `id=eq.${id}`, body: { enabled: button.dataset.enabled !== "true" }, prefer: "return=minimal" });
          state.message = "Announcement updated.";
          break;
        case "delete-announcement":
          await api("announcements", { method: "DELETE", query: `id=eq.${id}` });
          state.message = "Announcement deleted.";
          break;
        case "delete-admin-playlist":
          if (!confirm("Remove this playlist and all of its tracks?")) {
            state.message = "Cancelled.";
            return;
          }
          await api("playlists", { method: "DELETE", query: `id=eq.${id}` });
          state.message = "Playlist removed.";
          break;
        case "suspend-user": {
          const suspended = button.dataset.suspended !== "true";
          if (!confirm(`${suspended ? "Suspend" : "Restore"} this account?`)) {
            state.message = "Cancelled.";
            return;
          }
          await api("profiles", {
            method: "PATCH",
            query: `id=eq.${id}`,
            body: { is_suspended: suspended },
            prefer: "return=minimal",
          });
          state.message = suspended ? "Account suspended." : "Account restored.";
          break;
        }
        case "role": {
          if (!confirm("Change this user's admin role?")) return;
          const role = button.dataset.role === "admin" ? "user" : "admin";
          await api("profiles", { method: "PATCH", query: `id=eq.${id}`, body: { role }, prefer: "return=minimal" });
          state.message = `User role changed to ${role}.`;
          break;
        }
      }
    });
  }
})();

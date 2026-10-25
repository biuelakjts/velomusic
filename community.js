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
      :host {
        --community-bg: rgba(20, 20, 23, .88);
        --community-glass: rgba(255, 255, 255, .045);
        --community-border: rgba(255, 255, 255, .09);
        --community-text: #f5f5f7;
        --community-muted: #99999f;
        --community-accent: #2383e2;
        all: initial;
        color-scheme: dark;
        color: var(--community-text);
        font-family: Inter, system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      * { box-sizing: border-box; }
      button, input, textarea, select { font: inherit; }
      [hidden] { display: none !important; }
      .launcher {
        position: fixed;
        z-index: 2147483000;
        right: 20px;
        bottom: 20px;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 11px 16px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 10px;
        background: rgba(32,32,36,.82);
        color: #f5f5f7;
        font-size: 13px;
        font-weight: 550;
        cursor: pointer;
        backdrop-filter: blur(28px) saturate(150%);
        box-shadow: 0 8px 32px rgba(0,0,0,.28);
        transition: background .18s ease, transform .18s ease;
      }
      .launcher:hover { background: rgba(54,54,60,.9); transform: translateY(-1px); }
      .launcher::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--community-accent);
        box-shadow: 0 0 12px rgba(35,131,226,.65);
      }
      .backdrop {
        position: fixed;
        z-index: 2147483001;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(7,7,9,.48);
        backdrop-filter: blur(7px);
        animation: veil-in .18s ease-out;
      }
      .panel {
        width: min(940px, 100%);
        max-height: min(740px, 90vh);
        min-height: min(560px, 78vh);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: var(--community-text);
        background: var(--community-bg);
        border: 1px solid var(--community-border);
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(0,0,0,.38);
        backdrop-filter: blur(44px) saturate(145%);
        animation: panel-in .2s cubic-bezier(.2,.7,.2,1);
      }
      header {
        display:flex;
        align-items:center;
        gap:12px;
        min-height:58px;
        padding:12px 18px;
        border-bottom:1px solid rgba(255,255,255,.08);
      }
      header strong { font-size:14px; letter-spacing:-.01em; font-weight:600; flex:1; }
      .connection { font-size:11px; }
      .close, .logout, .tab { cursor:pointer; border:0; color:inherit; background:transparent; }
      .close {
        display:grid;
        place-items:center;
        width:32px;
        height:32px;
        border-radius:8px;
        font-size:21px;
        line-height:1;
        color:#b4b4bb;
        transition:background .15s ease, color .15s ease;
      }
      .close:hover { color:#fff; background:rgba(255,255,255,.09); }
      .layout { min-height:0; display:flex; flex:1; }
      nav {
        width:168px;
        flex:none;
        padding:14px 9px;
        border-right:1px solid rgba(255,255,255,.07);
        display:flex;
        flex-direction:column;
        gap:3px;
        background:rgba(255,255,255,.012);
      }
      .tab {
        padding:9px 11px;
        text-align:left;
        border-radius:8px;
        color:#a6a6ad;
        font-size:12px;
        transition:background .15s ease, color .15s ease;
      }
      .tab.active, .tab:hover { color:#f5f5f7; background:rgba(255,255,255,.09); }
      .tab.active { box-shadow:inset 2px 0 var(--community-accent); }
      main { flex:1; min-width:0; overflow:auto; padding:24px 28px; }
      h2 { margin:0 0 6px; font-size:20px; letter-spacing:-.035em; font-weight:600; }
      h3 { margin:23px 0 10px; font-size:13px; font-weight:600; letter-spacing:.01em; }
      p, .muted { color:var(--community-muted); font-size:12px; line-height:1.55; }
      .card {
        padding:15px;
        margin:12px 0;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.075);
        background:var(--community-glass);
      }
      .row { display:flex; align-items:center; gap:12px; }
      .spread { justify-content:space-between; }
      .stack { display:grid; gap:11px; }
      .inline { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      label { display:grid; gap:6px; color:#c5c5cb; font-size:11px; }
      input, textarea, select {
        width:100%;
        padding:10px 11px;
        border:1px solid rgba(255,255,255,.11);
        border-radius:8px;
        outline:none;
        background:rgba(0,0,0,.18);
        color:#f5f5f7;
        font-size:12px;
        transition:border-color .15s ease, background .15s ease;
      }
      input[type="checkbox"], input[type="file"] { width:auto; }
      input:focus, textarea:focus, select:focus { border-color:rgba(35,131,226,.8); background:rgba(0,0,0,.26); }
      textarea { min-height:76px; resize:vertical; }
      button.action {
        border:1px solid rgba(255,255,255,.08);
        border-radius:8px;
        padding:9px 13px;
        background:var(--community-accent);
        color:#fff;
        font-size:12px;
        font-weight:600;
        cursor:pointer;
        transition:filter .15s ease, transform .15s ease;
      }
      button.action:hover { filter:brightness(1.12); transform:translateY(-1px); }
      button.secondary {
        border:1px solid rgba(255,255,255,.12);
        border-radius:8px;
        padding:8px 11px;
        color:#e7e7ea;
        background:rgba(255,255,255,.045);
        font-size:11px;
        cursor:pointer;
        transition:background .15s ease;
      }
      button.secondary:hover { background:rgba(255,255,255,.10); }
      button.danger { color:#ffb5bb; border-color:rgba(255,123,139,.3); }
      button:disabled { opacity:.5; cursor:wait; }
      .avatar { width:58px; height:58px; border:1px solid rgba(255,255,255,.13); border-radius:50%; object-fit:cover; background:#29292e; }
      .avatar.small { width:38px; height:38px; }
      .item { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.065); }
      .item:last-child { border-bottom:0; }
      .item-body { min-width:0; flex:1; } .item-body b { display:block; overflow-wrap:anywhere; }
      .badge { padding:4px 8px; color:#b7d9fb; background:rgba(35,131,226,.15); border:1px solid rgba(35,131,226,.16); border-radius:99px; font-size:10px; }
      .notice {
        margin:12px 18px 0;
        padding:10px 12px;
        border:1px solid rgba(35,131,226,.35);
        border-radius:9px;
        color:#d4e8fb;
        background:rgba(35,131,226,.09);
        font-size:12px;
      }
      .notice.error { border-color:rgba(255,123,139,.35); color:#ffd5d8; background:rgba(255,91,111,.085); }
      .message { padding:10px 12px; margin-bottom:12px; border-radius:9px; background:rgba(35,131,226,.11); color:#d4e8fb; font-size:12px; }
      .message.error { color:#ffd5d8; background:rgba(255,91,111,.10); }
      .auth { width:min(430px,100%); margin:auto; padding:30px; }
      .auth h2 { margin-bottom:18px; }
      .setup-card { max-width:560px; padding:17px; margin-top:20px; border:1px solid rgba(35,131,226,.25); border-radius:12px; background:rgba(35,131,226,.055); }
      .setup-card strong { display:block; margin-bottom:6px; font-size:13px; }
      .setup-card p { margin:5px 0; }
      .footer { padding:9px 18px; border-top:1px solid rgba(255,255,255,.07); color:#85858d; font-size:10px; }
      @keyframes veil-in { from { opacity:0; } to { opacity:1; } }
      @keyframes panel-in { from { opacity:0; transform:translateY(7px) scale(.99); } to { opacity:1; transform:translateY(0) scale(1); } }
      @media(max-width:620px) {
        .backdrop { padding:0; align-items:end; }
        .panel { width:100%; max-height:94vh; min-height:82vh; border-radius:16px 16px 0 0; }
        nav { width:100%; flex-direction:row; overflow:auto; border-right:0; border-bottom:1px solid rgba(255,255,255,.07); padding:8px; }
        .layout { flex-direction:column; }
        .tab { white-space:nowrap; padding:9px 10px; }
        main { padding:17px; }
        .notice { margin:10px 14px 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
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
      const schemaMissing = /PGRST205|(?:could not find|does not exist).{0,80}public\.profiles|public\.profiles.{0,80}(?:schema cache|does not exist)/i.test(state.message);
      content.innerHTML = `<main>
        ${schemaMissing
          ? `<section class="setup-card">
              <strong>One-time database setup needed</strong>
              <p>Supabase can’t find the <code>public.profiles</code> table. The Community panel needs its database schema installed before it can load your account.</p>
              <p>Open the Supabase SQL Editor, run the repository’s <code>supabase.sql</code>, then retry. If you just ran it, wait a few seconds for the API schema cache to refresh.</p>
              <button class="action" data-action="retry" type="button">Retry connection</button>
            </section>`
          : `<section class="setup-card">
              <strong>${state.message ? "Could not load your account" : "Connecting your account…"}</strong>
              <p>${state.message ? "Check the message above, then retry. Your sign-in is still saved." : "Loading your profile and settings from Supabase."}</p>
              ${state.message ? `<button class="action" data-action="retry" type="button">Retry</button>` : ""}
            </section>`}
      </main>`;
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

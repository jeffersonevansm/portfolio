/* ============================================================
   PORTFOLIO ADMIN API  (runs inside the site's Cloudflare Worker)
   ------------------------------------------------------------
   Routes (all under /api/admin/):
     POST /api/admin/login    → check the password, set a session cookie
     POST /api/admin/logout   → clear the session cookie
     GET  /api/admin/me       → is this browser signed in?
     GET  /api/admin/content  → current content.js text + its git blob sha
     POST /api/admin/save     → commit content.js (+ uploaded images) to GitHub

   Storage is the GitHub repo itself: every Save is one commit on the
   branch below, and Workers Builds redeploys the site from it.

   Required settings (Cloudflare → Workers & Pages → portfolio → Settings → Variables and Secrets),
   both as type "Secret":
     GITHUB_TOKEN     fine-grained token, Contents: read & write, only for this repository
     ADMIN_PASSWORD   the admin password (at least 12 characters)
   Optional:
     GITHUB_REPO      default "jeffersonevansm/portfolio"
     GITHUB_BRANCH    default "main"

   If a required setting is missing (or the password is too short),
   every request is refused (fail closed). Changing ADMIN_PASSWORD signs
   out every existing session.
   ============================================================ */

const CONTENT_PATH = 'content.js';
const MAX_CONTENT_BYTES = 300 * 1024;        // content.js is ~13 KB today
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;     // per uploaded image
const MAX_UPLOADS = 10;                      // per save
const IMAGE_TYPES = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };   // no SVG: it can carry scripts

const COOKIE = '__Host-portfolio_admin';
const SESSION_SECONDS = 12 * 60 * 60;        // stay signed in for 12 hours
const MIN_PASSWORD = 12;
const MAX_FAILS = 8;                         // wrong passwords per IP …
const FAIL_WINDOW = 15 * 60;                 // … per 15 minutes

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/+$/, '');

  try {
    const cfg = readConfig(env);
    if (!cfg) return json({ error: 'Admin is not configured yet (missing settings on Cloudflare).' }, 503);

    // Every state-changing request must come from this site (blocks cross-site form posts).
    if (request.method === 'POST') {
      const origin = request.headers.get('Origin');
      if (!origin || origin !== url.origin) return json({ error: 'Bad origin.' }, 403);
    }

    if (request.method === 'POST' && route === 'login') return login(request, cfg);
    if (request.method === 'POST' && route === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });

    const session = await readSession(request, cfg);
    if (!session) return json({ error: 'Not signed in.' }, 401);

    if (request.method === 'GET' && route === 'me') return json({ signedIn: true, expires: session.exp });
    if (request.method === 'GET' && route === 'content') return json(await getContent(cfg));
    if (request.method === 'POST' && route === 'save') return json(await save(cfg, await request.json()));
    return json({ error: 'Not found.' }, 404);
  } catch (err) {
    const status = err.status || 500;
    return json({ error: err.expose ? err.message : 'Something went wrong on the server.', detail: err.expose ? undefined : String(err.message || err).slice(0, 300) }, status);
  }
}

/* ---------- config ---------- */
function readConfig(env) {
  const token = String(env.GITHUB_TOKEN || '').trim();
  const password = String(env.ADMIN_PASSWORD || '');
  if (!token || password.length < MIN_PASSWORD) return null;
  return {
    token,
    password,
    repo: (env.GITHUB_REPO || 'jeffersonevansm/portfolio').trim(),
    branch: (env.GITHUB_BRANCH || 'main').trim(),
    githubApi: (env.GITHUB_API || 'https://api.github.com').replace(/\/+$/, '')   // overridable for tests
  };
}

/* ---------- password login + session cookie ---------- */
async function hmac(keyText, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(keyText), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)));
}
function sameBytes(a, b) {            // constant-time compare
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// The signing key is derived from the password, so changing the password logs everyone out.
const sessionKey = cfg => 'portfolio-admin-session:' + cfg.password;

async function login(request, cfg) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const fails = await getFails(ip);
  if (fails >= MAX_FAILS) return json({ error: 'Too many wrong passwords. Try again in 15 minutes.' }, 429);

  let body = {};
  try { body = await request.json(); } catch {}
  const given = typeof body.password === 'string' ? body.password : '';
  // Compare HMACs of both values so the check takes the same time whatever was typed.
  const ok = sameBytes(await hmac('pw-check', given), await hmac('pw-check', cfg.password));
  if (!ok) {
    await setFails(ip, fails + 1);
    await new Promise(r => setTimeout(r, 800));
    return json({ error: 'Wrong password.' }, 401);
  }
  await setFails(ip, 0);
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `v1.${exp}.${b64u(crypto.getRandomValues(new Uint8Array(12)))}`;
  const sig = b64u(await hmac(sessionKey(cfg), payload));
  return json({ ok: true, expires: exp }, 200, {
    'Set-Cookie': `${COOKIE}=${payload}.${sig}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`
  });
}

async function readSession(request, cfg) {
  const raw = cookie(request, COOKIE);
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  const payload = parts.slice(0, 3).join('.');
  const expected = b64u(await hmac(sessionKey(cfg), payload));
  if (!sameBytes(new TextEncoder().encode(expected), new TextEncoder().encode(parts[3]))) return null;
  const exp = Number(parts[1]);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return null;
  return { exp };
}

// Wrong-password counter per IP, kept in the Workers cache (per data centre).
const failKey = ip => new Request(`https://admin-login-fails.internal/${encodeURIComponent(ip)}`);
async function getFails(ip) {
  try { const r = await caches.default.match(failKey(ip)); return r ? Number(await r.text()) || 0 : 0; } catch { return 0; }
}
async function setFails(ip, n) {
  try {
    if (n <= 0) { await caches.default.delete(failKey(ip)); return; }
    await caches.default.put(failKey(ip), new Response(String(n), { headers: { 'Cache-Control': `max-age=${FAIL_WINDOW}` } }));
  } catch {}
}

/* ---------- GitHub ---------- */
async function gh(cfg, path, init = {}) {
  const r = await fetch(`${cfg.githubApi}/repos/${cfg.repo}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!r.ok) {
    const e = new Error(`GitHub ${r.status}: ${data.message || 'request failed'}`);
    e.status = r.status === 401 || r.status === 403 ? 502 : (r.status === 409 || r.status === 422 ? 409 : 502);
    e.expose = true;
    throw e;
  }
  return data;
}

async function getContent(cfg) {
  const ref = await gh(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
  const headSha = ref.object.sha;
  const file = await gh(cfg, `/contents/${CONTENT_PATH}?ref=${headSha}`);
  return { text: b64ToText(file.content), blobSha: file.sha, headSha, repo: cfg.repo, branch: cfg.branch };
}

async function save(cfg, body) {
  const fail = (msg, status = 400) => { const e = new Error(msg); e.status = status; e.expose = true; throw e; };

  const text = body && body.text;
  if (typeof text !== 'string' || !text.includes('window.SITE_CONTENT')) fail('The new content.js is missing or invalid.');
  if (new TextEncoder().encode(text).length > MAX_CONTENT_BYTES) fail('content.js is too large.');
  if (typeof body.baseBlobSha !== 'string') fail('Missing baseBlobSha — reload the admin page.');

  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  if (uploads.length > MAX_UPLOADS) fail(`Too many images in one save (max ${MAX_UPLOADS}).`);
  const seen = new Set();
  for (const u of uploads) {
    if (!u || typeof u.path !== 'string' || typeof u.base64 !== 'string') fail('Bad image upload.');
    const m = /^uploads\/[a-z0-9][a-z0-9._-]{0,80}\.([a-z0-9]+)$/.exec(u.path);
    if (!m || !IMAGE_TYPES[m[1]] || u.path.includes('..')) fail(`Image name not allowed: ${u.path}`);
    if (seen.has(u.path)) fail(`Duplicate image: ${u.path}`);
    seen.add(u.path);
    if (u.base64.length * 0.75 > MAX_IMAGE_BYTES) fail(`${u.path} is too large (max 4 MB).`);
  }

  // Conflict check: refuse if content.js changed on GitHub since the editor loaded it.
  const ref = await gh(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
  const headSha = ref.object.sha;
  const current = await gh(cfg, `/contents/${CONTENT_PATH}?ref=${headSha}`);
  if (current.sha !== body.baseBlobSha) {
    fail('content.js changed on GitHub since you opened the editor. Reload the page to get the latest version, then redo your edits.', 409);
  }

  const headCommit = await gh(cfg, `/git/commits/${headSha}`);
  const tree = [];
  const contentBlob = await gh(cfg, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: text, encoding: 'utf-8' }) });
  tree.push({ path: CONTENT_PATH, mode: '100644', type: 'blob', sha: contentBlob.sha });
  for (const u of uploads) {
    const blob = await gh(cfg, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: u.base64, encoding: 'base64' }) });
    tree.push({ path: u.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await gh(cfg, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }) });

  const summary = String(body.message || '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Update site content';
  const message = `${summary}\n\nEdited in the portfolio admin (/admin).`;
  const commit = await gh(cfg, '/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }) });

  // force:false → GitHub rejects if the branch moved in the meantime.
  await gh(cfg, `/git/refs/heads/${encodeURIComponent(cfg.branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });

  return { ok: true, commit: commit.sha, blobSha: contentBlob.sha, url: `https://github.com/${cfg.repo}/commit/${commit.sha}`, uploaded: uploads.map(u => u.path) };
}

/* ---------- helpers ---------- */
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }
  });
}
function cookie(request, name) {
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function b64ToText(b64) {
  const bin = atob(String(b64).replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

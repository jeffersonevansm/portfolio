/* ============================================================
   PORTFOLIO ADMIN API  (runs inside the site's Cloudflare Worker)
   ------------------------------------------------------------
   Routes (all under /api/admin/):
     GET  /api/admin/me       → who is signed in (Cloudflare Access)
     GET  /api/admin/content  → current content.js text + its git blob sha
     POST /api/admin/save     → commit content.js (+ uploaded images) to GitHub

   Storage is the GitHub repo itself: every Save is one commit on the
   branch below, and Cloudflare Pages redeploys the site from it.

   Required settings (Cloudflare → Workers & Pages → portfolio → Settings → Variables and Secrets):
     GITHUB_TOKEN         (secret)  fine-grained token, Contents: read & write,
                                    only for this repository
     ACCESS_TEAM_DOMAIN   e.g. "yourteam.cloudflareaccess.com"
     ACCESS_AUD           the Application Audience (AUD) tag of the
                          Cloudflare Access app that protects /admin and /api/admin
     ADMIN_EMAILS         comma-separated list of emails allowed to edit
   Optional:
     GITHUB_REPO          default "jeffersonevansm/portfolio"
     GITHUB_BRANCH        default "main"

   If any required setting is missing, every request is refused (fail closed).
   ============================================================ */

const CONTENT_PATH = 'content.js';
const MAX_CONTENT_BYTES = 300 * 1024;        // content.js is ~13 KB today
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;     // per uploaded image
const MAX_UPLOADS = 10;                      // per save
const IMAGE_TYPES = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };   // no SVG: it can carry scripts

export async function handleAdmin(request, env) {
  const route = new URL(request.url).pathname.replace(/^\/api\/admin\/?/, '').replace(/\/+$/, '');

  try {
    const cfg = readConfig(env);
    if (!cfg) return json({ error: 'Admin is not configured yet (missing settings on Cloudflare).' }, 503);

    const user = await verifyAccess(request, cfg);
    if (!user) return json({ error: 'Not signed in. Open /admin/ and sign in through Cloudflare Access.' }, 401);
    if (!cfg.emails.includes(user.email)) return json({ error: `${user.email} is not allowed to edit this site.` }, 403);

    if (request.method === 'GET' && route === 'me') return json({ email: user.email });
    if (request.method === 'GET' && route === 'content') return json(await getContent(cfg));
    if (request.method === 'POST' && route === 'save') {
      // Same-origin only: Access cookies are sent cross-site in some cases, so also check Origin.
      const origin = request.headers.get('Origin');
      if (origin && origin !== new URL(request.url).origin) return json({ error: 'Bad origin.' }, 403);
      return json(await save(cfg, user, await request.json()));
    }
    return json({ error: 'Not found.' }, 404);
  } catch (err) {
    const status = err.status || 500;
    return json({ error: err.expose ? err.message : 'Something went wrong on the server.', detail: err.expose ? undefined : String(err.message || err).slice(0, 300) }, status);
  }
}

/* ---------- config ---------- */
function readConfig(env) {
  const need = ['GITHUB_TOKEN', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD', 'ADMIN_EMAILS'];
  if (need.some(k => !env[k] || !String(env[k]).trim())) return null;
  return {
    token: env.GITHUB_TOKEN.trim(),
    team: String(env.ACCESS_TEAM_DOMAIN).trim().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
    aud: String(env.ACCESS_AUD).trim(),
    emails: String(env.ADMIN_EMAILS).split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    repo: (env.GITHUB_REPO || 'jeffersonevansm/portfolio').trim(),
    branch: (env.GITHUB_BRANCH || 'main').trim(),
    githubApi: (env.GITHUB_API || 'https://api.github.com').replace(/\/+$/, ''),   // overridable for tests
    certsUrl: env.ACCESS_CERTS_URL || null                                            // overridable for tests
  };
}

/* ---------- Cloudflare Access JWT ---------- */
let jwksCache = { at: 0, keys: null, url: '' };

async function verifyAccess(request, cfg) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie(request, 'CF_Authorization');
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header, payload;
  try { header = JSON.parse(b64urlText(parts[0])); payload = JSON.parse(b64urlText(parts[1])); } catch { return null; }
  if (header.alg !== 'RS256' || !header.kid) return null;

  const certsUrl = cfg.certsUrl || `https://${cfg.team}/cdn-cgi/access/certs`;
  const keys = await getKeys(certsUrl);
  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) return null;

  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(cfg.aud)) return null;
  if (!payload.exp || payload.exp < now - 30) return null;
  if (payload.nbf && payload.nbf > now + 30) return null;
  if (!cfg.certsUrl && payload.iss !== `https://${cfg.team}`) return null;
  if (!payload.email) return null;
  return { email: String(payload.email).toLowerCase() };
}

async function getKeys(url) {
  if (jwksCache.keys && jwksCache.url === url && Date.now() - jwksCache.at < 10 * 60 * 1000) return jwksCache.keys;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Could not load Access certificates');
  const body = await r.json();
  jwksCache = { at: Date.now(), keys: body.keys || [], url };
  return jwksCache.keys;
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

async function save(cfg, user, body) {
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
  const message = `${summary}\n\nEdited in the portfolio admin by ${user.email}.`;
  const commit = await gh(cfg, '/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }) });

  // force:false → GitHub rejects if the branch moved in the meantime.
  await gh(cfg, `/git/refs/heads/${encodeURIComponent(cfg.branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });

  return { ok: true, commit: commit.sha, blobSha: contentBlob.sha, url: `https://github.com/${cfg.repo}/commit/${commit.sha}`, uploaded: uploads.map(u => u.path) };
}

/* ---------- helpers ---------- */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}
function cookie(request, name) {
  const c = request.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function b64urlBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlText(s) { return new TextDecoder().decode(b64urlBytes(s)); }
function b64ToText(b64) {
  const bin = atob(String(b64).replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

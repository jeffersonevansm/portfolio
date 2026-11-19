/* Cloudflare Worker for jeffersonem.com.
   Static files are served straight from the repo (see wrangler.jsonc → assets).
   Only /api/* reaches this code; that's the admin API used by /admin/. */
import { handleAdmin } from './admin-api.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) return handleAdmin(request, env);
    return env.ASSETS.fetch(request);
  }
};

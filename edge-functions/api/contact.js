// edge-functions/api/contact.js
// EdgeOne Makers — Edge Function. Route: /api/contact (POST) -> Lark custom bot.
//
// SECURITY MODEL:
//  - Lark webhook URL lives ONLY in EdgeOne server-side env vars. NEVER in the repo.
//  - Browser only calls same-origin /api/contact; this function is the sole thing talking to Lark.
//  - Abuse hardening: per-IP rate limit, payload cap, honeypot, field validation, length caps.
//
// Env vars (Makers dashboard -> Project Settings -> Environment Variables):
//   LARK_WEBHOOK_URL  (required) the bot webhook URL
//   LARK_SIGN_SECRET  (optional) bot signing secret

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(code, obj) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...corsHeaders() }
  });
}

// ---- per-IP rate limit (in-memory, per edge isolate) ----
const RATE = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 6;
function rateLimited(ip) {
  const now = Date.now();
  const rec = RATE.get(ip);
  if (!rec || now - rec.ts > WINDOW_MS) { RATE.set(ip, { count: 1, ts: now }); return false; }
  rec.count++;
  if (rec.count > MAX_PER_WINDOW) return true;
  if (RATE.size > 5000) {
    for (const [k, v] of RATE) { if (now - v.ts > WINDOW_MS) RATE.delete(k); }
  }
  return false;
}
function clientIp(request) {
  return request.headers.get('cf-connecting-ip')
    || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

// ---- Lark signature (Web Crypto) ----
async function larkSignature(secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `${timestamp}\n${secret}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(stringToSign));
  let bin = '';
  const bytes = new Uint8Array(sigBuf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { timestamp: String(timestamp), sign: btoa(bin) };
}

function readEnv(env, keys) {
  if (!env || typeof env !== 'object') return '';
  for (const k of keys) {
    if (env[k] && String(env[k]).trim()) return String(env[k]).trim();
  }
  return '';
}

async function postLark(url, body, secret) {
  if (secret) {
    try { const sig = await larkSignature(secret); body.timestamp = sig.timestamp; body.sign = sig.sign; } catch (_) {}
  }
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const respText = await r.text();
    let code = null;
    try { code = JSON.parse(respText).code; } catch (_) {}
    return { delivered: code === 0, lark_code: code, http: r.status };
  } catch (e) {
    return { delivered: false, error: 'fetch_error' };
  }
}

async function sendLark(env, p) {
  const url = readEnv(env, ['LARK_WEBHOOK_URL', 'LARK_WEBHOOK']);
  if (!url) {
    console.warn('[contact] no Lark webhook configured');
    return { delivered: false, reason: 'no_webhook' };
  }

  // Build rich message
  const sourceLabel = { damen: 'DAMEN Xplorer', customize: '定制改造', survey: '调研问卷', other: '其他' };
  const source = sourceLabel[p.source] || p.source || '网站';

  const text =
    `🛥️ [新客户咨询 · ${source}]\n` +
    `━━━━━━━━━━━━━━━\n` +
    `姓名：${p.name}\n` +
    `联系方式：${p.phone}\n` +
    `邮箱：${p.email || '(未提供)'}\n` +
    `意向船型：${p.model || '未指定'}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `需求备注：${p.notes || '(无)'}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

  const body = { msg_type: 'text', content: { text } };

  const secret = readEnv(env, ['LARK_SIGN_SECRET', 'LARK_SECRET', 'LARK_WEBHOOK_SECRET']);
  let res = await postLark(url, body, secret);

  // Fallback: if signature fails but bot doesn't enforce signing, retry without
  if (secret && res.lark_code === 19021) {
    const retry = await postLark(url, { msg_type: 'text', content: { text } }, null);
    if (retry.delivered) return retry;
  }
  return res;
}

// ---- normalise EdgeOne Makers invocation ----
function resolveContext(args) {
  const a = args[0], b = args[1];
  if (a && a.request) return { request: a.request, env: a.env || {} };
  return { request: a, env: (b && typeof b === 'object' && typeof b.text !== 'function') ? b : {} };
}
function getEnv(args) {
  try { if (typeof env !== 'undefined' && env && typeof env === 'object') return env; } catch (_) {}
  const a = args[0];
  if (a && a.env && typeof a.env === 'object') return a.env;
  const b = args[1];
  if (b && typeof b === 'object' && typeof b.text !== 'function' && !(typeof Request !== 'undefined' && b instanceof Request)) return b;
  try { if (typeof process !== 'undefined' && process.env) return process.env; } catch (_) {}
  return {};
}

async function onRequest(...args) {
  const { request } = resolveContext(args);
  const env = getEnv(args);
  const method = (request && request.method) || 'GET';

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  // 1) per-IP rate limit
  if (rateLimited(clientIp(request))) {
    return json(429, { ok: false, error: '请求过于频繁，请稍后再试。' });
  }

  // 2) read body with hard size cap
  let raw = '';
  try {
    if (!request || typeof request.text !== 'function') throw new Error('bad request');
    raw = await request.text();
  } catch (_) { return json(400, { ok: false, error: 'Invalid request' }); }
  if (raw.length > 20000) return json(413, { ok: false, error: 'Payload too large' });

  // 3) parse JSON
  let data;
  try { data = JSON.parse(raw); } catch (_) { return json(400, { ok: false, error: 'Invalid request' }); }
  if (!data || typeof data !== 'object') return json(400, { ok: false, error: 'Invalid request' });

  // 4) honeypot — bots fill hidden fields; silently accept so they don't learn
  if (data.website || data.url || data._hp) return json(200, { ok: true });

  // 5) field validation + length caps
  const get = (k, max) => (typeof data[k] === 'string' ? data[k].slice(0, max) : (data[k] == null ? '' : String(data[k]).slice(0, max)));
  const p = {
    source: get('source', 20),
    name: get('name', 80),
    phone: get('phone', 60),
    email: get('email', 120),
    model: get('model', 60),
    notes: get('notes', 2000)
  };
  if (!p.name.trim() || !p.phone.trim()) {
    return json(400, { ok: false, error: '请填写姓名和联系方式' });
  }

  // 6) deliver to Lark
  try {
    const res = await sendLark(env, p);
    if (!res.delivered) {
      console.warn('[contact] Lark delivery failed:', res.reason || res.lark_code);
      // Return specific code so frontend can fall back to mailto
      return json(502, { ok: false, error: '推送失败', fallback: true });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('[contact] delivery error', err);
    return json(502, { ok: false, error: '推送失败', fallback: true });
  }
}

export default onRequest;
export { onRequest };

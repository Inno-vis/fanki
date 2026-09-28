import { API_URL, LEARNER_TOKEN } from './config';

export class ApiError extends Error {
  constructor(public code: string, message?: string) {
    super(message || code);
  }
}

type Json = Record<string, unknown> & { ok?: boolean; error?: string; message?: string };

// Google occasionally serves an HTML error page or drops a POST body on its redirect
// (mostly right after a deploy). Every action is idempotent, so we simply retry.
const RETRYABLE = new Set(['no_action', 'busy', 'bad_response', 'network']);

async function once(init: { method: 'GET'; query: string } | { method: 'POST'; body: string }): Promise<Json> {
  let res: Response;
  try {
    res =
      init.method === 'GET'
        ? await fetch(`${API_URL}?${init.query}`, { cache: 'no-store' })
        : // text/plain + no custom headers = "simple" request, so no CORS preflight.
          await fetch(API_URL, { method: 'POST', body: init.body, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  } catch (e) {
    throw new ApiError('network', String(e));
  }
  const text = await res.text();
  let json: Json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError('bad_response', `HTTP ${res.status}`);
  }
  if (!json.ok) throw new ApiError(json.error || 'server_error', json.message);
  return json;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i) await new Promise((r) => setTimeout(r, 600 * i));
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!(e instanceof ApiError) || !RETRYABLE.has(e.code)) throw e;
      if (e.code === 'network' && typeof navigator !== 'undefined' && !navigator.onLine) throw e;
    }
  }
  throw last;
}

export function apiGet<T = Json>(action: string, params: Record<string, string> = {}): Promise<T> {
  const q = new URLSearchParams({ action, token: LEARNER_TOKEN, ...params }).toString();
  return withRetry(() => once({ method: 'GET', query: q })) as Promise<T>;
}

export function apiPost<T = Json>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const body = JSON.stringify({ ...payload, action, token: LEARNER_TOKEN });
  return withRetry(() => once({ method: 'POST', body })) as Promise<T>;
}

export function ping(): Promise<{ env: string }> {
  return withRetry(() => once({ method: 'GET', query: 'action=ping' })) as Promise<{ env: string }>;
}

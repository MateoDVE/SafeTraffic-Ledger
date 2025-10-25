// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/**
 * Usa backend real si hay NEXT_PUBLIC_API_BASE.
 * Si NO hay backend, usa el endpoint local /api/feed (mock).
 */
export async function fetchFeed() {
  const base = API_BASE && API_BASE.trim().length > 0 ? API_BASE.replace(/\/$/, '') : '';
  const url = base ? `${base}/feed` : '/api/feed';

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Feed error: ${res.status} ${res.statusText}`);
  return res.json();
}

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { AnalyticsMetric, AnalyticsPayload, AnalyticsPoint } from '../../lib/types';

export const prerender = false;

const DAY = 24 * 60 * 60 * 1000;
const JAKARTA_OFFSET = 7 * 60 * 60 * 1000;

interface UmamiPoint {
  x: string;
  y: number;
}

function json(payload: AnalyticsPayload | { error: string }, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}

function empty(days: number, configured: boolean, error?: string): AnalyticsPayload {
  return {
    configured,
    days,
    visitors: 0,
    pageviews: 0,
    series: [],
    topPages: [],
    sources: [],
    error,
  };
}

function startOfToday(now: number): number {
  const shifted = new Date(now + JAKARTA_OFFSET);
  const midnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );
  return midnight - JAKARTA_OFFSET;
}

function normaliseMetrics(rows: UmamiPoint[] | undefined, limit = 5): AnalyticsMetric[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row.x === 'string')
    .slice(0, limit)
    .map((row) => ({ label: row.x || 'Tanpa label', value: Number(row.y) || 0 }));
}

async function authorised(request: Request, url: string, key: string): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return false;
  const token = header.slice(7).trim();
  if (!token) return false;

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const daysParam = Number(url.searchParams.get('days') ?? '7');
  const days = daysParam === 1 || daysParam === 30 ? daysParam : 7;

  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseKey =
    process.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  const umamiKey = process.env.UMAMI_API_KEY ?? '';
  const websiteId = process.env.UMAMI_WEBSITE_ID ?? '';
  const baseUrl = (process.env.UMAMI_API_URL ?? 'https://api.umami.is').replace(/\/$/, '');

  const analyticsConfigured = Boolean(umamiKey && websiteId);
  if (!analyticsConfigured) {
    return json(empty(days, false));
  }

  if (!supabaseUrl || !supabaseKey) {
    return json(
      empty(
        days,
        true,
        'Supabase belum dikonfigurasi. Analitik tidak dibuka tanpa pemeriksaan sesi pemilik.'
      )
    );
  }

  const allowed = await authorised(request, supabaseUrl, supabaseKey);
  if (!allowed) {
    return json({ error: 'Sesi tidak valid. Masuk kembali untuk membaca analitik.' }, 401);
  }

  const now = Date.now();
  const startAt = days === 1 ? startOfToday(now) : startOfToday(now) - (days - 1) * DAY;
  const unit = days === 1 ? 'hour' : 'day';
  const query = `startAt=${startAt}&endAt=${now}`;
  const headers = { 'x-umami-api-key': umamiKey, Accept: 'application/json' };

  try {
    const [statsResponse, seriesResponse, pageResponse, sourceResponse] = await Promise.all([
      fetch(`${baseUrl}/v1/websites/${websiteId}/stats?${query}`, {
        headers,
        signal: AbortSignal.timeout(9000),
      }),
      fetch(
        `${baseUrl}/v1/websites/${websiteId}/pageviews?${query}&unit=${unit}&timezone=Asia%2FJakarta`,
        { headers, signal: AbortSignal.timeout(9000) }
      ),
      fetch(`${baseUrl}/v1/websites/${websiteId}/metrics?${query}&type=url&limit=5`, {
        headers,
        signal: AbortSignal.timeout(9000),
      }),
      fetch(`${baseUrl}/v1/websites/${websiteId}/metrics?${query}&type=referrer&limit=5`, {
        headers,
        signal: AbortSignal.timeout(9000),
      }),
    ]);

    if (!statsResponse.ok || !seriesResponse.ok) {
      return json(
        empty(
          days,
          true,
          statsResponse.status === 401 || statsResponse.status === 403
            ? 'Kunci API Umami ditolak. Periksa UMAMI_API_KEY.'
            : 'Sumber analitik tidak merespons. Coba lagi beberapa saat lagi.'
        )
      );
    }

    const stats = (await statsResponse.json()) as {
      visitors?: number;
      pageviews?: number;
    };
    const seriesRaw = (await seriesResponse.json()) as {
      pageviews?: UmamiPoint[];
      sessions?: UmamiPoint[];
    };

    const sessions = new Map(
      (seriesRaw.sessions ?? []).map((point) => [String(point.x), Number(point.y) || 0])
    );
    const series: AnalyticsPoint[] = (seriesRaw.pageviews ?? []).map((point) => ({
      date: String(point.x),
      visitors: sessions.get(String(point.x)) ?? 0,
      pageviews: Number(point.y) || 0,
    }));

    const topPages = pageResponse.ok
      ? normaliseMetrics((await pageResponse.json()) as UmamiPoint[])
      : [];
    const sources = sourceResponse.ok
      ? normaliseMetrics((await sourceResponse.json()) as UmamiPoint[])
      : [];

    return json({
      configured: true,
      days,
      visitors: Number(stats.visitors) || 0,
      pageviews: Number(stats.pageviews) || 0,
      series,
      topPages,
      sources,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'TimeoutError'
        ? 'Sumber analitik terlalu lama merespons.'
        : 'Sumber analitik tidak bisa dibaca. Periksa kunci dan alamat API Umami.';
    return json(empty(days, true, message));
  }
};

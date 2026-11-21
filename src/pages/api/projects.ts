import type { APIRoute } from 'astro';

export const prerender = false;

const CATEGORY_LABELS: Record<string, string> = {
  residensial: 'Residensial',
  komersial: 'Komersial',
  furnitur: 'Furnitur',
};

interface Cover {
  src?: unknown;
  width?: unknown;
  height?: unknown;
  alt?: unknown;
}

interface Row {
  id?: unknown;
  title?: unknown;
  category?: unknown;
  cover?: Cover | null;
  sort_order?: unknown;
}

function json(body: unknown, status: number, cacheControl: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}

function baseUrl(value: string) {
  return value.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
}

export const GET: APIRoute = async () => {
  const rawUrl =
    import.meta.env.PUBLIC_SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.SUPABASE_URL ??
    process.env.SUPABASE_URL;
  const key =
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!rawUrl || !key) {
    return json({ configured: false, projects: [] }, 200, 'no-store');
  }

  const endpoint =
    `${baseUrl(rawUrl)}/rest/v1/projects` +
    '?select=id,title,category,cover,sort_order' +
    '&status=eq.published' +
    '&order=sort_order.asc,title.asc';

  try {
    const response = await fetch(endpoint, {
      headers: { apikey: key, Accept: 'application/json' },
    });

    if (!response.ok) {
      return json({ configured: true, projects: [], error: `supabase_${response.status}` }, 502, 'no-store');
    }

    const rows = (await response.json()) as Row[];
    const projects = rows.flatMap((row) => {
      const cover = row.cover;
      const title = typeof row.title === 'string' ? row.title : '';
      const category = typeof row.category === 'string' ? row.category : '';

      if (!cover || typeof cover.src !== 'string' || !cover.src || !title || !category) {
        return [];
      }

      return [
        {
          id: typeof row.id === 'string' ? row.id : '',
          title,
          category,
          categoryLabel: CATEGORY_LABELS[category] ?? category,
          cover: {
            src: cover.src,
            width: typeof cover.width === 'number' ? cover.width : 0,
            height: typeof cover.height === 'number' ? cover.height : 0,
            alt: typeof cover.alt === 'string' ? cover.alt : title,
          },
        },
      ];
    });

    return json(
      { configured: true, projects },
      200,
      'public, s-maxage=30, stale-while-revalidate=120'
    );
  } catch {
    return json({ configured: true, projects: [], error: 'unreachable' }, 502, 'no-store');
  }
};

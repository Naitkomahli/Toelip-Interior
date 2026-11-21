import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const url =
    import.meta.env.PUBLIC_SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.SUPABASE_URL ??
    process.env.SUPABASE_URL;
  const key =
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;
  const supabase = Boolean(url && key);
  const analytics = Boolean(
    (import.meta.env.UMAMI_API_KEY ?? process.env.UMAMI_API_KEY) &&
      (import.meta.env.UMAMI_WEBSITE_ID ?? process.env.UMAMI_WEBSITE_ID)
  );

  return new Response(JSON.stringify({ supabase, analytics }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};

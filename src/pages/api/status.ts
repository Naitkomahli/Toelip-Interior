import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const supabase = Boolean(
    (process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
      (process.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)
  );
  const analytics = Boolean(process.env.UMAMI_API_KEY && process.env.UMAMI_WEBSITE_ID);

  return new Response(JSON.stringify({ supabase, analytics }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};

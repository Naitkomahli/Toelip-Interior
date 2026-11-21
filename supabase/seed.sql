-- 12 karya awal Toelip Interior.
-- Buka Supabase, SQL Editor, tempel seluruh file ini, lalu Run.
-- Aman dijalankan berulang: id tetap, jadi baris yang sudah ada dilewati.
-- Urutan dihitung dari karya yang sudah ada, jadi karya baru Anda tetap di atas.

with seed (ord, id, title, category, year, location, description, cover, gallery) as (
  values
    (1, 'a0000000-0000-4000-8000-000000000001'::uuid, 'Kamar tidur hijau', 'residensial',
     null::text, null::text, null::text,
     '{"src": "/assets/img/opt/p1-900.webp", "width": 900, "height": 900, "alt": "Kamar tidur dengan dinding hijau, tanaman, dan lampu rotan"}'::jsonb,
     '[]'::jsonb),

    (2, 'a0000000-0000-4000-8000-000000000002'::uuid, 'Ruang keluarga, Semarang', 'residensial',
     null::text, 'Semarang'::text, null::text,
     '{"src": "/assets/img/opt/p2-700.webp", "width": 700, "height": 466, "alt": "Ruang keluarga dengan sofa, jendela besar, dan lantai terang"}'::jsonb,
     '[]'::jsonb),

    (3, 'a0000000-0000-4000-8000-000000000003'::uuid, 'Ruang keluarga hangat', 'residensial',
     null::text, null::text, null::text,
     '{"src": "/assets/img/opt/p7-700.webp", "width": 700, "height": 512, "alt": "Ruang keluarga dengan sofa krem, anyaman, dan lantai kayu"}'::jsonb,
     '[]'::jsonb),

    (4, 'a0000000-0000-4000-8000-000000000004'::uuid, 'Rumah, Semarang', 'residensial',
     null::text, 'Semarang'::text, null::text,
     '{"src": "/assets/img/opt/p3-900.webp", "width": 900, "height": 676, "alt": "Ruang tamu rumah minimalis di Semarang"}'::jsonb,
     '[]'::jsonb),

    (5, 'a0000000-0000-4000-8000-000000000005'::uuid, 'Kantor, Semarang', 'komersial',
     null::text, 'Semarang'::text, null::text,
     '{"src": "/assets/img/opt/p4-700.webp", "width": 700, "height": 468, "alt": "Koridor kantor dengan partisi kaca dan lampu gantung"}'::jsonb,
     '[]'::jsonb),

    (6, 'a0000000-0000-4000-8000-000000000006'::uuid, 'Dapur dengan rak terbuka', 'furnitur',
     null::text, null::text, null::text,
     '{"src": "/assets/img/opt/p8-900.webp", "width": 900, "height": 600, "alt": "Dapur putih dengan rak kayu terbuka dan jendela besar"}'::jsonb,
     '[]'::jsonb),

    (7, 'a0000000-0000-4000-8000-000000000007'::uuid, 'Kamar tidur, Semarang', 'residensial',
     null::text, 'Semarang'::text, null::text,
     '{"src": "/assets/img/opt/p9-900.webp", "width": 900, "height": 900, "alt": "Kamar tidur dengan dinding gelap dan cahaya dari jendela"}'::jsonb,
     '[]'::jsonb),

    (8, 'a0000000-0000-4000-8000-000000000008'::uuid, 'Kafe, Semarang', 'komersial',
     null::text, 'Semarang'::text, null::text,
     '{"src": "/assets/img/opt/p5-900.webp", "width": 900, "height": 616, "alt": "Kafe dengan meja kayu, kursi rotan, dan menu di dinding"}'::jsonb,
     '[]'::jsonb),

    (9, 'a0000000-0000-4000-8000-000000000009'::uuid, 'Kursi kayu kustom', 'furnitur',
     null::text, null::text, null::text,
     '{"src": "/assets/img/opt/p10-700.webp", "width": 700, "height": 1052, "alt": "Kursi putih dengan rangka kayu dan bantalan empuk"}'::jsonb,
     '[]'::jsonb),

    (10, 'a0000000-0000-4000-8000-000000000010'::uuid, 'Sudut ruang tamu', 'residensial',
     null::text, null::text, null::text,
     '{"src": "/assets/img/opt/p11-700.webp", "width": 700, "height": 1244, "alt": "Sudut ruang tamu dengan kursi oranye, tanaman, dan sideboard"}'::jsonb,
     '[]'::jsonb),

    (11, 'a0000000-0000-4000-8000-000000000011'::uuid, 'Toko pakaian, Semarang', 'komersial',
     null::text, 'Semarang'::text, null::text,
     '{"src": "/assets/img/opt/p6-700.webp", "width": 700, "height": 468, "alt": "Toko pakaian dengan rak display dan meja kayu"}'::jsonb,
     '[]'::jsonb),

    (12, 'a0000000-0000-4000-8000-000000000012'::uuid, 'Rak built-in', 'furnitur',
     null::text, null::text, null::text,
     '{"src": "/assets/img/opt/cta-700.webp", "width": 700, "height": 466, "alt": "Ruang keluarga dengan rak built-in gelap dan TV"}'::jsonb,
     '[]'::jsonb)
),
base as (
  select coalesce(max(sort_order), 0) as base_order from public.projects
)
insert into public.projects
  (id, title, category, year, location, description, cover, gallery, status, sort_order)
select
  seed.id, seed.title, seed.category, seed.year, seed.location, seed.description,
  seed.cover, seed.gallery, 'published', base.base_order + seed.ord
from seed cross join base
on conflict (id) do nothing;

select count(*) as total_karya from public.projects;

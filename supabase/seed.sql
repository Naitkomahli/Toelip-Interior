-- Seed 12 karya awal Toelip Interior.
-- Jalankan sekali di Supabase: SQL Editor, tempel seluruh isi file ini, Run.
-- Aman dijalankan berulang: id tetap, jadi baris yang sudah ada dilewati.

insert into public.projects (id, title, category, year, location, description, cover, gallery, status, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'Kamar tidur hijau', 'residensial', null, null, null,
   '{"src": "/assets/img/opt/p1-900.webp", "width": 900, "height": 900, "alt": "Kamar tidur dengan dinding hijau, tanaman, dan lampu rotan"}'::jsonb,
   '[]'::jsonb, 'published', 1),

  ('a0000000-0000-4000-8000-000000000002', 'Ruang keluarga, Semarang', 'residensial', null, 'Semarang', null,
   '{"src": "/assets/img/opt/p2-700.webp", "width": 700, "height": 466, "alt": "Ruang keluarga dengan sofa, jendela besar, dan lantai terang"}'::jsonb,
   '[]'::jsonb, 'published', 2),

  ('a0000000-0000-4000-8000-000000000003', 'Ruang keluarga hangat', 'residensial', null, null, null,
   '{"src": "/assets/img/opt/p7-700.webp", "width": 700, "height": 512, "alt": "Ruang keluarga dengan sofa krem, anyaman, dan lantai kayu"}'::jsonb,
   '[]'::jsonb, 'published', 3),

  ('a0000000-0000-4000-8000-000000000004', 'Rumah, Semarang', 'residensial', null, 'Semarang', null,
   '{"src": "/assets/img/opt/p3-900.webp", "width": 900, "height": 676, "alt": "Ruang tamu rumah minimalis di Semarang"}'::jsonb,
   '[]'::jsonb, 'published', 4),

  ('a0000000-0000-4000-8000-000000000005', 'Kantor, Semarang', 'komersial', null, 'Semarang', null,
   '{"src": "/assets/img/opt/p4-700.webp", "width": 700, "height": 468, "alt": "Koridor kantor dengan partisi kaca dan lampu gantung"}'::jsonb,
   '[]'::jsonb, 'published', 5),

  ('a0000000-0000-4000-8000-000000000006', 'Dapur dengan rak terbuka', 'furnitur', null, null, null,
   '{"src": "/assets/img/opt/p8-900.webp", "width": 900, "height": 600, "alt": "Dapur putih dengan rak kayu terbuka dan jendela besar"}'::jsonb,
   '[]'::jsonb, 'published', 6),

  ('a0000000-0000-4000-8000-000000000007', 'Kamar tidur, Semarang', 'residensial', null, 'Semarang', null,
   '{"src": "/assets/img/opt/p9-900.webp", "width": 900, "height": 900, "alt": "Kamar tidur dengan dinding gelap dan cahaya dari jendela"}'::jsonb,
   '[]'::jsonb, 'published', 7),

  ('a0000000-0000-4000-8000-000000000008', 'Kafe, Semarang', 'komersial', null, 'Semarang', null,
   '{"src": "/assets/img/opt/p5-900.webp", "width": 900, "height": 616, "alt": "Kafe dengan meja kayu, kursi rotan, dan menu di dinding"}'::jsonb,
   '[]'::jsonb, 'published', 8),

  ('a0000000-0000-4000-8000-000000000009', 'Kursi kayu kustom', 'furnitur', null, null, null,
   '{"src": "/assets/img/opt/p10-700.webp", "width": 700, "height": 1052, "alt": "Kursi putih dengan rangka kayu dan bantalan empuk"}'::jsonb,
   '[]'::jsonb, 'published', 9),

  ('a0000000-0000-4000-8000-000000000010', 'Sudut ruang tamu', 'residensial', null, null, null,
   '{"src": "/assets/img/opt/p11-700.webp", "width": 700, "height": 1244, "alt": "Sudut ruang tamu dengan kursi oranye, tanaman, dan sideboard"}'::jsonb,
   '[]'::jsonb, 'published', 10),

  ('a0000000-0000-4000-8000-000000000011', 'Toko pakaian, Semarang', 'komersial', null, 'Semarang', null,
   '{"src": "/assets/img/opt/p6-700.webp", "width": 700, "height": 468, "alt": "Toko pakaian dengan rak display dan meja kayu"}'::jsonb,
   '[]'::jsonb, 'published', 11),

  ('a0000000-0000-4000-8000-000000000012', 'Rak built-in', 'furnitur', null, null, null,
   '{"src": "/assets/img/opt/cta-700.webp", "width": 700, "height": 466, "alt": "Ruang keluarga dengan rak built-in gelap dan TV"}'::jsonb,
   '[]'::jsonb, 'published', 12)
on conflict (id) do nothing;

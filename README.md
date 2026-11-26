# Toelip Interior

Company profile + etalase portofolio untuk studio desain interior dan furnitur kustom di Semarang. Situs publik tetap statis dan cepat; pemilik mengelola karya lewat meja kerja admin di `/admin`.

- Produksi: https://toelip-interior.vercel.app
- Admin: https://toelip-interior.vercel.app/admin
- Dokumen perencanaan: `PRD.md`

## Masalah & Solusi

Sebelumnya, menambah karya berarti mengedit HTML lalu deploy ulang, dan pemilik tidak punya tempat untuk mengelola portofolio.

- Karya disimpan sekali di Supabase Postgres dan dipakai admin maupun halaman publik.
- Halaman publik membaca data lewat endpoint `/api/projects`; HTML awal tetap berisi karya statis sebagai cadangan untuk SEO dan pengunjung tanpa JavaScript.
- Foto dikompresi di browser sebelum diunggah: JPG/PNG/WebP maksimal 15 MB, sisi terpanjang 1400px, dikodekan ulang ke WebP kualitas 0.82.
- Publik hanya bisa membaca karya berstatus `published` lewat Row Level Security (RLS) di database.

## Fitur

### Situs publik

- Lima halaman: beranda, tentang, layanan, portofolio, kontak.
- Filter kategori, lightbox dengan panah dan swipe, animasi reveal.
- Form brief WhatsApp, marquee layanan, SEO lokal (`sitemap.xml`, `robots.txt`).
- `/api/projects` hanya mengirim kolom publik dan karya terbit; cache edge 30 detik dengan stale-while-revalidate 120 detik.

### Meja kerja admin

| Rute | Isi |
|---|---|
| `/admin` | Ringkasan jumlah karya, terbit, draf, foto |
| `/admin/portfolio` | Daftar karya, filter status, urutan, aksi |
| `/admin/portfolio?edit=id` | Editor karya dan galeri |
| `/admin/analitik` | Statistik Umami |
| `/admin/koneksi` | Status Supabase, SQL setup, ekspor demo |
| `/admin/akun` | Ganti kata sandi tanpa email |

- Login memakai Supabase Auth dengan kata sandi, sesi diperbarui otomatis.
- Mode otomatis: Supabase saat env tersedia, IndexedDB demo saat tidak ada.
- Status terbit memakai kata, bukan hanya warna. Target sentuh minimal 44px dan fokus keyboard terlihat.

## Tech Stack

| Teknologi | Fungsi |
|---|---|
| Astro 7 (`output: 'static'`) | Halaman statis dan route dinamis |
| @astrojs/vercel | Route `prerender = false` sebagai serverless function |
| React 19 | Pulau admin saja |
| TypeScript (strict) | Tipe data karya dan repository |
| Supabase | Postgres, Auth, Storage, RLS |
| Vercel | Satu deployment untuk situs dan API |

## Menjalankan

Butuh Node.js dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:4321`. Perintah lain:

```bash
npm run build
npm run preview
```

Buat `.env` di root untuk memakai Supabase sungguhan:

```env
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
```

Tanpa env, admin memakai mode demo berbasis IndexedDB. Pakai **publishable key** di browser; jangan pernah memasukkan secret key ke bundle. Variabel opsional untuk analitik: `UMAMI_API_KEY` dan `UMAMI_WEBSITE_ID`.

SQL setup tabel, RLS, dan bucket Storage tersedia di halaman `/admin/koneksi`.

## Struktur

```text
public/                 # Halaman statis, CSS, JS, gambar, sitemap
src/
  components/admin/     # UI admin (React)
  layouts/              # AdminLayout.astro
  lib/                  # Repository, Supabase, tipe, seed, image
  pages/
    admin/              # Rute /admin
    api/                # /api/projects, /api/status, /api/analytics
  styles/               # admin.css
astro.config.mjs
vercel.json
tsconfig.json
PRD.md
```

## Keamanan

- RLS di level database: publik hanya baca `published`; pengguna login bisa baca, tambah, ubah, hapus.
- Empat kebijakan Storage untuk bucket `portfolio`: baca publik, tulis hanya untuk pengguna login.
- Header dari `vercel.json`: `nosniff`, `strict-origin-when-cross-origin`, `SAMEORIGIN`, Permissions-Policy, dan `noindex, nofollow` untuk `/admin` beserta sub-routnya.

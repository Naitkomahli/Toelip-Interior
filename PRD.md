# PRD: Website Company Profile Toelip Interior

**Versi:** 1.0 (Static)
**Penyusun:** Tyan (Ilham Oktian Ramadhan)
**Status:** Draft

---

## 1. Ringkasan

Toelip Interior adalah studio jasa desain interior dan kontraktor furnitur kustom (design & build) di Kota Semarang, Jawa Tengah. Website ini berfungsi sebagai **company profile + etalase portofolio** yang mengubah pengunjung menjadi calon klien lewat WhatsApp.

**Pendekatan:** website static (HTML, CSS, sedikit vanilla JavaScript), tanpa backend dan database. Fokus pada kecepatan, kesederhanaan, dan tampilan modern minimalist.

## 2. Tujuan

- Membangun kredibilitas Toelip Interior secara online
- Menampilkan hasil karya (portofolio) dengan visual yang bersih
- Mengarahkan pengunjung ke kontak (WhatsApp) sebanyak mungkin
- Muncul di pencarian lokal ("jasa interior Semarang", "furnitur custom Semarang")

**Indikator keberhasilan**
- Skor Lighthouse Performance, SEO, Accessibility di atas 90
- Waktu muat halaman utama di bawah 2,5 detik (LCP) pada koneksi 4G
- Klik tombol WhatsApp menjadi konversi utama

## 3. Target Audiens

- Pemilik rumah dan apartemen di Semarang dan Jawa Tengah yang butuh desain atau renovasi interior
- Pemilik usaha (kafe, toko, kantor) yang butuh interior komersial
- Pencari furnitur kustom (lemari, kitchen set, dll.)
- Akses utama lewat **smartphone**, sehingga desain mobile-first

## 4. Ruang Lingkup

**Termasuk (in scope)**
- Halaman utama, Tentang, Layanan, Portofolio, Kontak
- Galeri portofolio dengan filter kategori
- Tombol WhatsApp dengan pesan otomatis
- Optimasi SEO lokal dan performa gambar

**Tidak termasuk (out of scope, versi ini)**
- Dashboard admin / CMS
- Database dan login
- Before-after slider interaktif (opsional di versi berikutnya)
- Blog, multi-bahasa, e-commerce

## 5. Sitemap

- **Beranda**: hero, ringkasan layanan, proyek pilihan, alasan memilih Toelip, CTA
- **Tentang**: profil studio, nilai, proses kerja
- **Layanan**: interior residensial, interior komersial, furnitur kustom
- **Portofolio**: grid proyek + filter kategori, detail proyek (lightbox atau halaman sederhana)
- **Kontak**: WhatsApp, Instagram, email, alamat/area layanan, peta

## 6. Kebutuhan Fungsional

| ID | Fitur | Deskripsi | Prioritas |
|----|-------|-----------|-----------|
| F1 | Navbar responsif | Menu sticky, hamburger di mobile | Tinggi |
| F2 | Hero section | Headline, subjudul, gambar besar, CTA "Konsultasi via WhatsApp" | Tinggi |
| F3 | Layanan | Tiga kartu layanan dengan ikon sederhana | Tinggi |
| F4 | Galeri portofolio | Grid gambar dengan filter kategori (JS ringan), lazy loading | Tinggi |
| F5 | Lightbox | Klik gambar untuk melihat ukuran besar | Sedang |
| F6 | Proses kerja | Langkah: konsultasi, desain, produksi, pemasangan | Sedang |
| F7 | Tombol WhatsApp | Link `wa.me` dengan pesan awal otomatis, floating button di mobile | Tinggi |
| F8 | Tautan sosial | Instagram dan email | Sedang |
| F9 | Peta lokasi | Embed Google Maps atau tautan ke Maps | Rendah |
| F10 | Footer | Kontak singkat, navigasi, hak cipta | Tinggi |

## 7. Kebutuhan Non-Fungsional

**Desain (modern minimalist)**
- Palet netral: putih/off-white, abu hangat, satu warna aksen (misalnya tone kayu atau hijau zaitun)
- Tipografi: satu font heading + satu font body (contoh: Playfair Display / DM Serif untuk heading, Inter untuk body)
- Banyak ruang kosong (whitespace), grid rapi, sudut halus
- Foto proyek sebagai elemen visual utama, sedikit dekorasi
- Animasi halus saja (fade-in saat scroll, hover lembut)

**Performa**
- Gambar format WebP, dengan atribut `width`/`height` dan `loading="lazy"`
- Ukuran gambar responsif (`srcset`)
- Tanpa framework berat; CSS dan JS dijaga kecil

**SEO lokal**
- Title dan meta description per halaman memuat kata kunci "Semarang"
- Heading terstruktur (satu H1 per halaman)
- Alt text deskriptif di semua gambar
- Structured data `LocalBusiness` (JSON-LD)
- `sitemap.xml` dan `robots.txt`
- Daftarkan di Google Business Profile dan Search Console

**Aksesibilitas dan kompatibilitas**
- Kontras warna memadai, navigasi keyboard, label yang jelas
- Berfungsi di Chrome, Safari, Firefox, Edge versi terbaru

## 8. Tech Stack

- **Frontend:** HTML5, CSS3 (CSS variables, Flexbox/Grid), JavaScript vanilla
- **Data portofolio:** ditulis langsung di HTML atau file `projects.json`
- **Hosting:** Netlify, Vercel, atau GitHub Pages (gratis, HTTPS)
- **Domain:** opsional (misalnya toelipinterior.com atau .id)
- **Analitik:** Google Analytics atau Plausible (opsional)

## 9. Struktur Folder

```
toelip-interior/
├── index.html
├── about.html
├── services.html
├── portfolio.html
├── contact.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
├── sitemap.xml
└── robots.txt
```

## 10. Konten yang Dibutuhkan dari Klien

- Logo (format PNG/SVG)
- Foto proyek berkualitas baik (minimal 12 proyek, dikelompokkan per kategori)
- Deskripsi singkat tiap proyek (lokasi, jenis, tahun)
- Teks profil studio dan daftar layanan
- Nomor WhatsApp, akun Instagram, alamat email, alamat/area layanan
- Testimoni klien (jika ada)

## 11. Rencana Pengerjaan

| Tahap | Aktivitas | Estimasi |
|-------|-----------|----------|
| 1 | Pengumpulan konten dan aset | 2-3 hari |
| 2 | Wireframe dan style guide (warna, font) | 1-2 hari |
| 3 | Pembuatan halaman dan komponen | 4-5 hari |
| 4 | Optimasi gambar, SEO, uji responsif | 2 hari |
| 5 | Deploy dan serah terima | 1 hari |

## 12. Risiko dan Mitigasi

- **Foto proyek kurang berkualitas:** minta foto asli resolusi tinggi, atur ulang crop dan kompresi
- **Konten terlambat:** buat template dengan placeholder, isi bertahap
- **Update portofolio manual:** dokumentasikan cara menambah proyek; pertimbangkan migrasi ke CMS di versi 2

## 13. Rencana Pengembangan (Versi 2)

- Before-after slider interaktif
- Form leads dengan penyimpanan data
- Dashboard admin / CMS ringan (Next.js + Sanity/Supabase)
- Halaman detail proyek dan blog tips interior
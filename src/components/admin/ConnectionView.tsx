import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { dataMode, repository } from '../../lib/repository';
import { Button, Notice, ToastRegion, cx, useToasts } from './ui';
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconDatabase,
  IconDownload,
  IconEye,
  IconImage,
  IconInfo,
  IconLock,
  IconRefresh,
} from './icons';

const SETUP_SQL = `-- Tabel karya
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  category text not null check (category in ('residensial','komersial','furnitur')),
  year text,
  location text,
  description text,
  cover jsonb not null,
  gallery jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('published','draft','archived')),
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Public reads published" on public.projects;
create policy "Public reads published"
  on public.projects for select
  using (status = 'published');

drop policy if exists "Owner reads all" on public.projects;
create policy "Owner reads all"
  on public.projects for select to authenticated
  using (true);

drop policy if exists "Owner inserts" on public.projects;
create policy "Owner inserts"
  on public.projects for insert to authenticated
  with check (true);

drop policy if exists "Owner updates" on public.projects;
create policy "Owner updates"
  on public.projects for update to authenticated
  using (true) with check (true);

drop policy if exists "Owner deletes" on public.projects;
create policy "Owner deletes"
  on public.projects for delete to authenticated
  using (true);

-- Bucket foto
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "Public reads photos" on storage.objects;
create policy "Public reads photos"
  on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "Owner uploads photos" on storage.objects;
create policy "Owner uploads photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio');

drop policy if exists "Owner updates photos" on storage.objects;
create policy "Owner updates photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio');

drop policy if exists "Owner deletes photos" on storage.objects;
create policy "Owner deletes photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio');`;

const UMAMI_SNIPPET = `<script defer src="https://cloud.umami.is/script.js"
  data-website-id="WEBSITE_ID"></script>`;

type Status = { supabase: boolean; analytics: boolean };

export default function ConnectionView({ session }: { session: Session | null }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState('');
  const timer = useRef<number | null>(null);
  const { toasts, push, dismiss } = useToasts();
  const demo = dataMode === 'demo';

  useEffect(() => {
    let active = true;
    setStatusError('');

    fetch('/api/status', { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('Status tidak bisa dibaca.');
        return response.json() as Promise<Status>;
      })
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatusError(error instanceof Error ? error.message : 'Status tidak bisa dibaca.');
        setStatus({ supabase: false, analytics: false });
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(''), 2200);
      push('Disalin ke papan klip.');
    } catch {
      push('Peramban menolak akses papan klip. Salin manual dari blok kode.', 'error');
    }
  }

  async function exportDemo() {
    try {
      const projects = await repository.list();
      const payload = {
        exportedAt: new Date().toISOString(),
        mode: dataMode,
        projects,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `toelip-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      push('Data portofolio diekspor sebagai JSON.');
    } catch (error) {
      push(error instanceof Error ? error.message : 'Data gagal diekspor.', 'error');
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Koneksi data</p>
          <h1 className="page-title">
            Dari meja kerja <em>ke situs.</em>
          </h1>
          <p className="page-lede">
            Status sambungan, variabel yang dibutuhkan, dan urutan pemasangan. Tidak ada kunci
            rahasia yang ditampilkan di halaman ini.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" icon={<IconDownload size={16} />} onClick={() => void exportDemo()}>
            Ekspor data
          </Button>
        </div>
      </header>

      {demo ? (
        <div className="page-notice">
          <Notice tone="demo" icon={<IconInfo size={18} />}>
            <strong>Meja kerja ini masih demo.</strong> Karya tersimpan di peramban dan belum masuk
            ke situs publik. Ekspor data sebelum berpindah perangkat atau membersihkan peramban.
          </Notice>
        </div>
      ) : null}

      <section className="panel" aria-labelledby="status-title">
        <div className="panel-head">
          <div>
            <h2 className="panel-title" id="status-title">
              Status sambungan
            </h2>
            <p className="panel-sub">
              {session?.user.email ? `Masuk sebagai ${session.user.email}` : 'Diperiksa dari server'}
            </p>
          </div>
          <Button
            variant="ghost"
            icon={<IconRefresh size={16} />}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Periksa ulang
          </Button>
        </div>
        <div className="panel-body">
          {statusError ? (
            <div className="page-notice" style={{ marginBottom: 12 }}>
              <Notice tone="error" icon={<IconAlert size={18} />}>
                {statusError}
              </Notice>
            </div>
          ) : null}

          <div className="status-list">
            <StatusRow
              icon={<IconDatabase size={16} />}
              title="Penyimpanan karya"
              body="Postgres Supabase, dibaca lewat anon key dan RLS."
              active={Boolean(status?.supabase)}
              pending={!status}
            />
            <StatusRow
              icon={<IconLock size={16} />}
              title="Login pemilik"
              body="Magic link Supabase. Hanya akun yang dibuat manual yang bisa masuk."
              active={Boolean(status?.supabase)}
              pending={!status}
            />
            <StatusRow
              icon={<IconImage size={16} />}
              title="Foto dan sampul"
              body="Supabase Storage, bucket portfolio, baca publik."
              active={Boolean(status?.supabase)}
              pending={!status}
            />
            <StatusRow
              icon={<IconEye size={16} />}
              title="Analitik pengunjung"
              body="Umami Cloud. Data dibaca lewat server setelah sesi diperiksa."
              active={Boolean(status?.analytics)}
              pending={!status}
            />
            <StatusRow
              icon={<IconDatabase size={16} />}
              title="Galeri publik"
              body="Masih memakai HTML statis. Pembacaan data publik adalah langkah terpisah."
              active={false}
              pending={false}
              staticLabel="Statis"
            />
          </div>
        </div>
      </section>

      <div className="connection-grid" style={{ marginTop: 26 }}>
        <section className="panel" aria-labelledby="supabase-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="supabase-title">
                Supabase
              </h2>
              <p className="panel-sub">Database, login, dan foto</p>
            </div>
            <span className={cx('chip', status?.supabase ? 'chip-green' : 'chip-neutral')}>
              {status?.supabase ? 'Aktif' : 'Menunggu'}
            </span>
          </div>
          <div className="panel-body">
            <div className="steps">
              <Step number={1} title="Buat project dan satu akun pemilik">
                <p>
                  Buat project di Supabase, lalu tambahkan satu user lewat Authentication, Users,
                  Add user. Login dashboard memakai magic link, bukan kata sandi.
                </p>
              </Step>
              <Step number={2} title="Jalankan skema dan kebijakan akses">
                <p>
                  Buka SQL Editor, tempel blok berikut, lalu jalankan. Skema ini membuat tabel
                  karya, RLS, dan bucket foto.
                </p>
                <CodeBlock
                  label="SQL"
                  code={SETUP_SQL}
                  copied={copied === 'sql'}
                  onCopy={() => void copy(SETUP_SQL, 'sql')}
                />
              </Step>
              <Step number={3} title="Tambahkan variabel di Vercel">
                <p>
                  Isi dua variabel publik di Project Settings, Environment Variables, lalu redeploy.
                  Anon key memang terlihat di peramban. RLS yang membatasi tulis.
                </p>
                <table className="env-table">
                  <tbody>
                    <tr>
                      <th scope="row">URL project</th>
                      <td>
                        <code>PUBLIC_SUPABASE_URL</code>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Anon key</th>
                      <td>
                        <code>PUBLIC_SUPABASE_ANON_KEY</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Step>
              <Step number={4} title="Masuk dan pindahkan karya">
                <p>
                  Setelah redeploy, halaman ini meminta email pemilik. Karya demo tidak terkirim
                  otomatis. Ekspor JSON, lalu masukkan ulang lewat editor atau impor ke database.
                </p>
              </Step>
            </div>
          </div>
        </section>

        <div className="stack">
          <section className="panel" aria-labelledby="umami-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="umami-title">
                  Umami
                </h2>
                <p className="panel-sub">Pengunjung harian, mingguan, bulanan</p>
              </div>
              <span className={cx('chip', status?.analytics ? 'chip-green' : 'chip-neutral')}>
                {status?.analytics ? 'Aktif' : 'Menunggu'}
              </span>
            </div>
            <div className="panel-body">
              <div className="steps">
                <Step number={1} title="Buat situs dan API key">
                  <p>
                    Tambahkan domain publik di Umami Cloud, salin website ID, lalu buat API key
                    untuk membaca statistik.
                  </p>
                </Step>
                <Step number={2} title="Isi variabel server">
                  <p>
                    Variabel ini tidak memakai awalan PUBLIC, jadi tidak ikut ke peramban.
                  </p>
                  <table className="env-table">
                    <tbody>
                      <tr>
                        <th scope="row">Website ID</th>
                        <td>
                          <code>UMAMI_WEBSITE_ID</code>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">API key</th>
                        <td>
                          <code>UMAMI_API_KEY</code>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Self-host, opsional</th>
                        <td>
                          <code>UMAMI_API_URL</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Step>
                <Step number={3} title="Pasang pelacak di halaman publik">
                  <p>
                    Tempel skrip berikut sebelum penutup head di lima halaman publik, ganti
                    WEBSITE_ID, lalu redeploy.
                  </p>
                  <CodeBlock
                    label="HTML"
                    code={UMAMI_SNIPPET}
                    copied={copied === 'umami'}
                    onCopy={() => void copy(UMAMI_SNIPPET, 'umami')}
                  />
                </Step>
                <Step number={4} title="Baca data di dashboard">
                  <p>
                    Analitik hanya dibuka jika Supabase juga aktif, karena endpoint memeriksa sesi
                    pemilik sebelum membaca API Umami.
                  </p>
                </Step>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="security-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="security-title">
                  Batas keamanan
                </h2>
                <p className="panel-sub">Yang perlu dijaga</p>
              </div>
              <IconLock size={18} />
            </div>
            <div className="panel-body">
              <ul className="security-list">
                <li>Jangan pernah menaruh service role key di variabel PUBLIC atau di kode browser.</li>
                <li>RLS wajib aktif. Tanpa RLS, anon key bisa membaca dan menulis seluruh tabel.</li>
                <li>Buat akun pemilik secara manual. Jangan buka pendaftaran publik.</li>
                <li>Mode demo bukan pengganti login. Siapa pun yang membuka halaman ini melihat data contoh.</li>
                <li>Gunakan HTTPS dan domain sendiri sebelum menyerahkan akses ke klien.</li>
              </ul>
              <p className="connection-note">
                <strong>Catatan.</strong> Dashboard ini menyimpan data demo di peramban. Tidak ada
                kunci Supabase atau Umami yang ditulis ke penyimpanan peramban.
              </p>
            </div>
          </section>
        </div>
      </div>

      <ToastRegion toasts={toasts} dismiss={dismiss} />
    </>
  );
}

function StatusRow({
  icon,
  title,
  body,
  active,
  pending,
  staticLabel,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  active: boolean;
  pending: boolean;
  staticLabel?: string;
}) {
  return (
    <div className="status-row">
      <span className={cx('status-icon', active && 'on')}>{icon}</span>
      <div className="status-copy">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      <span className={cx('chip', active ? 'chip-green' : 'chip-neutral')}>
        {pending ? 'Memeriksa' : active ? 'Aktif' : staticLabel ?? 'Menunggu'}
      </span>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="step">
      <span className="step-num" aria-hidden="true">
        {number}
      </span>
      <div className="step-body">
        <strong>
          <span className="sr-only">Langkah {number}. </span>
          {title}
        </strong>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({
  label,
  code,
  copied,
  onCopy,
}: {
  label: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="code-block">
      <div className="code-head">
        <span>{label}</span>
        <button className="code-copy" type="button" onClick={onCopy}>
          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

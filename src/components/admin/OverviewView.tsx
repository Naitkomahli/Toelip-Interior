import { useEffect, useState } from 'react';
import { dataMode, repository } from '../../lib/repository';
import { CATEGORY_LABELS, type Project } from '../../lib/types';
import { Notice, StatusPill, cx } from './ui';
import {
  IconAlert,
  IconArrowRight,
  IconDatabase,
  IconInfo,
  IconPlus,
} from './icons';

type LoadState =
  | { status: 'loading'; projects: Project[]; message: '' }
  | { status: 'ready'; projects: Project[]; message: '' }
  | { status: 'error'; projects: Project[]; message: string };

export default function OverviewView() {
  const [state, setState] = useState<LoadState>({ status: 'loading', projects: [], message: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', projects: [], message: '' });

    repository
      .list()
      .then((projects) => {
        if (active) setState({ status: 'ready', projects, message: '' });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: 'error',
          projects: [],
          message: error instanceof Error ? error.message : 'Karya gagal dimuat.',
        });
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const { projects } = state;
  const loading = state.status === 'loading';
  const published = projects.filter((project) => project.status === 'published').length;
  const drafts = projects.filter((project) => project.status === 'draft').length;
  const archived = projects.filter((project) => project.status === 'archived').length;
  const photos = projects.reduce(
    (total, project) => total + (project.cover ? 1 : 0) + project.gallery.length,
    0
  );
  const categories = new Set(projects.map((project) => project.category)).size;
  const recent = projects.slice(0, 4);
  const demo = dataMode === 'demo';

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Meja kerja</p>
          <h1 className="page-title">
            Karya, status, dan <em>langkah berikutnya.</em>
          </h1>
          <p className="page-lede">
            Satu tempat untuk merapikan portofolio, menyiapkan foto, dan membaca data pengunjung
            situs.
          </p>
        </div>
        <div className="page-actions">
          <a className="btn btn-accent" href="/admin/portfolio?new=1">
            <IconPlus size={17} /> Karya baru
          </a>
        </div>
      </header>

      {demo ? (
        <div className="page-notice">
          <Notice tone="demo" icon={<IconInfo size={18} />}>
            <strong>Mode demo.</strong> Perubahan tersimpan di peramban ini dan belum mengubah
            situs publik. Data asli tidak dikirim ke mana pun.{' '}
            <a className="text-link" href="/admin/koneksi">
              Siapkan Supabase
            </a>
          </Notice>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="page-notice">
          <Notice tone="error" icon={<IconAlert size={18} />}>
            {state.message}{' '}
            <button className="text-link" type="button" onClick={() => setAttempt((value) => value + 1)}>
              Coba lagi
            </button>
          </Notice>
        </div>
      ) : null}

      <div className="stat-strip" aria-label="Ringkasan portofolio">
        <div className="stat">
          <p className="stat-label">Total karya</p>
          {loading ? (
            <span className="skeleton-block" style={{ display: 'block', width: 54, height: 34 }} />
          ) : (
            <p className="stat-value">{projects.length}</p>
          )}
          <p className="stat-note">
            {loading ? 'Memuat data' : categories === 1 ? '1 kategori' : `${categories} kategori`}
          </p>
        </div>
        <div className="stat">
          <p className="stat-label">Terbit</p>
          {loading ? (
            <span className="skeleton-block" style={{ display: 'block', width: 54, height: 34 }} />
          ) : (
            <p className="stat-value">{published}</p>
          )}
          <p className="stat-note">Status siap tampil</p>
        </div>
        <div className="stat">
          <p className="stat-label">Draf</p>
          {loading ? (
            <span className="skeleton-block" style={{ display: 'block', width: 54, height: 34 }} />
          ) : (
            <p className="stat-value">{drafts}</p>
          )}
          <p className="stat-note">{archived} karya di arsip</p>
        </div>
        <div className="stat">
          <p className="stat-label">Foto</p>
          {loading ? (
            <span className="skeleton-block" style={{ display: 'block', width: 54, height: 34 }} />
          ) : (
            <p className="stat-value">{photos}</p>
          )}
          <p className="stat-note">Sampul dan galeri</p>
        </div>
      </div>

      <div className="overview-grid">
        <section className="panel" aria-labelledby="recent-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="recent-title">
                Urutan tampil
              </h2>
              <p className="panel-sub">Karya paling atas di galeri publik</p>
            </div>
            <a className="text-link" href="/admin/portfolio">
              Kelola semua <IconArrowRight size={15} />
            </a>
          </div>
          <div className="panel-body flush">
            {loading ? (
              <div className="work-list" aria-busy="true">
                {[0, 1, 2, 3].map((item) => (
                  <div className="work-row" key={item}>
                    <span className="skeleton-block work-thumb" />
                    <div className="work-copy">
                      <span className="skeleton-block" style={{ display: 'block', width: '48%', height: 12 }} />
                      <span
                        className="skeleton-block"
                        style={{ display: 'block', width: '30%', height: 9, marginTop: 7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : recent.length ? (
              <div className="work-list">
                {recent.map((project) => (
                  <a
                    className="work-row"
                    href={`/admin/portfolio?edit=${project.id}`}
                    key={project.id}
                    aria-label={`Edit karya ${project.title}`}
                  >
                    <img className="work-thumb" src={project.cover.src} alt="" width={54} height={54} />
                    <div className="work-copy">
                      <span className="work-title">{project.title}</span>
                      <span className="work-meta">
                        {CATEGORY_LABELS[project.category]}
                        {project.location ? (
                          <>
                            <span className="dot" aria-hidden="true" />
                            {project.location}
                          </>
                        ) : null}
                      </span>
                    </div>
                    <StatusPill status={project.status} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="empty">
                <div className="empty-icon">
                  <IconDatabase size={22} />
                </div>
                <h2>Belum ada karya</h2>
                <p>Tambahkan karya pertama. Foto sampul dan judul cukup untuk memulai.</p>
                <a className="btn btn-primary" href="/admin/portfolio?new=1">
                  <IconPlus size={16} /> Karya baru
                </a>
              </div>
            )}
          </div>
        </section>

        <div className="stack">
          <section className="panel" aria-labelledby="analytics-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="analytics-title">
                  Analitik pengunjung
                </h2>
                <p className="panel-sub">Harian, 7 hari, dan 30 hari</p>
              </div>
              <span className="chip chip-neutral">Belum aktif</span>
            </div>
            <div className="panel-body">
              <p className="panel-sub" style={{ marginTop: 0, lineHeight: 1.6 }}>
                Angka pengunjung muncul setelah sumber data tersambung. Tidak ada data contoh
                yang dipalsukan di halaman ini.
              </p>
              <ul className="period-preview" aria-label="Periode analitik yang tersedia">
                <li>
                  <span>Hari ini</span>
                  <span className="chip chip-neutral">Menunggu data</span>
                </li>
                <li>
                  <span>7 hari</span>
                  <span className="chip chip-neutral">Menunggu data</span>
                </li>
                <li>
                  <span>30 hari</span>
                  <span className="chip chip-neutral">Menunggu data</span>
                </li>
              </ul>
              <div className="teaser-foot">
                <p>Umami Cloud, dibaca lewat server.</p>
                <a className="text-link" href="/admin/analitik">
                  Buka analitik <IconArrowRight size={15} />
                </a>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="data-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="data-title">
                  Status data
                </h2>
                <p className="panel-sub">Tempat karya disimpan</p>
              </div>
              <span className={cx('chip', demo ? 'chip-ochre' : 'chip-green')}>
                {demo ? 'Demo' : 'Supabase'}
              </span>
            </div>
            <div className="panel-body">
              <dl className="kv">
                <div>
                  <dt>Mode</dt>
                  <dd>{demo ? 'Demo lokal' : 'Supabase'}</dd>
                </div>
                <div>
                  <dt>Penyimpanan</dt>
                  <dd>{demo ? 'IndexedDB peramban' : 'Postgres dan Storage'}</dd>
                </div>
                <div>
                  <dt>Situs publik</dt>
                  <dd>Belum tersambung</dd>
                </div>
              </dl>
              <div className="teaser-foot">
                <p>Langkah sambungan ada di halaman koneksi.</p>
                <a className="text-link" href="/admin/koneksi">
                  Atur <IconArrowRight size={15} />
                </a>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="next-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="next-title">
                  Langkah berikutnya
                </h2>
                <p className="panel-sub">Sebelum karya dipublikasikan</p>
              </div>
              <IconInfo size={18} />
            </div>
            <div className="panel-body">
              <ol className="next-list">
                <li>Rapikan judul, lokasi, dan alt text setiap foto.</li>
                <li>Pilih sampul yang paling mewakili ruangan.</li>
                <li>Atur urutan tampil dari angka kecil ke besar.</li>
                <li>Terbitkan setelah foto dan teks selesai.</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

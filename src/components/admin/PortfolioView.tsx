import { useEffect, useMemo, useState } from 'react';
import { repository } from '../../lib/repository';
import {
  CATEGORY_LABELS,
  type Category,
  type Project,
  type ProjectStatus,
} from '../../lib/types';
import ProjectEditor from './ProjectEditor';
import { Button, ConfirmDialog, EmptyState, IconButton, Notice, StatusPill, ToastRegion, useToasts } from './ui';
import {
  IconAlert,
  IconCopy,
  IconImage,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from './icons';

type CategoryFilter = 'all' | Category;
type StatusFilter = 'all' | ProjectStatus;
type SortKey = 'order' | 'title' | 'updated';

export default function PortfolioView() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('order');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    let active = true;
    setLoadError('');

    repository
      .list()
      .then((list) => {
        if (active) setProjects(list);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Karya gagal dimuat.');
        setProjects([]);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get('edit');
    const isNew = params.get('new') === '1';
    if (edit || isNew) {
      setEditingId(isNew ? 'new' : edit);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!projects || !editingId || editingId === 'new') return;
    if (!projects.some((project) => project.id === editingId)) {
      setEditingId(null);
      push('Karya yang dituju tidak ditemukan.', 'error');
    }
  }, [projects, editingId]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    const needle = query.trim().toLowerCase();
    const list = projects.filter((project) => {
      if (category !== 'all' && project.category !== category) return false;
      if (status !== 'all' && project.status !== status) return false;
      if (!needle) return true;
      return `${project.title} ${project.location} ${project.year}`.toLowerCase().includes(needle);
    });

    list.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'id');
      if (sort === 'updated') {
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.sortOrder - b.sortOrder;
      }
      return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'id');
    });

    return list;
  }, [projects, query, category, status, sort]);

  const nextOrder = projects?.length
    ? Math.max(...projects.map((project) => project.sortOrder)) + 1
    : 1;
  const selectedProject =
    editingId && editingId !== 'new'
      ? projects?.find((project) => project.id === editingId) ?? null
      : null;
  const filtersActive = query.trim() !== '' || category !== 'all' || status !== 'all';

  function resetFilters() {
    setQuery('');
    setCategory('all');
    setStatus('all');
  }

  function handleSaved(saved: Project, created: boolean) {
    setProjects((current) => {
      const list = current ? [...current] : [];
      const index = list.findIndex((project) => project.id === saved.id);
      if (index >= 0) list[index] = saved;
      else list.push(saved);
      return list.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'id')
      );
    });
    setEditingId(null);
    push(created ? 'Karya baru ditambahkan.' : 'Perubahan disimpan.');
  }

  async function duplicate(project: Project) {
    setBusyId(project.id);
    try {
      const copy = await repository.duplicate(project.id);
      setProjects((current) => (current ? [...current, copy] : [copy]));
      push('Karya diduplikasi sebagai draf.');
    } catch (error) {
      push(error instanceof Error ? error.message : 'Karya gagal diduplikasi.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repository.remove(deleteTarget.id);
      setProjects((current) =>
        current ? current.filter((project) => project.id !== deleteTarget.id) : current
      );
      if (editingId === deleteTarget.id) setEditingId(null);
      push('Karya dihapus.');
      setDeleteTarget(null);
    } catch (error) {
      push(error instanceof Error ? error.message : 'Karya gagal dihapus.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const loading = projects === null;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Portofolio</p>
          <h1 className="page-title">
            Karya yang <em>tersusun.</em>
          </h1>
          <p className="page-lede">
            Tambah karya, atur urutan, dan siapkan foto. Semua perubahan masuk ke meja kerja ini
            sebelum diterbitkan.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="accent" icon={<IconPlus size={17} />} onClick={() => setEditingId('new')}>
            Karya baru
          </Button>
        </div>
      </header>

      <div className="page-notice">
        <Notice>
          <strong>Mode demo.</strong> Perubahan tersimpan di peramban ini dan belum mengubah situs
          publik. Foto unggahan juga hanya ada di perangkat ini.
        </Notice>
      </div>

      {loadError ? (
        <div className="page-notice">
          <Notice tone="error" icon={<IconAlert size={18} />}>
            {loadError}{' '}
            <button className="text-link" type="button" onClick={() => setAttempt((value) => value + 1)}>
              Coba lagi
            </button>
          </Notice>
        </div>
      ) : null}

      <div className="toolbar">
        <div className="search-field">
          <IconSearch size={17} />
          <label className="sr-only" htmlFor="portfolio-search">
            Cari karya
          </label>
          <input
            id="portfolio-search"
            className="search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, lokasi, atau tahun"
          />
        </div>

        <label className="sr-only" htmlFor="portfolio-category">
          Filter kategori
        </label>
        <select
          id="portfolio-category"
          className="select-field"
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
        >
          <option value="all">Semua kategori</option>
          <option value="residensial">Residensial</option>
          <option value="komersial">Komersial</option>
          <option value="furnitur">Furnitur</option>
        </select>

        <label className="sr-only" htmlFor="portfolio-status">
          Filter status
        </label>
        <select
          id="portfolio-status"
          className="select-field"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          <option value="all">Semua status</option>
          <option value="published">Terbit</option>
          <option value="draft">Draf</option>
          <option value="archived">Arsip</option>
        </select>

        <label className="sr-only" htmlFor="portfolio-sort">
          Urutkan karya
        </label>
        <select
          id="portfolio-sort"
          className="select-field"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
        >
          <option value="order">Urutan tampil</option>
          <option value="title">Judul A-Z</option>
          <option value="updated">Terbaru diubah</option>
        </select>

        <p className="result-count" aria-live="polite">
          {loading ? 'Memuat karya' : `${filtered.length} dari ${projects?.length ?? 0} karya`}
        </p>
      </div>

      {loading ? (
        <div className="table-wrap" aria-busy="true">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Karya</th>
                <th scope="col">Kategori</th>
                <th scope="col">Status</th>
                <th scope="col">Urutan</th>
                <th scope="col">Diperbarui</th>
                <th scope="col">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4].map((row) => (
                <tr key={row}>
                  <td>
                    <div className="cell-work-inner">
                      <span className="skeleton-block work-thumb" />
                      <span className="skeleton-block" style={{ width: 180, height: 12 }} />
                    </div>
                  </td>
                  <td>
                    <span className="skeleton-block" style={{ width: 72, height: 10 }} />
                  </td>
                  <td>
                    <span className="skeleton-block" style={{ width: 54, height: 20 }} />
                  </td>
                  <td>
                    <span className="skeleton-block" style={{ width: 18, height: 10 }} />
                  </td>
                  <td>
                    <span className="skeleton-block" style={{ width: 64, height: 10 }} />
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !projects?.length ? (
        <div className="table-wrap">
          <EmptyState
            icon={<IconImage size={23} />}
            title="Belum ada karya"
            body="Mulai dari satu karya. Judul, kategori, dan satu foto sampul sudah cukup untuk menyusun galeri."
            action={
              <Button variant="accent" icon={<IconPlus size={16} />} onClick={() => setEditingId('new')}>
                Tambah karya pertama
              </Button>
            }
          />
        </div>
      ) : !filtered.length ? (
        <div className="table-wrap">
          <EmptyState
            icon={<IconSearch size={22} />}
            title="Tidak ada yang cocok"
            body="Coba kata kunci lain, atau longgarkan filter kategori dan status."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Reset filter
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">
                Daftar karya portofolio. Gunakan tombol di setiap baris untuk mengedit,
                menduplikasi, atau menghapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Karya</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Status</th>
                  <th scope="col">Urutan</th>
                  <th scope="col">Diperbarui</th>
                  <th scope="col">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id}>
                    <td className="cell-work">
                      <div className="cell-work-inner">
                        <img
                          className="work-thumb"
                          src={project.cover.src}
                          alt=""
                          width={54}
                          height={54}
                        />
                        <div className="cell-work-copy">
                          <span className="cell-work-title">{project.title}</span>
                          <span className="cell-work-meta">
                            {project.location || 'Lokasi belum diisi'}
                            {project.year ? (
                              <>
                                <span className="dot" aria-hidden="true" />
                                {project.year}
                              </>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{CATEGORY_LABELS[project.category]}</td>
                    <td>
                      <StatusPill status={project.status} />
                    </td>
                    <td className="cell-order">{project.sortOrder}</td>
                    <td className="cell-updated">{formatUpdated(project.updatedAt)}</td>
                    <td className="cell-actions">
                      <div className="row-actions">
                        <IconButton
                          label={`Edit ${project.title}`}
                          onClick={() => setEditingId(project.id)}
                        >
                          <IconPencil size={17} />
                        </IconButton>
                        <IconButton
                          label={`Duplikat ${project.title}`}
                          onClick={() => void duplicate(project)}
                          disabled={busyId === project.id}
                        >
                          <IconCopy size={17} />
                        </IconButton>
                        <IconButton
                          label={`Hapus ${project.title}`}
                          tone="danger"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <IconTrash size={17} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="work-cards">
            {filtered.map((project) => (
              <article className="work-card" key={project.id}>
                <img className="work-thumb" src={project.cover.src} alt="" width={64} height={64} />
                <div className="work-card-body">
                  <div className="work-card-top">
                    <div>
                      <h2 className="work-card-title">{project.title}</h2>
                      <p className="work-card-meta">
                        {CATEGORY_LABELS[project.category]}
                        {project.location ? `, ${project.location}` : ''}
                      </p>
                    </div>
                    <StatusPill status={project.status} />
                  </div>
                  <p className="work-card-meta">
                    Urutan {project.sortOrder} <span aria-hidden="true">·</span>{' '}
                    {formatUpdated(project.updatedAt)}
                  </p>
                  <div className="work-card-actions">
                    <IconButton label={`Edit ${project.title}`} onClick={() => setEditingId(project.id)}>
                      <IconPencil size={17} />
                    </IconButton>
                    <IconButton
                      label={`Duplikat ${project.title}`}
                      onClick={() => void duplicate(project)}
                      disabled={busyId === project.id}
                    >
                      <IconCopy size={17} />
                    </IconButton>
                    <IconButton
                      label={`Hapus ${project.title}`}
                      tone="danger"
                      onClick={() => setDeleteTarget(project)}
                    >
                      <IconTrash size={17} />
                    </IconButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {editingId === 'new' || selectedProject ? (
        <ProjectEditor
          key={editingId}
          project={selectedProject}
          nextOrder={nextOrder}
          onClose={() => setEditingId(null)}
          onSaved={handleSaved}
          notify={push}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus karya ini?"
        body={
          deleteTarget
            ? `"${deleteTarget.title}" akan dihapus dari meja kerja. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus karya"
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
        busy={deleting}
      />

      <ToastRegion toasts={toasts} dismiss={dismiss} />
    </>
  );
}

function formatUpdated(value: string | null): string {
  if (!value) return 'Data awal';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data awal';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

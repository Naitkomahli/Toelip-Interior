import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { repository, uploadImage } from '../../lib/repository';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type Category,
  type Project,
  type ProjectDraft,
  type ProjectImage,
  type ProjectStatus,
} from '../../lib/types';
import { Button, ConfirmDialog, Drawer, Field, IconButton, cx } from './ui';
import { IconImage, IconPlus, IconUpload, IconX } from './icons';

interface EditorDraft {
  title: string;
  category: Category;
  year: string;
  location: string;
  description: string;
  cover: ProjectImage | null;
  gallery: ProjectImage[];
  status: ProjectStatus;
  sortOrder: number;
}

interface ProjectEditorProps {
  project: Project | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (project: Project, created: boolean) => void;
  notify: (message: string, tone?: 'success' | 'error') => void;
}

function makeDraft(project: Project | null, nextOrder: number): EditorDraft {
  if (!project) {
    return {
      title: '',
      category: 'residensial',
      year: '',
      location: '',
      description: '',
      cover: null,
      gallery: [],
      status: 'draft',
      sortOrder: nextOrder,
    };
  }
  return {
    title: project.title,
    category: project.category,
    year: project.year,
    location: project.location,
    description: project.description,
    cover: project.cover ? { ...project.cover } : null,
    gallery: project.gallery.map((image) => ({ ...image })),
    status: project.status,
    sortOrder: project.sortOrder,
  };
}

export default function ProjectEditor({
  project,
  nextOrder,
  onClose,
  onSaved,
  notify,
}: ProjectEditorProps) {
  const [draft, setDraft] = useState<EditorDraft>(() => makeDraft(project, nextOrder));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const initial = useRef(JSON.stringify(makeDraft(project, nextOrder)));
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const created = !project;

  const snapshot = JSON.stringify(draft);
  const dirty = snapshot !== initial.current;

  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  function clearError(key: string) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function patch<K extends keyof EditorDraft>(key: K, value: EditorDraft[K], errorKey: string = key) {
    setDraft((current) => ({ ...current, [key]: value }));
    clearError(errorKey);
  }

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setCoverBusy(true);
    clearError('cover');
    clearError('coverAlt');
    try {
      const processed = await uploadImage(file);
      setDraft((current) => ({
        ...current,
        cover: { ...processed, alt: '' },
      }));
      notify('Foto sampul siap. Tambahkan alt text sebelum menyimpan.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Foto sampul gagal diproses.', 'error');
    } finally {
      setCoverBusy(false);
      if (coverInput.current) coverInput.current.value = '';
    }
  }

  async function handleGalleryFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const list = Array.from(files);
    setGalleryBusy(list.length);
    let added = 0;

    for (const file of list) {
      try {
        const processed = await uploadImage(file);
        setDraft((current) => ({
          ...current,
          gallery: [...current.gallery, { ...processed, alt: '' }],
        }));
        added += 1;
      } catch (error) {
        notify(error instanceof Error ? error.message : `${file.name} gagal diproses.`, 'error');
      } finally {
        setGalleryBusy((count) => Math.max(0, count - 1));
      }
    }

    if (added) {
      clearError('gallery');
      notify(added === 1 ? '1 foto galeri ditambahkan.' : `${added} foto galeri ditambahkan.`);
    }
    if (galleryInput.current) galleryInput.current.value = '';
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void handleCoverFile(event.dataTransfer.files?.[0]);
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (draft.title.trim().length < 2) next.title = 'Judul minimal 2 karakter.';
    if (draft.year && !/^(19|20)\d{2}$/.test(draft.year.trim())) {
      next.year = 'Tahun memakai 4 angka, contoh 2024.';
    }
    if (draft.location.length > 80) next.location = 'Lokasi maksimal 80 karakter.';
    if (draft.description.length > 600) next.description = 'Deskripsi maksimal 600 karakter.';
    if (!draft.cover) next.cover = 'Sampul wajib dipilih.';
    if (draft.cover && draft.cover.alt.trim().length < 5) {
      next.coverAlt = 'Alt text sampul wajib diisi, minimal 5 karakter.';
    }
    if (draft.gallery.some((image) => image.alt.trim().length < 5)) {
      next.gallery = 'Setiap foto galeri perlu alt text minimal 5 karakter.';
    }
    if (!Number.isInteger(draft.sortOrder) || draft.sortOrder < 1) {
      next.sortOrder = 'Urutan memakai angka bulat mulai dari 1.';
    }
    return next;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);

    if (Object.keys(next).length) {
      const order = ['title', 'year', 'cover', 'coverAlt', 'gallery', 'sortOrder'];
      const ids: Record<string, string> = {
        title: 'project-title',
        year: 'project-year',
        cover: 'project-cover-drop',
        coverAlt: 'project-cover-alt',
        gallery: 'project-gallery-alt-0',
        sortOrder: 'project-order',
      };
      const first = order.find((key) => next[key]);
      if (first) {
        window.setTimeout(() => document.getElementById(ids[first])?.focus(), 20);
      }
      notify('Ada isian yang perlu dilengkapi.', 'error');
      return;
    }

    const cover = draft.cover;
    if (!cover) return;

    const payload: ProjectDraft = {
      title: draft.title.trim(),
      category: draft.category,
      year: draft.year.trim(),
      location: draft.location.trim(),
      description: draft.description.trim(),
      cover: { ...cover, alt: cover.alt.trim() },
      gallery: draft.gallery.map((image) => ({ ...image, alt: image.alt.trim() })),
      status: draft.status,
      sortOrder: draft.sortOrder,
    };

    setSaving(true);
    try {
      const saved = project
        ? await repository.update(project.id, payload)
        : await repository.create(payload);
      onSaved(saved, created);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Karya gagal disimpan.', 'error');
      setSaving(false);
    }
  }

  function requestClose() {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  }

  const body = (
    <form id="project-form" onSubmit={submit} noValidate>
      <section className="form-section">
        <h3 className="form-section-title">Identitas karya</h3>
        <p className="form-section-note">
          Judul dan lokasi muncul di galeri. Deskripsi dipakai untuk ringkasan dan pencarian.
        </p>
        <div className="form-grid">
          <Field id="project-title" label="Judul" error={errors.title} full>
            <input
              id="project-title"
              className="input"
              value={draft.title}
              onChange={(event) => patch('title', event.target.value)}
              placeholder="Contoh: Rumah keluarga di Banyumanik"
              aria-invalid={Boolean(errors.title) || undefined}
              aria-describedby={errors.title ? 'project-title-error' : undefined}
              data-autofocus
            />
          </Field>

          <Field id="project-category" label="Kategori">
            <select
              id="project-category"
              className="select-input"
              value={draft.category}
              onChange={(event) => patch('category', event.target.value as Category)}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="project-year" label="Tahun" hint="Opsional" error={errors.year}>
            <input
              id="project-year"
              className="input"
              value={draft.year}
              onChange={(event) => patch('year', event.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="2024"
              aria-invalid={Boolean(errors.year) || undefined}
              aria-describedby={errors.year ? 'project-year-error' : undefined}
            />
          </Field>

          <Field id="project-location" label="Lokasi" hint="Contoh: Semarang" error={errors.location} full>
            <input
              id="project-location"
              className="input"
              value={draft.location}
              onChange={(event) => patch('location', event.target.value)}
              placeholder="Semarang"
              aria-invalid={Boolean(errors.location) || undefined}
              aria-describedby={errors.location ? 'project-location-error' : undefined}
            />
          </Field>

          <Field
            id="project-description"
            label="Deskripsi"
            hint="Opsional, maksimal 600 karakter."
            error={errors.description}
            full
          >
            <textarea
              id="project-description"
              className="textarea"
              value={draft.description}
              onChange={(event) => patch('description', event.target.value)}
              placeholder="Apa yang dikerjakan, material utama, atau hal yang berubah dari ruangan ini."
              maxLength={600}
              aria-invalid={Boolean(errors.description) || undefined}
              aria-describedby={errors.description ? 'project-description-error' : undefined}
            />
            <span className="char-count">{draft.description.length}/600</span>
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section-title">Foto sampul</h3>
        <p className="form-section-note">
          Satu foto utama. Rasio bebas, tetapi foto mendatar atau persegi paling aman untuk galeri.
        </p>

        <input
          ref={coverInput}
          className="file-input"
          id="project-cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void handleCoverFile(event.target.files?.[0])}
          tabIndex={-1}
        />

        {draft.cover ? (
          <div className="image-field">
            <div className="image-preview">
              <img src={draft.cover.src} alt="" width={draft.cover.width} height={draft.cover.height} />
            </div>
            <div className="image-controls">
              <Button
                variant="secondary"
                icon={<IconUpload size={17} />}
                onClick={() => coverInput.current?.click()}
                loading={coverBusy}
              >
                Ganti foto
              </Button>
              <p className="field-hint">JPG, PNG, atau WebP. Maksimal 15 MB.</p>
              <Button
                variant="ghost"
                onClick={() => {
                  patch('cover', null);
                  setErrors((current) => ({ ...current, coverAlt: '' }));
                }}
              >
                Hapus sampul
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            id="project-cover-drop"
            className={cx('drop-zone', dragging && 'dragging')}
            onClick={() => coverInput.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            aria-describedby={errors.cover ? 'project-cover-error' : 'project-cover-hint'}
          >
            <IconImage size={26} />
            <span>
              <strong>{coverBusy ? 'Memproses foto' : 'Pilih foto sampul'}</strong>
              <span>atau tarik file ke area ini. Maksimal 15 MB.</span>
            </span>
          </button>
        )}

        {errors.cover ? (
          <p className="field-error" id="project-cover-error" role="alert" style={{ marginTop: 7 }}>
            {errors.cover}
          </p>
        ) : (
          <p className="field-hint" id="project-cover-hint" style={{ marginTop: 7 }}>
            Foto diperkecil ke sisi terpanjang 1400 px dan dikompres saat diunggah.
          </p>
        )}

        <div style={{ marginTop: 16 }}>
          <Field
            id="project-cover-alt"
            label="Alt text sampul"
            hint="Tulis apa yang terlihat, bukan nama file. Membantu pembaca layar."
            error={errors.coverAlt}
            full
          >
            <input
              id="project-cover-alt"
              className="input"
              value={draft.cover?.alt ?? ''}
              onChange={(event) => {
                if (!draft.cover) return;
                patch('cover', { ...draft.cover, alt: event.target.value }, 'coverAlt');
              }}
              disabled={!draft.cover}
              placeholder="Ruang keluarga dengan sofa krem dan jendela besar"
              aria-invalid={Boolean(errors.coverAlt) || undefined}
              aria-describedby={errors.coverAlt ? 'project-cover-alt-error' : 'project-cover-alt-hint'}
            />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section-title">Galeri</h3>
        <p className="form-section-note">
          Opsional. Tambahkan beberapa sudut ruangan. Setiap foto perlu alt text sebelum disimpan.
        </p>

        <input
          ref={galleryInput}
          className="file-input"
          id="project-gallery"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => void handleGalleryFiles(event.target.files)}
          tabIndex={-1}
        />

        <div className="gallery-grid">
          {draft.gallery.map((image, index) => (
            <div className="gallery-item" key={`${image.src}-${index}`}>
              <div className="gallery-item-media">
                <img src={image.src} alt="" width={image.width} height={image.height} />
                <button
                  type="button"
                  className="gallery-remove"
                  aria-label={`Hapus foto galeri ${index + 1}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      gallery: current.gallery.filter((_, position) => position !== index),
                    }))
                  }
                >
                  <IconX size={15} />
                </button>
              </div>
              <label className="sr-only" htmlFor={`project-gallery-alt-${index}`}>
                Alt text foto galeri {index + 1}
              </label>
              <input
                id={`project-gallery-alt-${index}`}
                className="input"
                value={image.alt}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    gallery: current.gallery.map((item, position) =>
                      position === index ? { ...item, alt: value } : item
                    ),
                  }));
                  clearError('gallery');
                }}
                placeholder={`Alt text foto ${index + 1}`}
                aria-invalid={Boolean(errors.gallery) || undefined}
              />
            </div>
          ))}

          <button
            type="button"
            className="gallery-add"
            onClick={() => galleryInput.current?.click()}
            disabled={galleryBusy > 0}
          >
            {galleryBusy > 0 ? (
              <>
                <IconUpload size={20} />
                Memproses {galleryBusy} foto
              </>
            ) : (
              <>
                <IconPlus size={20} />
                Tambah foto galeri
              </>
            )}
          </button>
        </div>

        {errors.gallery ? (
          <p className="field-error" role="alert" style={{ marginTop: 7 }}>
            {errors.gallery}
          </p>
        ) : null}
      </section>

      <section className="form-section">
        <h3 className="form-section-title">Publikasi</h3>
        <p className="form-section-note">
          Draf bisa disiapkan lebih dulu. Arsip menyembunyikan karya tanpa menghapus datanya.
        </p>
        <div className="form-grid">
          <Field id="project-status" label="Status">
            <select
              id="project-status"
              className="select-input"
              value={draft.status}
              onChange={(event) => patch('status', event.target.value as ProjectStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="project-order"
            label="Urutan tampil"
            hint="Angka kecil tampil lebih dulu."
            error={errors.sortOrder}
          >
            <input
              id="project-order"
              className="input"
              type="number"
              min={1}
              step={1}
              value={draft.sortOrder}
              onChange={(event) => patch('sortOrder', Number(event.target.value))}
              aria-invalid={Boolean(errors.sortOrder) || undefined}
              aria-describedby={errors.sortOrder ? 'project-order-error' : undefined}
            />
          </Field>
        </div>
      </section>
    </form>
  );

  const footer = (
    <>
      <p className="sheet-foot-note">
        {created ? 'Karya baru disimpan sebagai data di meja kerja ini.' : 'Perubahan belum tersimpan sampai tombol ditekan.'}
      </p>
      <div className="sheet-foot-actions">
        <Button variant="secondary" onClick={requestClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" form="project-form" variant="accent" loading={saving}>
          {created ? 'Simpan karya' : 'Simpan perubahan'}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Drawer
        open
        onClose={requestClose}
        eyebrow={created ? 'Karya baru' : 'Edit karya'}
        title={created ? 'Tambahkan karya.' : draft.title || 'Edit karya.'}
        body={body}
        footer={footer}
      />
      <ConfirmDialog
        open={discardOpen}
        title="Buang perubahan?"
        body="Isian yang belum disimpan akan hilang. Karya yang sudah ada tidak terhapus."
        confirmLabel="Buang perubahan"
        cancelLabel="Lanjut mengedit"
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onClose={() => setDiscardOpen(false)}
      />
    </>
  );
}

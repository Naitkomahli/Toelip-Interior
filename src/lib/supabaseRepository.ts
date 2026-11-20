import { processImage } from './image';
import { supabase } from './supabase';
import type { Category, Project, ProjectDraft, ProjectImage, ProjectStatus } from './types';

interface ProjectRow {
  id: string;
  title: string;
  category: Category;
  year: string | null;
  location: string | null;
  description: string | null;
  cover: ProjectImage;
  gallery: ProjectImage[] | null;
  status: ProjectStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    year: row.year ?? '',
    location: row.location ?? '',
    description: row.description ?? '',
    cover: row.cover,
    gallery: row.gallery ?? [],
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function draftToRow(draft: ProjectDraft) {
  return {
    title: draft.title,
    category: draft.category,
    year: draft.year || null,
    location: draft.location || null,
    description: draft.description || null,
    cover: draft.cover,
    gallery: draft.gallery,
    status: draft.status,
    sort_order: draft.sortOrder,
  };
}

function client() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  return supabase;
}

async function nextOrder(): Promise<number> {
  const { data, error } = await client()
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.sort_order ?? 0) + 1;
}

export async function uploadProjectImage(file: File): Promise<ProjectImage> {
  const processed = await processImage(file);
  const extension = processed.blob.type === 'image/png' ? 'png' : 'webp';
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await client()
    .storage
    .from('portfolio')
    .upload(path, processed.blob, {
      contentType: processed.blob.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) throw new Error(error.message);
  const { data } = client().storage.from('portfolio').getPublicUrl(path);
  return {
    src: data.publicUrl,
    width: processed.width,
    height: processed.height,
    alt: '',
  };
}

export const supabaseRepository = {
  mode: 'supabase' as const,

  async list(): Promise<Project[]> {
    const { data, error } = await client()
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ProjectRow[]).map(rowToProject);
  },

  async create(draft: ProjectDraft): Promise<Project> {
    const sortOrder = draft.sortOrder || (await nextOrder());
    const { data, error } = await client()
      .from('projects')
      .insert({ ...draftToRow(draft), sort_order: sortOrder })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToProject(data as ProjectRow);
  },

  async update(id: string, draft: ProjectDraft): Promise<Project> {
    const { data, error } = await client()
      .from('projects')
      .update({ ...draftToRow(draft), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToProject(data as ProjectRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await client().from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async setStatus(id: string, status: ProjectStatus): Promise<Project> {
    const { data, error } = await client()
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToProject(data as ProjectRow);
  },

  async duplicate(id: string): Promise<Project> {
    const { data, error } = await client()
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    const source = rowToProject(data as ProjectRow);
    return this.create({
      title: `${source.title} (salinan)`,
      category: source.category,
      year: source.year,
      location: source.location,
      description: source.description,
      cover: source.cover,
      gallery: source.gallery,
      status: 'draft',
      sortOrder: 0,
    });
  },

  async reset(): Promise<void> {
    throw new Error('Reset hanya tersedia di mode demo.');
  },
};

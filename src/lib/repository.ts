import { demoRepository } from './demoRepository';
import { processImage } from './image';
import { isSupabaseConfigured } from './supabase';
import { supabaseRepository, uploadProjectImage } from './supabaseRepository';
import type { Project, ProjectDraft, ProjectImage, ProjectStatus } from './types';

export interface Repository {
  mode: 'demo' | 'supabase';
  list(): Promise<Project[]>;
  create(draft: ProjectDraft): Promise<Project>;
  update(id: string, draft: ProjectDraft): Promise<Project>;
  remove(id: string): Promise<void>;
  setStatus(id: string, status: ProjectStatus): Promise<Project>;
  duplicate(id: string): Promise<Project>;
  reset(): Promise<void>;
}

export const repository: Repository = isSupabaseConfigured ? supabaseRepository : demoRepository;
export const dataMode = repository.mode;

export async function uploadImage(file: File): Promise<ProjectImage> {
  if (isSupabaseConfigured) return uploadProjectImage(file);
  const processed = await processImage(file);
  return {
    src: processed.dataUrl,
    width: processed.width,
    height: processed.height,
    alt: '',
  };
}

export type Category = 'residensial' | 'komersial' | 'furnitur';
export type ProjectStatus = 'published' | 'draft' | 'archived';

export interface ProjectImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Project {
  id: string;
  title: string;
  category: Category;
  year: string;
  location: string;
  description: string;
  cover: ProjectImage;
  gallery: ProjectImage[];
  status: ProjectStatus;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ProjectDraft = Pick<
  Project,
  'title' | 'category' | 'year' | 'location' | 'description' | 'cover' | 'gallery' | 'status' | 'sortOrder'
>;

export interface AnalyticsPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface AnalyticsMetric {
  label: string;
  value: number;
}

export interface AnalyticsPayload {
  configured: boolean;
  days: number;
  visitors: number;
  pageviews: number;
  series: AnalyticsPoint[];
  topPages: AnalyticsMetric[];
  sources: AnalyticsMetric[];
  error?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  residensial: 'Residensial',
  komersial: 'Komersial',
  furnitur: 'Furnitur',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  published: 'Terbit',
  draft: 'Draf',
  archived: 'Arsip',
};

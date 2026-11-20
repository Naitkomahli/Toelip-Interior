import { seedProjects } from './seed';
import type { Project, ProjectDraft, ProjectStatus } from './types';

const DB_NAME = 'toelip-admin';
const DB_VERSION = 1;
const PROJECTS = 'projects';
const META = 'meta';

let memoryProjects: Project[] | null = null;

function now(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function sortProjects(projects: Project[]): Project[] {
  return projects.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'id'));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) {
        db.createObjectStore(PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Database demo gagal dibuka.'));
  });
}

function useMemory(): void {
  if (!memoryProjects) memoryProjects = clone(seedProjects);
}

async function readAll(): Promise<Project[]> {
  try {
    const db = await openDatabase();
    return await new Promise<Project[]>((resolve, reject) => {
      const tx = db.transaction([PROJECTS, META], 'readonly');
      const projectsRequest = tx.objectStore(PROJECTS).getAll();
      const metaRequest = tx.objectStore(META).get('seeded');
      tx.oncomplete = () => {
        const projects = (projectsRequest.result as Project[]) ?? [];
        const seeded = Boolean(metaRequest.result?.value);
        if (seeded) {
          resolve(sortProjects(projects));
          return;
        }
        const initial = clone(seedProjects);
        const write = db.transaction([PROJECTS, META], 'readwrite');
        initial.forEach((project) => write.objectStore(PROJECTS).put(project));
        write.objectStore(META).put({ key: 'seeded', value: true });
        write.oncomplete = () => resolve(sortProjects(initial));
        write.onerror = () => reject(write.error ?? new Error('Data demo gagal disiapkan.'));
      };
      tx.onerror = () => reject(tx.error ?? new Error('Data demo gagal dibaca.'));
    });
  } catch {
    useMemory();
    return sortProjects(clone(memoryProjects ?? []));
  }
}

async function writeProject(project: Project): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROJECTS, 'readwrite');
      tx.objectStore(PROJECTS).put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Karya gagal disimpan.'));
    });
  } catch {
    useMemory();
    const index = memoryProjects!.findIndex((item) => item.id === project.id);
    if (index >= 0) memoryProjects![index] = project;
    else memoryProjects!.push(project);
  }
}

async function removeProject(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROJECTS, 'readwrite');
      tx.objectStore(PROJECTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Karya gagal dihapus.'));
    });
  } catch {
    useMemory();
    memoryProjects = memoryProjects!.filter((item) => item.id !== id);
  }
}

export const demoRepository = {
  mode: 'demo' as const,

  async list(): Promise<Project[]> {
    const projects = await readAll();
    return projects;
  },

  async create(draft: ProjectDraft): Promise<Project> {
    const projects = await readAll();
    const maxOrder = projects.reduce((max, item) => Math.max(max, item.sortOrder), 0);
    const project: Project = {
      ...draft,
      id: crypto.randomUUID(),
      sortOrder: draft.sortOrder || maxOrder + 1,
      createdAt: now(),
      updatedAt: now(),
    };
    await writeProject(project);
    return project;
  },

  async update(id: string, draft: ProjectDraft): Promise<Project> {
    const projects = await readAll();
    const current = projects.find((item) => item.id === id);
    if (!current) throw new Error('Karya tidak ditemukan.');
    const project: Project = {
      ...current,
      ...draft,
      id,
      updatedAt: now(),
    };
    await writeProject(project);
    return project;
  },

  async remove(id: string): Promise<void> {
    await removeProject(id);
  },

  async setStatus(id: string, status: ProjectStatus): Promise<Project> {
    const projects = await readAll();
    const current = projects.find((item) => item.id === id);
    if (!current) throw new Error('Karya tidak ditemukan.');
    const project: Project = { ...current, status, updatedAt: now() };
    await writeProject(project);
    return project;
  },

  async duplicate(id: string): Promise<Project> {
    const projects = await readAll();
    const current = projects.find((item) => item.id === id);
    if (!current) throw new Error('Karya tidak ditemukan.');
    const maxOrder = projects.reduce((max, item) => Math.max(max, item.sortOrder), 0);
    const project: Project = {
      ...clone(current),
      id: crypto.randomUUID(),
      title: `${current.title} (salinan)`,
      status: 'draft',
      sortOrder: maxOrder + 1,
      createdAt: now(),
      updatedAt: now(),
    };
    await writeProject(project);
    return project;
  },

  async reset(): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([PROJECTS, META], 'readwrite');
        tx.objectStore(PROJECTS).clear();
        tx.objectStore(META).put({ key: 'seeded', value: true });
        const initial = clone(seedProjects);
        initial.forEach((project) => tx.objectStore(PROJECTS).put(project));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Data demo gagal diatur ulang.'));
      });
    } catch {
      memoryProjects = clone(seedProjects);
    }
  },
};

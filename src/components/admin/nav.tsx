import type { ReactNode } from 'react';
import {
  IconChart,
  IconOverview,
  IconPlug,
  IconPortfolio,
} from './icons';

export type AdminView = 'overview' | 'portfolio' | 'analytics' | 'connection';

export interface NavItem {
  view: AdminView;
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'overview', href: '/admin', label: 'Ringkasan', short: 'Ringkasan', icon: <IconOverview /> },
  { view: 'portfolio', href: '/admin/portfolio', label: 'Portofolio', short: 'Karya', icon: <IconPortfolio /> },
  { view: 'analytics', href: '/admin/analitik', label: 'Analitik', short: 'Analitik', icon: <IconChart /> },
  { view: 'connection', href: '/admin/koneksi', label: 'Koneksi data', short: 'Koneksi', icon: <IconPlug /> },
];

export const VIEW_TITLES: Record<AdminView, string> = {
  overview: 'Ringkasan',
  portfolio: 'Portofolio',
  analytics: 'Analitik',
  connection: 'Koneksi data',
};

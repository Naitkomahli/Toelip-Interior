import type { ReactNode } from 'react';
import {
  IconChart,
  IconOverview,
  IconPlug,
  IconPortfolio,
  IconUser,
} from './icons';

export type AdminView = 'overview' | 'portfolio' | 'analytics' | 'connection' | 'account';

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
  { view: 'account', href: '/admin/akun', label: 'Akun', short: 'Akun', icon: <IconUser /> },
];

export const VIEW_TITLES: Record<AdminView, string> = {
  overview: 'Ringkasan',
  portfolio: 'Portofolio',
  analytics: 'Analitik',
  connection: 'Koneksi data',
  account: 'Akun',
};

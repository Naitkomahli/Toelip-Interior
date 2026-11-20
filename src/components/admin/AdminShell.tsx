import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { dataMode } from '../../lib/repository';
import { NAV_ITEMS, type AdminView } from './nav';
import { cx } from './ui';
import {
  IconArrowRight,
  IconExternal,
  IconLogOut,
} from './icons';

interface AdminShellProps {
  view: AdminView;
  title: string;
  session: Session | null;
  onSignOut?: () => void | Promise<void>;
  children: ReactNode;
}

export function AdminShell({ view, title, session, onSignOut, children }: AdminShellProps) {
  const demo = dataMode === 'demo';
  const initial = session?.user.email?.[0]?.toUpperCase() ?? 'T';

  return (
    <div className="adm-shell">
      <a className="skip-link" href="#main">
        Langsung ke konten
      </a>

      <aside className="adm-sidebar">
        <a className="side-brand" href="/admin" aria-label="Toelip Interior, ringkasan meja kerja">
          <span className="brand-mark">T</span>
          <span className="brand-word">
            <strong>Toelip Interior</strong>
            <span>Meja kerja</span>
          </span>
        </a>

        <p className="side-label">Menu</p>
        <nav className="side-nav" aria-label="Navigasi meja kerja">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.view}
              className="side-link"
              href={item.href}
              aria-current={view === item.view ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="side-foot">
          <div className="side-mode">
            <div className="side-mode-top">
              <span className={cx('mode-dot', !demo && 'live')} />
              <strong>{demo ? 'Mode demo' : 'Supabase aktif'}</strong>
            </div>
            <p>
              {demo
                ? 'Data tersimpan di peramban ini dan belum mengubah situs publik.'
                : 'Karya dan foto dibaca dari database Supabase.'}
            </p>
            <a href="/admin/koneksi">
              Atur koneksi <IconArrowRight size={13} />
            </a>
          </div>

          {onSignOut ? (
            <button className="side-signout" type="button" onClick={() => void onSignOut()}>
              <IconLogOut size={17} />
              Keluar dari meja kerja
            </button>
          ) : null}
        </div>
      </aside>

      <div className="adm-frame">
        <header className="adm-topbar">
          <div className="topbar-inner">
            <p className="topbar-context">
              <span>Meja kerja</span>
              <span className="sep" aria-hidden="true">
                /
              </span>
              <strong>{title}</strong>
            </p>

            <a className="mobile-brand" href="/admin">
              <span className="brand-mark">T</span>
              Toelip
            </a>

            <div className="topbar-actions">
              <a
                className="topbar-link"
                href="/"
                target="_blank"
                rel="noopener"
                aria-label="Lihat situs publik di tab baru"
              >
                <IconExternal size={16} />
                <span>Lihat situs</span>
              </a>
              {onSignOut ? (
                <button
                  className="topbar-link"
                  type="button"
                  onClick={() => void onSignOut()}
                  aria-label="Keluar dari meja kerja"
                >
                  <IconLogOut size={16} />
                  <span>Keluar</span>
                </button>
              ) : null}
              <span className="avatar" aria-hidden="true" title={session?.user.email}>
                {initial}
              </span>
            </div>
          </div>
        </header>

        <main className="adm-main" id="main">
          {children}
        </main>

        <footer className="adm-footer">
          <span>Toelip Interior, Semarang</span>
          <span>Meja kerja internal. Tidak ditampilkan di navigasi publik.</span>
        </footer>
      </div>

      <nav className="adm-mobile-nav" aria-label="Navigasi meja kerja">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.view}
            className="mobile-link"
            href={item.href}
            aria-current={view === item.view ? 'page' : undefined}
          >
            {item.icon}
            {item.short}
          </a>
        ))}
      </nav>
    </div>
  );
}

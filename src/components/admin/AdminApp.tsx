import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { AdminShell } from './AdminShell';
import { VIEW_TITLES, type AdminView } from './nav';
import OverviewView from './OverviewView';
import PortfolioView from './PortfolioView';
import AnalyticsView from './AnalyticsView';
import ConnectionView from './ConnectionView';
import { Button, Notice } from './ui';
import { IconArrowLeft, IconMail } from './icons';

export default function AdminApp({ view }: { view: AdminView }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthReady(true);
      return;
    }

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setAuthReady(true);
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <div className="login-page">
        <div className="login-brand">
          <span className="brand-mark">T</span>
          <span className="brand-word">
            <strong>Toelip Interior</strong>
            <span>Meja kerja</span>
          </span>
        </div>
        <div className="login-card" aria-busy="true">
          <p className="eyebrow">Meja kerja</p>
          <h1>Menyiapkan ruang kerja.</h1>
          <div className="login-form">
            <div className="skeleton-block" style={{ height: 46 }} />
            <div className="skeleton-block" style={{ height: 46 }} />
            <div className="skeleton-block" style={{ height: 46 }} />
          </div>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <LoginScreen />;
  }

  function renderView() {
    switch (view) {
      case 'portfolio':
        return <PortfolioView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'connection':
        return <ConnectionView session={session} />;
      default:
        return <OverviewView />;
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  return (
    <AdminShell
      view={view}
      title={VIEW_TITLES[view]}
      session={session}
      onSignOut={isSupabaseConfigured ? signOut : undefined}
    >
      {renderView()}
    </AdminShell>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatus('error');
      setMessage('Masukkan alamat email yang valid.');
      return;
    }

    setStatus('sending');
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus('error');
      setMessage(
        error.message.toLowerCase().includes('rate')
          ? 'Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.'
          : 'Tautan masuk gagal dikirim. Periksa email dan konfigurasi Supabase.'
      );
      return;
    }

    setStatus('sent');
    setMessage(clean);
  }

  return (
    <div className="login-page">
      <a className="login-brand" href="/" aria-label="Toelip Interior, beranda">
        <span className="brand-mark">T</span>
        <span className="brand-word">
          <strong>Toelip Interior</strong>
          <span>Meja kerja</span>
        </span>
      </a>

      <main className="login-card">
        <p className="eyebrow">Akses pemilik</p>
        <h1>
          Masuk ke <em>meja kerja.</em>
        </h1>
        <p className="page-lede">
          Tautan masuk dikirim ke email pemilik. Tidak ada kata sandi yang perlu diingat.
        </p>

        {status === 'sent' ? (
          <div className="login-status">
            <Notice tone="info" icon={<IconMail size={18} />}>
              <p>
                Tautan masuk sudah dikirim ke <strong>{message}</strong>. Buka email tersebut,
                lalu kembali ke halaman ini.
              </p>
            </Notice>
            <Button
              variant="ghost"
              className="login-back"
              onClick={() => {
                setStatus('idle');
                setMessage('');
              }}
            >
              Kirim ke alamat lain
            </Button>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit} noValidate>
            <div className="field">
              <div className="field-label">
                <label htmlFor="login-email">Email pemilik</label>
              </div>
              <input
                id="login-email"
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="nama@studio.com"
                aria-invalid={status === 'error' || undefined}
                aria-describedby={status === 'error' ? 'login-error' : undefined}
                data-autofocus
              />
              {status === 'error' ? (
                <p className="field-error" id="login-error" role="alert">
                  {message}
                </p>
              ) : null}
            </div>
            <Button type="submit" variant="accent" loading={status === 'sending'}>
              Kirim tautan masuk
            </Button>
          </form>
        )}

        <a className="login-back" href="/">
          <IconArrowLeft size={15} /> Kembali ke situs
        </a>
      </main>

      <p className="login-note">
        Akses hanya untuk pemilik Toelip Interior. Sesi berakhir sendiri saat keluar.
      </p>
    </div>
  );
}

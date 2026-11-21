import { useEffect, useId, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { signInMessage, waitSeconds } from '../../lib/authFeedback';
import { AdminShell } from './AdminShell';
import { VIEW_TITLES, type AdminView } from './nav';
import OverviewView from './OverviewView';
import PortfolioView from './PortfolioView';
import AnalyticsView from './AnalyticsView';
import ConnectionView from './ConnectionView';
import AccountView from './AccountView';
import { PasswordInput } from './PasswordInput';
import { Button } from './ui';
import { IconArrowLeft } from './icons';

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
      case 'account':
        return <AccountView session={session} />;
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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const passwordId = useId();
  const errorId = useId();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function validEmail(): string | null {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Masukkan alamat email yang valid.');
      return null;
    }
    return clean;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy || cooldown > 0) return;
    const clean = validEmail();
    if (!clean) return;
    if (!password) {
      setError('Masukkan kata sandi akun Anda.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: clean,
        password,
      });
      if (authError) {
        setError(signInMessage(authError));
        const wait = waitSeconds(authError);
        if (wait) setCooldown(wait);
        return;
      }
      setPassword('');
    } catch {
      setError('Tidak bisa menghubungi server. Periksa sambungan lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  const locked = cooldown > 0;

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
        <p className="page-lede">Masuk dengan email dan kata sandi akun studio.</p>

        <form className="login-form" onSubmit={submit} noValidate>
          <div className="field">
            <div className="field-label">
              <label htmlFor="login-email">Email</label>
            </div>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
              autoComplete="username"
              inputMode="email"
              placeholder="nama@studio.com"
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          <div className="field">
            <div className="field-label">
              <label htmlFor={passwordId}>Kata sandi</label>
            </div>
            <PasswordInput
              id={passwordId}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              autoComplete="current-password"
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          {error ? (
            <p className="field-error login-error" id={errorId} role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="accent" loading={busy} disabled={locked}>
            {locked ? `Coba lagi dalam ${cooldown} detik` : 'Masuk ke meja kerja'}
          </Button>

          <p className="field-hint">
            Lupa kata sandi? Hubungi pengelola situs untuk mengatur ulang.
          </p>
        </form>

        <a className="login-back" href="/">
          <IconArrowLeft size={15} /> Kembali ke situs
        </a>
      </main>

      <p className="login-note">
        Akses hanya untuk pemilik dan staf Toelip Interior. Sesi berakhir saat keluar.
      </p>
    </div>
  );
}

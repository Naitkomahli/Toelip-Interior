import { useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { passwordMessage } from '../../lib/authFeedback';
import { PasswordInput } from './PasswordInput';
import { Button, Notice, ToastRegion, useToasts } from './ui';
import { IconInfo } from './icons';

export default function AccountView({ session }: { session: Session | null }) {
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const email = session?.user.email ?? '';
  const ready = Boolean(supabase && session);
  const verified = Boolean(session?.user.email_confirmed_at);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session || busy) return;
    if (next.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (next !== repeat) {
      setError('Ulangi kata sandi baru dengan tepat.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.updateUser({ password: next });
      if (authError) {
        setError(passwordMessage(authError));
        return;
      }
      setNext('');
      setRepeat('');
      push('Kata sandi diperbarui. Gunakan kata sandi baru saat masuk berikutnya.');
    } catch {
      setError('Tidak bisa menghubungi server. Periksa sambungan lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Akun</p>
          <h1 className="page-title">
            Kunci <em>meja kerja.</em>
          </h1>
          <p className="page-lede">
            Satu akun untuk membuka dashboard. Kata sandi bisa diganti di sini tanpa menunggu
            email.
          </p>
        </div>
      </header>

      {!ready ? (
        <Notice tone="demo" icon={<IconInfo size={18} />}>
          <strong>Mode demo tidak memakai akun.</strong> Hubungkan Supabase untuk mengaktifkan
          login dan pengaturan kata sandi.
        </Notice>
      ) : (
        <div className="account-grid">
          <section className="panel" aria-labelledby="account-identity">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="account-identity">
                  Akun aktif
                </h2>
                <p className="panel-sub">Dipakai untuk membuka dashboard ini.</p>
              </div>
            </div>
            <div className="panel-body account-identity">
              <span className="account-mark" aria-hidden="true">
                {email[0]?.toUpperCase() ?? 'T'}
              </span>
              <div>
                <p className="account-email">{email}</p>
                <p className="account-meta">
                  {verified ? 'Email terverifikasi' : 'Email belum diverifikasi'}
                </p>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="account-password">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="account-password">
                  Ganti kata sandi
                </h2>
                <p className="panel-sub">Minimal 8 karakter. Tidak perlu konfirmasi email.</p>
              </div>
            </div>
            <div className="panel-body">
              <form className="account-form" onSubmit={submit} noValidate>
                <div className="field">
                  <div className="field-label">
                    <label htmlFor="account-next">Kata sandi baru</label>
                  </div>
                  <PasswordInput
                    id="account-next"
                    value={next}
                    onChange={(event) => {
                      setNext(event.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="new-password"
                  />
                </div>
                <div className="field">
                  <div className="field-label">
                    <label htmlFor="account-repeat">Ulangi kata sandi baru</label>
                  </div>
                  <input
                    id="account-repeat"
                    className="input"
                    type="password"
                    value={repeat}
                    onChange={(event) => {
                      setRepeat(event.target.value);
                      if (error) setError('');
                    }}
                    autoComplete="new-password"
                  />
                </div>
                {error ? (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" variant="accent" loading={busy}>
                  Simpan kata sandi
                </Button>
              </form>
            </div>
          </section>
        </div>
      )}

      <ToastRegion toasts={toasts} dismiss={dismiss} />
    </>
  );
}

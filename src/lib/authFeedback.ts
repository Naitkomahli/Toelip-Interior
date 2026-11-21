import type { AuthError } from '@supabase/supabase-js';

export function isRateLimited(error: AuthError): boolean {
  return (
    error.status === 429 ||
    error.code === 'over_request_rate_limit' ||
    error.code === 'over_email_send_rate_limit'
  );
}

export function waitSeconds(error: AuthError): number | null {
  const match = error.message.match(/(\d+)\s*second/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(value, 3600);
}

export function rateLimitMessage(error: AuthError): string {
  const wait = waitSeconds(error);
  if (wait) return `Terlalu banyak percobaan. Coba lagi dalam ${wait} detik.`;
  return 'Batas percobaan sedang tercapai. Coba lagi nanti.';
}

export function signInMessage(error: AuthError): string {
  if (error.code === 'invalid_credentials') {
    return 'Email atau kata sandi salah. Periksa huruf besar kecil dan spasi.';
  }
  if (error.code === 'email_not_confirmed') {
    return 'Akun ini belum dikonfirmasi. Minta pemilik mengaktifkannya di Supabase.';
  }
  if (error.code === 'user_banned') {
    return 'Akun ini dinonaktifkan. Hubungi pemilik meja kerja.';
  }
  if (isRateLimited(error)) return rateLimitMessage(error);
  return 'Masuk gagal. Periksa sambungan lalu coba lagi.';
}

export function passwordMessage(error: AuthError): string {
  if (isRateLimited(error)) return rateLimitMessage(error);
  if (error.name === 'AuthSessionMissingError' || error.code === 'session_not_found') {
    return 'Sesi sudah berakhir. Muat ulang halaman lalu masuk kembali.';
  }
  if (error.code === 'weak_password') {
    return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.';
  }
  if (error.code === 'same_password') {
    return 'Kata sandi baru sama dengan yang sekarang. Pilih kata sandi lain.';
  }
  return 'Kata sandi gagal diperbarui. Coba lagi.';
}

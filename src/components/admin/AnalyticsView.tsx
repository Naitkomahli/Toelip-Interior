import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { AnalyticsPayload, AnalyticsPoint } from '../../lib/types';
import { Notice } from './ui';
import {
  IconAlert,
  IconArrowRight,
  IconChart,
  IconInfo,
  IconRefresh,
} from './icons';

const PERIODS = [
  { days: 1 as const, label: 'Hari ini' },
  { days: 7 as const, label: '7 hari' },
  { days: 30 as const, label: '30 hari' },
];

type State =
  | { status: 'loading'; payload: null; error: '' }
  | { status: 'ready'; payload: AnalyticsPayload; error: '' }
  | { status: 'error'; payload: null; error: string };

export default function AnalyticsView() {
  const [days, setDays] = useState<1 | 7 | 30>(7);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading', payload: null, error: '' });
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', payload: null, error: '' });

    async function load() {
      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            headers.Authorization = `Bearer ${data.session.access_token}`;
          }
        }

        const response = await fetch(`/api/analytics?days=${days}`, { headers });
        const data = (await response.json()) as AnalyticsPayload & { error?: string };

        if (!active) return;

        if (!response.ok) {
          setState({
            status: 'error',
            payload: null,
            error: data.error ?? 'Analitik tidak bisa dibaca.',
          });
          return;
        }

        setState({ status: 'ready', payload: data, error: '' });
        setUpdatedAt(
          new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date())
        );
      } catch {
        if (!active) return;
        setState({
          status: 'error',
          payload: null,
          error: 'Jaringan bermasalah. Analitik tidak bisa dimuat.',
        });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [days, attempt]);

  const payload = state.status === 'ready' ? state.payload : null;
  const loading = state.status === 'loading';
  const periodLabel = PERIODS.find((period) => period.days === days)?.label ?? '7 hari';

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Analitik</p>
          <h1 className="page-title">
            Yang dibaca, <em>bukan ditebak.</em>
          </h1>
          <p className="page-lede">
            Pengunjung situs publik untuk hari ini, tujuh hari, dan tiga puluh hari terakhir.
            Angka berasal dari satu sumber, tanpa data contoh.
          </p>
        </div>
        <div className="page-actions">
          <div className="period-bar" role="group" aria-label="Pilih periode analitik">
            {PERIODS.map((period) => (
              <button
                key={period.days}
                type="button"
                className="period-btn"
                aria-pressed={days === period.days}
                onClick={() => setDays(period.days)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <>
          <div className="analytics-strip" aria-busy="true">
            {[0, 1, 2, 3].map((item) => (
              <div className="stat" key={item}>
                <span className="skeleton-block" style={{ display: 'block', width: 84, height: 10 }} />
                <span
                  className="skeleton-block"
                  style={{ display: 'block', width: 54, height: 30, marginTop: 12 }}
                />
                <span
                  className="skeleton-block"
                  style={{ display: 'block', width: 70, height: 9, marginTop: 9 }}
                />
              </div>
            ))}
          </div>
          <div className="panel chart-panel" aria-busy="true">
            <div className="panel-head">
              <span className="skeleton-block" style={{ width: 140, height: 16 }} />
              <span className="skeleton-block" style={{ width: 80, height: 10 }} />
            </div>
            <div className="chart-body">
              <div className="skeleton-block" style={{ width: '100%', height: 220 }} />
            </div>
          </div>
        </>
      ) : state.status === 'error' ? (
        <div className="panel">
          <div className="analytics-empty">
            <div className="empty-icon">
              <IconAlert size={22} />
            </div>
            <h2>Analitik tidak bisa dibaca</h2>
            <p>{state.error}</p>
            <button className="btn btn-secondary" type="button" onClick={() => setAttempt((value) => value + 1)}>
              <IconRefresh size={16} /> Coba lagi
            </button>
          </div>
        </div>
      ) : payload && !payload.configured ? (
        <div className="panel">
          <div className="analytics-empty">
            <div className="empty-icon">
              <IconChart size={22} />
            </div>
            <h2>Belum ada sumber data</h2>
            <p>
              Halaman ini sengaja tidak menampilkan grafik kosong atau angka contoh. Setelah Umami
              dan Supabase tersambung, data pengunjung asli muncul di sini.
            </p>
            <ol className="setup-list">
              <li>Buat situs di Umami Cloud, lalu salin website ID.</li>
              <li>Buat API key untuk membaca statistik.</li>
              <li>Tambahkan kunci tersebut di Vercel, lalu pasang skrip pelacak di halaman publik.</li>
              <li>Aktifkan Supabase agar data hanya bisa dibaca pemilik.</li>
            </ol>
            <div className="empty-actions">
              <a className="btn btn-accent" href="/admin/koneksi">
                Buka panduan koneksi <IconArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      ) : payload ? (
        payload.error ? (
          <div className="panel">
            <div className="analytics-empty">
              <div className="empty-icon">
                <IconAlert size={22} />
              </div>
              <h2>Data belum bisa dibaca</h2>
              <p>{payload.error}</p>
              <div className="empty-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  <IconRefresh size={16} /> Coba lagi
                </button>
                <a className="btn btn-accent" href="/admin/koneksi">
                  Buka koneksi
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
          <div className="analytics-strip" aria-label={`Ringkasan ${periodLabel}`}>
            <div className="stat">
              <p className="stat-label">Pengunjung</p>
              <p className="stat-value">{formatNumber(payload.visitors)}</p>
              <p className="stat-note">Perangkat unik</p>
            </div>
            <div className="stat">
              <p className="stat-label">Tayangan</p>
              <p className="stat-value">{formatNumber(payload.pageviews)}</p>
              <p className="stat-note">Halaman dibuka</p>
            </div>
            <div className="stat">
              <p className="stat-label">Halaman per orang</p>
              <p className="stat-value">
                {payload.visitors ? (payload.pageviews / payload.visitors).toFixed(1) : '0'}
              </p>
              <p className="stat-note">Rata-rata</p>
            </div>
            <div className="stat">
              <p className="stat-label">Halaman teratas</p>
              <p className="stat-value">{formatNumber(payload.topPages[0]?.value ?? 0)}</p>
              <p className="stat-note">{payload.topPages[0]?.label ?? 'Belum ada data'}</p>
            </div>
          </div>

          <section className="panel chart-panel" aria-labelledby="trend-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="trend-title">
                  Tren kunjungan
                </h2>
                <p className="panel-sub">{periodLabel}, waktu Indonesia bagian barat</p>
              </div>
              <span className="data-source">
                <IconInfo size={14} />
                Umami{updatedAt ? `, ${updatedAt}` : ''}
              </span>
            </div>
            <div className="chart-body">
              {payload.series.length ? (
                <TrendChart series={payload.series} days={payload.days} />
              ) : (
                <div className="chart-empty">
                  <p>Belum ada kunjungan yang tercatat pada periode ini.</p>
                  <span>Pastikan skrip pelacak sudah terpasang di halaman publik.</span>
                </div>
              )}
            </div>
          </section>

          <div className="analytics-lists">
            <section className="panel" aria-labelledby="pages-title">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title" id="pages-title">
                    Halaman teratas
                  </h2>
                  <p className="panel-sub">Dari jumlah tayangan</p>
                </div>
              </div>
              <div className="panel-body">
                <MetricList metrics={payload.topPages} empty="Belum ada halaman yang terbaca." />
              </div>
            </section>

            <section className="panel" aria-labelledby="sources-title">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title" id="sources-title">
                    Sumber kunjungan
                  </h2>
                  <p className="panel-sub">Perujuk dan tautan masuk</p>
                </div>
              </div>
              <div className="panel-body">
                <MetricList metrics={payload.sources} empty="Belum ada sumber yang terbaca." />
              </div>
            </section>
          </div>
          </>
        )
      ) : null}
    </>
  );
}

function MetricList({
  metrics,
  empty,
}: {
  metrics: { label: string; value: number }[];
  empty: string;
}) {
  if (!metrics.length) {
    return <p className="metric-empty">{empty}</p>;
  }
  const max = Math.max(...metrics.map((metric) => metric.value), 1);
  return (
    <div className="metric-list">
      {metrics.map((metric) => (
        <div className="metric-row" key={`${metric.label}-${metric.value}`}>
          <span className="metric-name" title={metric.label}>
            {metric.label || 'Langsung'}
          </span>
          <span className="metric-value">{formatNumber(metric.value)}</span>
          <span className="metric-bar" aria-hidden="true">
            <span style={{ width: `${Math.max(3, (metric.value / max) * 100)}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ series, days }: { series: AnalyticsPoint[]; days: number }) {
  const width = 860;
  const height = 260;
  const pad = { top: 16, right: 14, bottom: 30, left: 38 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...series.map((point) => Math.max(point.pageviews, point.visitors)), 1);
  const step = series.length > 1 ? innerW / (series.length - 1) : 0;
  const x = (index: number) =>
    series.length === 1 ? pad.left + innerW / 2 : pad.left + index * step;
  const y = (value: number) => pad.top + (1 - value / max) * innerH;

  const pageLine = series.map((point, index) => `${x(index)},${y(point.pageviews)}`).join(' ');
  const visitorLine = series.map((point, index) => `${x(index)},${y(point.visitors)}`).join(' ');
  const area = `M ${x(0)} ${pad.top + innerH} L ${series
    .map((point, index) => `${x(index)} ${y(point.pageviews)}`)
    .join(' L ')} L ${x(series.length - 1)} ${pad.top + innerH} Z`;

  const maxLabels = 6;
  const labelEvery = Math.max(1, Math.ceil(series.length / maxLabels));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(max * (1 - ratio)),
    y: pad.top + innerH * ratio,
  }));

  return (
    <figure className="chart-figure">
      <figcaption className="sr-only">
        Grafik garis tayangan halaman dan pengunjung untuk {days === 1 ? 'hari ini' : `${days} hari terakhir`}.
        Tabel data tersedia di bawah grafik.
      </figcaption>
      <div className="chart-wrap">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Grafik tren tayangan halaman dan pengunjung"
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a5a3a" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#7a5a3a" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className="chart-grid">
            {ticks.map((tick) => (
              <line key={tick.y} x1={pad.left} y1={tick.y} x2={width - pad.right} y2={tick.y} />
            ))}
          </g>

          <g className="chart-axis">
            {ticks.map((tick) => (
              <text key={`label-${tick.y}`} x={pad.left - 8} y={tick.y + 3} textAnchor="end">
                {formatNumber(tick.value)}
              </text>
            ))}
            {series.map((point, index) =>
              index % labelEvery === 0 || index === series.length - 1 ? (
                <text
                  key={`x-${point.date}-${index}`}
                  x={x(index)}
                  y={height - 8}
                  textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
                >
                  {formatAxis(point.date, days)}
                </text>
              ) : null
            )}
          </g>

          <path className="chart-area" d={area} />
          <polyline className="chart-line" points={pageLine} />
          <polyline className="chart-line visitors" points={visitorLine} />
          {series.length <= 14
            ? series.map((point, index) => (
                <circle
                  className="chart-dot"
                  key={`dot-${point.date}-${index}`}
                  cx={x(index)}
                  cy={y(point.pageviews)}
                  r={2.6}
                />
              ))
            : null}
        </svg>
      </div>

      <div className="chart-legend">
        <span className="legend-key">
          <span className="legend-line" aria-hidden="true" /> Tayangan halaman
        </span>
        <span className="legend-key">
          <span className="legend-line dashed" aria-hidden="true" /> Pengunjung unik
        </span>
      </div>

      <details className="chart-data">
        <summary>Lihat data tabel</summary>
        <div className="chart-table-wrap">
          <table>
            <caption className="sr-only">Data tren kunjungan</caption>
            <thead>
              <tr>
                <th scope="col">Waktu</th>
                <th scope="col">Tayangan</th>
                <th scope="col">Pengunjung</th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={`row-${point.date}`}>
                  <td>{formatAxis(point.date, days, true)}</td>
                  <td>{formatNumber(point.pageviews)}</td>
                  <td>{formatNumber(point.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatAxis(value: string, days: number, full = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (days === 1) {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: full ? 'short' : 'numeric',
  }).format(date);
}

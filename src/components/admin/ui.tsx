import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IconAlert,
  IconCheck,
  IconInfo,
  IconX,
} from './icons';
import type { ProjectStatus } from '../../lib/types';
import { STATUS_LABELS } from '../../lib/types';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ---------- Buttons ---------- */

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'danger-quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', `btn-${variant}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}

export function IconButton({ label, tone = 'default', className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx('icon-btn', tone === 'danger' && 'danger', className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <svg className="spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Status ---------- */

export function StatusPill({ status }: { status: ProjectStatus }) {
  return <span className={cx('status', `status-${status}`)}>{STATUS_LABELS[status]}</span>;
}

/* ---------- Form field ---------- */

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: string;
  full?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, optional, full, className, children }: FieldProps) {
  return (
    <div className={cx('field', full && 'full', className)}>
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        {optional ? <span className="optional">{optional}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Empty state ---------- */

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}

/* ---------- Dialog behavior ---------- */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialogBehavior(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add('locked');

    const focusTimer = window.setTimeout(() => {
      const target =
        node?.querySelector<HTMLElement>('[data-autofocus]') ??
        node?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('locked');
      previous?.focus?.();
    };
  }, [open, ref]);
}

/* ---------- Drawer ---------- */

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  body: ReactNode;
  footer: ReactNode;
}

export function Drawer({ open, onClose, eyebrow, title, body, footer }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogBehavior(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <section
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="sheet-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="sheet-title" id={titleId}>
              {title}
            </h2>
          </div>
          <IconButton label="Tutup panel" onClick={onClose}>
            <IconX />
          </IconButton>
        </header>
        <div className="sheet-body">{body}</div>
        <footer className="sheet-foot">{footer}</footer>
      </section>
    </div>,
    document.body
  );
}

/* ---------- Confirm dialog ---------- */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Batal',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  useDialogBehavior(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div className="dialog-layer">
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={bodyId}>{body}</p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'accent'}
            onClick={onConfirm}
            loading={busy}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Toasts ---------- */

export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'error';
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const current = timers.current;
    return () => {
      current.forEach((timer) => window.clearTimeout(timer));
      current.clear();
    };
  }, []);

  function dismiss(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }

  function push(message: string, tone: 'success' | 'error' = 'success') {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    const timer = window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4200);
    timers.current.set(id, timer);
  }

  return { toasts, push, dismiss };
}

export function ToastRegion({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className={cx('toast', toast.tone === 'error' && 'error')} key={toast.id}>
          {toast.tone === 'error' ? <IconAlert size={17} /> : <IconCheck size={17} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => dismiss(toast.id)} aria-label="Tutup pemberitahuan">
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Notice ---------- */

interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'demo' | 'error';
  icon?: ReactNode;
  children: ReactNode;
}

export function Notice({ tone = 'info', icon, className, children, ...props }: NoticeProps) {
  return (
    <div className={cx('notice', tone !== 'info' && tone, className)} {...props}>
      {icon ?? <IconInfo size={18} />}
      <div>{children}</div>
    </div>
  );
}

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";

/* ==========================================================================
   Button
   ========================================================================== */

const BUTTON_VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  accent: "btn-accent",
  danger: "btn-danger",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  type = "button",
  disabled,
  ...props
}) {
  const variantCls = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const sizeCls = size === "sm" ? "btn-sm" : "";

  return (
    <button
      type={type}
      className={`${variantCls} ${sizeCls} ${className}`}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ==========================================================================
   IconButton
   ========================================================================== */

export function IconButton({
  label,
  children,
  variant = "default",
  className = "",
  type = "button",
  ...props
}) {
  const tone =
    variant === "danger"
      ? "text-hm-text-subtle hover:bg-hm-danger-soft hover:text-hm-danger"
      : "text-hm-text-subtle hover:bg-hm-surface-2 hover:text-hm-text";

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-hm-sm p-1.5 transition-colors duration-100 ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ==========================================================================
   Modal
   ========================================================================== */

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}) {
  const dialogRef = useRef(null);
  const titleId = useRef(
    `modal-title-${Math.random().toString(36).slice(2, 9)}`,
  ).current;
  const descId = useRef(
    `modal-desc-${Math.random().toString(36).slice(2, 9)}`,
  ).current;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;

    const findInitialFocus = () => {
      const root = dialogRef.current;
      if (!root) return null;
      const fields = root.querySelectorAll(
        'input:not([type="hidden"]), textarea, select',
      );
      if (fields.length) return fields[0];
      return null;
    };

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((el) => !el.disabled && el.offsetParent !== null);

    const firstField = findInitialFocus();
    (firstField || dialogRef.current)?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } max-h-[90vh] overflow-y-auto rounded-hm-lg border border-hm-border bg-hm-surface shadow-hm-elevated focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hm-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-hm-title text-hm-text">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-hm-meta text-hm-text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" onClick={() => onCloseRef.current?.()}>
            <X size={16} />
          </IconButton>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Status
   ========================================================================== */

const STATUS_TONES = {
  green: "badge-success",
  orange: "badge-warning",
  red: "badge-danger",
  blue: "badge-info",
  slate: "badge-neutral",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "badge-neutral",
};

const DOT_TONES = {
  green: "bg-hm-success",
  orange: "bg-hm-warning",
  red: "bg-hm-danger",
  blue: "bg-hm-info",
  slate: "bg-hm-text-subtle",
  success: "bg-hm-success",
  warning: "bg-hm-warning",
  danger: "bg-hm-danger",
  info: "bg-hm-info",
  neutral: "bg-hm-text-subtle",
};

export function Status({ children, tone = "neutral", dot = false }) {
  const cls = STATUS_TONES[tone] || STATUS_TONES.neutral;
  const dotCls = DOT_TONES[tone] || DOT_TONES.neutral;
  return (
    <span className={cls}>
      {dot && <span className={`dot ${dotCls}`} />}
      {children}
    </span>
  );
}

/* ==========================================================================
   Panel
   ========================================================================== */

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "p-4",
}) {
  const hasHeader = title || description || actions;
  return (
    <section className={`panel ${className}`}>
      {hasHeader && (
        <header className="panel-header">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-hm-title text-hm-text">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-hm-meta text-hm-text-muted">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* ==========================================================================
   Form primitives
   ========================================================================== */

export function Input({ className = "", ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Textarea({ className = "", rows = 3, ...props }) {
  return <textarea rows={rows} className={`input ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`input ${className}`} {...props}>
      {children}
    </select>
  );
}

/* ==========================================================================
   Divider
   ========================================================================== */

export function Divider({ className = "" }) {
  return <div className={`divider ${className}`} role="separator" />;
}

/* ==========================================================================
   Toast
   --------------------------------------------------------------------------
   - <ToastProvider> must wrap the app (see App.jsx).
   - Call useToast() anywhere to get { showToast, toasts }.
   - Tones: success | warning | danger | info
   - Auto-dismisses after 4s. Click X to dismiss sooner.
   ========================================================================== */

const ToastContext = React.createContext(null);

const TOAST_TONES = {
  success: {
    accent: "bg-hm-success",
    icon: CheckCircle2,
    iconCls: "text-hm-success",
  },
  warning: {
    accent: "bg-hm-warning",
    icon: AlertTriangle,
    iconCls: "text-hm-warning",
  },
  danger: {
    accent: "bg-hm-danger",
    icon: AlertTriangle,
    iconCls: "text-hm-danger",
  },
  info: {
    accent: "bg-hm-info",
    icon: Info,
    iconCls: "text-hm-info",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const showToast = useCallback(
    (message, tone = "info", duration = 4000) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      // Replace any existing toasts — only one visible at a time.
      setToasts([{ id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = React.useMemo(
    () => ({ showToast, dismiss, toasts }),
    [showToast, dismiss, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const cfg = TOAST_TONES[toast.tone] || TOAST_TONES.info;
  const Icon = cfg.icon;

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-hm-md border border-hm-border bg-hm-surface shadow-hm-elevated"
      style={{
        animation: "toast-in 180ms ease-out",
      }}
    >
      <span className={`w-1 self-stretch ${cfg.accent}`} aria-hidden="true" />
      <div className="flex flex-1 items-start gap-2.5 px-3 py-2.5">
        <Icon size={16} className={`mt-0.5 shrink-0 ${cfg.iconCls}`} />
        <div className="min-w-0 flex-1 text-hm-body text-hm-text">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 rounded-hm-xs p-0.5 text-hm-text-subtle hover:bg-hm-surface-2 hover:text-hm-text"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// Hand-rolled primitives on the semantic token layer (see index.css @theme).
// Colors come from tokens (bg-accent, bg-surface, border-border…), so light/dark
// is automatic — no dark: variants here.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-border bg-surface hover:bg-selection",
  ghost: "hover:bg-selection",
  danger: "text-fail hover:bg-fail/10",
};

const sizes: Record<Size, string> = {
  md: "h-8 px-3",
  icon: "h-8 w-8",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-8 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none placeholder:text-muted focus:border-accent ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

// The one tab style, used app-wide (underline).
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: [T, string][];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border text-sm">
      {tabs.map(([t, label]) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`-mb-px border-b-2 px-3 py-2 ${
            value === t
              ? "border-accent text-fg"
              : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// In-app confirmation. window.confirm is a no-op in the Tauri webview, so
// destructive actions use this instead.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-4 shadow-xl">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Theme-aware logo. Both source PNGs carry the squircle background; the app
// theme follows prefers-color-scheme (Tailwind's default `dark:` variant), so
// we render both and toggle by mode. Small `-inverse` sizes don't exist, so the
// light variant scales the 1024 master down via width/height.
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  const box = { width: size, height: size };
  return (
    <>
      <img
        src="/logo/launchr-1024-inverse.png"
        alt="launchr"
        style={box}
        className={`block dark:hidden ${className}`}
      />
      <img
        src="/logo/launchr-256.png"
        alt="launchr"
        style={box}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}

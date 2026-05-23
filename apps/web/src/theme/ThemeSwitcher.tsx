import { useEffect, useRef, useState } from "react";
import { useTheme } from "./themeContext";
import { THEMES, type ThemeId } from "./themes";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="theme-switcher relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${active.label}`}
        className={`theme-switcher__trigger${compact ? " theme-switcher__trigger--compact" : ""}`}
      >
        <span className="theme-switcher__swatch" data-swatch={active.id} />
        {!compact && (
          <>
            <span className="theme-switcher__label">{active.label}</span>
            <span aria-hidden className="theme-switcher__chev">
              ▾
            </span>
          </>
        )}
      </button>
      {open && (
        <ul role="listbox" className="theme-switcher__menu">
          {THEMES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={t.id === theme}
                onClick={() => {
                  setTheme(t.id as ThemeId);
                  setOpen(false);
                }}
                className="theme-switcher__option"
                data-active={t.id === theme ? "true" : undefined}
              >
                <span className="theme-switcher__swatch" data-swatch={t.id} />
                <span className="theme-switcher__option-text">
                  <span className="theme-switcher__option-label">{t.label}</span>
                  <span className="theme-switcher__option-tagline">{t.tagline}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./themeContext";
import { THEMES, type ThemeId } from "./themes";

export function ThemeSwitcher({
  compact = false,
  menuPlacement = "below",
}: {
  compact?: boolean;
  menuPlacement?: "above" | "below";
}) {
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
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Theme: ${active.label}`}
        className={`theme-switcher__trigger${compact ? " theme-switcher__trigger--compact" : ""}`}
      >
        <span className="theme-switcher__swatch" data-swatch={active.id} aria-hidden />
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
        <div
          role="radiogroup"
          aria-label="Theme options"
          className={`theme-switcher__menu${menuPlacement === "above" ? " theme-switcher__menu--above" : ""}`}
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={t.id === theme}
              onClick={() => {
                setTheme(t.id as ThemeId);
                setOpen(false);
              }}
              className="theme-switcher__option"
              data-active={t.id === theme ? "true" : undefined}
            >
              <span className="theme-switcher__swatch" data-swatch={t.id} aria-hidden />
              <span className="theme-switcher__option-text">
                <span className="theme-switcher__option-label">{t.label}</span>
                <span className="theme-switcher__option-tagline">{t.tagline}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

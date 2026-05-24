import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./themeContext";
import { THEMES, type ThemeId } from "./themes";

type MenuPlacement = "above" | "below";

const VIEWPORT_PADDING = 8;
const MENU_GAP = 8;

function resolvePlacement(
  preferred: MenuPlacement,
  spaceAbove: number,
  spaceBelow: number,
  menuHeight: number,
): MenuPlacement {
  const fitsAbove = menuHeight <= spaceAbove;
  const fitsBelow = menuHeight <= spaceBelow;

  if (preferred === "above") {
    if (fitsAbove) return "above";
    if (fitsBelow) return "below";
    return spaceBelow >= spaceAbove ? "below" : "above";
  }

  if (fitsBelow) return "below";
  if (fitsAbove) return "above";
  return spaceBelow >= spaceAbove ? "below" : "above";
}

function useMenuPosition(
  open: boolean,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
  preferredPlacement: MenuPlacement,
) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function update() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const right = Math.max(VIEWPORT_PADDING, window.innerWidth - rect.right);
      const spaceAbove = Math.max(0, rect.top - VIEWPORT_PADDING - MENU_GAP);
      const spaceBelow = Math.max(
        0,
        window.innerHeight - rect.bottom - VIEWPORT_PADDING - MENU_GAP,
      );
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const placement = resolvePlacement(
        preferredPlacement,
        spaceAbove,
        spaceBelow,
        menuHeight,
      );

      if (placement === "above") {
        setStyle({
          right,
          bottom: window.innerHeight - rect.top + MENU_GAP,
          top: "auto",
          maxHeight: spaceAbove,
          overflowY: menuHeight > spaceAbove ? "auto" : undefined,
        });
      } else {
        setStyle({
          right,
          top: rect.bottom + MENU_GAP,
          bottom: "auto",
          maxHeight: spaceBelow,
          overflowY: menuHeight > spaceBelow ? "auto" : undefined,
        });
      }
    }

    update();

    const menu = menuRef.current;
    const resizeObserver =
      menu && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (menu && resizeObserver) resizeObserver.observe(menu);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, preferredPlacement, triggerRef, menuRef]);

  return style;
}

export function ThemeSwitcher({
  compact = false,
  menuPlacement = "below",
}: {
  compact?: boolean;
  menuPlacement?: MenuPlacement;
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuStyle = useMenuPosition(open, triggerRef, menuRef, menuPlacement);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
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

  const menu = open ? (
    <div
      ref={menuRef}
      role="radiogroup"
      aria-label="Theme options"
      className="theme-switcher__menu theme-switcher__menu--portal"
      style={menuStyle}
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
  ) : null;

  return (
    <div ref={rootRef} className="theme-switcher relative">
      <button
        ref={triggerRef}
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
      {menu && createPortal(menu, document.body)}
    </div>
  );
}

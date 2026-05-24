import { ThemeSwitcher } from "@/theme/ThemeSwitcher";

/** Fixed theme picker for viewports below the desktop nav breakpoint. */
export function ThemeDock() {
  return (
    <div className="theme-dock xl:hidden" aria-label="Theme">
      <ThemeSwitcher compact menuPlacement="above" />
    </div>
  );
}

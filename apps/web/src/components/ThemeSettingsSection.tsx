import { ThemeSwitcher } from "@/theme/ThemeSwitcher";

/** Theme picker for profile and landing — kept out of the global header. */
export function ThemeSettingsSection({ className }: { className?: string }) {
  return (
    <section
      className={`theme-settings ${className ?? ""}`.trim()}
      aria-labelledby="theme-settings-heading"
    >
      <div className="theme-settings__copy">
        <h2 id="theme-settings-heading" className="theme-settings__title">
          Appearance
        </h2>
        <p className="theme-settings__desc">
          Pick how the lobby looks on this device. Your choice is saved locally.
        </p>
      </div>
      <ThemeSwitcher />
    </section>
  );
}

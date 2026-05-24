import type { AuthFlow } from "@/components/auth/authStyles";
import { AUTH_THEME_STYLES } from "@/components/auth/authStyles";
import type { HeaderVariant } from "@/components/ResponsiveHeader";

type AuthFlowTabsProps = {
  flow: AuthFlow;
  setFlow: (flow: AuthFlow) => void;
  variant: HeaderVariant;
};

export function AuthFlowTabs({ flow, setFlow, variant }: AuthFlowTabsProps) {
  const styles = AUTH_THEME_STYLES[variant];

  return (
    <div className={styles.tabs} role="tablist" aria-label="Account access">
      {(
        [
          ["signIn", "Sign in"],
          ["signUp", "Sign up"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={flow === id}
          data-active={flow === id ? "true" : undefined}
          className={`${styles.tab}${flow === id ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setFlow(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

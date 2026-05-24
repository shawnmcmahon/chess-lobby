import type { HeaderVariant } from "@/components/ResponsiveHeader";

export type AuthFlow = "signIn" | "signUp";

export type AuthThemeStyles = {
  tabs: string;
  tab: string;
  tabActive: string;
  input: string;
  passwordToggle?: string;
  checkboxLabel: string;
  checkbox: string;
  infoIcon: string;
  tooltip: string;
  submit: string;
  google: string;
  divider: string;
  verificationPanel?: string;
  verificationCancel?: string;
};

export const AUTH_THEME_STYLES: Record<HeaderVariant, AuthThemeStyles> = {
  default: {
    tabs: "auth-flow-tabs default-tabs",
    tab: "default-tab auth-flow-tab",
    tabActive: "auth-flow-tab--active",
    input: "default-input",
    checkboxLabel: "default-mono flex items-start gap-2 text-sm text-[var(--default-mist)]",
    checkbox: "mt-1 accent-[var(--default-ember)]",
    infoIcon:
      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--default-mist)] text-[0.65rem] leading-none text-[var(--default-mist)]",
    tooltip: "auth-info-tooltip default-mono",
    submit: "default-btn default-btn--primary w-full",
    google: "default-btn default-btn--ghost w-full",
    divider:
      "default-mono my-4 text-center text-xs uppercase tracking-widest text-[var(--default-mist)]",
    verificationCancel:
      "default-mono text-sm text-[var(--default-mist)] hover:text-[var(--default-ember)]",
  },
  bento: {
    tabs: "auth-flow-tabs flex gap-2",
    tab: "bento-mono auth-flow-tab flex-1 rounded-xl px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em]",
    tabActive: "auth-flow-tab--active",
    input: "bento-input",
    checkboxLabel: "bento-mono flex items-start gap-2 text-[0.78rem] opacity-80",
    checkbox: "mt-1 accent-[var(--bento-clay)]",
    infoIcon:
      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[0.65rem] leading-none opacity-70",
    tooltip: "auth-info-tooltip bento-mono",
    submit: "bento-btn bento-btn--jade w-full justify-center",
    google: "bento-btn bento-btn--ghost w-full justify-center",
    divider:
      "bento-mono my-4 text-center text-[0.68rem] uppercase tracking-widest opacity-50",
    verificationCancel: "bento-mono text-[0.78rem] opacity-70 hover:opacity-100",
  },
  brutal: {
    tabs: "auth-flow-tabs flex gap-2",
    tab: "brutal-display auth-flow-tab flex-1 px-3 py-2 text-[0.78rem]",
    tabActive: "auth-flow-tab--active",
    input: "brutal-input",
    checkboxLabel: "brutal-chunk flex items-start gap-2 text-[0.9rem]",
    checkbox: "mt-1 accent-[var(--brutal-magenta)]",
    infoIcon:
      "inline-flex h-5 w-5 shrink-0 items-center justify-center border-2 border-current text-[0.7rem] leading-none",
    tooltip: "auth-info-tooltip brutal-chunk",
    submit: "brutal-btn brutal-btn--magenta w-full",
    google: "brutal-btn brutal-btn--yellow w-full",
    divider:
      "brutal-display my-5 text-center text-[0.75rem] text-[var(--brutal-magenta)]",
    verificationCancel: "brutal-chunk text-[0.9rem] hover:underline",
  },
  atelier: {
    tabs: "auth-flow-tabs flex gap-2",
    tab: "atelier-smallcaps auth-flow-tab flex-1 px-3 py-2 text-[0.68rem]",
    tabActive: "auth-flow-tab--active",
    input: "atelier-input",
    checkboxLabel:
      "flex items-start gap-2 text-sm text-[var(--atelier-parchment-soft)]",
    checkbox: "mt-1 accent-[var(--atelier-brass)]",
    infoIcon:
      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--atelier-brass-dim)] text-[0.65rem] leading-none text-[var(--atelier-brass)]",
    tooltip: "auth-info-tooltip atelier-smallcaps",
    submit: "atelier-btn w-full",
    google: "atelier-btn w-full",
    divider: "atelier-rule my-4",
    verificationCancel: "atelier-smallcaps text-[var(--atelier-brass)]",
  },
};

export type LoginFormProps = {
  flow: AuthFlow;
  setFlow: (flow: AuthFlow) => void;
  verifyEmail: boolean;
  setVerifyEmail: (value: boolean) => void;
  error: string | null;
  pending: boolean;
  isLoading: boolean;
  onEmailSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => void | Promise<void>;
  onForgotPassword?: () => void;
  variant: HeaderVariant;
};

export type EmailVerificationProps = {
  email: string;
  pending: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  variant: HeaderVariant;
};

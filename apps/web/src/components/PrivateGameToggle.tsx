type PrivateGameToggleProps = {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  className?: string;
  labelClassName?: string;
};

export function PrivateGameToggle({
  isPublic,
  onChange,
  className = "",
  labelClassName = "",
}: PrivateGameToggleProps) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 ${className}`}>
      <input
        type="checkbox"
        checked={!isPublic}
        onChange={(e) => onChange(!e.target.checked)}
        className="mt-0.5"
      />
      <span className={labelClassName}>
        Private game (hidden from lobby and spectators)
      </span>
    </label>
  );
}

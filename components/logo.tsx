type LogoProps = {
  size?: number;
  className?: string;
  /** Bracket + slab color */
  color?: string;
  /** Anchor dot color (oxblood) */
  accent?: string;
};

/**
 * The Codal Column — geometric, scales cleanly to 16px (favicon),
 * chosen for nav and app shell.
 */
export function LogoMarkColumn({
  size = 28,
  className,
  color = "currentColor",
  accent = "var(--color-accent)",
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 12 L14 76 L20 76"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M74 12 L74 76 L68 76"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M14 12 L20 12 M74 12 L68 12"
        stroke={color}
        strokeWidth="2.5"
      />
      <rect x="30" y="22" width="9" height="44" fill={color} />
      <path
        d="M30 22 H52 a10 10 0 0 1 10 10 v4 a10 10 0 0 1 -10 10 H30"
        fill={color}
      />
      <circle cx="44" cy="72" r="3" fill={accent} />
    </svg>
  );
}

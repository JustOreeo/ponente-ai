type WordmarkProps = {
  size?: number;
  /** Show the enye-style tilde accent above the wordmark */
  withAccent?: boolean;
  className?: string;
};

export function Wordmark({
  size = 56,
  withAccent = true,
  className,
}: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: "var(--font-serif)",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.025em",
      }}
    >
      Ponente
      {withAccent && (
        <svg
          width={size * 0.22}
          height={size * 0.12}
          viewBox="0 0 22 12"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -size * 0.05,
            left: size * 0.18,
            color: "currentColor",
          }}
        >
          <path
            d="M2 8 Q7 2 11 6 Q15 10 20 4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      )}
    </span>
  );
}

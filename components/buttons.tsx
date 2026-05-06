import type { ButtonHTMLAttributes, ReactNode } from "react";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  small?: boolean;
};

export function BtnPrimary({
  children,
  small,
  className = "",
  ...rest
}: BtnProps) {
  const padding = small ? "px-[14px] py-[7px]" : "px-[18px] py-[11px]";
  const text = small ? "text-[12.5px]" : "text-[13.5px]";
  return (
    <button
      {...rest}
      className={`bg-ink text-parchment border-0 font-sans font-medium tracking-[0.005em] cursor-pointer rounded-[2px] ${padding} ${text} ${className}`}
    >
      {children}
    </button>
  );
}

/** Inverted primary — for use on dark (ink/navy) backgrounds. */
export function BtnLight({
  children,
  small,
  className = "",
  ...rest
}: BtnProps) {
  const padding = small ? "px-[14px] py-[7px]" : "px-[18px] py-[11px]";
  const text = small ? "text-[12.5px]" : "text-[13.5px]";
  return (
    <button
      {...rest}
      className={`bg-parchment text-ink border-0 font-sans font-medium tracking-[0.005em] cursor-pointer rounded-[2px] ${padding} ${text} ${className}`}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  small,
  className = "",
  ...rest
}: BtnProps) {
  const padding = small ? "px-[14px] py-[7px]" : "px-[17px] py-[10px]";
  const text = small ? "text-[12.5px]" : "text-[13.5px]";
  return (
    <button
      {...rest}
      className={`bg-transparent text-ink border border-ink font-sans font-medium cursor-pointer rounded-[2px] ${padding} ${text} ${className}`}
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, className = "", ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`bg-transparent text-muted border-0 px-3 py-[10px] font-sans text-[13.5px] font-medium cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

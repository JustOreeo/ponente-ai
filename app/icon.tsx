import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "edge";

/**
 * Dynamic favicon — renders the Codal Column logo mark via ImageResponse.
 * Stays in sync with the brand without static asset files.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5efe2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 88 88"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bracket frame */}
          <path
            d="M14 12 L14 76 L20 76"
            stroke="#1a2438"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M74 12 L74 76 L68 76"
            stroke="#1a2438"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M14 12 L20 12 M74 12 L68 12"
            stroke="#1a2438"
            strokeWidth="2.5"
            fill="none"
          />
          {/* P glyph */}
          <rect x="30" y="22" width="9" height="44" fill="#1a2438" />
          <path
            d="M30 22 H52 a10 10 0 0 1 10 10 v4 a10 10 0 0 1 -10 10 H30"
            fill="#1a2438"
          />
          {/* Accent dot */}
          <circle cx="44" cy="72" r="3" fill="#8b2a1f" />
        </svg>
      </div>
    ),
    size,
  );
}

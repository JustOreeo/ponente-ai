import { ImageResponse } from "next/og";

export const alt = "Ponente — Manila-built legal AI for Philippine practice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

/**
 * Dynamic Open Graph image — Ponente wordmark + tagline on parchment.
 * Returned as PNG by Next 16 from app/opengraph-image.tsx.
 *
 * NOTE: Satori (the rendering engine) requires every <div> with multiple
 * children to set display: flex|contents|none. Inline text uses <span>.
 */
export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5efe2",
          color: "#1a2438",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top — eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#6b6357",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span style={{ color: "#8b2a1f" }}>●</span>
          <span>Built in Manila for Philippine practice</span>
        </div>

        {/* Middle — headline */}
        <div
          style={{
            display: "flex",
            fontSize: 108,
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            fontWeight: 400,
            color: "#1a2438",
            maxWidth: 1040,
          }}
        >
          <span>
            The legal AI that{" "}
            <span style={{ color: "#8b2a1f", fontStyle: "italic" }}>
              drafts,
            </span>{" "}
            not just answers.
          </span>
        </div>

        {/* Bottom — wordmark + url */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid #d9cfb8",
            paddingTop: 32,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "#1a2438",
            }}
          >
            Ponente
          </span>
          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 22,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#a8884a",
            }}
          >
            ponente.ph
          </span>
        </div>
      </div>
    ),
    size,
  );
}

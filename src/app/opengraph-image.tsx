import { ImageResponse } from "next/og";

export const alt = "Flyin drone map visualizer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://flyin-drone-map-visualizer.vercel.app/";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.35), transparent 34%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
        color: "white",
        padding: "64px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(34,211,238,1), rgba(168,85,247,1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            boxShadow: "0 0 40px rgba(34,211,238,0.35)",
          }}
        >
          ✈
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, letterSpacing: "0.12em", opacity: 0.8 }}>
            FLYIN
          </div>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.05 }}>
            Drone Map Visualizer
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
        <div
          style={{
            flex: 1,
            fontSize: 30,
            lineHeight: 1.35,
            maxWidth: 760,
            color: "rgba(226,232,240,0.92)",
          }}
        >
          Validate maps, inspect zones, and simulate drone movement with a
          modern interactive SVG experience.
        </div>

        <div
          style={{
            padding: "18px 22px",
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(148,163,184,0.25)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minWidth: 260,
          }}
        >
          <div style={{ fontSize: 18, color: "rgba(125,211,252,0.95)" }}>
            42 Network • Education
          </div>
          <div style={{ fontSize: 18, color: "rgba(226,232,240,0.9)" }}>
            {siteUrl.replace(/\/$/, "")}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}

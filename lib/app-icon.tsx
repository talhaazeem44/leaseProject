import { ImageResponse } from "next/og";

const SIDEBAR = "#3a3a36";
const GOLD = "#d4af37";

export function createAppIcon(size: number, { maskable = false } = {}) {
  const padding = maskable ? size * 0.22 : size * 0.1;
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SIDEBAR,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: size - padding * 2,
            height: size - padding * 2,
            borderRadius: size * 0.08,
            border: `${Math.max(2, size * 0.015)}px solid ${GOLD}`,
            color: GOLD,
            fontSize: size * 0.4,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          SE
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}

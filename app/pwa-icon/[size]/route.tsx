import { ImageResponse } from "next/og";

const SIZES = ["192", "512"];

/** Pre-renders both icon sizes at build time. */
export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

/** Renders the PWA icon (an "L." mark in Gestivo brass on dark) as a PNG of the requested size. */
export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  const px = SIZES.includes(size) ? Number(size) : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1613",
          color: "#f2ede6",
          fontSize: px * 0.55,
          fontWeight: 700,
        }}
      >
        L<span style={{ color: "#c89a4e" }}>.</span>
      </div>
    ),
    { width: px, height: px }
  );
}

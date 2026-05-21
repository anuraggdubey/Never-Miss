import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at top left, rgba(176,140,255,0.55), transparent 40%), radial-gradient(circle at bottom right, rgba(111,192,255,0.45), transparent 35%), linear-gradient(180deg, #f5f0ff 0%, #e9e0ff 100%)",
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(237,229,255,0.94))",
            boxShadow: "26px 26px 60px rgba(100,88,145,0.28), -22px -22px 48px rgba(255,255,255,0.9)",
            color: "#7457ff",
            fontSize: 144,
            fontWeight: 700,
          }}
        >
          N
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}

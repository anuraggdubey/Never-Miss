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
          background: "radial-gradient(circle at 20% 20%, rgba(176,140,255,0.65), transparent 38%), radial-gradient(circle at 82% 80%, rgba(111,192,255,0.45), transparent 35%), linear-gradient(180deg, #f6f1ff 0%, #efe8ff 100%)",
        }}
      >
        <div
          style={{
            width: 118,
            height: 118,
            borderRadius: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(240,231,255,0.94))",
            boxShadow: "14px 14px 30px rgba(100,88,145,0.24), -10px -10px 28px rgba(255,255,255,0.9)",
            color: "#7457ff",
            fontSize: 58,
            fontWeight: 700,
          }}
        >
          N
        </div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}

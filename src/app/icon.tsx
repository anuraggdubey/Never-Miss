import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 20% 20%, rgba(176,140,255,0.6), transparent 40%), radial-gradient(circle at 80% 80%, rgba(111,192,255,0.45), transparent 35%), linear-gradient(180deg, #f6f1ff 0%, #efe8ff 100%)",
          borderRadius: "120px",
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(241,233,255,0.95))",
            boxShadow: "30px 30px 60px rgba(100,88,145,0.25), -24px -24px 48px rgba(255,255,255,0.85)",
            color: "#7457ff",
            fontSize: 152,
            fontWeight: 700,
          }}
        >
          N
        </div>
      </div>
    ),
    size,
  );
}

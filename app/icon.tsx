import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
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
          background: "#020604",
          border: "2px solid #1f6b3a",
          color: "#66ff99",
          fontSize: 20,
          fontWeight: 500,
        }}
      >
        ▶
      </div>
    ),
    { ...size },
  );
}

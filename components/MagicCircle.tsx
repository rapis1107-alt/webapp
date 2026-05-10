"use client";

export default function MagicCircle({ size = 280, color = "#6b21a8" }: { size?: number; color?: string }) {
  const isRed = color === "#cc1a1a";

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {/* 紫（外周・順回転） */}
      <img
        src="/circle-purple.png"
        alt=""
        className="magic-circle"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          opacity: isRed ? 0.3 : 0.85,
        }}
      />
      {/* 赤（内周・逆回転） */}
      <img
        src="/circle-red.png"
        alt=""
        className="magic-circle-inner"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          opacity: isRed ? 0.9 : 0.45,
        }}
      />
    </div>
  );
}

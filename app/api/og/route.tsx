import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rank       = searchParams.get("r")  || "E";
  const score      = searchParams.get("s")  || "0";
  const volume     = Number(searchParams.get("v")  || 0);
  const intonation = Number(searchParams.get("i")  || 0);
  const clarity    = Number(searchParams.get("c")  || 0);
  const soul       = Number(searchParams.get("so") || 0);
  const chuni      = Number(searchParams.get("ch") || 0);

  const rankColor =
    rank === "EX" ? "#d4a017" :
    rank === "S"  ? "#ff6a00" :
    rank === "A"  ? "#ff4444" :
    rank === "B"  ? "#b060ff" :
    rank === "C"  ? "#7c9fff" :
    rank === "D"  ? "#66ccaa" : "#aaaaaa"; // E

  const bars = [
    { label: "声量",      value: volume,     color: "#a855f7" },
    { label: "抑揚",      value: intonation, color: "#c084fc" },
    { label: "詠唱安定度", value: clarity,    color: "#818cf8" },
    { label: "魂",        value: soul,       color: "#f87171" },
    { label: "厨二力",    value: chuni,      color: "#fbbf24" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0008",
          padding: "36px 80px",
          position: "relative",
        }}
      >
        {/* 背景グラデーション */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 60% 60% at 50% 45%, ${rankColor}22 0%, transparent 70%)`,
          display: "flex",
        }} />

        {/* アプリ名 */}
        <div style={{
          fontSize: 28,
          color: "#e8e0f0bb",
          letterSpacing: "0.4em",
          marginBottom: 16,
          display: "flex",
        }}>
          詠唱力診断
        </div>

        {/* ランク */}
        <div style={{
          fontSize: 130,
          fontWeight: "bold",
          color: rankColor,
          lineHeight: 1,
          marginBottom: 8,
          display: "flex",
          textShadow: `0 0 80px ${rankColor}cc`,
        }}>
          {rank}
        </div>

        {/* スコア */}
        <div style={{
          fontSize: 48,
          fontWeight: "bold",
          color: "#ffffff",
          marginBottom: 36,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}>
          {score}
          <span style={{ fontSize: 24, color: "#e8e0f077", display: "flex" }}>/ 100</span>
        </div>

        {/* スコアバー */}
        <div style={{ width: "90%", display: "flex", flexDirection: "column", gap: 16 }}>
          {bars.map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
                fontSize: 20,
                color: "#e8e0f0dd",
                width: 110,
                textAlign: "right",
                display: "flex",
                justifyContent: "flex-end",
              }}>
                {label}
              </div>
              <div style={{
                flex: 1,
                height: 20,
                background: "#e8e0f01a",
                borderRadius: 10,
                display: "flex",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${value}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 10,
                  display: "flex",
                }} />
              </div>
              <div style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#ffffff",
                width: 36,
                display: "flex",
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ハッシュタグ */}
        <div style={{
          position: "absolute",
          bottom: 22,
          fontSize: 18,
          color: "#e8e0f055",
          display: "flex",
        }}>
          #詠唱力診断
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

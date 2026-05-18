import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rank      = searchParams.get("r")  || "E";
  const score     = searchParams.get("s")  || "0";
  const title     = searchParams.get("t")  || "";
  const volume    = Number(searchParams.get("v")  || 0);
  const intonation= Number(searchParams.get("i")  || 0);
  const clarity   = Number(searchParams.get("c")  || 0);
  const soul      = Number(searchParams.get("so") || 0);
  const chuni     = Number(searchParams.get("ch") || 0);
  const chantTitle= searchParams.get("ct") || "";

  const rankColor =
    rank === "EX" ? "#d4a017" :
    rank === "S"  ? "#ff6a00" :
    rank === "A"  ? "#cc1a1a" :
    rank === "B"  ? "#9333ea" :
    rank === "C"  ? "#6b21a8" : "#555555";

  const bars = [
    { label: "声量",      value: volume,     color: "#6b21a8" },
    { label: "抑揚",      value: intonation, color: "#9333ea" },
    { label: "詠唱安定度", value: clarity,    color: "#7c3aed" },
    { label: "魂",        value: soul,       color: "#cc1a1a" },
    { label: "厨二力",    value: chuni,      color: "#d4a017" },
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
          padding: "40px 60px",
          position: "relative",
        }}
      >
        {/* 背景グラデーション */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, #1a001866 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* アプリ名 */}
        <div style={{ fontSize: 18, color: "#e8e0f055", letterSpacing: "0.3em", marginBottom: 12, display: "flex" }}>
          詠唱力診断
        </div>

        {/* 詠唱名 */}
        {chantTitle && (
          <div style={{ fontSize: 15, color: "#e8e0f044", marginBottom: 20, display: "flex" }}>
            詠唱：{chantTitle}
          </div>
        )}

        {/* ランク */}
        <div style={{
          fontSize: 110,
          fontWeight: "bold",
          color: rankColor,
          lineHeight: 1,
          marginBottom: 6,
          display: "flex",
          textShadow: `0 0 60px ${rankColor}`,
        }}>
          {rank}
        </div>

        {/* 称号 */}
        <div style={{ fontSize: 26, fontWeight: "bold", color: "#d4a017", marginBottom: 6, display: "flex" }}>
          {title}
        </div>

        {/* スコア */}
        <div style={{ fontSize: 38, fontWeight: "bold", color: "#e8e0f0", marginBottom: 32, display: "flex", alignItems: "baseline", gap: 8 }}>
          {score}
          <span style={{ fontSize: 18, color: "#e8e0f066", display: "flex" }}>/ 100</span>
        </div>

        {/* スコアバー */}
        <div style={{ width: "85%", display: "flex", flexDirection: "column", gap: 14 }}>
          {bars.map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 13, color: "#e8e0f0bb", width: 80, textAlign: "right", display: "flex", justifyContent: "flex-end" }}>
                {label}
              </div>
              <div style={{ flex: 1, height: 13, background: "#e8e0f01a", borderRadius: 8, display: "flex", overflow: "hidden" }}>
                <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 8, display: "flex" }} />
              </div>
              <div style={{ fontSize: 13, color: "#e8e0f0bb", width: 28, display: "flex" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ハッシュタグ */}
        <div style={{ position: "absolute", bottom: 20, fontSize: 14, color: "#e8e0f033", display: "flex" }}>
          #詠唱力診断
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

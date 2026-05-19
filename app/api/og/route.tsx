import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rank       = searchParams.get("r")  || "E";
  const score      = searchParams.get("s")  || "0";
  const title      = searchParams.get("t")  || "";
  const chantName  = searchParams.get("cn") || "";
  const volume     = Number(searchParams.get("v")  || 0);
  const intonation = Number(searchParams.get("i")  || 0);
  const clarity    = Number(searchParams.get("c")  || 0);
  const soul       = Number(searchParams.get("so") || 0);
  const chuni      = Number(searchParams.get("ch") || 0);

  const rankColor =
    rank === "EX" ? "#d4a017" :
    rank === "SS" ? "#ffcc00" :
    rank === "S"  ? "#ff6a00" :
    rank === "A"  ? "#ff4444" :
    rank === "B"  ? "#b060ff" :
    rank === "C"  ? "#7c9fff" :
    rank === "D"  ? "#66ccaa" : "#aaaaaa";

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
          flexDirection: "row",
          background: "#0a0008",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景グラデーション */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 80% 80% at 30% 50%, ${rankColor}1a 0%, transparent 65%)`,
          display: "flex",
        }} />

        {/* 左カラム：ランク・称号・スコア */}
        <div style={{
          width: "42%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 30px 40px 50px",
          gap: 0,
        }}>
          {/* アプリ名 */}
          <div style={{
            fontSize: 20,
            color: "#e8e0f077",
            letterSpacing: "0.35em",
            marginBottom: 12,
            display: "flex",
          }}>
            詠唱力診断
          </div>

          {/* 呪文名 */}
          {chantName && (
            <div style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#ffffff",
              textAlign: "center",
              marginBottom: 12,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              lineHeight: 1.3,
              padding: "4px 12px",
              borderRadius: 8,
              border: `1px solid ${rankColor}88`,
              background: `${rankColor}22`,
            }}>
              {chantName}
            </div>
          )}

          {/* ランク */}
          <div style={{
            fontSize: 140,
            fontWeight: "bold",
            color: rankColor,
            lineHeight: 1,
            display: "flex",
            textShadow: `0 0 80px ${rankColor}cc`,
          }}>
            {rank}
          </div>

          {/* スコア */}
          <div style={{
            fontSize: 36,
            fontWeight: "bold",
            color: "#ffffff",
            marginTop: 8,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}>
            {score}
            <span style={{ fontSize: 20, color: "#e8e0f066", display: "flex" }}>/ 100</span>
          </div>

          {/* 称号 */}
          {title && (
            <div style={{
              marginTop: 20,
              fontSize: 26,
              fontWeight: "bold",
              color: "#d4a017",
              textAlign: "center",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              lineHeight: 1.4,
            }}>
              『{title}』
            </div>
          )}
        </div>

        {/* 縦区切り線 */}
        <div style={{
          width: 1,
          background: `${rankColor}44`,
          margin: "50px 0",
          display: "flex",
        }} />

        {/* 右カラム：スコアバー */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px 50px 40px 40px",
          gap: 20,
        }}>
          {bars.map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                fontSize: 20,
                color: "#e8e0f0cc",
                width: 110,
                textAlign: "right",
                display: "flex",
                justifyContent: "flex-end",
              }}>
                {label}
              </div>
              <div style={{
                flex: 1,
                height: 22,
                background: "#e8e0f015",
                borderRadius: 11,
                display: "flex",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${value}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 11,
                  display: "flex",
                }} />
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#ffffff",
                width: 40,
                display: "flex",
                justifyContent: "flex-end",
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ハッシュタグ */}
        <div style={{
          position: "absolute",
          bottom: 18,
          right: 30,
          fontSize: 16,
          color: "#e8e0f044",
          display: "flex",
        }}>
          #詠唱力診断
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

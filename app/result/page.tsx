import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://webapp-6bdo.vercel.app";

type SearchParams = {
  r?: string; s?: string; t?: string;
  v?: string; i?: string; c?: string;
  so?: string; ch?: string; ct?: string;
};

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const rank  = p.r  || "E";
  const score = p.s  || "0";
  const title = p.t  || "";

  const qs = new URLSearchParams(p as Record<string, string>).toString();
  const ogImage = `${SITE_URL}/api/og?${qs}`;
  const pageUrl = `${SITE_URL}/result?${qs}`;

  return {
    title: `詠唱ランク${rank}・${title} | 詠唱力診断`,
    description: `詠唱力診断の結果：ランク${rank}、${score}点、称号「${title}」。あなたも詠唱力を試してみよう。`,
    openGraph: {
      title: `詠唱ランク${rank}・${title}`,
      description: `ランク${rank} / ${score}点 / ${title}`,
      url: pageUrl,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `詠唱ランク${rank}・${title}`,
      description: `ランク${rank} / ${score}点 / ${title}`,
      images: [ogImage],
    },
  };
}

export default async function ResultPage({ searchParams }: Props) {
  const p = await searchParams;
  const rank  = p.r  || "E";
  const score = p.s  || "0";
  const title = p.t  || "";

  const rankColor =
    rank === "EX" ? "#d4a017" :
    rank === "S"  ? "#ff6a00" :
    rank === "A"  ? "#cc1a1a" :
    rank === "B"  ? "#9333ea" :
    rank === "C"  ? "#6b21a8" : "#555555";

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 text-center" style={{ color: "#e8e0f0", background: "#0a0008" }}>
      <p className="text-xs opacity-40 tracking-widest mb-6">詠唱力診断　結果</p>

      <div className="text-8xl font-bold mb-2" style={{ color: rankColor, textShadow: `0 0 40px ${rankColor}` }}>
        {rank}
      </div>
      <p className="text-xl font-bold mb-1" style={{ color: "#d4a017" }}>{title}</p>
      <p className="text-3xl font-bold mb-12" style={{ color: rankColor }}>
        {score} <span className="text-base opacity-50">/ 100</span>
      </p>

      <Link
        href="/"
        className="px-8 py-4 rounded-full font-bold tracking-widest text-sm"
        style={{ background: "linear-gradient(135deg, #6b21a8, #cc1a1a)", color: "#e8e0f0" }}
      >
        自分も詠唱力を診断する
      </Link>
    </main>
  );
}

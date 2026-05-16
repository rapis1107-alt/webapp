import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";
import GoogleAdSense from "../components/GoogleAdSense";

const SITE_URL = "https://webapp-6bdo.vercel.app";

export const metadata: Metadata = {
  title: "詠唱力診断",
  description: "マイクに向かって呪文を詠唱し、声量・抑揚・詠唱安定度・魂をAIが診断。あなたの詠唱力ランクはEからEXまで。厨二病全開で挑め！",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  keywords: ["詠唱力診断", "詠唱", "呪文", "厨二病", "魔法", "声診断", "マイク", "ランク", "ゲーム"],
  openGraph: {
    title: "詠唱力診断",
    description: "マイクに向かって呪文を詠唱し、声量・抑揚・魂をAIが診断。あなたの詠唱ランクはEからEXまで。",
    url: SITE_URL,
    siteName: "詠唱力診断",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "詠唱力診断",
    description: "マイクに向かって呪文を詠唱し、声量・抑揚・魂をAIが診断。あなたの詠唱ランクはEからEXまで。",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <GoogleAdSense />
        {children}
        <footer className="w-full text-center py-4 mt-auto" style={{ borderTop: "1px solid #ffffff0a" }}>
          <nav className="flex justify-center gap-6 text-xs opacity-30 hover:opacity-50 transition-opacity">
            <Link href="/about" className="hover:opacity-80">詠唱力診断とは</Link>
            <Link href="/privacy" className="hover:opacity-80">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:opacity-80">お問い合わせ</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}

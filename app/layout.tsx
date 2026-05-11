import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";
import GoogleAdSense from "../components/GoogleAdSense";

export const metadata: Metadata = {
  title: "詠唱力診断",
  description: "汝の詠唱力を今こそ証明せよ",
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

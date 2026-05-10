import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "詠唱力診断",
  description: "汝の詠唱力を今こそ証明せよ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

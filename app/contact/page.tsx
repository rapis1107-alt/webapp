import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "お問い合わせ | 詠唱力診断",
};

export default function ContactPage() {
  return (
    <main className="min-h-dvh px-6 py-12 max-w-2xl mx-auto" style={{ color: "#e8e0f0" }}>
      <Link href="/" className="text-xs opacity-50 hover:opacity-80 transition-opacity mb-8 inline-block">
        ← トップへ戻る
      </Link>

      <h1 className="text-2xl font-bold mb-8" style={{ color: "#d4a017" }}>
        お問い合わせ
      </h1>

      <div className="space-y-6 text-sm leading-relaxed opacity-80">
        <p>
          バグ報告・ご意見・ご要望・プライバシーポリシーに関するご質問など、
          以下の方法よりお気軽にお問い合わせください。
        </p>

        <div
          className="rounded-xl p-6"
          style={{ background: "#1a0028", border: "1px solid #6b21a833" }}
        >
          <p className="text-xs opacity-50 tracking-widest mb-1">メール</p>
          <a
            href="mailto:customer@lapisworks.jp"
            className="font-bold hover:opacity-80 transition-opacity"
            style={{ color: "#9333ea" }}
          >
            customer@lapisworks.jp
          </a>
        </div>

        <p className="text-xs opacity-40">
          ※ 返信にお時間をいただく場合がございます。ご了承ください。
        </p>
      </div>
    </main>
  );
}

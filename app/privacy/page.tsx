import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 詠唱力診断",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh px-6 py-12 max-w-2xl mx-auto" style={{ color: "#e8e0f0" }}>
      <Link href="/" className="text-xs opacity-50 hover:opacity-80 transition-opacity mb-8 inline-block">
        ← トップへ戻る
      </Link>

      <h1 className="text-2xl font-bold mb-8" style={{ color: "#d4a017" }}>
        プライバシーポリシー
      </h1>

      <div className="space-y-8 text-sm leading-relaxed opacity-80">

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>はじめに</h2>
          <p>
            詠唱力診断（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
            個人情報の保護に努めます。本ポリシーは、本サービスにおける情報の収集・利用方針について定めます。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>収集する情報</h2>
          <p>本サービスは以下の情報を収集します。</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>アクセスログ（IPアドレス、ブラウザ種別、参照元URLなど）</li>
            <li>サービス利用状況（診断回数、結果のランク、シェア操作など）</li>
            <li>Cookie およびローカルストレージに保存された情報</li>
          </ul>
          <p className="mt-2">
            なお、マイクから取得した音声データはすべてお使いのデバイス上でのみ処理され、
            外部サーバーへ送信・保存されることはありません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>Google Analytics について</h2>
          <p>
            本サービスはアクセス解析のために Google Analytics を使用しています。
            Google Analytics は Cookie を利用してデータを収集します。
            収集されるデータは匿名であり、個人を特定するものではありません。
          </p>
          <p className="mt-2">
            Google Analytics の利用規約・プライバシーポリシーについては
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1"
              style={{ color: "#9333ea" }}
            >
              Google のプライバシーポリシー
            </a>
            をご確認ください。
            オプトアウトをご希望の場合は
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1"
              style={{ color: "#9333ea" }}
            >
              Google Analytics オプトアウト アドオン
            </a>
            をご利用ください。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>Google AdSense について</h2>
          <p>
            本サービスは広告配信のために Google AdSense を使用しています。
            Google AdSense は Cookie を使用してユーザーの興味に基づいた広告を表示します。
            広告配信に使用される Cookie により個人が特定されることはありません。
          </p>
          <p className="mt-2">
            Google の広告に関する詳細やオプトアウト方法については
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1"
              style={{ color: "#9333ea" }}
            >
              広告に関するポリシー
            </a>
            をご参照ください。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>Cookie について</h2>
          <p>
            本サービスは Cookie を使用します。ブラウザの設定により Cookie を無効にすることが可能ですが、
            一部機能が正常に動作しない場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>第三者へのデータ提供</h2>
          <p>
            本サービスは、法令に基づく場合を除き、収集した情報を第三者に提供しません。
            ただし、Google Analytics および Google AdSense によるデータの利用については
            各社のプライバシーポリシーに従います。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>本ポリシーの変更</h2>
          <p>
            本サービスは必要に応じて本ポリシーを変更することがあります。
            変更後のポリシーは本ページに掲載した時点から効力を生じます。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>お問い合わせ</h2>
          <p>
            本ポリシーに関するご質問は
            <Link href="/contact" className="underline ml-1" style={{ color: "#9333ea" }}>
              お問い合わせページ
            </Link>
            よりご連絡ください。
          </p>
        </section>

        <p className="text-xs opacity-40 pt-4">最終更新：2026年5月</p>
      </div>
    </main>
  );
}

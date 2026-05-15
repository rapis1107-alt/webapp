import type { Metadata } from "next";
import Link from "next/link";
import AdBanner from "../../components/AdBanner";

export const metadata: Metadata = {
  title: "詠唱力診断とは | 詠唱力診断",
  description: "詠唱力診断の遊び方・概要・判定基準について解説します。",
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh px-6 py-12 max-w-2xl mx-auto" style={{ color: "#e8e0f0" }}>
      <Link href="/" className="text-xs opacity-50 hover:opacity-80 transition-opacity mb-8 inline-block">
        ← トップへ戻る
      </Link>

      <h1 className="text-2xl font-bold mb-8" style={{ color: "#d4a017" }}>
        詠唱力診断とは
      </h1>

      <div className="space-y-10 text-sm leading-relaxed opacity-80">

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>概要</h2>
          <p>
            「詠唱力診断」は、画面に表示された呪文（詠唱文）をマイクに向かって読み上げ、
            その声を解析してあなたの「詠唱力」を診断するWebアプリです。
            声量・抑揚・詠唱安定度・魂の4軸でスコアを算出し、EX〜Eまで7段階のランクと称号を授与します。
          </p>
          <p className="mt-2">
            診断はすべてブラウザ上で完結し、音声データが外部サーバーへ送信されることはありません。
            スマートフォン・PCどちらからでも無料でお楽しみいただけます。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>遊び方</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>「診断開始」ボタンを押す</li>
            <li>マイクへのアクセス許可を求められたら「許可」を選択する</li>
            <li>画面に表示された呪文を、カウントダウンが終わったら声に出して読み上げる</li>
            <li>読み終わったら「詠唱完了」ボタンを押す（最大10秒で自動停止）</li>
            <li>解析が完了するとランク・スコア・称号が表示される</li>
            <li>結果をXにシェアしたり、画像として保存することができる</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>詠唱文の種類</h2>
          <p>
            診断で使用される呪文はEASY・NORMAL・HARD・EXPERTの4段階の難易度に分かれており、
            ランダムに出題されます。同じ呪文が連続して出題されることはないため、
            何度でも異なる詠唱に挑戦できます。
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><span style={{ color: "#4ade80" }}>EASY</span>：短い呪文。初めての方でも安心</li>
            <li><span style={{ color: "#9333ea" }}>NORMAL</span>：標準的な長さ。声量と抑揚が問われる</li>
            <li><span style={{ color: "#cc1a1a" }}>HARD</span>：長く難解な呪文。詠唱安定度が鍵</li>
            <li><span style={{ color: "#d4a017" }}>EXPERT</span>：最高難度。魂を込めた詠唱が求められる</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>判定基準</h2>
          <p>以下の4項目をもとにスコアを算出します。</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl p-4" style={{ background: "#1a0028", border: "1px solid #6b21a833" }}>
              <p className="font-bold mb-1">声量</p>
              <p className="text-xs opacity-60">マイクに入力される音声の大きさを測定します。しっかりとした声で読み上げることが高得点への近道です。</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#1a0028", border: "1px solid #6b21a833" }}>
              <p className="font-bold mb-1">抑揚</p>
              <p className="text-xs opacity-60">声の強弱・変化を測定します。単調な棒読みではなく、感情を込めた読み上げが評価されます。</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#1a0028", border: "1px solid #6b21a833" }}>
              <p className="font-bold mb-1">詠唱安定度</p>
              <p className="text-xs opacity-60">詠唱中の無音区間を分析します。自然な間は問題ありませんが、長すぎる沈黙はペナルティになります。</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#1a0028", border: "1px solid #6b21a833" }}>
              <p className="font-bold mb-1">魂</p>
              <p className="text-xs opacity-60">声量・抑揚・詠唱安定度を総合した「魂の込め方」を測定する独自の指標です。</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>ランク一覧</h2>
          <div className="space-y-2">
            {[
              { rank: "EX", color: "#d4a017", desc: "究極の詠唱者のみに与えられる最高ランク" },
              { rank: "S",  color: "#ff6a00", desc: "一流の詠唱使いとして認められたランク" },
              { rank: "A",  color: "#cc1a1a", desc: "高い詠唱力を持つ上位ランク" },
              { rank: "B",  color: "#9333ea", desc: "平均以上の詠唱力を持つランク" },
              { rank: "C",  color: "#6b21a8", desc: "基本的な詠唱力を持つランク" },
              { rank: "D",  color: "#666",    desc: "詠唱失敗。もう一度挑戦せよ" },
              { rank: "E",  color: "#444",    desc: "魔力反応なし。声が届かなかった" },
            ].map(({ rank, color, desc }) => (
              <div key={rank} className="flex items-center gap-3">
                <span className="text-lg font-bold w-8 text-center" style={{ color }}>{rank}</span>
                <span className="text-xs opacity-60">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold mb-3" style={{ color: "#9333ea" }}>注意事項</h2>
          <ul className="list-disc list-inside space-y-1 text-xs opacity-60">
            <li>マイクの使用許可が必要です。許可しない場合、診断を利用できません。</li>
            <li>音声データはお使いのデバイス内でのみ処理されます。外部への送信は一切行いません。</li>
            <li>静かな環境での利用を推奨します。周囲の騒音が判定に影響する場合があります。</li>
            <li>本サービスはエンターテインメント目的であり、科学的な診断ではありません。</li>
            <li>マイクの性能やブラウザの種類によって判定結果が異なる場合があります。</li>
          </ul>
        </section>

        <div className="pt-4">
          <AdBanner slot="ABOUT_PAGE_SLOT" />
        </div>
      </div>
    </main>
  );
}

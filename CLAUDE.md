# 詠唱力診断 — Claude 作業アーカイブ

このファイルはClaude Codeが自動読み込みするプロジェクト仕様書。作業のたびに更新すること。

---

## 基本情報

- **本番URL**: https://webapp-6bdo.vercel.app
- **リポジトリ**: github.com/rapis1107-alt/webapp
- **デプロイ**: GitHub main push → Vercel 自動デプロイ（1〜2分）
- **公開日**: 2026-05-19

---

## 技術スタック

Next.js 16（App Router）+ TypeScript / Web Audio API / Vercel / Google Analytics / AdSense / Search Console

---

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `app/page.tsx` | 全画面（録音・分析・結果）メインコンポーネント |
| `app/result/page.tsx` | OGP付きシェア専用結果ページ |
| `app/api/og/route.tsx` | 動的OGP画像生成（1200×630px, edge runtime） |
| `lib/scoring.ts` | スコアリングロジック全体 |
| `data/chants.ts` | 呪文データ24本（難易度別6本ずつ） |
| `data/titles.ts` | ランク別称号（各5種、E〜EX） |
| `data/comments.ts` | ランク別コメント・指標コメント |

---

## 画面遷移

```
top → permission → countdown → recording → analyzing → result / error
```

---

## スコアリング仕様（lib/scoring.ts）

### 指標
- **声量**: avgVolume を非線形piecewiseで0〜100に変換
- **抑揚**: volumeVariance を normalize(0.02, 0.12)。声量<0.02なら×0.4
- **詠唱安定度**: 基点60 + speakingRatioボーナス - 2秒以上の無音のみ-15/回（2秒未満は演技的な間として無視）
- **魂**: intonation×0.50 + clarity×0.25 + duration×0.15 + volume×0.10
- **厨二力**: intonation×0.45 + duration×0.25 + clarity×0.20 + random×10

### 総合スコア重み
`volume×0.12 + intonation×0.30 + duration×0.22 + clarity×0.22 + soul×0.14`

### ランク閾値（2026-05-20 更新）
| ランク | 閾値 |
|--------|------|
| EX | ≥93 |
| SS | ≥86 |
| S  | ≥78 |
| A  | ≥68 |
| B  | ≥50 |
| C  | ≥35 |
| D  | ≥22 |
| E  | <22  |

### スコアキャップ
- 達成率: <0.40→21 / <0.60→34 / <0.75→49 / <0.90→67
- 声量: <30→21 / <40→34
- 抑揚: <40→67（上限B） / <55→77（上限A）

### ランク足切り条件（getRank内）
- EX: intonation≥88, duration≥90, clarity≥88, volume≥100（未達→SS）
- SS: intonation≥80, duration≥85, clarity≥85, volume≥90（未達→S）
- S: intonation≥65, duration≥80, clarity≥80, volume≥80（未達→A）
- A: intonation≥55, duration≥70, clarity≥70, volume≥70（未達→B）
- B: volume<60→C / C: volume<50→D / D: volume<40→E

### 早押し補正
`userCompleted && duration >= expectedSeconds*0.5` のとき `effectiveExpected = duration`（残り時間で減点しない）

---

## 結果画面（ResultScreen）

1. 使用した詠唱名 + 難易度バッジ
2. 魔法陣（ランクカラー発光）
3. ランク + スコア + 称号
4. 結果コメント
5. スコアバー5本（各指標コメント付き）
6. 次ランク昇格条件チェックリスト（EX以外全ランクで表示）
7. Xシェア / 画像保存 / もう一度 ボタン

### 昇格チェックリストのスコア条件（上記ランク閾値に対応）
- E→D: スコア22 / D→C: 35 / C→B: 50 / B→A: 68
- A→S: 78, S→SS: 86, SS→EX: 93
- S以上は「詠唱完了ボタンで終了」チェック項目あり

---

## Xシェア仕様

### 現在の実装（フリーズ対策済み）
```js
window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank", "noreferrer");
```
モバイル・PC共通でウェブURLを `_blank` で開く。iOSのユニバーサルリンクがXアプリへ誘導。

**過去のフリーズ原因**: `twitter://` カスタムスキームがiOSでアプリ切替時にSafariをフリーズさせる。`a.click()` でページ遷移させると現ページが死ぬ。どちらも廃止済み。再導入禁止。

### シェアURL形式（短縮済み）
`/result?r={rank}&s={score}&cn={chantId}&v={volume}&i={intonation}&c={clarity}&so={soul}&ch={chuni}`

### 投稿文
```
【詠唱力診断】

詠唱：{呪文名}
我が称号は『{称号}』
魔導ランク：{ランク}
総合詠唱力：{スコア}点

声量 / 抑揚 / 詠唱安定度 / 魂 / 厨二力

{煽り文（ランダム20種・連続同一防止）}

https://...
#詠唱力診断
```

### OGP画像（/api/og）
- 2カラム：左（アプリ名・呪文名・ランク・スコア）、右（5指標バー）
- 背景にランダム魔法陣（circle-purple.png / circle-red.png）
- 称号はURLに含めず（`cn=`呪文IDからルックアップ）

### Canvas保存画像（600×560px）
- 背景に魔法陣、呪文名・ランク・称号・スコア・コメント・バー
- `Image.onload`はsrc設定前にセット（キャッシュ対応）、3秒タイムアウト保険あり

---

## Xインアプリブラウザ対策

UA「Twitter」検出時に全画面オーバーレイ表示。「ブラウザで開く」を案内。「このまま使う」で閉じられる。

---

## 過去の主なバグと対策（再発防止）

| バグ | 原因 | 対策 |
|------|------|------|
| Xシェアでフリーズ（複数回） | `twitter://`スキームまたは`a.click()`でページ遷移 | 常に`window.open(_blank)`＋ウェブURL固定 |
| チェックリストに間違うランクの条件が出る | 古いキャッシュ or コード誤り | `nextRankConfig[result.rank]`でIIFE参照 |
| 呪文名がCanvas/OGPに出ない | onload設定タイミング / t=パラメータ削除後の残参照 | src前にハンドラセット / cn=で呪文ID渡してOGP側でルックアップ |
| titles.tsにEX重複 | Write時に既存エントリを消さず追記 | ファイル全体をWriteで上書き確認 |

---

## SEO・計測

- google-site-verification メタタグ（削除禁止）
- OGP / Twitter Card / canonical / sitemap / robots 設定済み
- GAイベント: `chant_start` / `chant_result` / `share_click`
- インデックス登録リクエスト済み（2026-05-16）。サイトマップ「取得不可」表示は Google 側の既知バグで実害なし。

---

## 残課題

- 検索インデックス反映待ち

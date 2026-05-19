# 詠唱力診断 — Claude 作業アーカイブ

このファイルはClaude Codeが自動読み込みするプロジェクト仕様書。
作業のたびに更新すること。

---

## 基本情報

- **本番URL**: https://webapp-6bdo.vercel.app
- **リポジトリ**: github.com/rapis1107-alt/webapp
- **デプロイ**: GitHub main push → Vercel 自動デプロイ（1〜2分）
- **公開日**: 2026-05-19

---

## アプリ概要

マイクに向かって呪文を詠唱し、声量・抑揚・詠唱安定度・魂・厨二力をスコアリングするエンタメWebアプリ。ランクはE〜EX。

---

## 技術スタック

- Next.js 16（App Router）+ TypeScript
- Web Audio API（AnalyserNode / MediaRecorder）
- Vercel デプロイ
- Google Analytics（`gtagEvent` でイベント計測）
- Google AdSense
- Google Search Console（HTMLタグ方式で所有権確認済み）

---

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `app/page.tsx` | メインコンポーネント（録音・分析・結果画面すべて） |
| `app/result/page.tsx` | OGP付きシェア専用結果ページ |
| `app/api/og/route.tsx` | 動的OGP画像生成API（1200×630px） |
| `lib/scoring.ts` | スコアリングロジック全体 |
| `data/chants.ts` | 呪文データ24本 |
| `data/titles.ts` | ランク別称号（各5種） |
| `data/comments.ts` | ランク別コメント・指標コメント |
| `app/layout.tsx` | SEOメタデータ・OGP・GA |
| `app/about/page.tsx` | 詠唱力診断とはページ |
| `app/sitemap.ts` | Googleサイトマップ |
| `app/robots.ts` | robots.txt |

---

## 画面遷移

```
top → permission → countdown → recording → analyzing → result / error
```

---

## 呪文データ（data/chants.ts）

24本（難易度別6本ずつ）

| 難易度 | expectedSeconds | 技名 |
|--------|----------------|------|
| EASY   | 4秒             | なし |
| NORMAL | 6〜7秒          | あり（末尾「── 技名！！」） |
| HARD   | 8〜9秒          | あり |
| EXPERT | 11〜13秒        | あり |

録音最大時間 = `chant.expectedSeconds * 1000 + 3000`（ms）

---

## スコアリング（lib/scoring.ts）

### 入力（AudioMetrics）
- duration, expectedSeconds, avgVolume, maxVolume
- volumeVariance, silenceRatio
- longSilenceCount（0.8〜1.5s無音）、veryLongSilenceCount（1.5s以上）
- difficulty、userCompleted

### 声量（非線形piecewise）
普通読みで50〜65が目標。

| avgVolume | score |
|-----------|-------|
| 0.012 | 0 |
| 0.025 | 45 |
| 0.045 | 60 |
| 0.075 | 75 |
| 0.11 | 88 |
| 0.16 | 100 |

### 各指標
- **抑揚**: volumeVariance を normalize(0.02, 0.12)。声量<0.02なら×0.4
- **尺**: actualSpeakingTime / expectedSeconds の達成率でpiecewise
- **詠唱安定度**: 基点60 + speakingRatioボーナス - 無音ペナルティ
- **魂**: intonation×0.50 + clarity×0.25 + duration×0.15 + volume×0.10
- **厨二力**: intonation×0.45 + duration×0.25 + clarity×0.20 + random×10

### 総合スコア重み
`volume×0.12 + intonation×0.30 + duration×0.22 + clarity×0.22 + soul×0.14`

### スコアキャップ
- 達成率 <0.40→34 / <0.60→51 / <0.75→67 / <0.90→81
- 声量 <20→51 / <35→81
- 抑揚 <40→81 / <55→89

### ランク閾値
`EX≥96 / S≥90 / A≥82 / B≥68 / C≥52 / D≥35 / E`

### EX昇格条件
- 共通: intonation≥88, duration≥90, clarity≥88, volume≥55
- EXPERT専用: userCompleted && achievementRatio≥0.95 && intonation≥85 && clarity≥85 && volume≥50

### S/A昇格条件
- S: intonation≥75, duration≥80, clarity≥80, volume≥45
- A: intonation≥55, duration≥70, clarity≥70, volume≥35

---

## 結果画面構成（app/page.tsx 内 ResultScreen）

1. 使用した詠唱名（難易度バッジ付き）
2. 魔法陣（全ランク共通、ランクカラーで発光）
3. ランク + スコア
4. 称号（金色）
5. 結果コメント
6. スコアバー（声量 / 抑揚 / 詠唱安定度 / 魂 / 厨二力）
7. EXPERTのみ：禁術級認定条件チェックリスト
8. Xシェア / 画像保存 / もう一度 ボタン

---

## Xシェア仕様

### 動作フロー
1. シェアボタン押下
2. モバイル: `<a href="twitter://post?message=...">` をクリック → Xアプリが直接開く
3. PC: `window.open(twitter.com/intent/tweet)` でX投稿ページを開く
4. 投稿文にOGP付きURLが含まれ、Xが自動でカード表示

### OGP画像仕組み（動的生成）
- シェアURLは `/result?r=ランク&s=スコア&v=声量&i=抑揚&c=詠唱安定度&so=魂&ch=厨二力`
- `/app/result/page.tsx` がこのURLのOGPメタを生成（twitter:card = summary_large_image）
- `/app/api/og/route.tsx`（edge runtime）がランク・スコア・バーを描画した1200×630px画像を返す
- XがURLを展開するとOGP画像がカードとして自動表示される（添付不要）

### 投稿文内容
```
【詠唱力診断】

我が称号は『{称号}』
魔導ランク：{ランク}
総合詠唱力：{スコア}点

声量 {v} / 抑揚 {i} / 詠唱安定度 {c} / 魂 {so} / 厨二力 {ch}

{煽り文（ランダム20種・連続同一防止あり）}

https://webapp-6bdo.vercel.app/result?r=...
#詠唱力診断
```

### 画像保存
- Canvas（600×560px）に結果を描画してPNG保存
- モバイルでは画像保存後にXで手動添付も可能

---

## Xインアプリブラウザ対策

UAに「Twitter」が含まれる場合、全画面オーバーレイを表示。

**理由**: Xインアプリブラウザではシェアボタン・画像保存ボタンが動作しない。

**案内内容**:
- 「このままではXシェア・画像保存ができません」
- 「自動で開かない場合：画面下部の vercel.app をタップ → ブラウザで開く」
- 「このまま使う」ボタン（閉じて続けられる）

---

## GAイベント計測

| イベント名 | 発火タイミング |
|-----------|--------------|
| `chant_start` | 診断開始ボタン押下 |
| `chant_result` | 結果画面表示 |
| `share_click` | Xシェアボタン押下 |

GAで確認: レポート → エンゲージメント → イベント

---

## SEO

- google-site-verification メタタグ（削除禁止）
- OGP / Twitter Card / canonical URL 設定済み
- sitemap.xml / robots.txt 生成済み
- インデックス登録リクエスト済み（2026-05-16）

---

## 残課題

- サイトマップが Search Console で「取得できませんでした」（実害なし・Google側の既知バグ）
- 検索インデックス反映待ち

# 詠唱力診断 — Claude 作業アーカイブ

このファイルはClaude Codeが自動読み込みするプロジェクト仕様書です。
作業のたびに更新すること。

---

## アプリ概要

マイクに向かって呪文を詠唱し、声量・抑揚・詠唱安定度・魂・厨二力をスコアリングするエンタメWebアプリ。
ランクはE〜EX。

- **本番URL**: https://webapp-6bdo.vercel.app
- **リポジトリ**: github.com/rapis1107-alt/webapp
- **デプロイ**: GitHub main push → Vercel 自動デプロイ（1〜2分）

---

## 技術スタック

- Next.js 14（App Router）+ TypeScript
- Web Audio API（AnalyserNode / MediaRecorder）
- Vercel デプロイ
- Google Analytics 導入済み
- Google AdSense 導入済み
- Google Search Console 登録済み（HTMLタグ方式で所有権確認済み）

---

## 主要ファイル

| ファイル | 役割 |
|---------|------|
| `app/page.tsx` | メインコンポーネント（録音・分析・結果画面） |
| `lib/scoring.ts` | スコアリングロジック全体 |
| `data/chants.ts` | 呪文データ24本 |
| `data/titles.ts` | ランク別称号 |
| `data/comments.ts` | ランク別コメント・指標コメント |
| `app/layout.tsx` | SEOメタデータ・OGP・GA |
| `app/about/page.tsx` | 詠唱力診断とはページ |
| `app/sitemap.ts` | Googleサイトマップ |
| `app/robots.ts` | robots.txt |

---

## 呪文データ仕様（data/chants.ts）

24本（難易度別6本ずつ）

| 難易度 | expectedSeconds | 技名 |
|--------|----------------|------|
| EASY   | 4秒             | なし |
| NORMAL | 6〜7秒          | あり（末尾に「── 技名！！」） |
| HARD   | 8〜9秒          | あり |
| EXPERT | 11〜13秒        | あり |

録音最大時間 = `chant.expectedSeconds * 1000 + RECORD_BUFFER_MS`（RECORD_BUFFER_MS = 3000ms 固定）

---

## スコアリング仕様（lib/scoring.ts）

### AudioMetrics（入力）
- duration, expectedSeconds, avgVolume, maxVolume
- volumeVariance, silenceRatio
- longSilenceCount（0.8〜1.5s無音）, veryLongSilenceCount（1.5s以上）
- difficulty（easy/normal/hard/expert）
- userCompleted（詠唱完了ボタン押下かタイムアウトか）

### 声量スコア（非線形piecewise）
普通読みで50〜65が目標値。

| avgVolume | score |
|-----------|-------|
| 0.012     | 0     |
| 0.025     | 45    |
| 0.045     | 60    |
| 0.075     | 75    |
| 0.11      | 88    |
| 0.16      | 100   |

### 各指標
- **抑揚**: volumeVariance を normalize(0.02, 0.12)。声量<0.02なら×0.4
- **尺**: actualSpeakingTime / expectedSeconds の達成率でpiecewise scoring
- **詠唱安定度**: 基点60 + speakingRatioボーナス - 無音ペナルティ
- **魂**: intonation×0.50 + clarity×0.25 + duration×0.15 + volume×0.10
- **厨二力**: intonation×0.45 + duration×0.25 + clarity×0.20 + random×10

### 総合スコア重み
`volume×0.12 + intonation×0.30 + duration×0.22 + clarity×0.22 + soul×0.14`

### スコアキャップ
- 達成率 <0.40→34, <0.60→51, <0.75→67, <0.90→81
- 声量 <20→51, <35→81
- 抑揚 <40→81, <55→89

### ランク閾値
`EX≥96 / S≥90 / A≥82 / B≥68 / C≥52 / D≥35 / E`

### EX昇格条件
- 共通: intonation≥88, duration≥90, clarity≥88, volume≥55
- EXPERT専用: userCompleted && achievementRatio≥0.95 && intonation≥85 && clarity≥85 && volume≥50

### S/A昇格条件
- S: intonation≥75, duration≥80, clarity≥80, volume≥45
- A: intonation≥55, duration≥70, clarity≥70, volume≥35

---

## UI仕様（app/page.tsx）

### 画面遷移
`top → permission → countdown → recording → analyzing → result / error`

### 結果画面構成
1. 使用した詠唱名（難易度バッジ付き）
2. 魔法陣（全ランク共通、ランクカラーで発光）
3. ランク + スコア
4. 称号（金色）
5. 結果コメント
6. スコアバー（声量/抑揚/詠唱安定度/魂/厨二力）
7. 【EXPERTのみ】禁術級認定条件チェックリスト
8. 「画像も投稿したい場合は先に画像保存を」案内テキスト
9. Xシェア / 画像保存 / もう一度 ボタン

### Xシェア
- モバイル: `twitter://post?message=...` → 1500ms後にdocument.hidden確認 → 未遷移ならwindow.open
- PC: `window.open(twitter.com/intent/tweet)`
- 画像投稿は「画像保存」で保存してからXで手動添付
- 煽り文ランダム20種（連続同一防止あり）

### Xインアプリブラウザ対策
- UAに「Twitter」が含まれる場合、全画面オーバーレイで外部ブラウザ誘導を表示
- 案内文：「画面下部の vercel.app をタップ → ブラウザで開く」

---

## SEO設定（app/layout.tsx）

- google-site-verification メタタグ（HTMLタグ方式、削除禁止）
- OGP / Twitter Card / canonical URL 設定済み
- sitemap.xml / robots.txt 生成済み
- インデックス登録リクエスト済み（2026-05-16）

---

## 完了済み作業

- [x] 呪文24本（難易度別6本）
- [x] スコアリングロジック全面刷新
- [x] 録音時間を呪文ごとのexpectedSeconds基準に動的化
- [x] EXPERT専用EX条件（禁術級認定）+ UIチェックリスト表示
- [x] 称号・コメント更新
- [x] Xシェア（twitter://直接起動・ランダム煽り文）
- [x] 「失敗」表示廃止（全ランク魔法陣表示）
- [x] 指標名「滑舌」→「詠唱安定度」
- [x] SEO・Search Console・サイトマップ設定
- [x] NORMAL/HARD/EXPERTの呪文末尾にカタカナ必殺技名追加
- [x] Xインアプリブラウザ検出オーバーレイ（外部ブラウザ誘導）

---

## 残課題

- サイトマップが Search Console で「取得できませんでした」のまま（実害なし、Google側の既知バグ）
- インデックス登録リクエスト済み → 検索表示待ち

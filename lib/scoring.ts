import { titles, createResultText } from "../data/titles";
import { getMetricComment } from "../data/comments";

export interface AudioMetrics {
  duration: number;
  expectedSeconds: number;
  avgVolume: number;
  maxVolume: number;
  volumeVariance: number;
  silenceRatio: number;
  longSilenceCount: number;      // 0.8s〜1.5s の無音区間数
  veryLongSilenceCount: number;  // 1.5s 以上の無音区間数
}

export interface ScoreResult {
  volume: number;
  intonation: number;
  duration: number;
  clarity: number;
  soul: number;
  chuni: number;
  score: number;
  rank: string;
  title: string;
  comment: string;
  volumeComment: string;
  intonationComment: string;
  clarityComment: string;
  soulComment: string;
}

function normalize(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreDuration(ratio: number) {
  if (ratio < 0.5)  return 15;
  if (ratio < 0.7)  return 45;
  if (ratio <= 1.25) return 90;
  if (ratio <= 1.6)  return 65;
  return 40;
}

interface RawScores {
  volume: number;
  intonation: number;
  duration: number;
  clarity: number;
}

function getRank(score: number, s: RawScores): keyof typeof titles {
  // スコアによる基本ランク
  let rank: keyof typeof titles;
  if      (score >= 96) rank = "EX";
  else if (score >= 90) rank = "S";
  else if (score >= 82) rank = "A";
  else if (score >= 68) rank = "B";
  else if (score >= 52) rank = "C";
  else if (score >= 35) rank = "D";
  else                  rank = "E";

  // 上位ランクの最低条件チェック（条件未達なら1段階降格）
  if (rank === "EX" && !(s.volume >= 75 && s.intonation >= 88 && s.duration >= 90 && s.clarity >= 88)) rank = "S";
  if (rank === "S"  && !(s.volume >= 65 && s.intonation >= 75 && s.duration >= 80 && s.clarity >= 80)) rank = "A";
  if (rank === "A"  && !(s.volume >= 50 && s.intonation >= 55 && s.duration >= 70 && s.clarity >= 70)) rank = "B";

  return rank;
}

function calculateScores(metrics: AudioMetrics) {
  const durationRatio = metrics.duration / metrics.expectedSeconds;

  let volume     = normalize(metrics.avgVolume,       0.02,  0.18);
  let intonation = normalize(metrics.volumeVariance,  0.005, 0.08);
  let duration   = scoreDuration(durationRatio);
  const speakingRatio = 1 - metrics.silenceRatio;

  // 基礎点を55に引き下げ
  let clarity = 55;
  if (speakingRatio > 0.55) clarity += 10;
  if (speakingRatio > 0.70) clarity += 8;
  if (metrics.avgVolume > 0.04) clarity += 6;
  if (metrics.avgVolume > 0.08) clarity += 4;
  clarity -= metrics.longSilenceCount * 8;
  clarity -= metrics.veryLongSilenceCount * 15;
  if (durationRatio < 0.6)            clarity -= 25;
  if (metrics.avgVolume < 0.025)      clarity -= 20;
  if (metrics.volumeVariance < 0.006) clarity -= 8;

  let soul  = volume * 0.45 + intonation * 0.45 + duration * 0.1;
  let chuni = intonation * 0.5 + volume * 0.3 + Math.random() * 20;

  volume     = clamp(volume,     0, 100);
  intonation = clamp(intonation, 0, 100);
  duration   = clamp(duration,   0, 100);
  clarity    = clamp(clarity,    0, 100);
  soul       = clamp(soul,       0, 100);
  chuni      = clamp(chuni,      0, 100);

  let score =
    volume     * 0.22 +
    intonation * 0.24 +
    duration   * 0.18 +
    clarity    * 0.18 +
    soul       * 0.18;

  // 失敗補正（上限キャップ）
  if (durationRatio < 0.5)            score = Math.min(score, 34);
  if (metrics.silenceRatio > 0.45)    score = Math.min(score, 45);
  if (metrics.avgVolume < 0.025)      score = Math.min(score, 30);
  if (metrics.volumeVariance < 0.008) score = Math.min(score, 51);

  // 抑揚不足による上限キャップ（棒読み対策）
  if (intonation < 40) score = Math.min(score, 81); // 最大Bランク
  if (intonation < 55) score = Math.min(score, 89); // 最大Aランク

  score = clamp(score, 0, 100);

  const raw: RawScores = {
    volume:     Math.round(volume),
    intonation: Math.round(intonation),
    duration:   Math.round(duration),
    clarity:    Math.round(clarity),
  };

  return {
    ...raw,
    soul:  Math.round(soul),
    chuni: Math.round(chuni),
    score: Math.round(score),
    rank:  getRank(score, raw),
  };
}

export function calcScore(metrics: AudioMetrics): ScoreResult {
  const scores = calculateScores(metrics);
  const rank = scores.rank;
  const { title, comment } = createResultText(rank, scores.score);

  return {
    ...scores,
    title,
    comment,
    volumeComment:    getMetricComment("volume",    scores.volume),
    intonationComment: getMetricComment("intonation", scores.intonation),
    clarityComment:   getMetricComment("clarity",   scores.clarity),
    soulComment:      getMetricComment("soul",      scores.soul),
  };
}

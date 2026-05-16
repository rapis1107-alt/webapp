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

// 声量を非線形スコアに変換（普通読みで50〜70、本気で80〜90に収まるよう設計）
function scoreVolume(avgVolume: number): number {
  const points: [number, number][] = [
    [0.006, 0],
    [0.02,  50],
    [0.04,  70],
    [0.06,  85],
    [0.075, 100],
  ];
  if (avgVolume <= points[0][0]) return points[0][1];
  if (avgVolume >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (avgVolume <= x1) {
      return y0 + (y1 - y0) * (avgVolume - x0) / (x1 - x0);
    }
  }
  return 100;
}

function getRank(score: number, s: RawScores): keyof typeof titles {
  let rank: keyof typeof titles;
  if      (score >= 96) rank = "EX";
  else if (score >= 90) rank = "S";
  else if (score >= 82) rank = "A";
  else if (score >= 68) rank = "B";
  else if (score >= 52) rank = "C";
  else if (score >= 35) rank = "D";
  else                  rank = "E";

  // 上位ランクの最低条件チェック（声量条件を緩和・抑揚重視に変更）
  if (rank === "EX" && !(s.intonation >= 88 && s.duration >= 90 && s.clarity >= 88 && s.volume >= 55)) rank = "S";
  if (rank === "S"  && !(s.intonation >= 75 && s.duration >= 80 && s.clarity >= 80 && s.volume >= 45)) rank = "A";
  if (rank === "A"  && !(s.intonation >= 55 && s.duration >= 70 && s.clarity >= 70 && s.volume >= 35)) rank = "B";

  return rank;
}

function calculateScores(metrics: AudioMetrics) {
  const durationRatio = metrics.duration / metrics.expectedSeconds;

  let volume     = scoreVolume(metrics.avgVolume);
  let intonation = normalize(metrics.volumeVariance, 0.02, 0.12);
  // 声量が低い場合は抑揚補正（ノイズを抑揚として拾わないように）
  if (metrics.avgVolume < 0.02) intonation *= 0.4;
  let duration   = scoreDuration(durationRatio);
  const speakingRatio = 1 - metrics.silenceRatio;

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

  // 魂：抑揚・詠唱安定度・尺重視、声量は最小限
  let soul  = intonation * 0.50 + clarity * 0.25 + duration * 0.15 + volume * 0.10;
  // 厨二力：声量を直接入れず抑揚・尺・安定度で決まる
  let chuni = intonation * 0.45 + duration * 0.25 + clarity * 0.20 + Math.random() * 10;

  volume     = clamp(volume,     0, 100);
  intonation = clamp(intonation, 0, 100);
  duration   = clamp(duration,   0, 100);
  clarity    = clamp(clarity,    0, 100);
  soul       = clamp(soul,       0, 100);
  chuni      = clamp(chuni,      0, 100);

  let score =
    volume     * 0.12 +
    intonation * 0.30 +
    duration   * 0.22 +
    clarity    * 0.22 +
    soul       * 0.14;

  // 失敗補正
  if (durationRatio < 0.5)         score = Math.min(score, 34);
  if (metrics.silenceRatio > 0.45) score = Math.min(score, 45);

  // 声量・抑揚不足による上限キャップ
  if (volume    < 20) score = Math.min(score, 51); // 上限D
  if (volume    < 35) score = Math.min(score, 81); // 上限B
  if (intonation < 40) score = Math.min(score, 81); // 上限B（棒読み対策）
  if (intonation < 55) score = Math.min(score, 89); // 上限A

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

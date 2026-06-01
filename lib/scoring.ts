import { titles, createResultText } from "../data/titles";
import { getMetricComment } from "../data/comments";

export type Difficulty = "easy" | "normal" | "hard" | "expert";

export interface AudioMetrics {
  duration: number;
  expectedSeconds: number;
  avgVolume: number;
  maxVolume: number;
  volumeVariance: number;
  silenceRatio: number;
  longSilenceCount: number;      // 0.8s〜1.5s の無音区間数
  veryLongSilenceCount: number;  // 1.5s 以上の無音区間数
  difficulty: Difficulty;
  userCompleted: boolean;        // true = ボタン押下, false = タイムアウト
}

export interface ScoreResult {
  volume: number;
  intonation: number;
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
  chuniComment: string;
  achievementRatio: number;
  userCompleted: boolean;
  difficulty: Difficulty;
  durationAchieved: boolean;   // true = 尺達成, false = 尺未達
  timeoutWarning: boolean;     // タイムアウト終了
}

function normalize(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreDuration(actualSpeakingTime: number, expectedSeconds: number): number {
  const rate = actualSpeakingTime / expectedSeconds;
  if (rate < 0.40) return (rate / 0.40) * 20;
  if (rate < 0.60) return 20 + ((rate - 0.40) / 0.20) * 25;
  if (rate < 0.75) return 45 + ((rate - 0.60) / 0.15) * 20;
  if (rate < 0.90) return 65 + ((rate - 0.75) / 0.15) * 20;
  return Math.min(90 + ((rate - 0.90) / 0.10) * 10, 100);
}

interface RawScores {
  volume: number;
  intonation: number;
  clarity: number;
}

// 声量を非線形スコアに変換（普通読みで50〜65、本気で70〜85に収まるよう設計）
function scoreVolume(avgVolume: number): number {
  const points: [number, number][] = [
    [0.012, 0],
    [0.025, 45],
    [0.045, 60],
    [0.075, 75],
    [0.11,  88],
    [0.16,  100],
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

function getRank(
  score: number,
  s: RawScores,
  achievementRatio: number,
  difficulty: Difficulty,
  userCompleted: boolean,
): keyof typeof titles {
  let rank: keyof typeof titles;
  if      (score >= 93) rank = "EX";
  else if (score >= 86) rank = "SS";
  else if (score >= 78) rank = "S";
  else if (score >= 68) rank = "A";
  else if (score >= 50) rank = "B";
  else if (score >= 35) rank = "C";
  else if (score >= 22) rank = "D";
  else                  rank = "E";

  // 共通EX条件
  if (rank === "EX" && !(s.intonation >= 88 && s.clarity >= 88 && s.volume >= 100)) rank = "SS";
  // EXPERT専用EX条件（禁術級認定）
  if (rank === "EX" && difficulty === "expert") {
    const expertEx =
      userCompleted &&
      achievementRatio >= 0.95 &&
      s.intonation >= 85 &&
      s.clarity >= 85 &&
      s.volume >= 90;
    if (!expertEx) rank = "SS";
  }

  if (rank === "SS" && !(s.intonation >= 80 && s.clarity >= 85 && s.volume >= 90)) rank = "S";
  if (rank === "S"  && !(s.intonation >= 65 && s.clarity >= 80 && s.volume >= 80)) rank = "A";
  if (rank === "A"  && !(s.intonation >= 55 && s.clarity >= 70 && s.volume >= 70)) rank = "B";
  if (rank === "B"  && s.volume < 60) rank = "C";
  if (rank === "C"  && s.volume < 50) rank = "D";
  if (rank === "D"  && s.volume < 40) rank = "E";

  return rank;
}

function calculateScores(metrics: AudioMetrics) {
  const actualSpeakingTime = metrics.duration * (1 - metrics.silenceRatio);

  // 尺ゲート判定（総合スコアへのキャップのみ、バー表示なし）
  // 完了ボタン + 61%以上 → 尺達成（キャップなし）
  // 完了ボタン + 60%未満 → 尺未達（総合スコア上限50）
  // タイムアウト          → 上限なしだがペナルティ×0.88 + メッセージ表示
  const completionRatio = metrics.duration / metrics.expectedSeconds;
  const durationAchieved = metrics.userCompleted && completionRatio >= 0.61;
  const completedEarly   = metrics.userCompleted && completionRatio < 0.60;
  const timedOut         = !metrics.userCompleted;

  // achievementRatio: EX判定用（ボタン押下時は押下タイミング基準）
  const achievementRatio = metrics.userCompleted
    ? completionRatio
    : actualSpeakingTime / metrics.expectedSeconds;

  let volume     = scoreVolume(metrics.avgVolume);
  let intonation = normalize(metrics.volumeVariance, 0.02, 0.12);
  if (metrics.avgVolume < 0.02) intonation *= 0.4;

  // 尺スコアは魂・厨二力の内部計算のみに使用（表示・式から除外）
  const durationScore = scoreDuration(actualSpeakingTime, metrics.expectedSeconds);

  const speakingRatio = 1 - metrics.silenceRatio;

  let clarity = 60;
  if (speakingRatio >= 0.80) clarity += 30;
  else if (speakingRatio >= 0.70) clarity += 20;
  else if (speakingRatio >= 0.60) clarity += 10;
  else if (speakingRatio >= 0.50) clarity += 5;
  clarity -= metrics.veryLongSilenceCount * 15;
  if (metrics.volumeVariance > 0.09) clarity -= 10;

  let soul  = intonation * 0.50 + clarity * 0.25 + durationScore * 0.15 + volume * 0.10;
  let chuni = intonation * 0.45 + durationScore * 0.25 + clarity * 0.20 + Math.random() * 10;

  volume     = clamp(volume,     0, 100);
  intonation = clamp(intonation, 0, 100);
  clarity    = clamp(clarity,    0, 100);
  soul       = clamp(soul,       0, 100);
  chuni      = clamp(chuni,      0, 100);

  // 尺を総合スコア式から除外（voice/intonation/clarity/soulに再配分）
  let score =
    volume     * 0.15 +
    intonation * 0.38 +
    clarity    * 0.28 +
    soul       * 0.19;

  // 尺ゲートによるキャップ
  if (completedEarly) score = Math.min(score, 50); // 途中でやめた → 上限B
  if (timedOut)       score = score * 0.88;         // 完了ボタン未押下 → 軽いペナルティ

  // 声量・抑揚不足によるキャップ
  if (volume     < 30) score = Math.min(score, 21);
  if (volume     < 40) score = Math.min(score, 34);
  if (intonation < 40) score = Math.min(score, 67);
  if (intonation < 55) score = Math.min(score, 77);

  score = clamp(score, 0, 100);

  const raw: RawScores = {
    volume:     Math.round(volume),
    intonation: Math.round(intonation),
    clarity:    Math.round(clarity),
  };

  return {
    ...raw,
    soul:  Math.round(soul),
    chuni: Math.round(chuni),
    score: Math.round(score),
    rank:  getRank(score, raw, achievementRatio, metrics.difficulty, metrics.userCompleted),
    achievementRatio,
    userCompleted: metrics.userCompleted,
    difficulty: metrics.difficulty,
    durationAchieved,
    timeoutWarning: timedOut,
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
    volumeComment:     getMetricComment("volume",     scores.volume),
    intonationComment: getMetricComment("intonation", scores.intonation),
    clarityComment:    getMetricComment("clarity",    scores.clarity),
    soulComment:       getMetricComment("soul",       scores.soul),
    chuniComment:      getMetricComment("chuni",      scores.chuni),
  };
}

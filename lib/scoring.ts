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
  achievementRatio: number;
  userCompleted: boolean;
  difficulty: Difficulty;
}

function normalize(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// 尺スコア：達成率に応じた段階的スコア
// 速く読んでも達成率が高ければ高得点、途中終了は厳しく落とす
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
  duration: number;
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
  if      (score >= 96) rank = "EX";
  else if (score >= 90) rank = "S";
  else if (score >= 82) rank = "A";
  else if (score >= 68) rank = "B";
  else if (score >= 52) rank = "C";
  else if (score >= 35) rank = "D";
  else                  rank = "E";

  // 共通EX条件
  if (rank === "EX" && !(s.intonation >= 88 && s.duration >= 90 && s.clarity >= 88 && s.volume >= 55)) rank = "S";
  // EXPERT専用EX条件（禁術級認定）
  if (rank === "EX" && difficulty === "expert") {
    const expertEx =
      userCompleted &&
      achievementRatio >= 0.95 &&
      s.intonation >= 85 &&
      s.clarity >= 85 &&
      s.volume >= 50;
    if (!expertEx) rank = "S";
  }

  if (rank === "S"  && !(s.intonation >= 65 && s.duration >= 80 && s.clarity >= 80 && s.volume >= 45)) rank = "A";
  if (rank === "A"  && !(s.intonation >= 55 && s.duration >= 70 && s.clarity >= 70 && s.volume >= 35)) rank = "B";

  return rank;
}

function calculateScores(metrics: AudioMetrics) {
  // 実発話時間（無音除く）で尺を評価
  const actualSpeakingTime = metrics.duration * (1 - metrics.silenceRatio);
  const achievementRatio   = actualSpeakingTime / metrics.expectedSeconds;

  let volume     = scoreVolume(metrics.avgVolume);
  let intonation = normalize(metrics.volumeVariance, 0.02, 0.12);
  // 声量が低い場合は抑揚補正（ノイズを抑揚として拾わないように）
  if (metrics.avgVolume < 0.02) intonation *= 0.4;
  let duration   = scoreDuration(actualSpeakingTime, metrics.expectedSeconds);
  const speakingRatio = 1 - metrics.silenceRatio;

  // 詠唱安定度：発話の滑らかさを測る。速さ・声量は評価しない
  // 「無音が少なく最後まで続いた」かどうかを見る
  let clarity = 60;

  // 発話継続ボーナス（speakingRatioベース。速さ無関係）
  if (speakingRatio >= 0.80) clarity += 30;
  else if (speakingRatio >= 0.70) clarity += 20;
  else if (speakingRatio >= 0.60) clarity += 10;
  else if (speakingRatio >= 0.50) clarity += 5;

  // 2秒以上の無音区間のみペナルティ（演技的な間は減点しない）
  clarity -= metrics.veryLongSilenceCount * 15;

  // 極端な音量の乱れのみペナルティ（通常の抑揚は減点しない）
  if (metrics.volumeVariance > 0.09) clarity -= 10;

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

  // 尺達成率によるキャップ
  if (achievementRatio < 0.40) score = Math.min(score, 34); // 上限E
  if (achievementRatio < 0.60) score = Math.min(score, 51); // 上限D
  if (achievementRatio < 0.75) score = Math.min(score, 67); // 上限C
  if (achievementRatio < 0.90) score = Math.min(score, 81); // 上限B

  // 声量・抑揚不足によるキャップ
  if (volume     < 20) score = Math.min(score, 51); // 上限D
  if (volume     < 35) score = Math.min(score, 81); // 上限B
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
    rank:  getRank(score, raw, achievementRatio, metrics.difficulty, metrics.userCompleted),
    achievementRatio,
    userCompleted: metrics.userCompleted,
    difficulty: metrics.difficulty,
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

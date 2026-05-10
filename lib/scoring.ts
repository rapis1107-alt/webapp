export interface AnalysisData {
  volume: number;       // 0-100
  intonation: number;  // 0-100
  clarity: number;     // 0-100
  duration: number;    // seconds
}

export interface ScoreResult {
  volume: number;
  intonation: number;
  clarity: number;
  soul: number;
  chuuni: number;
  total: number;
  rank: string;
  title: string;
  comment: string;
}

const titles: { minScore: number; title: string; comment: string }[] = [
  { minScore: 95, title: "滅界の覇王", comment: "その詠唱、宇宙が震えた。神々も膝をついた。" },
  { minScore: 88, title: "闇の使者", comment: "魂が迸っている。厨二の神に選ばれし者よ。" },
  { minScore: 80, title: "黒炎の詠唱者", comment: "なかなかの覚醒度だ。もう少しで世界が滅ぶところだった。" },
  { minScore: 70, title: "虚空の見習い", comment: "素質はある。だが魂がまだ目覚めていない。" },
  { minScore: 58, title: "詠唱修行中", comment: "呪文というより連絡事項に聞こえた。精進せよ。" },
  { minScore: 45, title: "普通の人間", comment: "魔力：ゼロ。残念ながら君はただの人間だ。" },
  { minScore: 30, title: "詠唱放棄者", comment: "近所に聞こえていたら通報案件です。" },
  { minScore: 0,  title: "消滅候補", comment: "これは詠唱ではなく、ただの雑音だ……。" },
];

const rankThresholds = [
  { min: 95, rank: "EX" },
  { min: 88, rank: "SS" },
  { min: 80, rank: "S" },
  { min: 70, rank: "A" },
  { min: 58, rank: "B" },
  { min: 45, rank: "C" },
  { min: 30, rank: "D" },
  { min: 0,  rank: "F" },
];

function clamp(v: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function calcScore(data: AnalysisData): ScoreResult {
  const random = (range: number) => (Math.random() - 0.5) * range;

  const volume    = clamp(data.volume    + random(20));
  const intonation = clamp(data.intonation + random(25));
  const clarity   = clamp(data.clarity   + random(20));

  // 魂は声量と抑揚を掛け合わせ + ランダム性
  const soul = clamp((volume * 0.4 + intonation * 0.4 + data.duration * 3) + random(30));

  // 厨二力は全体的な迫力 + 大きめのランダム
  const chuuni = clamp((volume * 0.3 + intonation * 0.3 + soul * 0.3) + random(35));

  const total = clamp((volume + intonation + clarity + soul + chuuni) / 5);

  const rankObj = rankThresholds.find((r) => total >= r.min) ?? rankThresholds[rankThresholds.length - 1];
  const titleObj = titles.find((t) => total >= t.minScore) ?? titles[titles.length - 1];

  return {
    volume,
    intonation,
    clarity,
    soul,
    chuuni,
    total,
    rank: rankObj.rank,
    title: titleObj.title,
    comment: titleObj.comment,
  };
}

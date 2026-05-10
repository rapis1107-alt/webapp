export type Difficulty = "easy" | "normal" | "hard" | "expert";

export interface Chant {
  id: string;
  title: string;
  difficulty: Difficulty;
  text: string;
  expectedSeconds: number;
}

export const chants: Chant[] = [
  {
    id: "dark_flame_01",
    title: "黒炎召喚",
    difficulty: "normal",
    text: "深淵に眠りし黒炎の王よ。我が声に応え、今ここに顕現せよ。滅びの焔で、すべてを焼き尽くせ！",
    expectedSeconds: 8,
  },
  {
    id: "thunder_01",
    title: "雷鳴断罪",
    difficulty: "normal",
    text: "天を裂く雷鳴よ。我が刃に宿り、愚かなる敵を断罪せよ。轟け、雷神の一撃！",
    expectedSeconds: 7,
  },
  {
    id: "ice_01",
    title: "氷結封印",
    difficulty: "easy",
    text: "凍てつく静寂よ。迷える魂を包み込み、永遠の眠りへと封じよ。氷結の檻よ、閉ざせ！",
    expectedSeconds: 8,
  },
  {
    id: "heal_01",
    title: "聖光治癒",
    difficulty: "easy",
    text: "優しき光よ。傷つきし者の痛みを癒やし、失われた希望を再び灯せ。聖なる祈りよ、届け！",
    expectedSeconds: 8,
  },
  {
    id: "forbidden_01",
    title: "禁術解放",
    difficulty: "hard",
    text: "封じられし禁忌の扉よ。我が血と声を鍵として、今ここに開かれよ。禁術、虚無崩壊！",
    expectedSeconds: 9,
  },
  {
    id: "dragon_01",
    title: "竜王契約",
    difficulty: "hard",
    text: "古の竜王よ。我が魂の叫びを聞け。契約の名のもとに、その牙と翼を我に貸し与えよ！",
    expectedSeconds: 9,
  },
  {
    id: "final_01",
    title: "終焉詠唱",
    difficulty: "expert",
    text: "星を喰らい、時を砕く終焉の鐘よ。我が名を刻め。世界の理を越え、今こそ滅びを告げよ！",
    expectedSeconds: 10,
  },
];

export function getRandomChant(excludeId?: string): Chant {
  const pool = excludeId ? chants.filter((c) => c.id !== excludeId) : chants;
  return pool[Math.floor(Math.random() * pool.length)];
}

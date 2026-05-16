export type Difficulty = "easy" | "normal" | "hard" | "expert";

export interface Chant {
  id: string;
  title: string;
  difficulty: Difficulty;
  text: string;
  expectedSeconds: number;
}

export const chants: Chant[] = [
  // ── EASY ────────────────────────────────────────────────────────────────────
  {
    id: "ice_seal",
    title: "氷結封印",
    difficulty: "easy",
    text: "凍てつく氷の精霊よ。我が声に応え、愚かなる敵の足を永久に封じよ！",
    expectedSeconds: 7,
  },
  {
    id: "holy_heal",
    title: "聖光治癒",
    difficulty: "easy",
    text: "聖なる光よ。我が傷を癒し、失われし力を今ここに取り戻したまえ！",
    expectedSeconds: 7,
  },
  {
    id: "wind_guard",
    title: "烈風加護",
    difficulty: "easy",
    text: "疾風の守護者よ。我が身を包み、あらゆる刃と災厄よりこの身を守れ！",
    expectedSeconds: 7,
  },
  {
    id: "crimson_blast",
    title: "紅蓮爆炎",
    difficulty: "easy",
    text: "紅き炎の化身よ。我が呼び声に応え、敵を焼き尽くす熱き怒りを示せ！",
    expectedSeconds: 7,
  },
  {
    id: "thunder_strike",
    title: "雷撃降臨",
    difficulty: "easy",
    text: "天空を駆ける雷よ。我が敵を見定め、その裁きの一撃を今ここに下せ！",
    expectedSeconds: 7,
  },
  {
    id: "water_barrier",
    title: "水鏡結界",
    difficulty: "easy",
    text: "静寂なる水の精霊よ。我が前に集い、すべての悪意を拒む鏡の壁を築け！",
    expectedSeconds: 8,
  },

  // ── NORMAL ──────────────────────────────────────────────────────────────────
  {
    id: "dark_flame",
    title: "黒炎召喚",
    difficulty: "normal",
    text: "深淵に眠りし黒き炎よ。我が呼び声に応え、すべてを焼き尽くす力を示せ！",
    expectedSeconds: 9,
  },
  {
    id: "thunder_judge",
    title: "雷鳴断罪",
    difficulty: "normal",
    text: "天を裂く雷鳴よ。我が刃に宿り、愚かなる敵を断罪せよ。轟け、雷神の一撃！",
    expectedSeconds: 9,
  },
  {
    id: "shadow_bind",
    title: "影縛呪縛",
    difficulty: "normal",
    text: "闇に潜みし影の鎖よ。我が敵を絡め取り、その自由と希望を永遠に奪え！",
    expectedSeconds: 9,
  },
  {
    id: "holy_purge",
    title: "聖裁浄化",
    difficulty: "normal",
    text: "聖なる裁きの光よ。穢れし魂を照らし、その罪を炎とともに浄化せよ！",
    expectedSeconds: 9,
  },
  {
    id: "storm_slash",
    title: "烈風穿撃",
    difficulty: "normal",
    text: "荒れ狂う風の刃よ。我が敵を切り裂き、その叫びを天空へと散らせ！",
    expectedSeconds: 9,
  },
  {
    id: "earth_crush",
    title: "地裂崩壊",
    difficulty: "normal",
    text: "眠れる大地の怒りよ。我が声に応え、その大いなる力で敵を飲み込め！",
    expectedSeconds: 9,
  },

  // ── HARD ────────────────────────────────────────────────────────────────────
  {
    id: "forbidden_release",
    title: "禁術解放",
    difficulty: "hard",
    text: "封印されし禁断の力よ。我が契約に従い、その枷を解き放て。今こそ世界に真の恐怖を示せ！",
    expectedSeconds: 13,
  },
  {
    id: "dragon_pact",
    title: "竜王契約",
    difficulty: "hard",
    text: "古より眠りし竜王よ。我が血の契約に応え、その咆哮で天地を震わせ、すべてを滅ぼせ！",
    expectedSeconds: 13,
  },
  {
    id: "underworld_summon",
    title: "冥界召喚",
    difficulty: "hard",
    text: "冥界の深き闇より現れし亡者の王よ。我が命に従い、この地に絶望の軍勢を呼び覚ませ！",
    expectedSeconds: 13,
  },
  {
    id: "demon_birth",
    title: "魔神降誕",
    difficulty: "hard",
    text: "封印されし災厄の魔神よ。我が呼び声に応え、その圧倒的な力を今ここに顕現せよ！",
    expectedSeconds: 12,
  },
  {
    id: "abyss_collapse",
    title: "深淵崩壊",
    difficulty: "hard",
    text: "深き深淵に眠りし混沌の力よ。我が魂を糧として、すべてを無へと還せ！",
    expectedSeconds: 12,
  },
  {
    id: "divine_verdict",
    title: "天罰審判",
    difficulty: "hard",
    text: "天上に座す裁きの神よ。我が声を聞き届け、罪深き者どもに永遠の断罪を与えたまえ！",
    expectedSeconds: 13,
  },

  // ── EXPERT ──────────────────────────────────────────────────────────────────
  {
    id: "final_chant",
    title: "終焉詠唱",
    difficulty: "expert",
    text: "深淵の彼方より現れし終焉の王よ。我が魂を代償に契約を結ばん。今こそその絶望の力をもって、すべての光を喰らい、世界に静寂なる滅びをもたらせ！",
    expectedSeconds: 20,
  },
  {
    id: "god_destroy",
    title: "神滅審判",
    difficulty: "expert",
    text: "悠久の時を超えし裁きの神よ。我が声を贄としてここに命ずる。罪深き魂すべてに終焉の雷を降らせ、その存在を永遠に消し去れ！",
    expectedSeconds: 17,
  },
  {
    id: "forbidden_collapse",
    title: "禁界崩落",
    difficulty: "expert",
    text: "世界の理を司る禁忌の門よ。我が契約の名のもとに今ここに開かれよ。その深淵より溢れし絶望と混沌の力をもって、すべての秩序を崩壊させよ！",
    expectedSeconds: 19,
  },
  {
    id: "void_manifest",
    title: "虚無顕現",
    difficulty: "expert",
    text: "始まりも終わりもなき虚無の王よ。我が魂の叫びに応え、その果てなき静寂の力をもって、この世界のすべてを永遠なる無へと還したまえ！",
    expectedSeconds: 18,
  },
  {
    id: "star_destroy",
    title: "星滅崩壊",
    difficulty: "expert",
    text: "天空を巡る無数の星々よ。我が怒りと憎しみに共鳴し、その輝きを災厄の雨へと変えて、地上のすべてを灰燼へと焼き尽くせ！",
    expectedSeconds: 16,
  },
  {
    id: "absolute_end",
    title: "絶対終局",
    difficulty: "expert",
    text: "永遠の眠りにつきし終焉の神よ。我が最後の呼び声を聞き届け、その抗うことなき絶対なる力をもって、すべての命に静かなる終局を与えたまえ！",
    expectedSeconds: 20,
  },
];

export function getRandomChant(excludeId?: string, difficulty?: Difficulty): Chant {
  const pool = chants
    .filter((c) => c.id !== excludeId)
    .filter((c) => !difficulty || c.difficulty === difficulty);
  return pool[Math.floor(Math.random() * pool.length)];
}

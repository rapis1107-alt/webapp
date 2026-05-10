import { pickRandom } from "./utils";
import { resultComments } from "./comments";

export const titles = {
  EX: [
    "終焉を告げる詠唱王",
    "禁術を完成させし者",
    "現実干渉型魔導士",
    "魂がうるさすぎる覇者",
    "黒炎に選ばれし者",
  ],
  S: [
    "深夜絶叫魔導士",
    "詠唱特級保持者",
    "黒歴史を恐れぬ者",
    "近隣結界破壊者",
    "魔力暴走予備軍",
  ],
  A: [
    "なかなか本気の詠唱士",
    "抑揚を知る者",
    "恥を捨てかけた魔導士",
    "中級黒炎使い",
    "声に魂を乗せし者",
  ],
  B: [
    "一般詠唱士",
    "安全運転の魔法使い",
    "まだ理性が残っている者",
    "ほどほど魔導士",
    "人前ではやらなさそうな者",
  ],
  C: [
    "棒読み魔術見習い",
    "詠唱に迷いし者",
    "魔力不足の一般人",
    "声は出たが魂は留守",
    "恥じらいに負けた者",
  ],
  D: [
    "小声の召喚士",
    "詠唱未遂",
    "魔法陣に無視された者",
    "呪文が届かなかった者",
    "ただの独り言使い",
  ],
  E: [
    "沈黙の民",
    "詠唱崩壊者",
    "魔力反応なし",
    "黒炎に拒否されし者",
    "声なきチャレンジャー",
  ],
};

export function createResultText(rank: keyof typeof titles, score: number) {
  const title = pickRandom(titles[rank]);
  const comment = pickRandom(resultComments[rank]);
  return { title, comment };
}

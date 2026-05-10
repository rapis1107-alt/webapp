export interface Chant {
  id: number;
  title: string;
  text: string;
}

export const chants: Chant[] = [
  {
    id: 1,
    title: "虚無の召喚",
    text: "汝、虚空に宿りし闇よ。我が意に従い、この世界を覆い尽くせ……！　闇よ、今こそ解き放たれよ！",
  },
  {
    id: 2,
    title: "星屑の契約",
    text: "星屑に刻まれし禁断の契約よ、今こそ解き放たれよ！　我が名において、汝に命ずる——滅びよ、全ての光よ！",
  },
  {
    id: 3,
    title: "深淵への誓い",
    text: "深淵より来たりし我が力よ、今こそ目覚めよ！　この魂と引き換えに、世界の理を書き換えよ……！",
  },
  {
    id: 4,
    title: "鬼哭の炎",
    text: "燃え盛れ、鬼哭の炎よ！　天地を焼き尽くし、全ての存在を灰に帰せ！　我は闇の覇者なり……！",
  },
  {
    id: 5,
    title: "時空の断罪",
    text: "時空よ止まれ！　我が意志の前に、因果の糸は断ち切られる……！　消えよ、この瞬間ごと！",
  },
];

export function getRandomChant(): Chant {
  return chants[Math.floor(Math.random() * chants.length)];
}

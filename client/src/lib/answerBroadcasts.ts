export type AnswerBroadcastKind = "笑話" | "英雄短句" | "原創歌詞" | "順口溜" | "網路梗句";

export type AnswerBroadcast = {
  kind: AnswerBroadcastKind;
  title: string;
  text: string;
};

/**
 * All lines are original short-form copy or public-domain-style common sayings.
 * They intentionally avoid reproducing copyrighted song lyrics or character dialogue.
 */
export const ANSWER_BROADCASTS: AnswerBroadcast[] = [
  { kind: "笑話", title: "探險笑一笑", text: "為什麼星星不迷路？因為它們都有自己的軌道。" },
  { kind: "英雄短句", title: "奧特曼主題短句", text: "把光分給需要的人，勇氣就會越來越亮。" },
  { kind: "英雄短句", title: "假面騎士主題短句", text: "真正的變身，是把害怕變成願意再試一次。" },
  { kind: "英雄短句", title: "奶龍主題短句", text: "吃飽、睡好、勇敢發問，今天也能向前一小步。" },
  { kind: "原創歌詞", title: "原創短歌詞", text: "抬頭看星光，腳步有方向，學會一點點，就能走更長。" },
  { kind: "順口溜", title: "古今順口溜", text: "先觀察、再思量，找證據、再分享。" },
  { kind: "網路梗句", title: "今日梗句", text: "不是不會，是正在載入；多想十秒，答案就到。" },
];

export function getAnswerBroadcast(answerCount: number) {
  if (answerCount < 5 || answerCount % 5 !== 0) return null;
  const index = (answerCount / 5 - 1) % ANSWER_BROADCASTS.length;
  return ANSWER_BROADCASTS[index];
}

/** 夜間觀測深化：夜間時段的觀測加成與天文小語（純函數） */

export function isNightHour(hour: number): boolean {
  const safe = ((Math.floor(hour) % 24) + 24) % 24;
  return safe >= 18 || safe < 6;
}

export type NightObservationBonus = {
  active: boolean;
  goldBonus: number;
  rareRateBonus: number;
  label: string;
  caption: string;
};

const NIGHT_CAPTIONS: ReadonlyArray<{ from: number; to: number; text: string }> = [
  { from: 18, to: 20, text: "晚風初起，獵戶座正從東邊地平線升起。" },
  { from: 20, to: 23, text: "銀河橫跨天頂，記得找找牛郎星與織女星。" },
  { from: 23, to: 2, text: "夜最深處，北極星依然為迷路的人指引方向。" },
  { from: 2, to: 6, text: "黎明前的天空最清澈，金星正閃爍著晨光。" },
];

export function nightSkyCaption(hour: number): string {
  if (!isNightHour(hour)) return "白天的陽光蓋住了星光；夜間再來觀測吧。";
  const caption = NIGHT_CAPTIONS.find((item) =>
    item.to > item.from ? hour >= item.from && hour < item.to : hour >= item.from || hour < item.to,
  );
  return caption?.text ?? NIGHT_CAPTIONS[1].text;
}

/** 夜間觀測加成：夜間答題金幣 +20%、稀有遭遇率 +5%；白天無加成 */
export function nightObservationBonus(timestamp = Date.now()): NightObservationBonus {
  const hour = new Date(timestamp).getHours();
  const active = isNightHour(hour);
  return {
    active,
    goldBonus: active ? 0.2 : 0,
    rareRateBonus: active ? 0.05 : 0,
    label: active ? "星光加成" : "無加成",
    caption: nightSkyCaption(hour),
  };
}

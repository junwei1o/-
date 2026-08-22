import { ACADEMY_ROUTES } from "./academyQuestData";

export type AcademyDailyExpedition = {
  dayKey: string;
  routeSubject: "數學" | "自然" | "社會" | "國語";
  title: string;
  description: string;
  targetCorrectAnswers: number;
  rewardLabel: string;
};

export const academyDayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const seedForDay = (dayKey: string) => Array.from(dayKey).reduce((total, character) => total + character.charCodeAt(0), 0);

/**
 * Generates one original, curriculum-linked daily route deterministically for a
 * calendar day. The route never creates questions; it only directs the existing
 * Taiwan curriculum question bank and rewards verified correct answers.
 */
export const dailyExpeditionForDate = (dayKey: string): AcademyDailyExpedition => {
  const route = ACADEMY_ROUTES[seedForDay(dayKey) % ACADEMY_ROUTES.length];
  return {
    dayKey,
    routeSubject: route.subject,
    title: `${route.title}・三線校準`,
    description: `在${route.landmark}完成 3 個正確的${route.subject}線索，協助${route.questTitle}。`,
    targetCorrectAnswers: 3,
    rewardLabel: "完成可獲 2 能量與 3 金幣",
  };
};

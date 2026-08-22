import type { AdaptiveAttempt, AdaptiveProfile } from "@/game/adaptiveLearning";

export type StudentRelationNodeKey = "exam" | "astronomy" | "principles" | "companion" | "insights" | "observatory";

export type StudentLivingConnection = {
  nodeKey: StudentRelationNodeKey;
  subject: string;
  lifeExamples: string[];
  sourceLabel: string;
};

export type StudentLivingConnections = Partial<Record<StudentRelationNodeKey, StudentLivingConnection>>;

type ObservatoryStation = { title: string; completed: boolean };

type BuildLivingConnectionsInput = {
  profile: AdaptiveProfile;
  favoriteScenarioIds: readonly string[];
  observatoryStations: readonly ObservatoryStation[];
};

const PRINCIPLE_TOPIC = /光|力|能量|重力|電|磁|量子|熱|波|系統|原理|運動|聲音|天氣|地球|宇宙/;
const ASTRONOMY_TOPIC = /天文|宇宙|星|月|太陽|行星|星系|太空|觀測/;

function lifeContextFor(domain: string) {
  if (/數學/.test(domain)) return "整理物品、比較距離或規劃時間時";
  if (/自然|科學/.test(domain)) return "觀察校園的天氣、影子或天空時";
  if (/社會/.test(domain)) return "閱讀社區地圖、交通資訊或公共議題時";
  if (/國語|語文/.test(domain)) return "閱讀故事、整理段落或分享想法時";
  return "在日常觀察與提問時";
}

function uniqueRecentAttempts(attempts: readonly AdaptiveAttempt[], predicate: (attempt: AdaptiveAttempt) => boolean) {
  const seenTopics = new Set<string>();
  return [...attempts].reverse().filter((attempt) => {
    const topic = attempt.knowledge.find((item) => item.trim().length > 0);
    if (!topic || seenTopics.has(topic) || !predicate(attempt)) return false;
    seenTopics.add(topic);
    return true;
  }).slice(0, 2);
}

function connectionFromAttempts(nodeKey: StudentRelationNodeKey, attempts: readonly AdaptiveAttempt[], sourceLabel: string): StudentLivingConnection | null {
  const selected = uniqueRecentAttempts(attempts, () => true);
  if (!selected.length) return null;
  const subject = selected[0]?.curriculumDomain ?? "";
  const lifeExamples = selected.flatMap((attempt) => {
    const topic = attempt.knowledge.find((item) => item.trim().length > 0);
    if (!topic) return [];
    return [`你最近練習的「${topic}」，可以在${lifeContextFor(attempt.curriculumDomain)}，先找找和它有關的線索。`];
  });
  return subject && lifeExamples.length ? { nodeKey, subject, lifeExamples, sourceLabel } : null;
}

/**
 * 只從本機已存在的作答、收藏與已完成觀測站建立生活連結；沒有可觀測資料時不補造提示內容。
 */
export function buildStudentLivingConnections({ profile, favoriteScenarioIds, observatoryStations }: BuildLivingConnectionsInput): StudentLivingConnections {
  const result: StudentLivingConnections = {};
  const attempts = profile.attempts;
  const favorites = new Set(favoriteScenarioIds);
  const recentExam = connectionFromAttempts("exam", attempts, "來自你最近的實際練習");
  const companion = connectionFromAttempts("companion", attempts, "來自你已完成的練習線索");
  const insights = connectionFromAttempts("insights", attempts, "來自這台裝置保留的學習線索");
  const astronomyAttempts = attempts.filter((attempt) => /自然|科學/.test(attempt.curriculumDomain) && attempt.knowledge.some((topic) => ASTRONOMY_TOPIC.test(topic)));
  const principlesAttempts = attempts.filter((attempt) => favorites.has(attempt.questionId) || attempt.knowledge.some((topic) => PRINCIPLE_TOPIC.test(topic)));
  const astronomy = connectionFromAttempts("astronomy", astronomyAttempts, "來自你實際練習過的天文或自然主題");
  const principles = connectionFromAttempts("principles", principlesAttempts, favorites.size ? "來自你收藏或練習過的原理主題" : "來自你實際練習過的原理主題");

  if (recentExam) result.exam = recentExam;
  if (astronomy) result.astronomy = astronomy;
  if (principles) result.principles = principles;
  if (companion) result.companion = companion;
  if (insights) result.insights = insights;

  const completedStation = observatoryStations.find((station) => station.completed && station.title.trim().length > 0);
  if (completedStation) {
    result.observatory = {
      nodeKey: "observatory",
      subject: "作品觀察",
      sourceLabel: "來自你實際完成的觀測站小測驗",
      lifeExamples: [`你已完成「${completedStation.title}」的小測驗；下次觀看作品裡的科學場景時，可以先分開記錄「觀察到的設定」和「想再查證的線索」。`],
    };
  }

  return result;
}

export type SubjectId = "chinese" | "math" | "english" | "science";

export type SubjectDefinition = {
  id: SubjectId;
  name: string;
  region: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  correctRate: number;
};

/** Static curriculum navigation metadata; progress is derived from real attempts at runtime. */
export const SUBJECTS: Record<SubjectId, SubjectDefinition> = {
  chinese: { id: "chinese", name: "國文島", region: "台北", icon: "📜", unlocked: true, progress: 0, correctRate: 0 },
  math: { id: "math", name: "數學城", region: "台中", icon: "📐", unlocked: false, progress: 0, correctRate: 0 },
  english: { id: "english", name: "英文港", region: "高雄", icon: "⚓", unlocked: false, progress: 0, correctRate: 0 },
  science: { id: "science", name: "自然山", region: "花蓮", icon: "🌿", unlocked: false, progress: 0, correctRate: 0 },
};

export function subjectIdForDomain(domain: string): SubjectId | null {
  const value = domain.toLowerCase();
  if (value.includes("國") || value.includes("語文") || value.includes("chinese")) return "chinese";
  if (value.includes("數") || value.includes("math")) return "math";
  if (value.includes("英") || value.includes("english")) return "english";
  if (value.includes("自") || value.includes("科學") || value.includes("science")) return "science";
  return null;
}

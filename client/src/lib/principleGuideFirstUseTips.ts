export const PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY = "xue-principle-guide-first-use-tips-v1";

export type PrincipleGuideFirstUseTip = "visual" | "knowledge";

export type PrincipleGuideFirstUseTips = {
  version: 1;
  visual: boolean;
  knowledge: boolean;
};

const EMPTY_FIRST_USE_TIPS: PrincipleGuideFirstUseTips = {
  version: 1,
  visual: false,
  knowledge: false,
};

function isValidFirstUseTips(value: unknown): value is PrincipleGuideFirstUseTips {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrincipleGuideFirstUseTips>;
  return candidate.version === 1 && typeof candidate.visual === "boolean" && typeof candidate.knowledge === "boolean";
}

export function loadPrincipleGuideFirstUseTips(storage: Pick<Storage, "getItem" | "removeItem"> = localStorage): PrincipleGuideFirstUseTips {
  try {
    const raw = storage.getItem(PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_FIRST_USE_TIPS };
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidFirstUseTips(parsed)) throw new Error("Unsupported first-use tip state");
    return parsed;
  } catch {
    try { storage.removeItem(PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    return { ...EMPTY_FIRST_USE_TIPS };
  }
}

export function savePrincipleGuideFirstUseTips(value: PrincipleGuideFirstUseTips, storage: Pick<Storage, "setItem"> = localStorage) {
  try {
    storage.setItem(PRINCIPLE_GUIDE_FIRST_USE_TIPS_STORAGE_KEY, JSON.stringify(value));
  } catch { /* Private browsing must not interrupt learning. */ }
}

export function markPrincipleGuideFirstUseTipSeen(tip: PrincipleGuideFirstUseTip, storage: Pick<Storage, "getItem" | "removeItem" | "setItem"> = localStorage) {
  const current = loadPrincipleGuideFirstUseTips(storage);
  const next: PrincipleGuideFirstUseTips = { ...current, [tip]: true };
  savePrincipleGuideFirstUseTips(next, storage);
  return next;
}

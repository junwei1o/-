/** 雲端船籍模式的儲存 key（與 cloudSync 的 CLOUD_MODE_KEY 相同）。 */
const CLOUD_MODE_KEY = "xue-cloud-mode-v1";
/** 遊客暫名的儲存 key。 */
const GUEST_NAME_KEY = "xue-guest-name-v1";

/** 讀取雲端船籍名字；沒有雲端存檔時傳回 null。 */
function readCloudName(storage: Pick<Storage, "getItem">): string | null {
  try {
    const raw = storage.getItem(CLOUD_MODE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: unknown };
    return typeof parsed.name === "string" && parsed.name ? parsed.name : null;
  } catch {
    return null;
  }
}

/** 隨機生成「遊客＋4 位數字」的名字（6 個字元，符合雲端名字 2–6 字元規則）。 */
function makeGuestName(): string {
  const number = 1000 + Math.floor(Math.random() * 9000);
  return `遊客${number}`;
}

/**
 * 取得目前作答者對外顯示的名字：
 *  - 有雲端船籍名字 → 用它（已建立雲端存檔）。
 *  - 否則為遊客：首次自動產生一個穩定的「遊客編號」存於瀏覽器，之後都用同一個，
 *    讓遊客不用註冊也能登上答題榜。
 */
export function getPlayerName(storage: Pick<Storage, "getItem" | "setItem"> = localStorage): string {
  const cloud = readCloudName(storage);
  if (cloud) return cloud;
  const existing = storage.getItem(GUEST_NAME_KEY);
  if (existing) return existing;
  const guest = makeGuestName();
  storage.setItem(GUEST_NAME_KEY, guest);
  return guest;
}

/** 是否為遊客（尚未建立雲端船籍名字）；可用於榜單標示「遊客」與引導取名。 */
export function isGuest(storage: Pick<Storage, "getItem"> = localStorage): boolean {
  return !readCloudName(storage);
}

import type { AdminGroup, AdminGroupId, AdminModule } from "./types";

/**
 * 站長後台的模組註冊表（2026-10-01）。
 *
 * 擴充方式（完整流程只有兩步）：
 *   1. 在 `client/src/admin/modules/` 新增一個檔案，export 一個 `AdminModule`
 *   2. 在 `client/src/admin/modules/index.ts` 的 `ADMIN_MODULES` 陣列加一行
 * **外殼與版面不需要任何改動。**
 *
 * 這裡刻意做成「資料驅動」而非「在 JSX 硬寫區塊」：站長後台預期會持續長大，
 * 硬寫的版面每加一個模組就要動一次外殼，遲早會變成難以維護的巨型元件。
 */

/**
 * 分組定義。**新增分組不一定要改這裡**——未登記的分組會被自動附加到最後
 * （見 `groupAdminModules`）；但在這裡登記可以控制標題、說明與順序。
 */
/**
 * 分組順序刻意對應站長的**實際巡檢動線**，不是隨意排列：
 *
 *   站點現在忙不忙（營運與資源）
 *     → 裡面裝了什麼（內容與題庫）
 *     → 這些東西花多少錢（成本與用量）
 *     → 誰能進來、以什麼身分（存取與角色）
 *     → 我要動手做什麼（維護工具）
 *     → 它跑在什麼上面（系統與部署）
 *
 * `order` 以 10 為間隔，方便日後在任兩組之間插入新分組而不必重編號。
 */
export const ADMIN_GROUPS: AdminGroup[] = [
  {
    id: "overview",
    label: "站長總覽",
    description: "先看這裡：現在健康嗎、有人在用嗎、哪個功能壞了。",
    order: 5,
  },
  {
    id: "operations",
    label: "營運與資源",
    description: "站點本身的運作狀況：資料庫用量、額度與消耗速度。",
    order: 10,
  },
  {
    id: "content",
    label: "內容與題庫",
    description: "學習內容的規模與健康度。",
    order: 20,
  },
  {
    id: "usage",
    label: "成本與用量",
    description: "按次計費的外部資源用量。",
    order: 30,
  },
  {
    id: "access",
    label: "存取與角色",
    description: "三種角色的定位與憑證狀態，確認誰能進哪裡。",
    order: 40,
  },
  {
    id: "maintenance",
    label: "維護工具",
    description: "會主動改變伺服器狀態的操作——請確認後再執行。",
    order: 50,
  },
  {
    id: "system",
    label: "系統與部署",
    description: "版本、部署與前端執行環境資訊。",
    order: 60,
  },
  {
    id: "knowledge",
    label: "知識與文件",
    description: "為什麼這樣做、做過什麼、踩過哪些坑——給站長與之後的 agent 查。",
    order: 70,
  },
];

const modules = new Map<string, AdminModule>();

/**
 * 註冊單一模組。重複 id 會覆蓋（方便測試與熱替換），並在開發環境警告。
 */
export function registerAdminModule(module: AdminModule): void {
  if (modules.has(module.id) && typeof console !== "undefined") {
    console.warn(`[admin] 模組 id 重複，後者覆蓋前者：${module.id}`);
  }
  modules.set(module.id, module);
}

export function registerAdminModules(list: readonly AdminModule[]): void {
  for (const module of list) registerAdminModule(module);
}

/** 測試用：清空註冊表。 */
export function clearAdminModulesForTest(): void {
  modules.clear();
}

/** 目前可用的模組（已套用 isAvailable 過濾與排序）。 */
export function getAdminModules(): AdminModule[] {
  return Array.from(modules.values())
    .filter((module) => {
      if (!module.isAvailable) return true;
      try {
        return module.isAvailable();
      } catch {
        // 旗標判斷壞掉時選擇「不顯示」，而不是讓整個後台掛掉
        return false;
      }
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, "zh-Hant"));
}

export type AdminModuleGroupView = { group: AdminGroup; modules: AdminModule[] };

/**
 * 依分組整理模組。
 *
 * **關鍵保證**：填了未登記分組的模組**不會被丟掉**——會被歸到一個自動產生的
 * 分組並附加在最後。這樣「先寫模組、之後再整理分類」是可行的工作流。
 */
export function groupAdminModules(list: readonly AdminModule[] = getAdminModules()): AdminModuleGroupView[] {
  const known = new Map<AdminGroupId, AdminGroup>(ADMIN_GROUPS.map((group) => [group.id, group]));
  const usedUnknownOrder = new Map<AdminGroupId, number>();

  const buckets = new Map<AdminGroupId, AdminModule[]>();
  for (const module of list) {
    const bucket = buckets.get(module.group);
    if (bucket) bucket.push(module);
    else buckets.set(module.group, [module]);
  }

  const views: AdminModuleGroupView[] = [];
  for (const [groupId, groupModules] of Array.from(buckets.entries())) {
    const declared = known.get(groupId);
    if (declared) {
      views.push({ group: declared, modules: groupModules });
      continue;
    }
    // 未登記分組：自動附加在最後，並保留首次出現的相對順序
    const nextOrder = 1000 + usedUnknownOrder.size;
    usedUnknownOrder.set(groupId, nextOrder);
    views.push({
      group: {
        id: groupId,
        label: groupId,
        description: "（尚未登記的分組——在 ADMIN_GROUPS 加上標題與說明即可）",
        order: nextOrder,
      },
      modules: groupModules,
    });
  }

  return views.sort((a, b) => a.group.order - b.group.order);
}

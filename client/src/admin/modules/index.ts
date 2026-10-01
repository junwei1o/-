import { registerAdminModules } from "../registry";
import type { AdminModule } from "../types";
import { accessRolesModule } from "./accessRoles";
import { resourceMonitorModule } from "./resourceMonitor";
import { systemInfoModule } from "./systemInfo";

/**
 * ⬇️ **新增後台模組的唯一入口**。
 *
 * 只要在下面的陣列加一行，模組就會出現在站長後台，外殼與版面都不需要改。
 * 完整流程：
 *   1. 在 `client/src/admin/modules/` 新增檔案，export 一個 `AdminModule`
 *   2. 在這裡加一行
 * （若想歸到新的分組，可在 `registry.ts` 的 `ADMIN_GROUPS` 補標題與順序；
 *  就算忘了補也不會遺失——未登記分組會自動附加在最後。）
 */
export const ADMIN_MODULES: AdminModule[] = [
  resourceMonitorModule,
  accessRolesModule,
  systemInfoModule,
];

export function registerBuiltinAdminModules(): void {
  registerAdminModules(ADMIN_MODULES);
}

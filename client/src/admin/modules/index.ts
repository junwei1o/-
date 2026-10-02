import { registerAdminModules } from "../registry";
import type { AdminModule } from "../types";
import { accessRolesModule } from "./accessRoles";
import { questionBankModule, siteDataModule } from "./content";
import { maintenanceModule } from "./maintenance";
import { knowledgeCenterModule } from "./knowledge";
import { projectMapModule } from "./knowledgeMap";
import { requestStatsModule, speechSupplyModule } from "./operations";
import { resourceMonitorModule } from "./resourceMonitor";
import { runtimeModule } from "./runtime";
import { securityModule } from "./security";
import { systemInfoModule } from "./systemInfo";
import { aiUsageModule } from "./usage";

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
  // 營運與資源
  resourceMonitorModule,
  requestStatsModule,
  speechSupplyModule,
  // 內容與題庫
  questionBankModule,
  siteDataModule,
  // 成本與用量
  aiUsageModule,
  // 存取與角色
  accessRolesModule,
  securityModule,
  // 系統與部署
  runtimeModule,
  systemInfoModule,
  // 維運操作
  maintenanceModule,
  // 知識與文件
  projectMapModule,
  knowledgeCenterModule,
];

export function registerBuiltinAdminModules(): void {
  registerAdminModules(ADMIN_MODULES);
}

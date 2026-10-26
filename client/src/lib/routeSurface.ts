/**
 * 路由分區判定（單一真相）。
 *
 * 為什麼要獨立成模組：`AuthGate`（決定要不要攔到船名閘）與 `App`（決定要不要
 * 渲染學生導覽列）都需要判斷「這是不是管理面路由」。兩處各寫一份正則，
 * 改一處漏一處就會出現「閘門放行了、導覽列卻還是學生版」的半套狀態
 * （審查協議型 4：語意與實作矛盾）。故抽成共用判定。
 *
 * 2026-10-25 審計 P0 背景：
 * `AuthGate` 原本包住整個 `<Router />`，導致**所有**路由都要先輸入學生船名。
 * 站長在乾淨環境訪 `/admin` 只會看到「輸入你的船長名字」，AdminShell 自己的
 * `admin.login`（站長用戶名）永遠沒機會渲染——管理入口被學生閘吃掉。
 * 修法：管理面路由放行船名閘，改由各元件自行驗身分。
 */

/** 管理面路由前綴：站長後台／督學台／家長摘要。 */
const ADMIN_SURFACE = /^\/(admin|teacher|learning-summary)(\/|$|\?)/;

/**
 * 是否為管理面路由。
 * 這些頁面**不需要**學生船名 session，但**需要**教師／站長身分
 * （由 AdminOnlyRoute 與後端 teacherProcedure / adminProcedure 把關）。
 */
export function isAdminSurface(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // 去掉 query 與 hash 再判斷，避免 `/admin?tab=x` 被誤判為非管理面
  const path = pathname.split(/[?#]/)[0] ?? "";
  return ADMIN_SURFACE.test(path);
}

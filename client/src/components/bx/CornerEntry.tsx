import React, { useEffect, useRef, useState } from "react";
import { Anchor, X } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getSession } from "@/game/session";

/**
 * 首頁角落入口（2026-10-02）。
 *
 * ## 它解決什麼
 *
 * 站長後台從「輸入通關語才能進」改成「輸入站長用戶名」之後，
 * 入口需要一個**不打斷首頁**的位置。首頁是學生每天看的地方，
 * 放一個明顯的「後台」按鈕會干擾所有人。
 *
 * 所以設計成**極低調的固定角落圖標**：
 * - `position: fixed` → **不佔版面**，不影響首頁任何排版
 * - 預設透明度 0.22 → 學生看不到它在動什麼
 * - hover / focus 才提高對比 → 需要的人找得到，不需要的人忽略它
 * - `z-index` 遠低於任何對話框 → 永不蓋住隱私彈窗、導覽、測驗
 *
 * ## 輸入的處理：前端**不知道**站長用戶名是什麼
 *
 * | 輸入 | 結果 |
 * | --- | --- |
 * | 目前登入者自己的船名 | 進設定頁（純前端判斷，不打後端） |
 * | 其他任何輸入 | **一律交給後端判斷** |
 *
 * ⭐ 為什麼不再在前端比對站長用戶名（2026-10-02 收緊）：
 * 前端要比對，就必須把用戶名寫進 bundle——而 **bundle 是公開的**，
 * 任何人打開網頁看 JS 就讀得到 `admin`。那等於把憑證公佈在牆上，
 * 「隱藏的入口」這時只剩心理作用。
 *
 * 改成「前端不認識站長用戶名、一律問後端」之後：
 * - 用戶名**不在公開 bundle 裡**（與 2026-09 那次 PAT 洩漏同一類問題，這裡從根上避免）
 * - 站長日後改 `ADMIN_USERNAME` **只改部署環境即可**，不必改程式、不必重新部署前端
 * - 不需要在前端與後端「同步兩處常數」，也就不會有改一邊漏一邊的風險
 *
 * 代價只是「打錯字要多打一次後端請求」——可忽略，且 API 本來就有速率限制。
 *
 * ## ⚠️ 安全性說明（要誠實講）
 *
 * 純用戶名驗證**沒有第二道因子**。這是站長的知情決定。
 * 「藏起來的入口」只是**降低被隨手試到的機率**，不是安全邊界。
 *
 * 因此這個元件**不做任何前端偽裝**：它一定真的打 `admin.login`，
 * 由後端決定要不要發 session cookie；而且每次嘗試（成功與失敗）都會寫入審計紀錄。
 */


type Verdict = "settings" | "askServer";

/**
 * 判斷輸入該走哪條路——本元件的核心判斷。
 *
 * 刻意做成**模組層級的純函式**而不是寫在元件裡：
 * 這個分支是整個功能的核心，必須能單獨測，
 * 而不是只能「點畫面看對不對」。
 *
 * ⚠️ 這裡**只認得「是不是自己的船名」**，不認得站長用戶名——
 * 理由見上方說明：前端一旦知道站長用戶名，它就會出現在公開 bundle 裡。
 *
 * 規則：
 * - 空白 → askServer（交給後端回錯誤，避免前端洩漏「站長用戶名是空的」這種資訊）
 * - 等於自己���船名（大小寫敏感）→ settings
 * - 其他 → askServer（後端會回 ok 或 invalid）
 */
export function classifyCornerInput(input: string, sessionName: string | null): Verdict {
  const trimmed = input.trim();
  if (!trimmed) return "askServer";
  // 船名比對大小寫敏感：船名是使用者自己取的，不該替他改大小寫
  if (sessionName && trimmed === sessionName) return "settings";
  return "askServer";
}

type Props = {
  /** 測試與實作都會用到：關閉後要不要清空輸入（避免殘留上一次輸入）。 */
  onNavigate?: (path: string) => void;
};

export function CornerEntry({ onNavigate }: Props) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const login = trpc.admin.login.useMutation();

  // 換頁就自動收起來——留著一個開著的輸入框在別頁會很怪
  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Esc 關閉；點面板外也關閉。兩者都是「不給人卡住」的細節。
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    setValue("");
    setError(null);
    if (onNavigate) onNavigate(path);
    else navigate(path);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const sessionName = getSession()?.name ?? null;
    const verdict = classifyCornerInput(value, sessionName);

    if (verdict === "settings") {
      go("/settings");
      return;
    }

    // ⭐ askServer：前端**不認得**站長用戶名，所以一律問後端。
    // 這一條同時處理「對的站長用戶名」與「打錯的字」——
    // 差別由後端回應決定，前端不預先知道。
    login.mutate(
      { username: value.trim() },
      {
        onSuccess: (result) => {
          if (result.ok) {
            // 換完 cookie 要重新載入，讓伺服器端會話生效（身分由 cookie 決定）
            window.location.assign("/admin");
            return;
          }
          setValue("");
          setError("這個名稱認不出來，請再試一次。");
          inputRef.current?.focus();
        },
        onError: () => {
          setError("登入時發生錯誤，請稍後再試。");
          inputRef.current?.focus();
        },
      },
    );
  };

  return (
    <div className="corner-entry">
      <button
        ref={triggerRef}
        type="button"
        className="corner-entry-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="船長入口"
        title="船長入口"
      >
        <Anchor size={15} aria-hidden="true" />
      </button>

      {open && (
        <div className="corner-entry-panel" ref={panelRef} role="dialog" aria-modal="false" aria-label="船長入口">
          <div className="corner-entry-head">
            <p className="corner-entry-title">你是誰？</p>
            <button
              type="button"
              className="corner-entry-close"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="關閉"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={submit}>
            <label className="corner-entry-label" htmlFor="corner-entry-input">
              輸入你的船名
            </label>
            <input
              ref={inputRef}
              id="corner-entry-input"
              className="corner-entry-input"
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="船名"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={24}
              aria-describedby={error ? "corner-entry-error" : undefined}
            />
            {error && (
              <p className="corner-entry-error" id="corner-entry-error" role="alert">
                {error}
              </p>
            )}
            <p className="corner-entry-hint">
              {login.isPending ? "驗證中…" : "輸入船名進設定；輸入站長用戶名進後台。"}
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

export type { Verdict };

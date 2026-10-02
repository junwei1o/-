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
 * ## 三種輸入的處理
 *
 * | 輸入 | 結果 | 為什麼這樣處理 |
 * | --- | --- | --- |
 * | 目前登入者自己的船名 | 進設定頁 | 捷徑；設定頁本來就能進，這裡只是省找路徑的時間 |
 * | 站長用戶名 | 先向後端換 session cookie，再進後台 | **必須真的呼叫後端**，不能只前端跳轉——���則等於前端自己宣告自己是站長 |
 * | 其他 | 顯示錯誤、停在輸入框 | 不跳轉、不清空，讓使用者直接改 |
 *
 * ## ⚠️ 安全性說明（要誠實講）
 *
 * 純用戶名驗證**沒有第二道因子**。這是站長的知情決定。
 * 這裡的「隱藏」只是**降低被隨手試到的機率**，不是安全邊界——
 * 任何人只要在首頁右下角點一下、輸入 `admin`，就是站長。
 *
 * 因此這個元件**不做任何前端偽裝**：它一定真的打 `admin.login`，
 * 由後端決定要不要發 session cookie。
 */
const ADMIN_USERNAME = "admin";

type Verdict = "settings" | "admin" | "invalid";

/**
 * 判斷輸入屬於哪一種情況——本元件的核心判斷。
 *
 * 刻意做成**模組層級的純函式**而不是寫在元件裡：
 * 這三種分支是整個功能的核心，必須能單獨測試，
 * 而不是只能「點畫面看對不對」——那種測試撐不起三個分支的組合。
 *
 * 規則：
 * - 站長用戶名優先於船名比對（萬一兩者撞名，站長身分才是對的）
 * - 船名比對**大小寫敏感**：船名是使用者自己取的，不該替他改大小寫
 * - 站長用戶名比對不敏感：避免大小寫差異擋住自己
 */
export function classifyCornerInput(input: string, sessionName: string | null): Verdict {
  const trimmed = input.trim();
  if (!trimmed) return "invalid";
  if (trimmed.toLowerCase() === ADMIN_USERNAME) return "admin";
  if (sessionName && trimmed === sessionName) return "settings";
  return "invalid";
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
    if (verdict === "invalid") {
      setError(
        sessionName
          ? `「${value.trim()}」不是你的船名，也不是站長用戶名。`
          : `「${value.trim()}」不是站長用戶名。如果這是你的船名，請先登入。`,
      );
      return;
    }

    // 站長：一定要真的問後端換 cookie，不能只前端跳轉
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
          setError("站長用戶名不正確，請再試一次。");
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

export { ADMIN_USERNAME };
export type { Verdict };

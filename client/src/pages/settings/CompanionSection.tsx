// 伴小星雙腦：規則腦離線常駐；這裡設定/驗證使用者自備的 OpenAI 相容代理。
import React, { useState } from "react";
import { RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_COMPANION_MODEL,
  clearCompanionConfig,
  loadCompanionConfig,
  saveCompanionConfig,
} from "@/game/companionBrain";
import { SettingsSection } from "./ui";

type ProxyTestState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function CompanionSection() {
  const [base, setBase] = useState(() => loadCompanionConfig()?.base ?? "");
  const [apiKey, setApiKey] = useState(() => loadCompanionConfig()?.key ?? "");
  const [model, setModel] = useState(() => loadCompanionConfig()?.model || DEFAULT_COMPANION_MODEL);
  const [testState, setTestState] = useState<ProxyTestState>({ kind: "idle" });
  const testProxy = trpc.aiCompanion.testProxy.useMutation();

  function handleSave() {
    if (!base.trim() || !apiKey.trim()) {
      toast.error("請先填寫 API Base 與 API Key。");
      return;
    }
    saveCompanionConfig({ base, key: apiKey, model: model.trim() || DEFAULT_COMPANION_MODEL });
    toast.success("已儲存代理設定，答題後「和伴小星聊聊這題」會優先使用它。");
  }

  function handleClear() {
    clearCompanionConfig();
    setBase("");
    setApiKey("");
    setModel(DEFAULT_COMPANION_MODEL);
    setTestState({ kind: "idle" });
    toast.success("已清除代理；深度伴讀會改用內建模型，連不上時由離線規則腦接手。");
  }

  async function handleTest() {
    if (!base.trim() || !apiKey.trim()) {
      toast.error("先填寫 API Base 與 API Key，才能測試連線。");
      return;
    }
    setTestState({ kind: "pending" });
    try {
      const result = await testProxy.mutateAsync({
        base: base.trim(),
        key: apiKey.trim(),
        model: model.trim() || undefined,
      });
      setTestState({
        kind: "ok",
        message: `連線成功，往返 ${(result.latencyMs / 1000).toFixed(1)} 秒，模型回報：${result.model || "未提供"}`,
      });
    } catch (error) {
      setTestState({
        kind: "error",
        message: error instanceof Error ? error.message : "連線失敗，請檢查設定。",
      });
    }
  }

  return (
    <SettingsSection
      className="settings-companion-card"
      icon={<Sparkles size={20} />}
      eyebrow="伴小星雙腦"
      title="深度伴讀的 AI 代理"
      titleId="companion-brain-title"
      description="伴小星平常以「規則腦」離線陪讀，不會直接給答案。你可以在這裡填入自己的 OpenAI 相容代理（例如國內外中繼站、自架端點），答題後「和伴小星聊聊這題」就會改由它引導；AI 提問每分鐘有安全次數上限，超過會自動回到離線規則腦。"
    >
      <div className="settings-companion-grid">
        <label className="settings-companion-item" htmlFor="companion-proxy-base">
          <span>API Base（到 /v1 即可）</span>
          <input
            id="companion-proxy-base"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://你的代理網址/v1"
            value={base}
            onChange={(event) => setBase(event.target.value)}
          />
        </label>
        <label className="settings-companion-item" htmlFor="companion-proxy-key">
          <span>API Key（只存這台裝置）</span>
          <input
            id="companion-proxy-key"
            type="password"
            autoComplete="off"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>
        <label className="settings-companion-item" htmlFor="companion-proxy-model">
          <span>模型名稱</span>
          <input
            id="companion-proxy-model"
            type="text"
            autoComplete="off"
            placeholder={DEFAULT_COMPANION_MODEL}
            value={model}
            onChange={(event) => setModel(event.target.value)}
          />
        </label>
      </div>
      <div className="settings-companion-actions">
        <button type="button" className="settings-companion-test" onClick={() => void handleTest()} disabled={testState.kind === "pending"}>
          <RefreshCw size={15} aria-hidden="true" />
          {testState.kind === "pending" ? "測試中…" : "查詢驗證代理連線"}
        </button>
        <button type="button" className="settings-companion-save" onClick={handleSave}>儲存設定</button>
        <button type="button" className="settings-companion-clear" onClick={handleClear}><Trash2 size={15} aria-hidden="true" />清除代理</button>
      </div>
      {testState.kind === "ok" ? (
        <p className="settings-companion-state is-ok" role="status">{testState.message}</p>
      ) : null}
      {testState.kind === "error" ? (
        <p className="settings-companion-state is-error" role="alert">{testState.message}</p>
      ) : null}
      <ul className="settings-companion-notes">
        <li>只在「答題後的深度伴讀」使用，主頁不會主動派任務。</li>
        <li>深度反思時，題目、選項與你選的答案會送往 AI 服務商產生導讀，不會包含姓名、學校、班級。</li>
        <li>不填代理也能用：系統會嘗試內建模型，再不行就由離線規則腦陪讀。</li>
      </ul>
    </SettingsSection>
  );
}

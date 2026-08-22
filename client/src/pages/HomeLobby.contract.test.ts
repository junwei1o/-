import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("首頁沉浸式航海儀表板契約", () => {
  it("以既有本機 RPG、適性作答與 playerData 呈現資料，不建立虛構進度", () => {
    expect(source).toContain('loadRpgState()');
    expect(source).toContain('loadAdaptiveProfile()');
    expect(source).toContain('useState<LearningRecord[]>(() => getLearningRecord())');
    expect(source).toContain('useState(() => getPlayerData())');
    expect(source).toContain('setLearningRecords(getLearningRecord())');
    expect(source).toContain('setPlayerData(getPlayerData())');
    expect(source).toContain('{playerData.gold} 金幣');
    expect(source).toContain('playerData.totalAnswers');
    expect(source).toContain('playerData.exp');
  });

  it("在跨頁或答題資料變動後重新同步 localStorage 最新狀態", () => {
    expect(source).toContain('window.addEventListener("storage", syncLatestData)');
    expect(source).toContain('window.addEventListener("focus", syncLatestData)');
    expect(source).toContain('window.addEventListener("pageshow", syncLatestData)');
    expect(source).toContain('[refreshLearningData, learningRecords.length]');
  });

  it("把主航海圖維持為絕對背景並讓狀態與行動層可操作", () => {
    expect(source).toContain('className="home-dashboard-map-layer"');
    expect(source).toContain('<TaiwanMainNavigationMap');
    expect(source).toContain('className="home-dashboard-hud"');
    expect(source).toContain('className="home-dashboard-status"');
    expect(source).toContain('className="home-dashboard-actions"');
  });

  it("提供特產背包、真實錯題入口、首航引導與隨機冒險", () => {
    expect(source).toContain('getInventory()');
    expect(source).toContain('aria-label="特產背包"');
    expect(source).toContain('setLocation("/wrong-answers")');
    expect(source).toContain('firstUse ? "開始探險" : "繼續探險"');
    expect(source).toContain('randomQuestionId=');
    expect(source).toContain('randomBonus=');
  });

  it("只從已解鎖的真實學科題庫抽取隨機冒險題目", () => {
    expect(source).toContain('const candidateSubjects = new Set(availableIslands.map((island) => island.subject));');
    expect(source).toContain('questions.filter((question) => candidateSubjects.has(question.subject))');
  });

  it("在金幣增加時提供可近用的視覺回饋", () => {
    expect(source).toContain('isGoldPulseActive');
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain('is-gold-pulse');
  });
});

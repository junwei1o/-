import React, { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Bookmark, BookmarkCheck, Check, ChevronDown, CircleAlert, CircleDot, CircleHelp, Lightbulb, ListTree, MapPinned, Orbit, RotateCcw, ScanSearch, ShieldCheck, Tags } from "lucide-react";
import { QuestionTransition } from "@/components/QuestionTransition";
import { SpeechReadButton } from "@/components/SpeechReadButton";
import {
  createWormholeGuideSession,
  getWorldPrinciple,
  getWormholeQuestionGuidance,
  getWormholeGuideQuestions,
  type WorldPrinciple,
  type WormholeGuideDomain,
  WORMHOLE_GUIDE_DOMAINS,
  WORMHOLE_GUIDE_QUESTIONS,
} from "@/lib/worldPrinciples";
import { loadScenarioFavorites, saveScenarioFavorites } from "@/lib/scenarioFavorites";
import { loadPrincipleGuideFirstUseTips, markPrincipleGuideFirstUseTipSeen, type PrincipleGuideFirstUseTip } from "@/lib/principleGuideFirstUseTips";
import { getPrincipleGuideFirstUseTipCopy, getPrincipleGuideStrategyRecap, type PrincipleGuideTipSubject } from "@/lib/principleGuideTipCopy";
import { loadStudentGradePreference } from "@/lib/studentGradePreference";

const GUIDE_DOMAIN_META: Record<WormholeGuideDomain, { label: string; subtitle: string; icon: typeof Orbit }> = {
  gravity: { label: "重力", subtitle: "軌道與偏折", icon: Orbit },
  light: { label: "光", subtitle: "訊號與光譜", icon: ScanSearch },
  energy: { label: "能量", subtitle: "來源與轉換", icon: Lightbulb },
  spacetime: { label: "時空", subtitle: "測量與模型", icon: CircleHelp },
  observation: { label: "觀測", subtitle: "資料與證據", icon: ShieldCheck },
};

const GUIDE_DOMAIN_TIP_SUBJECT: Record<WormholeGuideDomain, PrincipleGuideTipSubject> = {
  gravity: "science",
  light: "science",
  energy: "science",
  spacetime: "science",
  observation: "science-inquiry",
};

const OPTION_CHECK_ITEMS = [
  { id: "conditions", label: "回看條件", detail: "我有回到題幹指定的條件，沒有自行補上沒有出現的設定。" },
  { id: "evidence", label: "對照線索", detail: "我有確認選擇能連回可比較的資料、觀測或推理線索。" },
  { id: "direction", label: "說清關係", detail: "我有檢查因果、方向或前後關係，沒有只憑直覺下結論。" },
] as const;

export default function PrincipleGuideQuiz() {
  const [domain, setDomain] = useState<WormholeGuideDomain>("gravity");
  const [sessionKey, setSessionKey] = useState(0);
  const session = useMemo(() => createWormholeGuideSession(domain), [domain, sessionKey]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [selectedVisualSignalId, setSelectedVisualSignalId] = useState<string | null>(null);
  const [isVisualExpanded, setIsVisualExpanded] = useState(false);
  const [isKnowledgeExpanded, setIsKnowledgeExpanded] = useState(false);
  const [usedStrategySupports, setUsedStrategySupports] = useState<PrincipleGuideFirstUseTip[]>([]);
  const [firstUseTips, setFirstUseTips] = useState(() => loadPrincipleGuideFirstUseTips());
  const [activeFirstUseTip, setActiveFirstUseTip] = useState<PrincipleGuideFirstUseTip | null>(null);
  const studentGrade = useMemo(() => loadStudentGradePreference(), []);
  const [checkedOptionIds, setCheckedOptionIds] = useState<string[]>([]);
  const [selectedReflectionId, setSelectedReflectionId] = useState<string | null>(null);
  const [favoriteQuestionIds, setFavoriteQuestionIds] = useState<string[]>(() => loadScenarioFavorites());
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteDomainFilter, setFavoriteDomainFilter] = useState<WormholeGuideDomain | "all">("all");
  const [favoriteTopicFilter, setFavoriteTopicFilter] = useState("all");
  const [answeredCount, setAnsweredCount] = useState(0);
  const question = session[questionIndex];
  const tipSubject = question ? GUIDE_DOMAIN_TIP_SUBJECT[question.domain] : "science";
  const firstUseTipCopy = useMemo(() => ({
    visual: getPrincipleGuideFirstUseTipCopy("visual", studentGrade, tipSubject),
    knowledge: getPrincipleGuideFirstUseTipCopy("knowledge", studentGrade, tipSubject),
  }), [studentGrade, tipSubject]);
  const strategyRecap = useMemo(() => getPrincipleGuideStrategyRecap(studentGrade, tipSubject, usedStrategySupports), [studentGrade, tipSubject, usedStrategySupports]);
  const guidance = useMemo(() => question ? getWormholeQuestionGuidance(question) : null, [question]);
  const selectedTransferChoice = guidance?.scenario.choices.find((choice) => choice.id === selectedTransferId) ?? null;
  const selectedVisualSignal = guidance?.visualProbe.signals.find((signal) => signal.id === selectedVisualSignalId) ?? null;
  const selectedReflection = guidance?.reflection.choices.find((choice) => choice.id === selectedReflectionId) ?? null;
  const relatedPrinciples = useMemo(() => (guidance?.relatedPrincipleKeys ?? [])
    .map((key) => getWorldPrinciple(key))
    .filter((item): item is WorldPrinciple => item !== undefined), [guidance]);
  const favoriteQuestions = useMemo(() => favoriteQuestionIds
    .map((id) => WORMHOLE_GUIDE_QUESTIONS.find((entry) => entry.id === id))
    .filter((entry): entry is (typeof WORMHOLE_GUIDE_QUESTIONS)[number] => Boolean(entry)), [favoriteQuestionIds]);
  const favoriteDomainOptions = useMemo(() => Array.from(new Set(favoriteQuestions.map((entry) => entry.domain))), [favoriteQuestions]);
  const favoriteTopicOptions = useMemo(() => Array.from(new Set(favoriteQuestions.flatMap((entry) => entry.principleKeys))), [favoriteQuestions]);
  const filteredFavoriteQuestions = useMemo(() => favoriteQuestions.filter((entry) => (
    (favoriteDomainFilter === "all" || entry.domain === favoriteDomainFilter)
    && (favoriteTopicFilter === "all" || entry.principleKeys.includes(favoriteTopicFilter as (typeof entry.principleKeys)[number]))
  )), [favoriteQuestions, favoriteDomainFilter, favoriteTopicFilter]);
  const areFavoriteFiltersActive = favoriteDomainFilter !== "all" || favoriteTopicFilter !== "all";
  const isScenarioFavorite = favoriteQuestionIds.includes(question.id);
  const isAnswered = selectedIndex !== null;

  const resetQuestionInteractions = () => {
    setSelectedIndex(null);
    setShowHint(false);
    setSelectedTransferId(null);
    setSelectedVisualSignalId(null);
    setIsVisualExpanded(false);
    setIsKnowledgeExpanded(false);
    setUsedStrategySupports([]);
    setActiveFirstUseTip(null);
    setCheckedOptionIds([]);
    setSelectedReflectionId(null);
  };

  const changeDomain = (nextDomain: WormholeGuideDomain) => {
    setDomain(nextDomain);
    setQuestionIndex(0);
    resetQuestionInteractions();
  };

  const chooseOption = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setAnsweredCount((current) => current + 1);
  };

  const toggleOptionCheck = (id: string) => {
    setCheckedOptionIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
  };

  const showFirstUseTip = (tip: PrincipleGuideFirstUseTip) => {
    if (firstUseTips[tip]) return;
    setFirstUseTips(markPrincipleGuideFirstUseTipSeen(tip));
    setActiveFirstUseTip(tip);
  };

  const toggleVisualDisclosure = () => {
    const nextExpanded = !isVisualExpanded;
    setIsVisualExpanded(nextExpanded);
    if (nextExpanded) {
      setUsedStrategySupports((current) => current.includes("visual") ? current : [...current, "visual"]);
      showFirstUseTip("visual");
    }
    else setActiveFirstUseTip((current) => current === "visual" ? null : current);
  };

  const toggleKnowledgeDisclosure = () => {
    const nextExpanded = !isKnowledgeExpanded;
    setIsKnowledgeExpanded(nextExpanded);
    if (nextExpanded) {
      setUsedStrategySupports((current) => current.includes("knowledge") ? current : [...current, "knowledge"]);
      showFirstUseTip("knowledge");
    }
    else setActiveFirstUseTip((current) => current === "knowledge" ? null : current);
  };

  const toggleScenarioFavorite = () => {
    const next = isScenarioFavorite ? favoriteQuestionIds.filter((id) => id !== question.id) : [...favoriteQuestionIds, question.id];
    setFavoriteQuestionIds(next);
    saveScenarioFavorites(next);
    setFavoriteMessage(next.includes(question.id) ? `已收藏「${guidance?.scenario.title ?? "這張情境卡"}」，之後可從快速複習開啟。` : `已取消收藏「${guidance?.scenario.title ?? "這張情境卡"}」。`);
  };

  const openFavoriteScenario = (questionId: string) => {
    const target = WORMHOLE_GUIDE_QUESTIONS.find((entry) => entry.id === questionId);
    if (!target) return;
    const nextIndex = getWormholeGuideQuestions(target.domain).findIndex((entry) => entry.id === questionId);
    setDomain(target.domain);
    setQuestionIndex(Math.max(0, nextIndex));
    resetQuestionInteractions();
    setFavoriteMessage(`已開啟「${getWormholeQuestionGuidance(target).scenario.title}」的快速複習。`);
  };

  const nextQuestion = () => {
    if (questionIndex < session.length - 1) {
      setQuestionIndex((current) => current + 1);
      resetQuestionInteractions();
      return;
    }
    setSessionKey((current) => current + 1);
    setQuestionIndex(0);
    resetQuestionInteractions();
  };

  if (!question) return null;

  return (
    <section className="principle-guide" aria-labelledby="principle-guide-heading">
      <div className="principle-guide-head">
        <div>
          <p className="eyebrow accent">WORMHOLE GUIDANCE / 原理引導問答</p>
          <h2 id="principle-guide-heading">先抓住一條可驗證的線索</h2>
          <p>蟲洞是想像情境；每一題都帶你把畫面連回可觀測、可討論的世界原理。作答後會停留在解析，請自行決定何時前進。</p>
        </div>
        <div className="principle-guide-status" aria-live="polite">
          <strong>{answeredCount}</strong><span>本次已回應</span>
        </div>
      </div>

      <div className="principle-guide-domains" role="tablist" aria-label="選擇蟲洞原理引導主題">
        {WORMHOLE_GUIDE_DOMAINS.map((entry) => {
          const meta = GUIDE_DOMAIN_META[entry];
          const Icon = meta.icon;
          const active = entry === domain;
          return <button
            key={entry}
            type="button"
            role="tab"
            aria-selected={active}
            className={`principle-guide-domain ${active ? "is-active" : ""}`}
            onClick={() => changeDomain(entry)}
          ><Icon size={17} /><span><strong>{meta.label}</strong><small>{meta.subtitle}</small></span></button>;
        })}
      </div>

      <QuestionTransition itemKey={`${domain}-${questionIndex}-${sessionKey}`} className="principle-question-transition">
      <div className="principle-guide-card" role="tabpanel" aria-label={`${GUIDE_DOMAIN_META[domain].label}引導題`}> 
        <div className="principle-guide-card-top"><span>{question.domainLabel}</span><span>固定題組 {questionIndex + 1} / {session.length}</span></div>
        <h3>{question.prompt}</h3>
        <div className="principle-guide-actions">
          <button type="button" className="principle-guide-hint" onClick={() => setShowHint((current) => !current)} aria-expanded={showHint}><Lightbulb size={16} /> {showHint ? "收起線索" : "先看線索"}</button>
          <p className="principle-guide-fixed"><ShieldCheck size={15} /> 這一輪會固定到你手動前進</p>
        </div>
        {showHint && <p className="principle-guide-hint-panel" role="status"><strong>觀測提示：</strong>{question.hint}</p>}
        {guidance && <section className="principle-guide-scaffold" aria-labelledby={`principle-guide-scaffold-${question.id}`}>
          <div className="principle-guide-scaffold-head">
            <div>
              <p className="principle-guide-scaffold-eyebrow">作答前的原理導航</p>
              <h4 id={`principle-guide-scaffold-${question.id}`}>先整理線索，再決定答案</h4>
            </div>
            <SpeechReadButton
              text={guidance.ttsText}
              label={`${question.domainLabel}原理導航`}
              buttonText="朗讀引導"
              className="principle-guide-scaffold-read"
            />
          </div>
          <div className="principle-guide-scaffold-grid">
            <div className="principle-guide-scaffold-card principle-guide-keywords">
              <div className="principle-guide-scaffold-label"><Tags size={16} aria-hidden="true" />關鍵詞拆解</div>
              <p>{guidance.keywordPrompt}</p>
              <ul aria-label="本題作答前可留意的關鍵詞">
                {guidance.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}
              </ul>
            </div>
            <div className="principle-guide-scaffold-card principle-guide-steps">
              <div className="principle-guide-scaffold-label"><ListTree size={16} aria-hidden="true" />三步驟推理卡</div>
              <ol aria-label="作答前的三步驟推理">
                {guidance.reasoningSteps.map((step, index) => <li key={step.title}><span aria-hidden="true">{index + 1}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}
              </ol>
            </div>
            <div className="principle-guide-scaffold-card principle-guide-misconception" role="note">
              <div className="principle-guide-scaffold-label"><CircleAlert size={16} aria-hidden="true" />容易混淆的地方</div>
              <p>{guidance.misconception}</p>
            </div>
          </div>
          <section className="principle-guide-visual" aria-labelledby={`principle-guide-visual-${question.id}`}>
            <div className="principle-guide-support-head">
              <div className="principle-guide-scaffold-label"><CircleDot size={16} aria-hidden="true" />圖像化微互動</div>
              <SpeechReadButton text={`${guidance.visualProbe.title}。${guidance.visualProbe.prompt} 可按展開圖像線索，選擇一個想先觀察的部分。${firstUseTipCopy.visual}${guidance.visualProbe.signals.map((signal) => `${signal.label}：${signal.detail}`).join(" ")}`} label={`${question.domainLabel}圖像化微互動`} buttonText="朗讀圖像" className="principle-guide-support-read" />
            </div>
            <h5 id={`principle-guide-visual-${question.id}`}>{guidance.visualProbe.title}</h5>
            <p>{guidance.visualProbe.prompt}</p>
            <div className="principle-guide-disclosure-control">
              <button type="button" className="principle-guide-disclosure-trigger" aria-expanded={isVisualExpanded} aria-controls={`principle-guide-visual-content-${question.id}`} aria-describedby={`principle-guide-visual-tip-${question.id}`} onClick={toggleVisualDisclosure}>
                <span>{isVisualExpanded ? "收合圖像線索" : "展開圖像線索"}</span><ChevronDown size={16} aria-hidden="true" />
              </button>
              <span id={`principle-guide-visual-tip-${question.id}`} className="principle-guide-disclosure-tip" role="tooltip">展開後可點選一個想先觀察的線索；不計分，也不會提示正確答案。</span>
            </div>
            <div id={`principle-guide-visual-content-${question.id}`} className={`principle-guide-disclosure ${isVisualExpanded ? "is-expanded" : ""}`} aria-hidden={!isVisualExpanded}>
              <div className="principle-guide-disclosure-inner">
                {activeFirstUseTip === "visual" && isVisualExpanded && <div className="principle-guide-first-use-tip" role="status" aria-live="polite"><div><CircleHelp size={16} aria-hidden="true" /><span><strong>如何使用</strong><p>{firstUseTipCopy.visual}</p></span></div><button type="button" onClick={() => setActiveFirstUseTip(null)}>知道了</button></div>}
                <div className={`principle-guide-visual-stage is-${domain}`}>
                  <svg viewBox="0 0 240 110" aria-hidden="true" focusable="false">
                    <path className="principle-guide-visual-path" d="M18 82 C66 14, 174 14, 222 82" />
                    <path className="principle-guide-visual-path is-secondary" d="M25 91 H215" />
                    <circle className="principle-guide-visual-core" cx="120" cy="54" r="13" />
                    <circle className="principle-guide-visual-node" cx="58" cy="80" r="6" />
                    <circle className="principle-guide-visual-node" cx="182" cy="80" r="6" />
                  </svg>
                  <span className="principle-guide-visual-caption" aria-hidden="true">觀測線索圖</span>
                </div>
                <div className="principle-guide-visual-signals" role="group" aria-label="選擇一個想先觀察的圖像線索，沒有標準答案">
                  {guidance.visualProbe.signals.map((signal) => <button key={signal.id} type="button" tabIndex={isVisualExpanded ? 0 : -1} className={selectedVisualSignalId === signal.id ? "is-selected" : ""} aria-pressed={selectedVisualSignalId === signal.id} onClick={() => setSelectedVisualSignalId(signal.id)}><span aria-hidden="true">{selectedVisualSignalId === signal.id ? <Check size={14} /> : "＋"}</span>{signal.label}</button>)}
                </div>
                {selectedVisualSignal && <p className="principle-guide-visual-reflection" role="status"><strong>先觀察「{selectedVisualSignal.label}」：</strong>{selectedVisualSignal.detail}</p>}
                <small>點選只是整理想法，不計分，也不會提示正確選項。</small>
              </div>
            </div>
          </section>
          {relatedPrinciples.length > 0 && <section className="principle-guide-links" aria-labelledby={`principle-guide-links-${question.id}`}>
            <div className="principle-guide-support-head">
              <div className="principle-guide-scaffold-label"><BookOpen size={16} aria-hidden="true" />知識連結</div>
              <SpeechReadButton text={`${guidance.knowledgeLinkPrompt} 可按展開原理概念卡，查看 ${relatedPrinciples.length} 張相關原理卡。${firstUseTipCopy.knowledge}${relatedPrinciples.map((item) => `${item.name}，${item.short}`).join(" ")}`} label={`${question.domainLabel}相關原理卡`} buttonText="朗讀連結" className="principle-guide-support-read" />
            </div>
            <h5 id={`principle-guide-links-${question.id}`}>先回到概念卡，再把線索帶回來</h5>
            <p>{guidance.knowledgeLinkPrompt}</p>
            <div className="principle-guide-disclosure-control">
              <button type="button" className="principle-guide-disclosure-trigger" aria-expanded={isKnowledgeExpanded} aria-controls={`principle-guide-links-content-${question.id}`} aria-describedby={`principle-guide-links-tip-${question.id}`} onClick={toggleKnowledgeDisclosure}>
                <span>{isKnowledgeExpanded ? "收合原理概念卡" : `展開 ${relatedPrinciples.length} 張原理概念卡`}</span><ChevronDown size={16} aria-hidden="true" />
              </button>
              <span id={`principle-guide-links-tip-${question.id}`} className="principle-guide-disclosure-tip" role="tooltip">可在新頁查看概念卡；回來後，題目與目前的作答狀態仍會保留。</span>
            </div>
            <div id={`principle-guide-links-content-${question.id}`} className={`principle-guide-disclosure ${isKnowledgeExpanded ? "is-expanded" : ""}`} aria-hidden={!isKnowledgeExpanded}>
              <div className="principle-guide-disclosure-inner principle-guide-link-list" aria-label="相關原理概念卡">
                {activeFirstUseTip === "knowledge" && isKnowledgeExpanded && <div className="principle-guide-first-use-tip" role="status" aria-live="polite"><div><CircleHelp size={16} aria-hidden="true" /><span><strong>如何使用</strong><p>{firstUseTipCopy.knowledge}</p></span></div><button type="button" onClick={() => setActiveFirstUseTip(null)}>知道了</button></div>}
                {relatedPrinciples.map((item) => <a key={item.key} href={`/principles/${item.key}`} tabIndex={isKnowledgeExpanded ? 0 : -1} className="principle-guide-link-card"><BookOpen size={17} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.short}</small></span><ArrowRight size={16} aria-hidden="true" /></a>)}
              </div>
            </div>
          </section>}
          <section className="principle-guide-scenario" aria-labelledby={`principle-guide-scenario-${question.id}`}>
            <div className="principle-guide-scenario-head">
              <div className="principle-guide-scaffold-label"><MapPinned size={16} aria-hidden="true" />生活／地圖情境</div>
              <div className="principle-guide-scenario-actions">
                <span>{guidance.scenario.location}</span>
                <button type="button" className={`principle-guide-favorite ${isScenarioFavorite ? "is-saved" : ""}`} onClick={toggleScenarioFavorite} aria-pressed={isScenarioFavorite} aria-label={isScenarioFavorite ? `取消收藏${guidance.scenario.title}` : `收藏${guidance.scenario.title}`}>
                  {isScenarioFavorite ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                  {isScenarioFavorite ? "已收藏" : "收藏情境"}
                </button>
              </div>
            </div>
            <h5 id={`principle-guide-scenario-${question.id}`}>{guidance.scenario.title}</h5>
            <p>{guidance.scenario.context}</p>
            <div className="principle-guide-transfer" aria-labelledby={`principle-guide-transfer-${question.id}`}>
              <strong id={`principle-guide-transfer-${question.id}`}>遷移想一想：{guidance.scenario.transferPrompt}</strong>
              <div className="principle-guide-transfer-choices" role="group" aria-label="選擇一個想嘗試的任務方向，沒有標準答案">
                {guidance.scenario.choices.map((choice) => <button
                  key={choice.id}
                  type="button"
                  className={selectedTransferId === choice.id ? "is-selected" : ""}
                  aria-pressed={selectedTransferId === choice.id}
                  onClick={() => setSelectedTransferId(choice.id)}
                >{choice.label}</button>)}
              </div>
              {selectedTransferChoice && <p className="principle-guide-transfer-reflection" role="status"><strong>你的遷移筆記：</strong>{selectedTransferChoice.reflection}</p>}
              <small>這是把原理帶進新情境的練習，不計分，也沒有標準選項。</small>
            </div>
          </section>
          <aside className="principle-guide-favorites" aria-labelledby="principle-guide-favorites-heading">
            <div className="principle-guide-favorites-head">
              <div><p>我的情境筆記</p><h5 id="principle-guide-favorites-heading">收藏後快速複習</h5></div>
              {filteredFavoriteQuestions.length > 0 && <SpeechReadButton text={`目前顯示 ${filteredFavoriteQuestions.length} 張收藏情境：${filteredFavoriteQuestions.map((entry) => getWormholeQuestionGuidance(entry).scenario.title).join("、")}。選擇一張情境卡，可回到相對應的原理引導題。`} label="篩選後的收藏情境清單" buttonText="朗讀收藏" className="principle-guide-favorites-read" />}
            </div>
            {favoriteQuestions.length > 0 ? <>
              <div className="principle-guide-favorites-filters" aria-label="篩選我的情境筆記">
                <label className="principle-guide-favorites-filter"><span>學科領域</span><select value={favoriteDomainFilter} onChange={(event) => setFavoriteDomainFilter(event.target.value as WormholeGuideDomain | "all")}><option value="all">全部領域</option>{favoriteDomainOptions.map((entry) => <option key={entry} value={entry}>{GUIDE_DOMAIN_META[entry].label}</option>)}</select></label>
                <label className="principle-guide-favorites-filter"><span>主題</span><select value={favoriteTopicFilter} onChange={(event) => setFavoriteTopicFilter(event.target.value)}><option value="all">全部主題</option>{favoriteTopicOptions.map((entry) => <option key={entry} value={entry}>{getWorldPrinciple(entry)?.name ?? entry}</option>)}</select></label>
                {areFavoriteFiltersActive && <button type="button" className="principle-guide-favorites-clear" onClick={() => { setFavoriteDomainFilter("all"); setFavoriteTopicFilter("all"); }}>清除篩選</button>}
              </div>
              {filteredFavoriteQuestions.length > 0 ? <div className="principle-guide-favorites-list" aria-label="已收藏的情境卡">
                {filteredFavoriteQuestions.map((entry) => {
                  const savedGuidance = getWormholeQuestionGuidance(entry);
                  return <button key={entry.id} type="button" className="principle-guide-favorite-entry" onClick={() => openFavoriteScenario(entry.id)}><BookmarkCheck size={15} aria-hidden="true" /><span><strong>{savedGuidance.scenario.title}</strong><small>{savedGuidance.scenario.location}</small></span><ArrowRight size={15} aria-hidden="true" /></button>;
                })}
              </div> : <p className="principle-guide-favorites-empty" role="status">目前沒有符合篩選條件的收藏情境。可調整條件，或按「清除篩選」查看全部筆記。</p>}
            </> : <p className="principle-guide-favorites-empty">尚未收藏情境。遇到特別有幫助的地圖任務時，按「收藏情境」就能在這裡快速回來複習。</p>}
          </aside>
          <p className="principle-guide-favorite-status" role="status" aria-live="polite">{favoriteMessage}</p>
        </section>}
        <div className="principle-guide-options" aria-label="選擇答案">
          {question.options.map((option, index) => {
            const correct = index === question.correctIndex;
            const selected = selectedIndex === index;
            const resultClass = isAnswered ? (correct ? "is-correct" : selected ? "is-wrong" : "") : "";
            return <button
              key={option}
              type="button"
              disabled={isAnswered}
              className={`principle-guide-option ${resultClass}`}
              onClick={() => chooseOption(index)}
            ><span>{String.fromCharCode(65 + index)}</span>{option}</button>;
          })}
        </div>
        {isAnswered && <div className={`principle-guide-feedback ${selectedIndex === question.correctIndex ? "is-correct" : "is-wrong"}`} role="status" aria-live="polite">
          <strong>{selectedIndex === question.correctIndex ? "線索對上了" : "先校準一次線索"}</strong>
          <p>{question.explanation}</p>
          {guidance && <>
          <section className="principle-guide-option-checklist" aria-labelledby={`principle-guide-option-checklist-${question.id}`}>
            <div className="principle-guide-support-head">
              <div className="principle-guide-scaffold-label"><ShieldCheck size={16} aria-hidden="true" />選項檢核</div>
              <SpeechReadButton text={`${guidance.optionCheckPrompt} ${OPTION_CHECK_ITEMS.map((item) => `${item.label}：${item.detail}`).join(" ")}`} label={`${question.domainLabel}選項檢核`} buttonText="朗讀檢核" className="principle-guide-support-read" />
            </div>
            <h5 id={`principle-guide-option-checklist-${question.id}`}>先檢查方法，不把求助當成扣分</h5>
            <p>{guidance.optionCheckPrompt}</p>
            <ul aria-label="不計分的選項自我檢核清單">
              {OPTION_CHECK_ITEMS.map((item) => {
                const checked = checkedOptionIds.includes(item.id);
                return <li key={item.id}><button type="button" aria-pressed={checked} className={checked ? "is-checked" : ""} onClick={() => toggleOptionCheck(item.id)}><span aria-hidden="true">{checked ? <Check size={14} /> : "○"}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span></button></li>;
              })}
            </ul>
            <small>這份檢核只幫你回顧思路，不會改變本題結果。</small>
          </section>
          <section className="principle-guide-reflection" aria-labelledby={`principle-guide-reflection-${question.id}`}>
            <div className="principle-guide-support-head">
              <div className="principle-guide-scaffold-label"><Lightbulb size={16} aria-hidden="true" />小型反思</div>
              <SpeechReadButton text={`${guidance.reflection.prompt} 可選擇：${guidance.reflection.choices.map((choice) => choice.label).join("、")}。這是未計分的反思。`} label={`${question.domainLabel}題後小型反思`} buttonText="朗讀反思" className="principle-guide-support-read" />
            </div>
            <h5 id={`principle-guide-reflection-${question.id}`}>{guidance.reflection.prompt}</h5>
            <div className="principle-guide-reflection-choices" role="group" aria-label="選擇一個想帶到下一題的反思方向，沒有標準答案">
              {guidance.reflection.choices.map((choice) => <button key={choice.id} type="button" className={selectedReflectionId === choice.id ? "is-selected" : ""} aria-pressed={selectedReflectionId === choice.id} onClick={() => setSelectedReflectionId(choice.id)}>{choice.label}</button>)}
            </div>
            {selectedReflection && <p className="principle-guide-reflection-response" role="status"><strong>你的下一步線索：</strong>{selectedReflection.response}</p>}
            <small>這是未計分的學習筆記；選擇後仍可隨時前進下一題。</small>
          </section>
          <section className="principle-guide-strategy-recap" aria-labelledby={`principle-guide-strategy-recap-${question.id}`}>
            <div className="principle-guide-support-head">
              <div className="principle-guide-scaffold-label"><ScanSearch size={16} aria-hidden="true" />觀察策略回顧</div>
              <SpeechReadButton text={`${strategyRecap.title}。${strategyRecap.summary} ${strategyRecap.nextStep} 這是思考過程的回顧，不會依答對或答錯評分。`} label={`${question.domainLabel}觀察策略回顧`} buttonText="朗讀回顧" className="principle-guide-support-read" />
            </div>
            <h5 id={`principle-guide-strategy-recap-${question.id}`}>{strategyRecap.title}</h5>
            <p>{strategyRecap.summary}</p>
            <small>{strategyRecap.nextStep} 這張卡只回顧你剛才的思考過程，不會依答對或答錯評分。</small>
          </section>
          </>}
          <button type="button" className="btn primary principle-guide-next" onClick={nextQuestion}>{questionIndex === session.length - 1 ? <><RotateCcw size={16} /> 重新校準本層</> : <>下一題 <ArrowRight size={16} /></>}</button>
        </div>}
      </div>
      </QuestionTransition>
    </section>
  );
}

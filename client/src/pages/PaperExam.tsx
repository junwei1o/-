import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, ChevronLeft, ChevronRight, CircleAlert, ClipboardList, Flag, MapPinned, Mountain, Orbit, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SpeechReadableText } from "@/components/SpeechReadableText";
import { SpeechReadButton } from "@/components/SpeechReadButton";
import { AiReviewPlanCard } from "@/components/AiReviewPlanCard";
import { QuestionTransition } from "@/components/QuestionTransition";
import {
  buildPaperDeck,
	buildPersonalizedPaperDeck,
  buildSubjectWrongReviewDeck,
  DEFAULT_PAPER_SIZE,
  PAPER_SCOPES,
  PAPER_MISTAKE_REASONS,
  filterWrongPaperQuestions,
  getPaperStrategyRecap,
  getPaperNextGroupStrategyHint,
  getPaperMistakeReason,
  questionIndexToAltitude,
  scorePaper,
  type PaperMistakeReason,
  type PaperQuestion,
  type PaperScope,
  getReviewSelfCheckAdaptation,
  getKnowledgeMasterySummary,
} from "@/lib/paperExam";
import { getDueReviewQuestionIds, loadAdaptiveProfile, recordAdaptiveAttempt, saveAdaptiveProfile, updateLatestAdaptiveAttempt, type AdaptiveErrorType } from "@/game/adaptiveLearning";
import { recordRpgAnswer } from "@/game/rpgStorage";
import { claimRandomAdventureBonus } from "@/game/randomAdventureBonus";
import { queueRandomAdventureRouteReward } from "@/game/randomAdventureRouteReward";
import { rewardForAnswer } from "@/game/rpgRewards";
import { formatJournalSummary, saveJournalEntry } from "@/game/adventureJournal";
import { subjectScopeFromSearch } from "@/lib/studentKnowledgeIslands";
import { recordAnalyticsEvent } from "@/utils/storage";
import { loadPaperStrategyCueEnabled, playPaperStrategyCue, savePaperStrategyCueEnabled } from "@/lib/paperExamStrategyCue";
import { useLocation } from "wouter";
import "./PaperExamAltitude.css";

function toAdaptiveDifficulty(difficulty: string): "基礎" | "標準" | "挑戰" {
  return difficulty === "挑戰" ? "挑戰" : difficulty === "標準" ? "標準" : "基礎";
}

function getHistoricalTopicMastery(topic: string): number | null {
  if (!topic) return null;
  const topicAttempts = loadAdaptiveProfile().attempts.filter((attempt) => attempt.knowledge.includes(topic));
  if (topicAttempts.length === 0) return null;
  const correctCount = topicAttempts.filter((attempt) => attempt.correct).length;
  return Math.round((correctCount / topicAttempts.length) * 100);
}

const SUMMIT_ENCOURAGEMENT_TIMEOUT_MS = 4800;

type ExplanationStage = 0 | 1 | 2;

function buildExplanationStages(question: PaperQuestion) {
  const explanation = question.explanation.trim();
  const sentences = explanation.split(/(?<=[。！？.!?])\s*/).filter(Boolean);
  const summary = sentences[0] ?? explanation;
  const detail = sentences.slice(0, Math.max(2, Math.ceil(sentences.length / 2))).join(" ") || explanation;
  return {
    summary: `${question.learningTopic}：${summary}`,
    detail,
    deepDive: explanation,
  };
}

function errorTypeLabel(errorType: AdaptiveErrorType) {
  return errorType === "concept" ? "觀念還要整理" : errorType === "careless" ? "這次可能是粗心" : "記憶線索需要再喚回";
}

export default function PaperExam() {
  const [location, setLocation] = useLocation();
  const { data, isLoading, error, refetch } = trpc.questionBank.list.useQuery({ limit: 500 });
  const questions = (data?.questions ?? []) as PaperQuestion[];
  const [scope, setScope] = useState<PaperScope>("綜合課綱");
  const [deck, setDeck] = useState<PaperQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [errorTypes, setErrorTypes] = useState<Record<string, AdaptiveErrorType>>({});
  const [explanationStage, setExplanationStage] = useState<Record<string, 0 | 1 | 2>>({});
  const [consecutiveCorrectWithoutExplanation, setConsecutiveCorrectWithoutExplanation] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [reviewTopicConfirmed, setReviewTopicConfirmed] = useState(false);
  const [showRelatedWrong, setShowRelatedWrong] = useState(false);
  const [wrongPracticePreview, setWrongPracticePreview] = useState<PaperQuestion[] | null>(null);
  const [quickQuizBaseline, setQuickQuizBaseline] = useState<number | null>(null);
  const [isQuickQuiz, setIsQuickQuiz] = useState(false);
  const [showSummitEncouragement, setShowSummitEncouragement] = useState(false);
  const [showSummitStrategyRecap, setShowSummitStrategyRecap] = useState(false);
  const [pendingPaperScope, setPendingPaperScope] = useState<PaperScope | null>(null);
  const [strategyCueEnabled, setStrategyCueEnabled] = useState(loadPaperStrategyCueEnabled);
  const reviewTopic = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("reviewTopic")?.trim() ?? "";
  }, [location]);
  const subjectScope = useMemo(() => {
    if (typeof window === "undefined") return null;
    return subjectScopeFromSearch(window.location.search);
  }, [location]);
  const wrongOnly = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("wrongOnly") === "1";
  }, [location]);
  const randomQuestionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("randomQuestionId")?.trim() ?? "";
  }, [location]);
  const randomBonusEventId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("randomBonus")?.trim() ?? "";
  }, [location]);
  const reviewDue = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("reviewDue") === "1";
  }, [location]);
  const reviewTopicLaunchRef = useRef("");
  const subjectScopeLaunchRef = useRef("");
  const wrongOnlyLaunchRef = useRef("");
  const randomAdventureLaunchRef = useRef("");
  const reviewDueLaunchRef = useRef(false);
  const [wrongSubjectFilter, setWrongSubjectFilter] = useState<PaperQuestion["subject"] | "全部">("全部");
  const [wrongReasonFilter, setWrongReasonFilter] = useState<PaperMistakeReason | "全部">("全部");
  const recordedIdsRef = useRef(new Set<string>());
  const startedAtRef = useRef(Date.now());
  const completedJournalSessionRef = useRef<string | null>(null);

  function resetRetentionState() {
    setFlaggedQuestions({});
    setErrorTypes({});
    setExplanationStage({});
    setConsecutiveCorrectWithoutExplanation(0);
  }

  const current = deck[currentIndex];
  const reviewIntroSections = useMemo(() => reviewTopic ? {
    coreConcept: `本次複習聚焦在「${reviewTopic}」。先找出題目要考的核心概念，理解題幹正在詢問的關鍵關係。`,
    answerReminder: "作答時用選項中的關鍵字逐一比對；遇到不確定的地方，可以先閱讀解析，再依自己的步調繼續。",
  } : { coreConcept: "", answerReminder: "" }, [reviewTopic]);
  const reviewIntro = reviewTopic ? `${reviewIntroSections.coreConcept} ${reviewIntroSections.answerReminder}` : "";
  const relatedWrongQuestions = useMemo(() => {
    if (!reviewTopic || typeof window === "undefined") return [];
    const questionById = new Map(questions.map((question) => [question.id, question]));
    const latestWrongAttemptByQuestion = new Map<string, number>();
    loadAdaptiveProfile().attempts.forEach((attempt) => {
      if (!attempt.correct && attempt.knowledge.includes(reviewTopic) && questionById.has(attempt.questionId)) {
        latestWrongAttemptByQuestion.set(attempt.questionId, Math.max(latestWrongAttemptByQuestion.get(attempt.questionId) ?? 0, attempt.timestamp));
      }
    });
    return Array.from(latestWrongAttemptByQuestion.entries())
      .sort(([, firstTimestamp], [, secondTimestamp]) => secondTimestamp - firstTimestamp)
      .slice(0, 3)
      .map(([questionId]) => questionById.get(questionId))
      .filter((question): question is PaperQuestion => Boolean(question));
  }, [questions, reviewTopic]);
  const wrongPracticeTopics = useMemo(
    () => Array.from(new Set((wrongPracticePreview ?? []).map((question) => question.learningTopic.trim()).filter(Boolean))),
    [wrongPracticePreview],
  );
  const result = useMemo(() => scorePaper(deck, answers), [answers, deck]);
  const summitStrategyRecap = useMemo(() => getPaperStrategyRecap(deck), [deck]);
  const nextGroupStrategyHint = useMemo(
    () => getPaperNextGroupStrategyHint(pendingPaperScope ?? scope),
    [pendingPaperScope, scope],
  );
  const quickQuizComparison = useMemo(() => {
    if (!isQuickQuiz || quickQuizBaseline === null || result.total === 0) return null;
    const difference = result.percentage - quickQuizBaseline;
    const narration = `錯題快速測驗掌握度比較。練習前的歷史掌握度為 ${quickQuizBaseline}%，本次快速測驗掌握度為 ${result.percentage}%。`;
    const encouragement = difference > 0
      ? `這次練習多答對了一些以前卡住的地方，掌握線索比開始前增加了 ${difference} 個百分點。`
      : difference === 0
        ? "你已用這次練習確認目前的掌握線索；繼續依自己的步調複習，就能累積更多把握。"
        : "這次練習已整理出最新的掌握線索；回看解析後再練一次，也是在幫自己建立更穩的基礎。";
    return { after: result.percentage, encouragement, narration };
  }, [isQuickQuiz, quickQuizBaseline, result.percentage, result.total]);
  const paperReady = deck.length > 0;
  const currentAnswer = current ? answers[current.id] : undefined;
  const currentAnswered = currentAnswer !== undefined;
  const currentCorrect = currentAnswered && currentAnswer === current?.answer;
  const currentExplanationStage = current ? (explanationStage[current.id] ?? 0) : 0;
  const currentErrorType = current ? errorTypes[current.id] : undefined;
  const currentExplanation = current ? buildExplanationStages(current) : null;
  const allAnswered = paperReady && result.incomplete === 0;
  const wrongQuestions = useMemo(
    () => deck.filter((question) => answers[question.id] !== undefined && answers[question.id] !== question.answer),
    [answers, deck],
  );
  const filteredWrongQuestions = useMemo(
    () => filterWrongPaperQuestions(wrongQuestions, { subject: wrongSubjectFilter, reason: wrongReasonFilter }),
    [wrongQuestions, wrongReasonFilter, wrongSubjectFilter],
  );
  const reviewPlan = trpc.aiTutor.reviewPlan.useMutation();
  const reviewAdaptation = useMemo(() => getReviewSelfCheckAdaptation(filteredWrongQuestions), [filteredWrongQuestions]);
  const knowledgeMastery = useMemo(() => getKnowledgeMasterySummary(filteredWrongQuestions), [filteredWrongQuestions]);
  const reviewPlanPayload = useMemo(() => ({
    filters: { subject: wrongSubjectFilter, reason: wrongReasonFilter },
    adaptation: reviewAdaptation,
    questions: filteredWrongQuestions.map((question) => ({
      subject: question.subject,
      difficulty: question.difficulty,
      learningTopic: question.learningTopic,
      prompt: question.prompt,
      selectedAnswer: question.options[answers[question.id]],
      correctAnswer: question.options[question.answer],
      officialExplanation: question.explanation,
    })),
  }), [answers, filteredWrongQuestions, reviewAdaptation, wrongReasonFilter, wrongSubjectFilter]);

  useEffect(() => {
    if (current) startedAtRef.current = Date.now();
  }, [current?.id]);

  useEffect(() => {
    if (!showSummary || filteredWrongQuestions.length === 0) {
      reviewPlan.reset();
      return;
    }
    reviewPlan.reset();
    reviewPlan.mutate(reviewPlanPayload);
  }, [showSummary, filteredWrongQuestions.length, wrongReasonFilter, wrongSubjectFilter, reviewPlanPayload, reviewPlan.reset, reviewPlan.mutate]);

  useEffect(() => {
    if (!allAnswered) {
      setShowSummitEncouragement(false);
      setShowSummitStrategyRecap(false);
      completedJournalSessionRef.current = null;
      return;
    }

    if (showSummitStrategyRecap) return;
    setShowSummitEncouragement(true);
    const timeoutId = window.setTimeout(() => setShowSummitEncouragement(false), SUMMIT_ENCOURAGEMENT_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [allAnswered, showSummitStrategyRecap]);

  useEffect(() => {
    if (!allAnswered || deck.length === 0 || completedJournalSessionRef.current) return;
    const sessionKey = `exam-${deck.map((question) => question.id).join("-")}-${startedAtRef.current}`;
    completedJournalSessionRef.current = sessionKey;
    const subject = scope === "綜合課綱" ? "綜合課綱" : scope;
    const journalBase = {
      id: sessionKey,
      date: Date.now(),
      subject,
      topicCount: new Set(deck.map((question) => question.learningTopic).filter(Boolean)).size,
      correctCount: result.correct,
      sessionType: "exam" as const,
      islandId: subjectScope ?? null,
    };
    saveJournalEntry({ ...journalBase, summary: formatJournalSummary(journalBase) });
  }, [allAnswered, deck, result.correct, scope, subjectScope]);

  useEffect(() => {
    if (!showSummitEncouragement) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showSummitStrategyRecap) {
        setShowSummitStrategyRecap(false);
        return;
      }
      setShowSummitEncouragement(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showSummitEncouragement, showSummitStrategyRecap]);

  useEffect(() => {
    if (!reviewDue || !questions.length || reviewDueLaunchRef.current) return;
    reviewDueLaunchRef.current = true;
    const profile = loadAdaptiveProfile();
    const dueIds = new Set(getDueReviewQuestionIds(profile, undefined, Date.now()));
    const nextDeck = questions.filter((question) => dueIds.has(question.id)).slice(0, DEFAULT_PAPER_SIZE);
    setScope("綜合課綱");
    setDeck(nextDeck);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(true);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(true);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    setNotice(nextDeck.length ? `今天有 ${nextDeck.length} 題記憶線索回來了，先用自己的步調整理它們。` : "今天暫時沒有到期複習題；你可以繼續探索新的知識島。 ");
  }, [questions, reviewDue]);

  useEffect(() => {
    const reviewLaunchKey = `${subjectScope ?? ""}:${reviewTopic}`;
    if (!reviewTopic || !questions.length || reviewTopicLaunchRef.current === reviewLaunchKey) return;
    reviewTopicLaunchRef.current = reviewLaunchKey;
    const topicQuestions = questions.filter((question) => question.learningTopic.trim() === reviewTopic && (!subjectScope || question.subject === subjectScope));
    const reviewScope = subjectScope ?? "綜合課綱";
    const nextDeck = buildPaperDeck(topicQuestions, reviewScope, DEFAULT_PAPER_SIZE);
    setScope(reviewScope);
    setDeck(nextDeck);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(false);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(false);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    const reviewLabel = subjectScope ? `「${subjectScope}」的「${reviewTopic}」` : `「${reviewTopic}」`;
    setNotice(nextDeck.length ? `已準備${reviewLabel}複習，共 ${nextDeck.length} 題。請先確認本次練習內容。` : `找不到${reviewLabel}的題目，請回到學習報告選擇其他知識點。`);
  }, [questions, reviewTopic, subjectScope]);

  useEffect(() => {
    if (!randomQuestionId || !questions.length || randomAdventureLaunchRef.current === randomQuestionId) return;
    const randomQuestion = questions.find((question) => question.id === randomQuestionId);
    randomAdventureLaunchRef.current = randomQuestionId;
    if (!randomQuestion) {
      setNotice("這次隨機冒險題目已無法確認；請回到航海儀表板重新抽題。");
      return;
    }
    setScope(randomQuestion.subject);
    setDeck([randomQuestion]);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(true);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(true);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    setNotice("隨機冒險已準備好：答對這一題可獲得雙倍航海金幣。");
  }, [questions, randomQuestionId]);

  useEffect(() => {
    const wrongOnlyLaunchKey = `${subjectScope ?? ""}:${wrongOnly ? "wrong-only" : ""}`;
    if (!wrongOnly || !subjectScope || !questions.length || wrongOnlyLaunchRef.current === wrongOnlyLaunchKey) return;
    wrongOnlyLaunchRef.current = wrongOnlyLaunchKey;
    subjectScopeLaunchRef.current = subjectScope;
    const nextDeck = buildSubjectWrongReviewDeck(questions, loadAdaptiveProfile().attempts, subjectScope);
    setScope(subjectScope);
    setDeck(nextDeck);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(true);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(true);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    setNotice(nextDeck.length
      ? `已從${subjectScope}知識島準備 ${nextDeck.length} 題錯題重練，請依自己的步調重新整理線索。`
      : `目前沒有${subjectScope}的近期錯題，可以選擇繼續挑戰並留下新的學習線索。`);
  }, [questions, subjectScope, wrongOnly]);

  useEffect(() => {
    if (!subjectScope || reviewTopic || wrongOnly || !questions.length || subjectScopeLaunchRef.current === subjectScope) return;
    subjectScopeLaunchRef.current = subjectScope;
    const nextDeck = buildPaperDeck(questions, subjectScope, DEFAULT_PAPER_SIZE);
    setScope(subjectScope);
    setDeck(nextDeck);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(true);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(false);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    setNotice(nextDeck.length ? `已從${subjectScope}知識島準備 ${nextDeck.length} 題練習。選項一經點選就會立即顯示結果。` : `目前沒有${subjectScope}題目，可以先從其他試卷開始探索。`);
  }, [questions, reviewTopic, subjectScope, wrongOnly]);

  function startWrongQuestionPractice() {
    if (relatedWrongQuestions.length === 0) {
      setNotice(`目前沒有「${reviewTopic}」的錯題可以練習。`);
      return;
    }
    setWrongPracticePreview([...relatedWrongQuestions]);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(false);
    setShowRelatedWrong(false);
    setNotice(`已準備 ${relatedWrongQuestions.length} 題錯題快速測驗，請先確認練習範圍。`);
  }

  function requestPaperStart(nextScope = scope) {
    const openingNewTip = pendingPaperScope !== nextScope;
    setScope(nextScope);
    setPendingPaperScope(nextScope);
    setNotice(`開始 ${nextScope} 題組前，先看看這句準備策略。`);
    if (openingNewTip) playPaperStrategyCue(strategyCueEnabled);
  }

  function toggleStrategyCue() {
    const nextEnabled = !strategyCueEnabled;
    setStrategyCueEnabled(nextEnabled);
    savePaperStrategyCueEnabled(nextEnabled);
    setNotice(nextEnabled ? "已開啟下一組策略提示音。" : "已關閉下一組策略提示音。畫面與文字提示會持續保留。");
  }
function pickPoolWithCooldown(nextScope: PaperScope): PaperQuestion[] {
    const attempts = loadAdaptiveProfile().attempts;
    const recentIds = new Set(
      [...attempts]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 48)
        .map((attempt) => attempt.questionId)
    );
    const cooled = questions.filter((question) => !recentIds.has(question.id));
    const inScope = (list: PaperQuestion[]) =>
      nextScope === "綜合課綱" ? list : list.filter((question) => question.subject === nextScope);
    const allInScope = inScope(questions);
    if (inScope(cooled).length >= Math.min(DEFAULT_PAPER_SIZE, allInScope.length)) return cooled;
    return questions;
  }

  function startPaper(nextScope = scope) {
    const nextDeck = buildPaperDeck(pickPoolWithCooldown(nextScope), nextScope, DEFAULT_PAPER_SIZE);
    setScope(nextScope);
    setPendingPaperScope(null);
    setDeck(nextDeck);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(true);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(false);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    setNotice(nextDeck.length ? `已建立 ${nextScope} 試卷，共 ${nextDeck.length} 題。選項一經點選就會立即顯示結果。` : "目前沒有符合此範圍的題目，請選擇其他試卷。");
  }

  function retryUnmasteredQuestions() {
    const retryDeck = [...wrongQuestions];
    if (retryDeck.length === 0) {
      setNotice("本次沒有未掌握題目可以再練，請繼續保持穩定的學習節奏。 ");
      return;
    }
    setDeck(retryDeck);
    setAnswers({});
    resetRetentionState();
    setCurrentIndex(0);
    setShowSummary(false);
    setReviewTopicConfirmed(true);
    setWrongPracticePreview(null);
    setQuickQuizBaseline(null);
    setIsQuickQuiz(false);
    setShowRelatedWrong(false);
    setWrongSubjectFilter("全部");
    setWrongReasonFilter("全部");
    recordedIdsRef.current = new Set();
    startedAtRef.current = Date.now();
    setNotice(`已準備 ${retryDeck.length} 題本次未掌握題目，現在就用自己的步調再練一次。`);
  }

  function changeScope(nextScope: PaperScope) {
    if (paperReady && Object.keys(answers).length > 0 && !window.confirm("切換試卷會清除目前作答，是否繼續？")) return;
    requestPaperStart(nextScope);
  }

  function updateAttemptMetadata(questionId: string, patch: { flagged?: boolean; errorType?: AdaptiveErrorType }) {
    const nextProfile = updateLatestAdaptiveAttempt(loadAdaptiveProfile(), questionId, patch);
    saveAdaptiveProfile(nextProfile);
  }

  function toggleDoubt(question: PaperQuestion) {
    if (!currentAnswered) return;
    const nextFlagged = !Boolean(flaggedQuestions[question.id]);
    setFlaggedQuestions((previous) => ({ ...previous, [question.id]: nextFlagged }));
    updateAttemptMetadata(question.id, { flagged: nextFlagged });
    setNotice(nextFlagged ? "已標記疑惑。之後可從記憶警報回來整理這題。" : "已取消疑惑標記，仍可依自己的步調回看解析。");
  }

  function classifyError(question: PaperQuestion, errorType: AdaptiveErrorType) {
    if (!currentAnswered || currentCorrect) return;
    setErrorTypes((previous) => ({ ...previous, [question.id]: errorType }));
    updateAttemptMetadata(question.id, { errorType });
    setNotice(`已記下「${errorTypeLabel(errorType)}」，這會幫助下一次複習更貼近你的需要。`);
  }

  function revealExplanation(question: PaperQuestion, stage: ExplanationStage) {
    setExplanationStage((previous) => ({ ...previous, [question.id]: stage }));
    if (stage > 0) setConsecutiveCorrectWithoutExplanation(0);
  }

  function answerQuestion(question: PaperQuestion, selected: number) {
    if (answers[question.id] !== undefined || recordedIdsRef.current.has(question.id)) return;
    const correct = selected === question.answer;
    const timestamp = Date.now();
    const difficulty = toAdaptiveDifficulty(question.difficulty);
    const responseMs = Math.min(25_000, Math.max(250, timestamp - startedAtRef.current));
    let nextProfile = loadAdaptiveProfile();
    nextProfile = recordAdaptiveAttempt(nextProfile, {
      questionId: question.id,
      curriculumDomain: question.subject,
      knowledge: [question.learningTopic],
      difficulty,
      correct,
      responseMs,
      timeLimitMs: 25_000,
      timestamp,
      flagged: flaggedQuestions[question.id] === true,
      ...(correct ? {} : { errorType: errorTypes[question.id] ?? "memory" as AdaptiveErrorType }),
    });
    saveAdaptiveProfile(nextProfile);
    recordAnalyticsEvent({ type: "answer", subject: question.subject, questionId: question.id, correct, timestamp });
    const ordinaryReward = rewardForAnswer({ eventId: `paper-${timestamp}-${question.id}`, correct, secondsLeft: undefined, streak: 0 });
    recordRpgAnswer({
      eventId: `paper-${timestamp}-${question.id}`,
      correct,
      curriculumDomain: question.subject,
      subject: question.subject,
      difficulty,
    });
    const bonus = randomBonusEventId && randomQuestionId === question.id
      ? claimRandomAdventureBonus({ eventId: randomBonusEventId, correct, bonusCoins: ordinaryReward.coins })
      : { awarded: 0 };
    if (bonus.awarded && randomBonusEventId) {
      queueRandomAdventureRouteReward({
        eventId: randomBonusEventId,
        questionId: question.id,
        subject: question.subject,
        completedAt: timestamp,
      });
      const randomAdventureData = {
        questionId: question.id,
        knowledgePoint: question.learningTopic?.trim() || null,
        baseCoins: ordinaryReward.coins,
        bonusCoins: bonus.awarded,
        totalCoins: ordinaryReward.coins + bonus.awarded,
      };
      const journalBase = {
        id: `random-adventure-${randomBonusEventId}`,
        date: timestamp,
        subject: question.subject,
        topicCount: question.learningTopic?.trim() ? 1 : 0,
        correctCount: 1,
        sessionType: "exam" as const,
        islandId: null,
        randomAdventure: randomAdventureData,
      };
      saveJournalEntry({ ...journalBase, summary: formatJournalSummary(journalBase) });
    }
    recordedIdsRef.current.add(question.id);
    setAnswers((previous) => ({ ...previous, [question.id]: selected }));
    if (correct) {
      setConsecutiveCorrectWithoutExplanation((previous) => {
        const next = previous + 1;
        if (next >= 10) setNotice("你已連續答對 10 題，而且都先靠自己的線索完成。可以試試看挑戰更難的區域。" );
        else setNotice(`第 ${currentIndex + 1} 題答對了。已記錄學習進度。${bonus.awarded ? ` 隨機冒險加發 ${bonus.awarded} 枚金幣。` : ""}`);
        return next;
      });
    } else {
      setConsecutiveCorrectWithoutExplanation(0);
      const distractor = question.strongDistractor;
      setNotice(distractor?.optionIndex === selected && distractor.note.trim()
        ? `這很接近了！但要注意${distractor.note}`
        : `第 ${currentIndex + 1} 題需要複習。請先看速記口訣，再依自己的步調繼續。`);
    }
  }

  return (
    <main className="paper-exam-page">
      <section className="paper-exam-hero" aria-labelledby="paper-exam-title">
        <p className="paper-exam-kicker"><ClipboardList size={16} aria-hidden="true" /> 十二年國教常規答題</p>
        <h1 id="paper-exam-title">常規試卷答題</h1>
        <p>選擇試卷範圍後逐題作答。點選選項就會立即顯示正誤與解析，不需要交卷，也不會在作答中跳轉或重排。</p>
        {!paperReady && (
          <nav className="paper-home-launchpad" aria-label="學習快速入口">
            <button type="button" className="paper-home-primary" onClick={() => requestPaperStart()} disabled={isLoading || Boolean(error)}>
              <BookOpenCheck size={20} aria-hidden="true" />
              <span><strong>開始今日試卷</strong><small>依目前選擇建立固定題組</small></span>
            </button>
            <button type="button" className="paper-home-secondary" onClick={() => setLocation("/map")}>
              <MapPinned size={19} aria-hidden="true" />
              <span><strong>查看今日智慧導引</strong><small>從實際學習紀錄找下一步</small></span>
            </button>
            <button type="button" className="paper-home-secondary" onClick={() => setLocation("/astronomy")}>
              <Orbit size={19} aria-hidden="true" />
              <span><strong>探索天文館</strong><small>進入專屬天文知識挑戰</small></span>
            </button>
          </nav>
        )}
      </section>

      <section className="paper-exam-panel" aria-labelledby="paper-scope-title">
        <div className="paper-exam-panel-heading">
          <div>
            <p className="paper-exam-eyebrow">試卷設定</p>
            <h2 id="paper-scope-title">選擇答題範圍</h2>
          </div>
          <span className="paper-exam-count">每份最多 {DEFAULT_PAPER_SIZE} 題</span>
        </div>
        <div className="paper-scope-grid" role="radiogroup" aria-label="試卷範圍">
          {PAPER_SCOPES.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={scope === item}
              className={`paper-scope-button ${scope === item ? "is-selected" : ""}`}
              onClick={() => changeScope(item)}
            >
              <strong>{item}</strong>
              <small>{item === "綜合課綱" ? "四科均衡組卷" : `${item}領域專屬試卷`}</small>
            </button>
          ))}
        </div>
        {!paperReady && (
          <button type="button" className="paper-primary-button" onClick={() => requestPaperStart()} disabled={isLoading || Boolean(error)}>
            <BookOpenCheck size={19} aria-hidden="true" /> {isLoading ? "題庫載入中…" : "建立試卷"}
          </button>
        )}
        {error && <p className="paper-error" role="alert"><CircleAlert size={17} aria-hidden="true" /> 題庫暫時無法載入。<button type="button" onClick={() => refetch()}>重新載入</button></p>}
        <p className="sr-only" aria-live="polite">{notice}</p>
      </section>

      {pendingPaperScope && (
        <aside className="paper-next-group-tip" aria-labelledby="paper-next-group-tip-title" data-testid="paper-next-group-tip">
          <BookOpenCheck size={24} aria-hidden="true" />
          <div className="paper-next-group-tip-copy">
            <p>下一組準備</p>
            <h2 id="paper-next-group-tip-title">{nextGroupStrategyHint.subjectLabel}</h2>
            <strong>{nextGroupStrategyHint.tip}</strong>
            <span>帶著這個方向開始，慢慢整理自己的線索就好。</span>
          </div>
          <SpeechReadButton
            text={`${nextGroupStrategyHint.subjectLabel}。${nextGroupStrategyHint.tip} 帶著這個方向開始，慢慢整理自己的線索就好。`}
            label="下一組學科策略提示"
            buttonText="朗讀提示"
            compact
          />
          <div className="paper-next-group-tip-actions">
            <button
              type="button"
              className="paper-next-group-tip-sound-toggle"
              onClick={toggleStrategyCue}
              aria-pressed={strategyCueEnabled}
              aria-label={strategyCueEnabled ? "關閉下一組策略提示音" : "開啟下一組策略提示音"}
            >
              {strategyCueEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
              提示音：{strategyCueEnabled ? "開" : "關"}
            </button>
            <button type="button" className="paper-secondary-button" onClick={() => { setPendingPaperScope(null); setNotice("已保留目前選擇，可準備好後再開始下一組題目。"); }}>
              稍後再說
            </button>
            <button type="button" className="paper-primary-button" onClick={() => startPaper(pendingPaperScope)}>
              <BookOpenCheck size={18} aria-hidden="true" />開始本組題目
            </button>
          </div>
        </aside>
      )}

      {paperReady && showSummary && (
        <section className="paper-summary-panel" aria-labelledby="paper-summary-title">
          <div className="paper-summary-hero">
            <p className="paper-exam-kicker"><ClipboardList size={16} aria-hidden="true" /> 試卷完成</p>
            <h2 id="paper-summary-title">學習成果總結</h2>
            <p>這份試卷的作答結果已保存到學習紀錄。請從錯題解析中挑選下一個複習重點。</p>
          </div>
          <div className="paper-summary-stats" aria-label="試卷統計">
            <div><strong>{result.percentage}</strong><span>最終分數</span></div>
            <div><strong>{result.correct} / {result.total}</strong><span>答對題數</span></div>
            <div><strong>{wrongQuestions.length}</strong><span>需要複習</span></div>
          </div>
          {isQuickQuiz && (
            <section className="mastery-comparison-card" aria-labelledby="mastery-comparison-title">
              <div className="mastery-comparison-heading">
                <div>
                  <p className="paper-exam-eyebrow">錯題快速測驗回顧</p>
                  <h3 id="mastery-comparison-title">掌握度前後比較</h3>
                </div>
                <SpeechReadButton
                  text={quickQuizComparison?.narration ?? "這次快速測驗已完成，但尚無足夠的過去作答資料可供比較。請繼續累積自己的學習紀錄。"}
                  label="掌握度比較"
                  buttonText="朗讀比較"
                  compact
                />
              </div>
              {quickQuizComparison ? (
                <>
                  <p className="mastery-comparison-copy">練習前使用這個知識點的過去作答紀錄；練習後只使用本次快速測驗的真實結果。</p>
                  <div className="mastery-comparison-bars" role="img" aria-label={`掌握度比較：練習前 ${quickQuizBaseline}%；練習後 ${quickQuizComparison.after}%。`}>
                    <div className="mastery-comparison-row">
                      <div className="mastery-comparison-label"><span>練習前</span><strong>{quickQuizBaseline}%</strong><small>過去作答</small></div>
                      <div className="mastery-comparison-track" aria-hidden="true"><span className="mastery-bar-before" style={{ width: `${quickQuizBaseline}%` }} /></div>
                    </div>
                    <div className="mastery-comparison-row">
                      <div className="mastery-comparison-label"><span>練習後</span><strong>{quickQuizComparison.after}%</strong><small>本次快速測驗</small></div>
                      <div className="mastery-comparison-track" aria-hidden="true"><span className="mastery-bar-after" style={{ width: `${quickQuizComparison.after}%` }} /></div>
                    </div>
                  </div>
                  <p className="mastery-comparison-encouragement" aria-live="polite">{quickQuizComparison.encouragement}</p>
                </>
              ) : (
                <p className="mastery-comparison-empty" aria-live="polite">這次快速測驗已完成。尚無足夠的過去作答紀錄可比較；你已開始累積自己的掌握線索。</p>
              )}
            </section>
          )}
          {wrongQuestions.length > 0 ? (
            <div className="paper-wrong-answers" aria-labelledby="paper-wrong-title">
              <div className="paper-summary-section-heading"><p className="paper-exam-eyebrow">逐題複習</p><h3 id="paper-wrong-title">錯題詳細解析</h3></div>
              <div className="paper-wrong-filters" aria-label="錯題篩選">
                <label>
                  <span>題型</span>
                  <select value={wrongSubjectFilter} onChange={(event) => setWrongSubjectFilter(event.target.value as PaperQuestion["subject"] | "全部")}>
                    <option value="全部">全部題型</option>
                    {PAPER_SCOPES.filter((item): item is PaperQuestion["subject"] => item !== "綜合課綱").map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>錯誤原因</span>
                  <select value={wrongReasonFilter} onChange={(event) => setWrongReasonFilter(event.target.value as PaperMistakeReason | "全部")}>
                    <option value="全部">全部原因</option>
                    {PAPER_MISTAKE_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
                <div className="paper-wrong-filter-summary" aria-live="polite">顯示 {filteredWrongQuestions.length} / {wrongQuestions.length} 題</div>
                {(wrongSubjectFilter !== "全部" || wrongReasonFilter !== "全部") && <button type="button" className="paper-filter-reset" onClick={() => { setWrongSubjectFilter("全部"); setWrongReasonFilter("全部"); }}>清除篩選</button>}
              </div>
              {filteredWrongQuestions.length > 0 ? <>
                <AiReviewPlanCard
                  isPending={reviewPlan.isPending}
                  error={Boolean(reviewPlan.error)}
                  data={reviewPlan.data}
                  filteredCount={filteredWrongQuestions.length}
                  knowledgeMastery={knowledgeMastery}
                  onRetry={() => reviewPlan.mutate(reviewPlanPayload)}
                />
                <div className="paper-wrong-list">
                {filteredWrongQuestions.map((question) => {
                  const selectedAnswer = answers[question.id];
                  return (
                    <article key={`summary-${question.id}`} className="paper-wrong-card">
                      <p className="paper-question-meta">第 {deck.indexOf(question) + 1} 題 · {question.subject} · {question.learningTopic}</p>
                      <SpeechReadableText as="h3" text={question.prompt} label="錯題題目" className="paper-wrong-prompt" compact={false} />
                      <div className="paper-wrong-answer-grid">
                        <p><span>你的作答</span><SpeechReadableText as="strong" text={question.options[selectedAnswer]} label="你的作答" compact /></p>
                        <p><span>正確答案</span><SpeechReadableText as="strong" text={question.options[question.answer]} label="正確答案" compact /></p>
                      </div>
                      <SpeechReadableText as="p" text={question.explanation} label="錯題詳細解析" className="paper-explanation" compact={false} />
                    </article>
                  );
                })}
                </div>
              </> : <aside className="paper-summary-empty-filter" aria-live="polite"><strong>找不到符合條件的錯題</strong><span>請清除篩選，或換一個題型與錯誤原因。</span></aside>}
            </div>
          ) : (
            <aside className="paper-summary-perfect" aria-live="polite"><strong>本次沒有錯題</strong><span>所有答案都正確，請繼續保持穩定的學習節奏。</span></aside>
          )}
          <div className="paper-summary-actions">
            {wrongQuestions.length > 0 && <button type="button" className="paper-retry-unmastered-button" onClick={retryUnmasteredQuestions} aria-label={`再練一次本次的 ${wrongQuestions.length} 題未掌握題目`}><RotateCcw size={18} aria-hidden="true" />再練一次未掌握題目</button>}
            <button type="button" className="paper-secondary-button" onClick={() => setShowSummary(false)}><ChevronLeft size={18} aria-hidden="true" />回看答題</button>
            <button type="button" className="paper-primary-button" onClick={() => requestPaperStart(scope)}><RotateCcw size={18} aria-hidden="true" />再做一份試卷</button>
          </div>
        </section>
      )}

      {paperReady && current && reviewTopic && wrongPracticePreview && !showSummary && (
        <section className="paper-review-confirmation paper-wrong-practice-preview" aria-labelledby="wrong-practice-preview-title">
          <div className="paper-review-confirmation-icon" aria-hidden="true"><RotateCcw size={26} /></div>
          <p className="paper-exam-kicker">快速複習準備</p>
          <h2 id="wrong-practice-preview-title">只練習這些錯題</h2>
          <p className="paper-review-confirmation-copy">開始前先看看這次快速測驗的範圍，集中整理曾經卡住的地方。</p>
          <div className="paper-wrong-practice-stats" aria-label="錯題快速測驗資訊">
            <div><strong>{wrongPracticePreview.length}</strong><span>題錯題</span></div>
            <div><strong>{wrongPracticeTopics.length}</strong><span>個知識點</span></div>
          </div>
          <section className="paper-wrong-practice-topics" aria-labelledby="wrong-practice-topics-title">
            <h3 id="wrong-practice-topics-title">本次涵蓋的知識點</h3>
            <div className="paper-wrong-practice-topic-list">
              {wrongPracticeTopics.map((topic) => <span key={topic}>{topic}</span>)}
            </div>
          </section>
          <div className="paper-review-confirmation-actions">
            <button type="button" className="paper-secondary-button" onClick={() => { setWrongPracticePreview(null); setQuickQuizBaseline(null); setIsQuickQuiz(false); setNotice("已返回錯題清單。"); }}><ChevronLeft size={18} aria-hidden="true" />返回錯題清單</button>
            <button type="button" className="paper-primary-button" onClick={() => {
              const practiceDeck = wrongPracticePreview;
              setQuickQuizBaseline(getHistoricalTopicMastery(reviewTopic));
              setIsQuickQuiz(true);
              setDeck(practiceDeck);
              setAnswers({});
    resetRetentionState();
              setCurrentIndex(0);
              setShowSummary(false);
              setReviewTopicConfirmed(true);
              setWrongPracticePreview(null);
              setWrongSubjectFilter("全部");
              setWrongReasonFilter("全部");
              recordedIdsRef.current = new Set();
              startedAtRef.current = Date.now();
              setNotice(`開始只練習「${reviewTopic}」的 ${practiceDeck.length} 題錯題。`);
            }}><BookOpenCheck size={19} aria-hidden="true" />開始快速測驗</button>
          </div>
        </section>
      )}

      {paperReady && current && reviewTopic && !reviewTopicConfirmed && !wrongPracticePreview && !showSummary && (
        <section className="paper-review-confirmation" aria-labelledby="paper-review-confirmation-title">
          <div className="paper-review-confirmation-icon" aria-hidden="true"><BookOpenCheck size={26} /></div>
          <p className="paper-exam-kicker">開始前確認</p>
          <h2 id="paper-review-confirmation-title">本次複習知識點</h2>
          <p className="paper-review-confirmation-topic">{reviewTopic}</p>
          <p className="paper-review-confirmation-copy">你即將練習這個知識點的專屬題目，先確認主題，再用自己的步調開始作答。</p>
          <div className="paper-review-intro" aria-label="本次複習導讀">
            <div>
              <p className="paper-review-intro-label">答題前小提示</p>
              <p className="paper-review-intro-copy">先聽一段簡短導讀，熟悉這次練習的思考方向。</p>
            </div>
            <SpeechReadButton text={reviewIntro} label="本次複習導讀" buttonText="先聽導讀" compact={false} />
            <details className="paper-review-transcript">
              <summary>展開導讀文字稿</summary>
              <div className="paper-review-transcript-body" aria-label="導讀文字稿">
                <section aria-labelledby="review-core-concept-title">
                  <h3 id="review-core-concept-title">核心概念</h3>
                  <p>{reviewIntroSections.coreConcept}</p>
                </section>
                <section aria-labelledby="review-answer-reminder-title">
                  <h3 id="review-answer-reminder-title">作答提醒</h3>
                  <p>{reviewIntroSections.answerReminder}</p>
                  <div className="paper-related-wrong-review">
                    <button type="button" className="paper-related-wrong-button" aria-expanded={showRelatedWrong} onClick={() => setShowRelatedWrong((visible) => !visible)}>
                      <RotateCcw size={16} aria-hidden="true" />查看相關錯題{relatedWrongQuestions.length > 0 ? `（${relatedWrongQuestions.length} 題）` : ""}
                    </button>
                    {showRelatedWrong && (
                      <div className="paper-related-wrong-list" aria-label="相關錯題回顧">
                        {relatedWrongQuestions.length > 0 ? <>
                          {relatedWrongQuestions.map((question) => (
                            <article key={`related-wrong-${question.id}`} className="paper-related-wrong-card">
                              <p className="paper-question-meta">{question.subject} · {question.learningTopic}</p>
                              <SpeechReadableText as="h3" text={question.prompt} label="相關錯題題目" compact={false} />
                              <SpeechReadableText as="p" text={`正確答案：${question.options[question.answer]}。${question.explanation}`} label="相關錯題解析" compact={false} />
                            </article>
                          ))}
                          <button type="button" className="paper-related-wrong-practice-button" onClick={startWrongQuestionPractice}>
                            <BookOpenCheck size={17} aria-hidden="true" />只練習這些錯題
                          </button>
                        </> : <p className="paper-related-wrong-empty">目前還沒有「{reviewTopic}」的錯題紀錄，先從這次練習開始累積自己的解題線索。</p>}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </details>
          </div>
          <div className="paper-review-confirmation-meta" aria-label="本次複習資訊">
            <span><strong>{deck.length}</strong> 題</span>
            <span>即時回饋</span>
            <span>可隨時查看解析</span>
          </div>
          <div className="paper-review-confirmation-actions">
            <button type="button" className="paper-secondary-button" onClick={() => setLocation("/learning-insights")}><ChevronLeft size={18} aria-hidden="true" />返回學習報告</button>
            <button type="button" className="paper-primary-button" onClick={() => { setQuickQuizBaseline(null); setIsQuickQuiz(false); setReviewTopicConfirmed(true); setNotice(`開始複習「${reviewTopic}」。`); }}><BookOpenCheck size={19} aria-hidden="true" />開始複習</button>
          </div>
        </section>
      )}

      {paperReady && current && (!reviewTopic || reviewTopicConfirmed) && !showSummary && (
        <section className="paper-question-panel" aria-labelledby="paper-question-title">
          <QuestionTransition itemKey={current.id} className="paper-question-transition">
          {(() => {
            const altitude = questionIndexToAltitude(result.answered, deck.length);
	            const altitudeSpeechText = `玉山高度計。目前海拔 ${altitude.toLocaleString("zh-TW")} 公尺。已完成 ${result.answered} 題，現在來到第 ${currentIndex + 1} 題。`;
	            const summitEncouragementText = "你完成這一組題目，玉山高度計已抵達 3,952 公尺。每一次認真整理線索，都是新的前進。";
	            const summitStrategySpeechText = `${summitStrategyRecap.title}。${summitStrategyRecap.summary} ${summitStrategyRecap.strategies.join(" ")}${summitStrategyRecap.knowledgeTopics.length ? ` 本組知識點：${summitStrategyRecap.knowledgeTopics.join("、")}。` : ""}`;
            return (
              <div className="paper-question-journey">
                <div className="paper-progress-row"><span>第 {currentIndex + 1} / {deck.length} 題</span><span>{scope} · {current.subject} · {current.learningTopic}</span></div>
                <aside className="paper-altitude-card" aria-label="玉山高度計">
                  <div
                    className="paper-altitude-meter"
                    role="progressbar"
                    aria-label="玉山高度計"
                    aria-valuemin={0}
                    aria-valuemax={deck.length}
                    aria-valuenow={result.answered}
                    aria-valuetext={`目前海拔 ${altitude.toLocaleString("zh-TW")} 公尺，已完成 ${result.answered} 題`}
                    data-testid="paper-altitude-gauge"
                  >
                    <span className="paper-altitude-meter-snow" aria-hidden="true" />
                    <span className="paper-altitude-meter-fill" style={{ height: `${deck.length ? (result.answered / deck.length) * 100 : 0}%` }} aria-hidden="true" />
                  </div>
                  <div className="paper-altitude-copy">
                    <p>玉山高度計</p>
                    <strong data-testid="paper-altitude-value">目前海拔 {altitude.toLocaleString("zh-TW")}m</strong>
                    <small>每完成一題，就向高處前進一步。</small>
                  </div>
                  <SpeechReadButton text={altitudeSpeechText} label="玉山高度計" compact />
                </aside>
                {showSummitEncouragement && (
                  <aside className="paper-summit-encouragement" role="status" aria-atomic="true" data-testid="paper-summit-encouragement">
                    <Mountain size={24} aria-hidden="true" />
	                    <div className="paper-summit-encouragement-copy">
                      <p>抵達玉山山頂</p>
                      <strong>完成這一組題目了</strong>
                      <span>你已走完整段學習航線，先為自己的投入喝采。</span>
	                    </div>
	                    <SpeechReadButton text={summitEncouragementText} label="登頂鼓勵" compact />
	                    <button
	                      type="button"
	                      className="paper-summit-strategy-trigger"
	                      aria-expanded={showSummitStrategyRecap}
	                      aria-controls="paper-summit-strategy-recap"
	                      onClick={() => setShowSummitStrategyRecap((visible) => !visible)}
	                    >
	                      <BookOpenCheck size={16} aria-hidden="true" />回顧本組策略
	                    </button>
	                    <button
                      type="button"
                      className="paper-summit-encouragement-close"
                      aria-label="關閉登頂鼓勵"
	                      onClick={() => { setShowSummitStrategyRecap(false); setShowSummitEncouragement(false); }}
	                    >
	                      <X size={17} aria-hidden="true" />
	                    </button>
	                    {showSummitStrategyRecap && (
	                      <section id="paper-summit-strategy-recap" className="paper-summit-strategy-recap" aria-labelledby="paper-summit-strategy-title" data-testid="paper-summit-strategy-recap">
	                        <div className="paper-summit-strategy-heading">
	                          <div>
	                            <p>本組策略回顧</p>
	                            <h3 id="paper-summit-strategy-title">{summitStrategyRecap.title}</h3>
	                          </div>
	                          <div className="paper-summit-strategy-actions">
	                            <SpeechReadButton text={summitStrategySpeechText} label="本組策略回顧" buttonText="朗讀策略" compact />
	                            <button type="button" className="paper-summit-strategy-close" aria-label="關閉本組策略回顧" onClick={() => setShowSummitStrategyRecap(false)}>
	                              <X size={16} aria-hidden="true" />
	                            </button>
	                          </div>
	                        </div>
	                        <p className="paper-summit-strategy-summary">{summitStrategyRecap.summary}</p>
	                        {summitStrategyRecap.strategies.length > 0 && <ul className="paper-summit-strategy-list">{summitStrategyRecap.strategies.map((strategy) => <li key={strategy}>{strategy}</li>)}</ul>}
	                        {summitStrategyRecap.knowledgeTopics.length > 0 && <p className="paper-summit-strategy-topics"><strong>本組知識點：</strong>{summitStrategyRecap.knowledgeTopics.join("、")}</p>}
	                      </section>
	                    )}
	                  </aside>
                )}
              </div>
            );
          })()}
          <div className="paper-question-heading"><div><p className="paper-question-meta">{current.grade} 年級 · {current.difficulty}</p><SpeechReadableText as="h2" text={current.prompt} label="題目" className="paper-question-prompt" compact={false} /></div></div>
          <div className="paper-options" role="radiogroup" aria-label="答案選項">
            {current.options.map((option, index) => {
              const isSelected = currentAnswer === index;
              const isCorrectOption = currentAnswered && index === current.answer;
              return (
                <label key={`${current.id}-${index}`} className={`paper-option ${isSelected ? "is-selected" : ""} ${isCorrectOption ? "is-correct" : ""} ${currentAnswered && isSelected && !currentCorrect ? "is-wrong" : ""}`}>
                  <input type="radio" name={`question-${current.id}`} checked={isSelected} disabled={currentAnswered} onChange={() => answerQuestion(current, index)} />
                  <span aria-hidden="true">{String.fromCharCode(65 + index)}</span><SpeechReadableText as="b" text={option} label={`選項 ${String.fromCharCode(65 + index)}`} className="paper-option-copy" compact />
                </label>
              );
            })}
          </div>
          {currentAnswered && currentExplanation && (
            <aside className={`paper-answer-feedback ${currentCorrect ? "is-correct" : "is-wrong"}`} aria-live="polite">
              <div className="paper-feedback-heading"><SpeechReadableText as="strong" text={currentCorrect ? "答對了！" : "先整理線索"} label="答題結果" compact={false} /></div>
              {!currentCorrect && <p>正確答案：<SpeechReadableText as="strong" text={current.options[current.answer]} label="正確答案" compact /></p>}
              {!currentCorrect && (
                <div className="paper-error-classification" role="group" aria-label="這次答錯的原因">
                  <span>你覺得這次需要哪種幫助？</span>
                  <div className="paper-error-classification-actions">
                    {(["concept", "careless", "memory"] as AdaptiveErrorType[]).map((type) => (
                      <button key={type} type="button" className={currentErrorType === type ? "is-selected" : ""} aria-pressed={currentErrorType === type} onClick={() => classifyError(current, type)}>
                        {type === "concept" ? "整理觀念" : type === "careless" ? "檢查細節" : "喚回記憶"}
                      </button>
                    ))}
                  </div>
                  {currentErrorType && <small>{errorTypeLabel(currentErrorType)}</small>}
                </div>
              )}
              <div className="paper-explanation-stages" aria-label="三段式解析">
                <p className="paper-explanation-stage-label">速記口訣</p>
                <SpeechReadableText as="p" text={currentExplanation.summary} label="速記口訣" className="paper-explanation" compact={false} />
                {currentExplanationStage >= 1 && <div className="paper-explanation-detail"><p className="paper-explanation-stage-label">進一步理解</p><SpeechReadableText as="p" text={currentExplanation.detail} label="進一步理解" className="paper-explanation" compact={false} /></div>}
                {currentExplanationStage >= 2 && <div className="paper-explanation-detail"><p className="paper-explanation-stage-label">完整深讀</p><SpeechReadableText as="p" text={currentExplanation.deepDive} label="完整深讀" className="paper-explanation" compact={false} /></div>}
              </div>
              <div className="paper-explanation-actions">
                <button type="button" className="paper-explanation-toggle" onClick={() => revealExplanation(current, currentExplanationStage >= 1 ? 0 : 1)} aria-expanded={currentExplanationStage >= 1}>{currentExplanationStage >= 1 ? "收起進一步理解" : "看進一步理解"}</button>
                {currentExplanationStage >= 1 && <button type="button" className="paper-explanation-toggle" onClick={() => revealExplanation(current, currentExplanationStage >= 2 ? 1 : 2)} aria-expanded={currentExplanationStage >= 2}>{currentExplanationStage >= 2 ? "收起完整深讀" : "進入完整深讀"}</button>}
                <button type="button" className={`paper-doubt-button ${flaggedQuestions[current.id] ? "is-flagged" : ""}`} aria-pressed={Boolean(flaggedQuestions[current.id])} onClick={() => toggleDoubt(current)}><Flag size={16} aria-hidden="true" />{flaggedQuestions[current.id] ? "已標記疑惑" : "標記疑惑"}</button>
              </div>
              {currentCorrect && consecutiveCorrectWithoutExplanation >= 10 && <p className="paper-challenge-prompt" role="status">你已連續答對 10 題，而且先靠自己的線索完成；可以試試看挑戰更難的區域。</p>}
            </aside>
          )}
          <div className="paper-question-actions">
            <button type="button" className="paper-secondary-button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}><ChevronLeft size={18} aria-hidden="true" />上一題</button>
            {currentIndex < deck.length - 1 ? <button type="button" className="paper-primary-button" onClick={() => setCurrentIndex((index) => index + 1)} disabled={!currentAnswered}>下一題<ChevronRight size={18} aria-hidden="true" /></button> : <button type="button" className="paper-primary-button" onClick={() => setShowSummary(true)} disabled={!currentAnswered}><ClipboardList size={18} aria-hidden="true" />查看結果總結</button>}
          </div>
          {allAnswered && <p className="paper-completion-note">本份試卷已完成：答對 {result.correct} / {result.total} 題，得分 {result.percentage} 分。每題結果都已即時寫入學習紀錄。</p>}
          </QuestionTransition>
        </section>
      )}
    </main>
  );
}

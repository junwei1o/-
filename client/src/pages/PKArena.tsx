import React, { useMemo, useState } from "react";
import { Swords, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useQuestionBank } from "@/lib/questionBank";
import { getCloudMode } from "@/game/cloudSync";
import { computePkScore, decidePkOutcome, normalizePkCode } from "@/lib/pkLogic";
import "./HubPages.css";

type Stage = "menu" | "playing" | "waiting" | "result";

const PK_QUESTION_COUNT = 10;

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function PKArena() {
  const { questions } = useQuestionBank();
  const myName = useMemo(() => {
    const mode = getCloudMode();
    return mode.mode === "cloud" && mode.name ? mode.name : "";
  }, []);

  const [stage, setStage] = useState<Stage>("menu");
  const [code, setCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [pkQuestions, setPkQuestions] = useState<typeof questions>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const createMutation = trpc.pk.create.useMutation();
  const joinMutation = trpc.pk.join.useMutation();
  const submitMutation = trpc.pk.submit.useMutation();
  const resultQuery = trpc.pk.get.useQuery({ code }, { enabled: stage === "waiting" || stage === "result", refetchInterval: stage === "waiting" ? 4000 : false });

  const challenge = resultQuery.data?.ok ? resultQuery.data.challenge : null;

  const startNewChallenge = async () => {
    setError("");
    if (!myName) {
      setError("請先在設定取一個船名（雲端身分），才能發起 PK。");
      return;
    }
    const picked = shuffle(questions).slice(0, PK_QUESTION_COUNT);
    if (picked.length < 3) {
      setError("題庫尚未載入完成，請稍後再試。");
      return;
    }
    const res = await createMutation.mutateAsync({ name: myName, questionIds: picked.map((q) => q.id) });
    if (!res.ok || !res.challenge) {
      setError("建立挑戰失敗，請再試一次。");
      return;
    }
    setCode(res.challenge.code);
    setPkQuestions(picked);
    setAnswers({});
    setCurrent(0);
    setStage("playing");
  };

  const joinChallenge = async () => {
    setError("");
    if (!myName) {
      setError("請先在設定取一個船名（雲端身分），才能加入 PK。");
      return;
    }
    const normalized = normalizePkCode(joinInput);
    if (normalized.length < 4) {
      setError("請輸入完整的 6 碼邀請碼。");
      return;
    }
    const res = await joinMutation.mutateAsync({ code: normalized, name: myName });
    if (!res.ok || !res.challenge) {
      setError("找不到這個邀請碼，請向同學確認後再試。");
      return;
    }
    const joined = res.challenge;
    const picked = joined.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is (typeof questions)[number] => Boolean(q));
    if (picked.length !== joined.questionIds.length) {
      setError("挑戰題目載入不完整，請稍後再試。");
      return;
    }
    setCode(joined.code);
    setPkQuestions(picked);
    setAnswers({});
    setCurrent(0);
    setStage("playing");
  };

  const choose = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitAnswers = async () => {
    const correct = pkQuestions.reduce((sum, q) => (answers[q.id] === q.answer ? sum + 1 : sum), 0);
    const score = computePkScore(correct, pkQuestions.length);
    setMyScore(score);
    const res = await submitMutation.mutateAsync({ code, name: myName, score });
    if (!res.ok || !res.challenge) {
      setError("成績提交失敗，請檢查網路後重試。");
      return;
    }
    setStage(res.challenge.status === "completed" ? "result" : "waiting");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪貼簿不可用時忽略，玩家仍可手動抄寫邀請碼 */
    }
  };

  // 輪詢到雙方都完成 → 切結果
  React.useEffect(() => {
    if (stage === "waiting" && challenge?.status === "completed") setStage("result");
  }, [stage, challenge]);

  const activeQuestion = stage === "playing" ? pkQuestions[current] : null;

  return (
    <main className="hub-page" aria-labelledby="pk-title">
      <header className="hub-header">
        <p className="hub-eyebrow">FRIEND PK</p>
        <h1 className="hub-title" id="pk-title">⚔️ 同學異步 PK</h1>
        <p className="hub-sub">發起挑戰取得邀請碼，同學輸入代碼後各自答同一份題，雙方都完成就比高下。不同裝置、不必同時上線。</p>
      </header>

      {error ? <p className="hub-empty" role="alert" style={{ borderColor: "rgba(220,80,80,.5)", color: "#b3402f" }}>{error}</p> : null}

      {stage === "menu" ? (
        <section className="pk-menu">
          <div className="pk-panel">
            <h2>發起挑戰</h2>
            <p>由你抽出 {PK_QUESTION_COUNT} 題，取得邀請碼分享給同學。</p>
            <button type="button" className="pk-primary" onClick={startNewChallenge} disabled={createMutation.isPending}>
              <Swords size={16} aria-hidden="true" /> {createMutation.isPending ? "建立中…" : "我要開戰"}
            </button>
          </div>
          <div className="pk-panel">
            <h2>輸入邀請碼加入</h2>
            <p>拿到同學給的 6 碼代碼，貼上後開始作答。</p>
            <input
              className="pk-code-input"
              value={joinInput}
              maxLength={8}
              placeholder="例如 K7P2QX"
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              aria-label="PK 邀請碼"
            />
            <button type="button" className="pk-primary" onClick={joinChallenge} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "加入中…" : "加入挑戰"}
            </button>
          </div>
        </section>
      ) : null}

      {stage === "playing" && activeQuestion ? (
        <section className="pk-play">
          <div className="pk-progress">第 {current + 1} / {pkQuestions.length} 題 · 邀請碼 <strong>{code}</strong></div>
          <article className="pk-question-card">
            <p className="pk-subject">{activeQuestion.subject} · {activeQuestion.grade} 年級</p>
            <h2 className="pk-prompt">{activeQuestion.prompt}</h2>
            <div className="pk-options">
              {activeQuestion.options.map((option, index) => (
                <button
                  key={`${activeQuestion.id}-${index}`}
                  type="button"
                  className={`pk-option${answers[activeQuestion.id] === index ? " is-selected" : ""}`}
                  onClick={() => choose(activeQuestion.id, index)}
                >
                  {option}
                </button>
              ))}
            </div>
          </article>
          <div className="pk-actions">
            {current > 0 ? <button type="button" className="pk-ghost" onClick={() => setCurrent((c) => c - 1)}>上一題</button> : <span />}
            {current < pkQuestions.length - 1 ? (
              <button type="button" className="pk-primary" disabled={answers[activeQuestion.id] === undefined} onClick={() => setCurrent((c) => c + 1)}>下一題</button>
            ) : (
              <button type="button" className="pk-primary" disabled={Object.keys(answers).length < pkQuestions.length || submitMutation.isPending} onClick={submitAnswers}>
                {submitMutation.isPending ? "提交中…" : "交卷比高下"}
              </button>
            )}
          </div>
        </section>
      ) : null}

      {stage === "waiting" ? (
        <section className="pk-result-panel">
          <h2>你的成績已送出：{myScore} 分</h2>
          <p>邀請碼 <button type="button" className="pk-copy" onClick={copyCode} aria-label="複製邀請碼">
            {code} {copied ? <Check size={14} /> : <Copy size={14} />}
          </button></p>
          <p className="hub-sub">正在等對手完成作答，頁面會自動更新，你也可以先去做別的事，等等再回來看結果。</p>
        </section>
      ) : null}

      {stage === "result" && challenge ? (
        <section className="pk-result-panel">
          <h2>
            {(() => {
              const outcome = decidePkOutcome(myName, challenge.initiatorName, challenge.initiatorScore ?? 0, challenge.challengerScore ?? 0);
              if (outcome === "draw") return "🤝 雙方平手！";
              return outcome === "win" ? "🎉 你贏了！" : "💪 對方略勝一籌，再戰一局！";
            })()}
          </h2>
          <ul className="pk-scoreboard">
            <li className={challenge.initiatorName === myName ? "is-me" : ""}>
              <span>{challenge.initiatorName}（發起者）</span><strong>{challenge.initiatorScore ?? 0} 分</strong>
            </li>
            <li className={challenge.challengerName === myName ? "is-me" : ""}>
              <span>{challenge.challengerName ?? "對手"}（挑戰者）</span><strong>{challenge.challengerScore ?? 0} 分</strong>
            </li>
          </ul>
          <button type="button" className="pk-primary" onClick={() => { setStage("menu"); setCode(""); setJoinInput(""); setMyScore(null); }}>再開一局</button>
        </section>
      ) : null}
    </main>
  );
}

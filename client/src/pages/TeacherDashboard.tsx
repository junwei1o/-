import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ClipboardList, Copy, School, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "@/pages/TeacherDashboard.css";

const TEACHER_CODE_KEY = "xue-teacher-class-code-v1";
const SUBJECTS = ["國語", "數學", "自然", "社會", "綜合課綱"] as const;

/** 教師端：建立班級、指派作業、查看班級報表。班級碼記在本機，重開瀏覽器仍在。 */
export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState<string>(() => localStorage.getItem(TEACHER_CODE_KEY) ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [className, setClassName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [subject, setSubject] = useState<string>("數學");
  const [grade, setGrade] = useState(4);
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const trimmedCode = code.trim().toUpperCase();

  const classQuery = trpc.teacher.getClass.useQuery(
    { code: trimmedCode },
    { enabled: trimmedCode.length >= 4, retry: false },
  );
  const reportQuery = trpc.teacher.classReport.useQuery(
    { classCode: trimmedCode },
    { enabled: trimmedCode.length >= 4, retry: false },
  );

  const createClass = trpc.teacher.createClass.useMutation({
    onSuccess: (result) => {
      if (!result.ok) {
        setNotice("建立班級失敗，請再試一次。");
        return;
      }
      localStorage.setItem(TEACHER_CODE_KEY, result.code);
      setCode(result.code);
      setNotice(`班級「${result.name}」已建立，把班級碼給學生就能加入。`);
    },
    onError: () => setNotice("無法連線到伺服器，建立班級失敗。"),
  });

  const createAssignment = trpc.teacher.createAssignment.useMutation({
    onSuccess: (result) => {
      if (!result.ok) {
        setNotice("指派失敗：找不到這個班級。");
        return;
      }
      setNotice("作業已指派，學生會在教室頁看到。");
      void reportQuery.refetch();
    },
    onError: () => setNotice("無法連線到伺服器，指派作業失敗。"),
  });

  const report = reportQuery.data;
  const students = useMemo(() => report?.ok ? report.students : [], [report]);
  const assignments = useMemo(() => report?.ok ? report.assignments : [], [report]);

  /** 全班平均正確率（只算有繳交的題數）。 */
  const classAccuracy = useMemo(() => {
    const totalQuestions = students.reduce(
      (sum, student) => sum + student.scores.reduce((inner, score) => inner + (score.done ? score.totalQuestions : 0), 0),
      0,
    );
    const correct = students.reduce(
      (sum, student) => sum + student.scores.reduce((inner, score) => inner + (score.done ? score.correctCount : 0), 0),
      0,
    );
    return totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  }, [students]);

  function handleCreateClass(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    if (!className.trim() || !teacherName.trim()) {
      setNotice("請填班級名稱與老師稱呼。");
      return;
    }
    createClass.mutate({ name: className.trim(), teacherName: teacherName.trim() });
  }

  function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    const next = codeInput.trim().toUpperCase();
    if (next.length < 4) {
      setNotice("班級碼至少 4 碼。");
      return;
    }
    localStorage.setItem(TEACHER_CODE_KEY, next);
    setCode(next);
  }

  function handleAssign(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    createAssignment.mutate({
      classCode: trimmedCode,
      subject: subject as (typeof SUBJECTS)[number],
      grade,
      questionCount,
      dueDate: dueDate || undefined,
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(trimmedCode);
      setNotice("班級碼已複製。");
    } catch {
      setNotice(`請手動記下班級碼：${trimmedCode}`);
    }
  }

  return (
    <main className="teacher-page" aria-labelledby="teacher-title">
      <div className="teacher-inner">
        <button type="button" className="settings-back-button" onClick={() => setLocation("/settings")}>
          ← 返回設定
        </button>
        <header className="teacher-header">
          <div>
            <p className="settings-eyebrow">教師專區</p>
            <h1 id="teacher-title">班級教室</h1>
            <p>建立班級後把班級碼給學生，就能指派作業並看到每位的完成狀況與正確率。</p>
          </div>
          <School size={32} aria-hidden="true" />
        </header>

        {notice ? <p className="teacher-notice" role="status">{notice}</p> : null}

        {trimmedCode.length < 4 ? (
          <div className="teacher-grid">
            <section className="teacher-card" aria-labelledby="create-class-title">
              <div className="teacher-card-title">
                <School size={19} aria-hidden="true" />
                <h2 id="create-class-title">建立新班級</h2>
              </div>
              <form className="teacher-form" onSubmit={handleCreateClass}>
                <label>
                  班級名稱
                  <input
                    type="text"
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    placeholder="例如：四年一班"
                    maxLength={40}
                  />
                </label>
                <label>
                  老師稱呼
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(event) => setTeacherName(event.target.value)}
                    placeholder="例如：陳老師"
                    maxLength={24}
                  />
                </label>
                <button type="submit" className="settings-primary-button" disabled={createClass.isPending}>
                  {createClass.isPending ? "建立中…" : "建立班級"}
                </button>
              </form>
            </section>

            <section className="teacher-card" aria-labelledby="lookup-class-title">
              <div className="teacher-card-title">
                <Users size={19} aria-hidden="true" />
                <h2 id="lookup-class-title">開啟既有班級</h2>
              </div>
              <form className="teacher-form" onSubmit={handleLookup}>
                <label>
                  班級碼
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                    placeholder="例如：K7M2QX"
                    maxLength={8}
                  />
                </label>
                <button type="submit" className="settings-secondary-button">開啟班級</button>
              </form>
              <p className="teacher-hint">班級碼會記在這台裝置，下次打開不用重填。</p>
            </section>
          </div>
        ) : (
          <>
            <section className="teacher-card" aria-labelledby="class-code-title">
              <div className="teacher-card-title">
                <Users size={19} aria-hidden="true" />
                <h2 id="class-code-title">
                  {classQuery.data?.ok ? classQuery.data.classInfo.name : "班級"}
                  {classQuery.isLoading ? "（讀取中…）" : ""}
                </h2>
              </div>
              <div className="teacher-code-row">
                <span className="teacher-code" aria-label={`班級碼 ${trimmedCode}`}>{trimmedCode}</span>
                <button type="button" className="settings-secondary-button" onClick={copyCode}>
                  <Copy size={15} aria-hidden="true" /> 複製班級碼
                </button>
                <button
                  type="button"
                  className="teacher-link-button"
                  onClick={() => {
                    localStorage.removeItem(TEACHER_CODE_KEY);
                    setCode("");
                    setNotice(null);
                  }}
                >
                  切換班級
                </button>
              </div>
              <p className="teacher-hint">
                學生在首頁「我的教室」輸入這組碼就能加入。目前 {students.length} 位學生、{assignments.length} 份作業，
                全班平均正確率 <strong>{classAccuracy}%</strong>。
              </p>
            </section>

            <section className="teacher-card" aria-labelledby="assign-title">
              <div className="teacher-card-title">
                <ClipboardList size={19} aria-hidden="true" />
                <h2 id="assign-title">指派作業</h2>
              </div>
              <form className="teacher-assign-form" onSubmit={handleAssign}>
                <label>
                  科目
                  <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                    {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  年級
                  <select value={grade} onChange={(event) => setGrade(Number(event.target.value))}>
                    {[3, 4, 5, 6].map((item) => <option key={item} value={item}>{item} 年級</option>)}
                  </select>
                </label>
                <label>
                  題數
                  <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
                    {[5, 10, 15, 20, 25, 30].map((item) => <option key={item} value={item}>{item} 題</option>)}
                  </select>
                </label>
                <label>
                  截止日（可不填）
                  <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </label>
                <button type="submit" className="settings-primary-button" disabled={createAssignment.isPending}>
                  {createAssignment.isPending ? "指派中…" : "指派作業"}
                </button>
              </form>
            </section>

            <section className="teacher-card" aria-labelledby="report-title">
              <div className="teacher-card-title">
                <ClipboardList size={19} aria-hidden="true" />
                <h2 id="report-title">班級報表</h2>
              </div>
              {reportQuery.isLoading ? <p className="teacher-hint">讀取中…</p> : null}
              {reportQuery.error ? <p className="teacher-hint">暫時讀不到報表，請確認網路後重試。</p> : null}
              {report && !report.ok ? <p className="teacher-hint">找不到這個班級。</p> : null}
              {students.length === 0 && report?.ok ? (
                <p className="teacher-hint">還沒有學生加入，把班級碼給學生就會出現在這裡。</p>
              ) : null}
              {students.length > 0 ? (
                <div className="teacher-table-wrap">
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th scope="col">學生</th>
                        <th scope="col">完成</th>
                        <th scope="col">正確率</th>
                        {assignments.map((item) => (
                          <th key={item.id} scope="col">
                            {item.subject}
                            <small>{item.grade} 年級 · {item.questionCount} 題</small>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.studentName}>
                          <th scope="row">{student.studentName}</th>
                          <td>{student.doneCount}/{student.assignmentCount}</td>
                          <td>{student.accuracy}%</td>
                          {student.scores.map((score) => (
                            <td key={score.assignmentId}>
                              {score.done ? `${score.correctCount}/${score.totalQuestions}` : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

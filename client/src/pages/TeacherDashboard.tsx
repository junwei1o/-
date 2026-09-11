import React, { useState } from "react";
import { useLocation } from "wouter";
import { ClipboardList, Copy, School, Target, UserRound, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "@/pages/TeacherDashboard.css";

const TEACHER_CODE_KEY = "xue-teacher-class-code-v1";
const SUBJECTS = ["國語", "數學", "自然", "社會", "綜合課綱"] as const;

/** 單一學生的督學卡片：正確率、作業完成度與薄弱知識點。 */
function StudentCard({
  studentName,
  assignmentCount,
  onAssign,
}: {
  studentName: string;
  assignmentCount: number;
  onAssign: (studentName: string) => void;
}) {
  const insights = trpc.teacher.studentInsights.useQuery(
    { studentName, days: 30 },
    { retry: false },
  );
  const data = insights.data;
  const weak = data?.weakTopics ?? [];

  return (
    <article className="mentor-card" aria-labelledby={`student-${studentName}`}>
      <header className="mentor-card-head">
        <span className="mentor-avatar" aria-hidden="true">{studentName.slice(0, 1)}</span>
        <div>
          <h3 id={`student-${studentName}`}>{studentName}</h3>
          <p className="mentor-card-sub">
            {data && data.totalQuestions > 0
              ? `近 30 天作答 ${data.totalQuestions} 題 · ${data.exams} 份試卷 · 作業 ${assignmentCount} 份`
              : "近 30 天還沒有作答紀錄"}
          </p>
        </div>
        {data && data.totalQuestions > 0 ? (
          <strong className="mentor-accuracy" aria-label={`正確率 ${data.accuracy}%`}>{data.accuracy}%</strong>
        ) : null}
      </header>

      <div className="mentor-weak" aria-label="薄弱知識點">
        <span className="mentor-weak-title"><Target size={14} aria-hidden="true" /> 需要加強</span>
        {weak.length > 0 ? (
          <ul className="mentor-tag-list">
            {weak.slice(0, 3).map((item) => (
              <li key={`${item.subject}/${item.topic}`} className="mentor-tag">
                {item.subject} · {item.topic}
                <small>{item.wrong}/{item.total} 錯</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mentor-hint">
            {data && data.totalQuestions > 0 ? "目前沒有明顯弱點，表現穩定。" : "累積作答後會自動標出弱點。"}
          </p>
        )}
      </div>

      <button type="button" className="settings-secondary-button" onClick={() => onAssign(studentName)}>
        <ClipboardList size={15} aria-hidden="true" /> 給 {studentName} 出作業
      </button>
    </article>
  );
}

/**
 * 督學台（1 老師帶少數學生的小班場景）。
 * 設計取捨：不做大班的「名單＋矩陣」，改成一人一張卡，
 * 老師一眼看到每個孩子「哪裡不會」，並能直接出作業。
 */
export default function TeacherDashboard() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState<string>(() => localStorage.getItem(TEACHER_CODE_KEY) ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [className, setClassName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [showAssign, setShowAssign] = useState(false);
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
      setNotice(`已指派作業（${subject} ${grade} 年級 ${questionCount} 題）。`);
      setShowAssign(false);
      void reportQuery.refetch();
    },
    onError: () => setNotice("無法連線到伺服器，指派作業失敗。"),
  });

  const report = reportQuery.data;
  const students = report?.ok ? report.students : [];

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
            <p className="settings-eyebrow">督學台</p>
            <h1 id="teacher-title">{classQuery.data?.ok ? classQuery.data.classInfo.name : "班級教室"}</h1>
            <p>一眼看到每個孩子的作答狀況與需要加強的地方，並直接針對科目出作業。</p>
          </div>
          <School size={32} aria-hidden="true" />
        </header>

        {notice ? <p className="teacher-notice" role="status">{notice}</p> : null}

        {trimmedCode.length < 4 ? (
          <div className="teacher-grid">
            <section className="teacher-card" aria-labelledby="create-class-title">
              <div className="teacher-card-title">
                <School size={19} aria-hidden="true" />
                <h2 id="create-class-title">建立班級</h2>
              </div>
              <form className="teacher-form" onSubmit={handleCreateClass}>
                <label>
                  班級名稱
                  <input
                    type="text"
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    placeholder="例如：我家兩個孩子"
                    maxLength={40}
                  />
                </label>
                <label>
                  老師／家長稱呼
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
            <section className="teacher-card mentor-classbar" aria-label="班級資訊">
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
                學生在「我的教室」輸入這組碼就能加入。目前 {students.length} 位學生。
              </p>
            </section>

            {showAssign ? (
              <section className="teacher-card" aria-labelledby="assign-title">
                <div className="teacher-card-title">
                  <ClipboardList size={19} aria-hidden="true" />
                  <h2 id="assign-title">出作業</h2>
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
                      {[5, 10, 15, 20].map((item) => <option key={item} value={item}>{item} 題</option>)}
                    </select>
                  </label>
                  <label>
                    截止日（可不填）
                    <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  </label>
                  <button type="submit" className="settings-primary-button" disabled={createAssignment.isPending}>
                    {createAssignment.isPending ? "指派中…" : "指派作業"}
                  </button>
                  <button type="button" className="teacher-link-button" onClick={() => setShowAssign(false)}>
                    取消
                  </button>
                </form>
                <p className="teacher-hint">作業會派給全班，學生在「我的教室」看得到。</p>
              </section>
            ) : null}

            <section aria-labelledby="students-title">
              <div className="teacher-card-title">
                <UserRound size={19} aria-hidden="true" />
                <h2 id="students-title">學生狀況</h2>
              </div>
              {reportQuery.isLoading ? <p className="teacher-hint">讀取中…</p> : null}
              {report && !report.ok ? <p className="teacher-hint">找不到這個班級。</p> : null}
              {!reportQuery.isLoading && students.length === 0 ? (
                <div className="teacher-card">
                  <p className="teacher-hint">還沒有學生加入。把班級碼給學生，他們在「我的教室」輸入後就會出現在這裡。</p>
                </div>
              ) : null}
              <div className="mentor-grid">
                {students.map((student) => (
                  <StudentCard
                    key={student.studentName}
                    studentName={student.studentName}
                    assignmentCount={student.assignmentCount}
                    onAssign={() => setShowAssign(true)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

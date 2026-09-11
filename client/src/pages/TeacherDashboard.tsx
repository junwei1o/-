import React, { useState } from "react";
import { useLocation } from "wouter";
import { ClipboardList, Copy, School, Target, Trash2, UserRound, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "@/pages/TeacherDashboard.css";

const TEACHER_CODE_KEY = "xue-teacher-class-code-v1";
const SUBJECTS = ["國語", "數學", "自然", "社會", "綜合課綱"] as const;

/** 單一學生的督學卡片：正確率、作業完成度與薄弱知識點。 */
function StudentCard({
  studentName,
  assignmentCount,
  onAssign,
  onRemove,
}: {
  studentName: string;
  assignmentCount: number;
  onRemove: (studentName: string) => void;
  /** 帶上預設知識點時，出作業表單會直接鎖定那個知識點。 */
  onAssign: (studentName: string, preset?: { subject: string; topic: string }) => void;
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
              <li key={`${item.subject}/${item.topic}`}>
                <button
                  type="button"
                  className="mentor-tag"
                  onClick={() => onAssign(studentName, { subject: item.subject, topic: item.topic })}
                  title={`直接針對「${item.topic}」出作業`}
                >
                  {item.subject} · {item.topic}
                  <small>{item.wrong}/{item.total} 錯</small>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mentor-hint">
            {data && data.totalQuestions > 0 ? "目前沒有明顯弱點，表現穩定。" : "累積作答後會自動標出弱點。"}
          </p>
        )}
      </div>

      <div className="mentor-card-actions">
        <button type="button" className="settings-secondary-button" onClick={() => onAssign(studentName)}>
          <ClipboardList size={15} aria-hidden="true" /> 給 {studentName} 出作業
        </button>
        <button
          type="button"
          className="teacher-link-button is-danger"
          onClick={() => onRemove(studentName)}
          title="把這位學生從班級移除，並清掉他在本站的作答紀錄"
        >
          <Trash2 size={14} aria-hidden="true" /> 移除
        </button>
      </div>
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
  /** 知識點：從學生的薄弱標籤點進來時會被預填，讓作業能對症下藥。 */
  const [topic, setTopic] = useState("");
  /** 從哪位學生的卡片點進來的：空值代表派給全班。 */
  const [assignTarget, setAssignTarget] = useState("");
  const [joinedName, setJoinedName] = useState("");
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
  // 已經取了船名、但還沒加入本班的孩子：老師點一下就能加進來，
  // 不用叫兩個孩子手輸 6 位班級碼。
  const candidatesQuery = trpc.teacher.joinCandidates.useQuery(
    { classCode: trimmedCode },
    { enabled: trimmedCode.length >= 4, retry: false },
  );
  const admitStudent = trpc.teacher.joinClass.useMutation({
    onSuccess: (result) => {
      setNotice(result.ok ? `已把「${joinedName}」加進班級。` : "加入失敗，請再試一次。");
      void reportQuery.refetch();
      void candidatesQuery.refetch();
    },
    onError: () => setNotice("無法連線到伺服器，加入失敗。"),
  });
  const isSingleSubject = subject !== "綜合課綱";
  const topicQuery = trpc.teacher.topicOptions.useQuery(
    { subject: subject as "國語" | "數學" | "自然" | "社會", grade },
    { enabled: showAssign && isSingleSubject, retry: false },
  );

  const removeMember = trpc.teacher.removeMember.useMutation({
    onSuccess: () => {
      setNotice("已移除這位學生，他的作答紀錄也一併清掉了。");
      void reportQuery.refetch();
    },
    onError: () => setNotice("無法連線到伺服器，移除失敗。"),
  });

  const deleteClassMutation = trpc.teacher.deleteClass.useMutation({
    onSuccess: () => {
      localStorage.removeItem(TEACHER_CODE_KEY);
      setCode("");
      setNotice("班級已刪除。");
    },
    onError: () => setNotice("無法連線到伺服器，刪除班級失敗。"),
  });

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
      const who = assignTarget ? `只給 ${assignTarget}` : "全班";
      setNotice(
        topic
          ? `已指派：${who} · ${subject}「${topic}」${questionCount} 題，學生打開就會先寫這份。`
          : `已指派：${who} · ${subject} ${grade} 年級 ${questionCount} 題。`,
      );
      setShowAssign(false);
      setTopic("");
      setAssignTarget("");
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
      learningTopic: topic || undefined,
      studentName: assignTarget || undefined,
      dueDate: dueDate || undefined,
    });
  }

  /** 出作業表單：從學生卡片的薄弱標籤點進來時，直接鎖定那位學生與那個知識點。 */
  function openAssign(student: string, preset?: { subject: string; topic: string }) {
    setAssignTarget(student);
    if (preset) {
      setSubject(preset.subject);
      setTopic(preset.topic);
    } else {
      setTopic("");
    }
    setShowAssign(true);
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
                <button
                  type="button"
                  className="teacher-link-button is-danger"
                  onClick={() => {
                    if (window.confirm(`刪除班級「${trimmedCode}」？學生名單、作業與繳交紀錄都會清掉，無法復原。`)) {
                      deleteClassMutation.mutate({ classCode: trimmedCode });
                    }
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" /> 刪除班級
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
                    給誰
                    <select value={assignTarget} onChange={(event) => setAssignTarget(event.target.value)}>
                      <option value="">全班</option>
                      {students.map((item) => <option key={item.studentName} value={item.studentName}>{item.studentName}</option>)}
                    </select>
                  </label>
                  <label>
                    科目
                    <select value={subject} onChange={(event) => { setSubject(event.target.value); setTopic(""); }}>
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
                  <label className="teacher-assign-wide">
                    針對知識點（可不指定）
                    <select value={topic} onChange={(event) => setTopic(event.target.value)} disabled={!isSingleSubject}>
                      <option value="">— 全科隨機 —</option>
                      {(topicQuery.data?.topics ?? []).map((item) => (
                        <option key={item.topic} value={item.topic}>{item.topic}（{item.count} 題）</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    截止日（可不填）
                    <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  </label>
                  <button type="submit" className="settings-primary-button" disabled={createAssignment.isPending}>
                    {createAssignment.isPending ? "指派中…" : "指派作業"}
                  </button>
                  <button type="button" className="teacher-link-button" onClick={() => { setShowAssign(false); setTopic(""); setAssignTarget(""); }}>
                    取消
                  </button>
                </form>
                <p className="teacher-hint">
                  {topic
                    ? `這份作業會優先出「${topic}」的題，學生打開網站就會先寫這份，不用另外通知。`
                    : "指定知識點可以對症下藥：從學生卡片的「需要加強」標籤點一下，就會自動帶入。"}
                </p>
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
              {candidatesQuery.data && candidatesQuery.data.candidates.length > 0 ? (
                <section className="teacher-card" aria-labelledby="candidates-title">
                  <div className="teacher-card-title">
                    <Users size={19} aria-hidden="true" />
                    <h2 id="candidates-title">還沒加入班級的孩子</h2>
                  </div>
                  <p className="teacher-hint">
                    這些孩子已經在網站上取了船名，只要點一下就能加進班級，不用請他們輸入班級碼。
                  </p>
                  <div className="teacher-code-row">
                    {candidatesQuery.data.candidates.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="settings-secondary-button"
                        disabled={admitStudent.isPending}
                        onClick={() => {
                          setJoinedName(item.name);
                          admitStudent.mutate({ code: trimmedCode, studentName: item.name });
                        }}
                      >
                        <UserRound size={15} aria-hidden="true" /> 加入 {item.name}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mentor-grid">
                {students.map((student) => (
                  <StudentCard
                    key={student.studentName}
                    studentName={student.studentName}
                    assignmentCount={student.assignmentCount}
                    onAssign={(name, preset) => openAssign(name, preset)}
                    onRemove={(name) => {
                      if (window.confirm(`把「${name}」從班級移除？他在本站的作答紀錄會一起清掉，之後要用同一個船名重新加入。`)) {
                        removeMember.mutate({ classCode: trimmedCode, studentName: name });
                      }
                    }}
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

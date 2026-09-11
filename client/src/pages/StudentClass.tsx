import React, { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, School } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCloudMode } from "@/game/cloudSync";
import { setPendingAssignment } from "@/game/classPortal";
import "@/pages/TeacherDashboard.css";

/** 學生教室：輸入班級碼加入老師的班級，並認領老師指派的作業。 */
export default function StudentClass() {
  const [, setLocation] = useLocation();
  const cloudName = getCloudMode().name ?? "";
  const [codeInput, setCodeInput] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [notice, setNotice] = useState<string | null>(null);

  const myClasses = trpc.teacher.myClasses.useQuery(
    { studentName: cloudName },
    { enabled: cloudName.length >= 2, retry: false },
  );

  const joinClass = trpc.teacher.joinClass.useMutation({
    onSuccess: (result) => {
      if (!result.ok) {
        setNotice(result.reason === "duplicated" ? "你已經在這個班級了。" : "找不到這個班級碼，請跟老師確認。");
        return;
      }
      setNotice(`已加入「${result.className}」。`);
      setCodeInput("");
      void myClasses.refetch();
    },
    onError: () => setNotice("無法連線到伺服器，加入班級失敗。"),
  });

  const activeCode = selected || (myClasses.data?.classes?.[0]?.code ?? "");
  const assignmentsQuery = trpc.teacher.listAssignments.useQuery(
    { classCode: activeCode },
    { enabled: activeCode.length >= 4, retry: false },
  );

  if (cloudName.length < 2) {
    return (
      <main className="teacher-page" aria-labelledby="student-class-title">
        <div className="teacher-inner">
          <button type="button" className="settings-back-button" onClick={() => setLocation("/settings")}>
            ← 返回設定
          </button>
          <section className="teacher-card">
            <h1 id="student-class-title">我的教室</h1>
            <p className="teacher-hint">
              加入班級需要先有船名（雲端船籍的名字）。請先到設定頁開啟雲端船籍、取一個名字，再回來加入班級。
            </p>
          </section>
        </div>
      </main>
    );
  }

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    const code = codeInput.trim().toUpperCase();
    if (code.length < 4) {
      setNotice("班級碼至少 4 碼。");
      return;
    }
    joinClass.mutate({ code, studentName: cloudName });
  }

  function startAssignment(assignment: {
    id: number;
    subject: string;
    grade: number;
    questionCount: number;
    learningTopic?: string | null;
  }) {
    setPendingAssignment({
      assignmentId: assignment.id,
      studentName: cloudName,
      subject: assignment.subject,
      grade: assignment.grade,
      questionCount: assignment.questionCount,
      learningTopic: assignment.learningTopic ?? null,
    });
    setLocation("/practice");
  }

  const classes = myClasses.data?.classes ?? [];
  const assignments = assignmentsQuery.data?.assignments ?? [];

  return (
    <main className="teacher-page" aria-labelledby="student-class-title">
      <div className="teacher-inner">
        <button type="button" className="settings-back-button" onClick={() => setLocation("/settings")}>
          ← 返回設定
        </button>
        <header className="teacher-header">
          <div>
            <p className="settings-eyebrow">學生教室</p>
            <h1 id="student-class-title">我的教室</h1>
            <p>用老師給的班級碼加入班級，就能收到作業。完成後成績會自動回報給老師。</p>
          </div>
          <School size={32} aria-hidden="true" />
        </header>

        {notice ? <p className="teacher-notice" role="status">{notice}</p> : null}

        <section className="teacher-card" aria-labelledby="join-class-title">
          <div className="teacher-card-title">
            <School size={19} aria-hidden="true" />
            <h2 id="join-class-title">加入班級</h2>
          </div>
          <form className="teacher-form" onSubmit={handleJoin}>
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
            <button type="submit" className="settings-primary-button" disabled={joinClass.isPending}>
              {joinClass.isPending ? "加入中…" : "加入班級"}
            </button>
          </form>
          <p className="teacher-hint">你的船名是「{cloudName}」，老師會用這個名字看到你的成績。</p>
        </section>

        {classes.length > 0 ? (
          <section className="teacher-card" aria-labelledby="my-classes-title">
            <div className="teacher-card-title">
              <School size={19} aria-hidden="true" />
              <h2 id="my-classes-title">我的班級</h2>
            </div>
            <div className="teacher-code-row">
              {classes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={item.code === activeCode ? "settings-primary-button" : "settings-secondary-button"}
                  onClick={() => setSelected(item.code)}
                >
                  {item.name}（{item.code}）
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeCode ? (
          <section className="teacher-card" aria-labelledby="homework-title">
            <div className="teacher-card-title">
              <BookOpen size={19} aria-hidden="true" />
              <h2 id="homework-title">老師的作業</h2>
            </div>
            {assignmentsQuery.isLoading ? <p className="teacher-hint">讀取中…</p> : null}
            {assignments.length === 0 && !assignmentsQuery.isLoading ? (
              <p className="teacher-hint">目前還沒有作業，老師指派後會出現在這裡。</p>
            ) : null}
            {assignments.length > 0 ? (
              <div className="teacher-table-wrap">
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th scope="col">科目</th>
                      <th scope="col">年級</th>
                      <th scope="col">加強重點</th>
                      <th scope="col">題數</th>
                      <th scope="col">截止</th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((item) => (
                      <tr key={item.id}>
                        <th scope="row">{item.subject}</th>
                        <td>{item.grade} 年級</td>
                        <td>{item.learningTopic || "—"}</td>
                        <td>{item.questionCount} 題</td>
                        <td>{item.dueDate || "—"}</td>
                        <td>
                          <button type="button" className="settings-secondary-button" onClick={() => startAssignment(item)}>
                            開始作業
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

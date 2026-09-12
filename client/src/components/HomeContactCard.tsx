import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Phone, Settings, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import "@/components/HomeContactCard.css";

const STORAGE_LINE_ID = "hdmx_teacher_line_id_v1";
const STORAGE_TEACHER_NAME = "hdmx_teacher_name_v1";
const STORAGE_NOTICE = "hdmx_class_notice_v1";
const STORAGE_PHONE = "hdmx_teacher_phone_v1";
const STORAGE_CLASS_CODE = "xue-teacher-class-code-v1";
const QR_API = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=";

type ContactInfo = {
  teacherName: string;
  phone: string;
  lineId: string;
  notice: string;
};

function loadContact(): ContactInfo {
  if (typeof window === "undefined") {
    return { teacherName: "", phone: "", lineId: "", notice: "" };
  }
  return {
    teacherName: localStorage.getItem(STORAGE_TEACHER_NAME) ?? "",
    phone: localStorage.getItem(STORAGE_PHONE) ?? "",
    lineId: localStorage.getItem(STORAGE_LINE_ID) ?? "",
    notice: localStorage.getItem(STORAGE_NOTICE) ?? "",
  };
}

function persistContact(next: ContactInfo) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LINE_ID, next.lineId);
  localStorage.setItem(STORAGE_TEACHER_NAME, next.teacherName);
  localStorage.setItem(STORAGE_PHONE, next.phone);
  localStorage.setItem(STORAGE_NOTICE, next.notice);
}

function readClassCode(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_CLASS_CODE) ?? "";
}

const LINE_ID_PATTERN = /^[A-Za-z0-9._-]{2,30}$/;

type AnnouncementRow = {
  id: number;
  classCode: string;
  teacherName: string;
  content: string;
  createdAt: number;
};

export function HomeContactCard() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState<ContactInfo>(() => loadContact());
  const [draft, setDraft] = useState<ContactInfo>(() => loadContact());
  const [statusMsg, setStatusMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [classCode, setClassCode] = useState<string>(() => readClassCode());

  // 編輯模式打開時，把當前值填入 draft
  useEffect(() => {
    if (editing) setDraft(contact);
  }, [editing, contact]);

  // 監聽 localStorage 變化（其他 tab 改班级碼時同步）
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_CLASS_CODE) {
        setClassCode(readClassCode());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 拉雲端公告（如果老師有班級碼）
  const listQuery = trpc.teacher.listAnnouncements.useQuery(
    { classCode, limit: 5 },
    { enabled: Boolean(classCode) },
  );
  const announcements: AnnouncementRow[] = (listQuery.data ?? []) as AnnouncementRow[];
  const postMutation = trpc.teacher.postAnnouncement.useMutation({
    onSuccess: (data) => {
      if (data.ok) {
        toast.success("公告已發出，全班可見");
        listQuery.refetch();
      } else {
        toast.error("發送失敗：" + data.reason);
      }
    },
    onError: (e) => toast.error("發送失敗：" + e.message),
  });
  const deleteMutation = trpc.teacher.deleteAnnouncement.useMutation({
    onSuccess: (data) => {
      if (data.ok) {
        toast.success("已刪除");
        listQuery.refetch();
      } else {
        toast.error("無法刪除：" + data.reason);
      }
    },
  });
  const [posting, setPosting] = useState(false);
  const [newContent, setNewContent] = useState("");

  const lineUrl = contact.lineId.trim() ? `https://line.me/ti/p/~${encodeURIComponent(contact.lineId.trim())}` : "";
  const qrSrc = lineUrl ? QR_API + encodeURIComponent(lineUrl) : "";

  function flash(msg: { kind: "ok" | "err"; text: string }) {
    setStatusMsg(msg);
    window.setTimeout(() => setStatusMsg(null), 3000);
  }

  function applySettings() {
    const trimmed: ContactInfo = {
      teacherName: draft.teacherName.trim(),
      phone: draft.phone.trim(),
      lineId: draft.lineId.trim(),
      notice: draft.notice.trim(),
    };
    if (trimmed.lineId && !LINE_ID_PATTERN.test(trimmed.lineId)) {
      flash({ kind: "err", text: "LINE ID 應為 2-30 字英文 / 數字 / 點 / 底線 / 短橫線" });
      return;
    }
    if (trimmed.phone && !/^0[2-9][-]?\d{3,4}[-]?\d{4}$|^09\d{2}[-]?\d{3}[-]?\d{3}$/.test(trimmed.phone.replace(/\s/g, ""))) {
      flash({ kind: "err", text: "電話格式看起來不對（行動：09XX-XXX-XXX；市話：0X-XXXX-XXXX）" });
      return;
    }
    persistContact(trimmed);
    setContact(trimmed);
    setEditing(false);
    flash({ kind: "ok", text: "已儲存" });
  }

  function submitAnnouncement() {
    if (!newContent.trim() || !classCode || !contact.teacherName.trim()) {
      toast.error("請先在「聯絡老師」設定中填入老師姓名，並確認已有班級碼");
      return;
    }
    postMutation.mutate({
      classCode,
      teacherName: contact.teacherName.trim(),
      content: newContent.trim(),
    });
    setPosting(false);
    setNewContent("");
  }

  return (
    <section className="home-contact-card" aria-labelledby="home-contact-heading">
      <button
        type="button"
        className="home-contact-toggle"
        aria-expanded={open}
        aria-controls="home-contact-panel"
        onClick={() => setOpen((prev) => !prev)}
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span id="home-contact-heading" className="home-contact-title">
          聯絡老師
        </span>
        <span className="home-contact-hint">
          {contact.lineId || contact.phone ? `${contact.teacherName || "老師"} · ${contact.phone || "LINE"}` : "點擊設定"}
        </span>
        {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
      </button>

      {open ? (
        <div id="home-contact-panel" className="home-contact-panel" role="region">
          {!editing ? (
            <>
              <div className="home-contact-qr">
                {qrSrc ? (
                  <img src={qrSrc} alt={`${contact.teacherName || "老師"} 的 LINE 好友 QR code`} />
                ) : (
                  <div className="home-contact-qr-placeholder" aria-hidden="true">
                    設定 LINE ID<br />後自動產生 QR
                  </div>
                )}
              </div>
              <p className="home-contact-lineid">
                LINE ID：<strong>{contact.lineId || "尚未設定"}</strong>
              </p>

              <div className="home-contact-actions">
                {lineUrl ? (
                  <a
                    href={lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-contact-cta line"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    開啟 LINE
                  </a>
                ) : (
                  <span className="home-contact-cta disabled" aria-disabled="true">
                    <MessageCircle size={18} aria-hidden="true" />
                    LINE 尚未設定
                  </span>
                )}

                {contact.phone ? (
                  <a href={`tel:${contact.phone.replace(/[^0-9+#]/g, "")}`} className="home-contact-cta phone">
                    <Phone size={18} aria-hidden="true" />
                    撥打 {contact.phone}
                  </a>
                ) : (
                  <span className="home-contact-cta disabled" aria-disabled="true">
                    <Phone size={18} aria-hidden="true" />
                    電話尚未設定
                  </span>
                )}
              </div>

              {/* 公告區：老師有班級碼時拉雲端；否則降級顯示 localStorage */}
              <div className="home-contact-notice-block">
                <header className="home-contact-notice-head">
                  <Megaphone size={16} aria-hidden="true" />
                  <span>班級公告</span>
                  {classCode ? (
                    <span className="home-contact-classcode">班級碼 {classCode}</span>
                  ) : (
                    <span className="home-contact-classcode muted">未綁定班級</span>
                  )}
                </header>

                {classCode ? (
                  <>
                    {listQuery.isLoading ? (
                      <p className="home-contact-notice">讀取中…</p>
                    ) : announcements.length === 0 ? (
                      <p className="home-contact-notice">尚未發過任何公告。</p>
                    ) : (
                      <ul className="home-contact-announcements">
                        {announcements.map((row) => (
                          <li key={row.id} className="home-contact-announcement">
                            <p>{row.content}</p>
                            <small>
                              {row.teacherName} ・{" "}
                              {new Date(row.createdAt).toLocaleString("zh-TW", {
                                month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                              {row.teacherName === contact.teacherName.trim() ? (
                                <button
                                  type="button"
                                  className="home-contact-del"
                                  onClick={() => {
                                    if (window.confirm("刪除這則公告？")) {
                                      deleteMutation.mutate({ id: row.id, classCode, teacherName: contact.teacherName.trim() });
                                    }
                                  }}
                                >
                                  刪除
                                </button>
                              ) : null}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="home-contact-post">
                      {posting ? (
                        <>
                          <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="例：週末作業：練習本第 32 頁。"
                            maxLength={500}
                            rows={2}
                          />
                          <div className="home-contact-post-actions">
                            <button type="button" className="home-contact-cta primary" onClick={submitAnnouncement} disabled={postMutation.isPending}>
                              {postMutation.isPending ? "送出中…" : "送出公告"}
                            </button>
                            <button type="button" className="home-contact-cta ghost" onClick={() => { setPosting(false); setNewContent(""); }}>
                              取消
                            </button>
                          </div>
                        </>
                      ) : (
                        <button type="button" className="home-contact-cta primary" onClick={() => setPosting(true)}>
                          <Megaphone size={16} aria-hidden="true" /> 發新公告
                        </button>
                      )}
                    </div>
                  </>
                ) : contact.notice ? (
                  <p className="home-contact-notice">{contact.notice}</p>
                ) : (
                  <p className="home-contact-notice muted">
                    建立班級後可發送雲端公告；未綁定時只顯示本機公告。
                  </p>
                )}
              </div>

              <button type="button" className="home-contact-edit" onClick={() => setEditing(true)}>
                <Settings size={16} aria-hidden="true" />
                {contact.lineId || contact.phone ? "編輯聯絡資訊" : "首次設定"}
              </button>
            </>
          ) : (
            <div className="home-contact-form" role="group" aria-labelledby="home-contact-heading">
              <label className="home-contact-field">
                <span>老師姓名</span>
                <input
                  type="text"
                  value={draft.teacherName}
                  onChange={(e) => setDraft({ ...draft, teacherName: e.target.value })}
                  placeholder="例：劉老師"
                  maxLength={20}
                />
              </label>
              <label className="home-contact-field">
                <span>家長電話（撥號）</span>
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="例：0932075752 或 02-1234-5678"
                  maxLength={20}
                />
              </label>
              <label className="home-contact-field">
                <span>LINE ID（不加 @）</span>
                <input
                  type="text"
                  value={draft.lineId}
                  onChange={(e) => setDraft({ ...draft, lineId: e.target.value })}
                  placeholder="例：liu_taipei_t3"
                  maxLength={30}
                  autoComplete="off"
                />
              </label>
              <label className="home-contact-field">
                <span>班級公告（無班級碼時的家長可見文字）</span>
                <textarea
                  value={draft.notice}
                  onChange={(e) => setDraft({ ...draft, notice: e.target.value })}
                  placeholder="例：週末作業：練習本第 32 頁。"
                  maxLength={200}
                  rows={3}
                />
              </label>
              <div className="home-contact-form-actions">
                <button type="button" className="home-contact-cta primary" onClick={applySettings}>
                  儲存
                </button>
                <button type="button" className="home-contact-cta ghost" onClick={() => setEditing(false)}>
                  取消
                </button>
              </div>
            </div>
          )}

          {statusMsg ? (
            <div className={`home-contact-status ${statusMsg.kind}`} role="status">
              {statusMsg.text}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default HomeContactCard;
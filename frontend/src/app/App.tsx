import React, { useState, useRef, useEffect } from "react";
import {
  User, ChevronRight, LogOut, X,
  ChevronsLeft, ChevronsRight, Bell,
  MessageCircle, Send, Sparkles, ChevronDown, Minimize2,
  HelpCircle, Mail,
} from "lucide-react";
import bgImage from "@/imports/bg.jpg";
import {
  NOTIFICATIONS, STUDENT_PROFILE,
  type Notification,
} from "../data/mockData";
import { AdminApp } from "./AdminSections";
import {
  NAV_ITEMS, SECTION_TITLES,
  TuitionSection, AcademicSection, ProfileSection,
  SurveySection, ScheduleSection, NotificationsSection,
  type NavSection,
} from "./StudentSections";

// ─── Accounts ────────────────────────────────────────────────────────────────
const ACCOUNTS = [
  { username: "admin",   label: "Quản trị viên", email: "admin@hcmus.edu.vn",            initials: "AD", pass: "abc", role: "admin"   as const },
  { username: "student", label: "Sinh viên",      email: "24127001@student.hcmus.edu.vn", initials: "NV", pass: "123", role: "student" as const },
];

// ─── Account Picker Modal ─────────────────────────────────────────────────────
function AccountPickerModal({ onLogin }: { onLogin: (role: "admin" | "student") => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-[#F4EFDF] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#C8C0A8]">
          <div>
            <p className="text-xs text-[#718096] mb-0.5">Chọn tài khoản để tiếp tục với</p>
            <h2 className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>
              CampUS — HCMUS
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            <span className="text-xs font-semibold text-[#4A6080]">Microsoft</span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-[#1E2D42]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chọn tài khoản
          </p>
          {ACCOUNTS.map(acc => (
            <button
              key={acc.username}
              onClick={() => onLogin(acc.role)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#BFBB9A] hover:border-[#11284D] hover:bg-[#E0D8C4] transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: acc.role === "admin" ? "#11284D" : "#D5B370", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {acc.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#101A2C] group-hover:text-[#11284D]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {acc.label}
                </div>
                <div className="text-xs text-[#718096] truncate">{acc.email}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B0AA90] group-hover:text-[#11284D] flex-shrink-0" />
            </button>
          ))}
        </div>
        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-[#B0AA90]">©GROUP 3 - AMONG US · HCMUS</p>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (role: "admin" | "student") => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background photo */}
      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.72) 100%)" }} />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Card */}
        <div className="rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Top: Navy branding ── */}
          <div className="px-8 pt-8 pb-7 text-center" style={{ background: "linear-gradient(135deg,#11284D 0%,#264B6F 100%)" }}>
            <div className="w-16 h-16 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white" style={PJS}>C</span>
            </div>
            <h1 className="text-xl font-bold text-white" style={PJS}>CampUS</h1>
            <p className="text-white/55 text-xs mt-1">Trường ĐH Khoa học Tự nhiên — ĐHQG HCM</p>
          </div>

          {/* ── Bottom: White, image-3 style ── */}
          <div className="bg-white pt-7 pb-3 flex flex-col items-center">
            <h2 className="font-bold mb-6 text-center text-[15px]" style={{ ...PJS, color: "var(--primary)" }}>ĐĂNG NHẬP</h2>

            {/* Microsoft button */}
            <button
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-3 px-4 py-3 rounded border border-[#BFBB9A] hover:border-[#11284D] hover:bg-[#F4EFDF]/60 transition-all group"
            >
              {/* Windows logo */}
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" className="flex-shrink-0">
                <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              <span className="text-sm font-semibold group-hover:text-[#11284D] transition-colors" style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }}>
                Đăng nhập với Microsoft
              </span>
            </button>

            {/* Note */}
            <p className="text-center text-[11px] mt-8 leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
              Vui lòng sử dụng email chính thức nhà trường đã cung cấp
              <br />
              <span style={{ color: "var(--primary)" }}>(@student.hcmus.edu.vn)</span>
            </p>

            {/* Footer inside white section */}
            <p className="text-center text-[10px] mt-5" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>©GROUP 3 - AMONG US · HCMUS</p>
          </div>
        </div>
      </div>

      {showPicker && <AccountPickerModal onLogin={role => { setShowPicker(false); onLogin(role); }} />}
    </div>
  );
}

// ─── Logout Confirm ───────────────────────────────────────────────────────────
function LogoutConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center bg-[#ffffff]">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--background)" }}>
          <LogOut className="w-6 h-6" style={{ color: "var(--accent)" }} />
        </div>
        <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>Đăng xuất?</h3>
        <p className="text-sm text-[#4A6080] mb-5">Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-semibold border border-[#BFBB9A] hover:bg-[#E8E0CC] transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--muted-foreground)" }}>Hủy</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Success ───────────────────────────────────────────────────────────
function LogoutSuccess() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xl w-full max-w-xs mx-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#f0fdf4" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <p className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>Đã đăng xuất thành công!</p>
      </div>
    </div>
  );
}

// ─── AI Chatbot ───────────────────────────────────────────────────────────────
type ChatMsg = { role: "user" | "bot"; text: string; time: string };

const BOT_GREET: ChatMsg = {
  role: "bot",
  text: "Xin chào! Tôi là **HCMUS AI** — trợ lý học vụ của bạn.\nTôi có thể giúp tra cứu lịch học, điểm số, học phí và các thắc mắc học vụ. Bạn cần hỗ trợ gì?",
  time: "",
};

const SUGGESTIONS = [
  "Lịch học hôm nay?",
  "Học phí còn bao nhiêu?",
  "Khi nào đăng ký môn?",
  "Cách xem điểm thi?",
];

function mockReply(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("học phí") || s.includes("đóng tiền") || s.includes("còn bao nhiêu"))
    return "Học phí học kỳ 3 năm 2025-2026 có hạn đóng đến **15/08/2026**. Số tiền còn lại bạn có thể xem tại mục **Học phí** trong sidebar. Thanh toán qua cổng trực tuyến hoặc tại phòng Tài vụ (B002).";
  if (s.includes("lịch học") || s.includes("thời khóa biểu") || s.includes("hôm nay"))
    return "Thời khóa biểu tuần hiện tại của bạn có thể xem tại mục **Lịch học & Thi**. Hôm nay bạn có buổi học Cơ sở dữ liệu lúc 7:30 tại phòng B201. Kiểm tra chi tiết tại tab Lịch học nhé!";
  if (s.includes("điểm") || s.includes("kết quả") || s.includes("xem điểm"))
    return "Điểm các môn học được cập nhật tại mục **Học tập → Tiến độ**. Nếu có thắc mắc về điểm, bạn nên liên hệ giảng viên phụ trách hoặc nộp đơn **phúc khảo** qua Phòng Đào tạo.";
  if (s.includes("đăng ký môn") || s.includes("đăng ký học"))
    return "Lịch đăng ký môn học kỳ tới sẽ được thông báo qua **Thông báo hệ thống**. Thông thường mở từ tuần 14–16 của học kỳ. Hãy kiểm tra mục Thông báo thường xuyên để không bỏ lỡ!";
  if (s.includes("khảo sát"))
    return "Bạn có các **khảo sát chưa hoàn thành**. Vui lòng vào mục **Khảo sát** và điền trước thời hạn — nếu không sẽ bị khóa quyền đăng ký môn của học kỳ tiếp theo.";
  if (s.includes("nghỉ học") || s.includes("xin nghỉ") || s.includes("vắng"))
    return "Để xin nghỉ có phép, bạn cần nộp đơn tại **Phòng Đào tạo (B001)** trước buổi học. Lưu ý: vắng quá **20% số buổi** sẽ bị cấm thi cuối kỳ theo quy chế.";
  if (s.includes("thư viện"))
    return "Thư viện HCMUS mở cửa **7:30–21:30** các ngày trong tuần (thứ 7 đến 17:00). Cần thẻ sinh viên để mượn sách. Tra cứu đầu sách tại **lib.hcmus.edu.vn**.";
  if (s.includes("wifi") || s.includes("mạng"))
    return "Sinh viên có thể kết nối WiFi **HCMUS-EDU** bằng tài khoản MSSV và mật khẩu cổng thông tin. Nếu không kết nối được, liên hệ Phòng CNTT tại A205.";
  if (s.includes("cảm ơn") || s.includes("thanks") || s.includes("ok"))
    return "Không có gì, rất vui được hỗ trợ bạn! Nếu còn câu hỏi nào khác, tôi luôn ở đây. Chúc bạn học tốt! 🎓";
  return "Tôi ghi nhận câu hỏi của bạn. Để được hỗ trợ chi tiết hơn, bạn có thể:\n• Đến **Phòng Đào tạo** (B001, Cơ sở 1)\n• Email: **daotao@hcmus.edu.vn**\n• Hotline: **(028) 3835 4266**\n\nTôi có thể giúp gì thêm không?";
}

function renderBotText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} className={i > 0 ? "mt-1" : ""}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

function AIChatbot() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
  const PRIMARY = "#11284D";

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([BOT_GREET]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      setPulse(false);
      setMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", text: q, time: now }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = mockReply(q);
      setMessages(prev => [...prev, {
        role: "bot", text: reply,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      }]);
      setTyping(false);
    }, 900 + Math.random() * 700);
  }

  return (
    <>
      <div className="fixed bottom-[88px] md:bottom-20 right-5 z-40 flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right"
        style={{
          width: "min(360px, calc(100vw - 24px))", background: "#ffffff",
          maxHeight: minimized ? 56 : 520,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transform: open ? "scale(1) translateY(0)" : "scale(0.85) translateY(16px)",
          border: "1px solid rgba(62,75,142,0.15)",
        }}>
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #264B6F 100%)` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight" style={PJS}>HCMUS AI</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 4px #4ade80" }} />
              <span className="text-white/70 text-xs" style={INTER}>Trợ lý học vụ • Trực tuyến</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(v => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors">
              {minimized ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {!minimized && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ ...INTER, minHeight: 0 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "bot" && (
                    <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: PRIMARY }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="max-w-[76%]">
                    <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm"
                      style={{
                        background: m.role === "user" ? PRIMARY : "#EBF4FF",
                        color: m.role === "user" ? "#fff" : "#101A2C",
                        borderBottomRightRadius: m.role === "user" ? 4 : undefined,
                        borderBottomLeftRadius:  m.role === "bot"  ? 4 : undefined,
                        border: m.role === "bot" ? "1px solid #e2e8f0" : undefined,
                      }}>
                      {m.role === "bot" ? renderBotText(m.text) : m.text}
                    </div>
                    {m.time && (
                      <p className="text-xs text-[#718096] mt-1 px-1" style={{ textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</p>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: PRIMARY }}>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-[#EBF4FF] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-blue-100 flex items-center gap-1">
                    {[0,1,2].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#8898AA] inline-block"
                        style={{ animation: `bounce 1.2s ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {messages.length <= 1 && !typing && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors" style={PJS}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="px-3 py-3 border-t border-gray-100 bg-white flex items-end gap-2">
              <textarea ref={inputRef} rows={1} value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Nhập câu hỏi... (Enter để gửi)"
                className="flex-1 resize-none rounded-xl border border-[#BFBB9A] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed bg-[#ffffff]"
                style={{ ...INTER, maxHeight: 96, overflowY: "auto" }} />
              <button onClick={() => send()} disabled={!input.trim() || typing}
                className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-white transition-all"
                style={{ background: input.trim() && !typing ? PRIMARY : "#cbd5e1", cursor: input.trim() && !typing ? "pointer" : "not-allowed" }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
      <button onClick={() => setOpen(v => !v)}
        className="fixed bottom-[68px] md:bottom-5 right-5 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: open ? "#264B6F" : `linear-gradient(135deg, ${PRIMARY} 0%, #264B6F 100%)` }}
        title="Trợ lý AI">
        <div className="relative">
          {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
          {!open && pulse && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />}
        </div>
      </button>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}

// ─── Help Button ─────────────────────────────────────────────────────────────
const CONTACTS = [
  { label: "Phòng đào tạo", mail: "daotao@hcmus.edu.vn" },
  { label: "Phòng giáo vụ", mail: "giaovu@hcmus.edu.vn" },
  { label: "Phòng kỹ thuật", mail: "kythuat@hcmus.edu.vn" },
];

function HelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        title="Liên hệ hỗ trợ"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50, whiteSpace: "nowrap" }}>
          <div className="px-4 py-2.5 border-b border-border">
            <h3 className="font-bold text-sm" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Liên hệ hỗ trợ</h3>
          </div>
          <div className="divide-y divide-border">
            {CONTACTS.map(c => (
              <div key={c.label} className="px-4 py-2.5 flex items-center gap-4 hover:bg-secondary/40 transition-colors">
                <span className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.label}:</span>
                <a
                  href={`mailto:${c.mail}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {c.mail}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "admin">("student");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("profile");
  const [academicSubTab, setAcademicSubTab] = useState<"summary" | "progress">("summary");
  const [scheduleTab, setScheduleTab] = useState<"tkb" | "thi">("tkb");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set(NOTIFICATIONS.filter(n => n.read).map(n => n.id)));
  const notifRef  = useRef<HTMLDivElement>(null);

  function markRead(id: number) {
    setReadIds(prev => new Set([...prev, id]));
  }
  const avatarRef = useRef<HTMLDivElement>(null);

  function handleLogin(role: "admin" | "student") {
    setUserRole(role);
    setIsLoggedIn(true);
  }

  function handleLogoutConfirm() {
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
    setTimeout(() => {
      setShowLogoutSuccess(false);
      setIsLoggedIn(false);
    }, 1800);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = NOTIFICATIONS.filter(n => !readIds.has(n.id)).length;

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;
  if (userRole === "admin") return <AdminApp onLogout={() => setIsLoggedIn(false)} />;

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {showLogoutConfirm && <LogoutConfirm onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutConfirm(false)} />}
      {showLogoutSuccess && <LogoutSuccess />}

      {/* ── Sidebar (desktop only) ── */}
      <aside className="flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: sidebarOpen ? 192 : 52, background: "var(--primary)" }}>
        <div className="flex flex-col items-center pt-5 pb-4 px-3 flex-shrink-0">
          <div className="relative flex-shrink-0" style={{ width: sidebarOpen ? 100 : 44, height: sidebarOpen ? 100 : 44, transition: "all 0.3s" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="text-center mt-2.5">
              <div className="font-bold text-white leading-tight tracking-wide text-[14px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CampUS</div>
              <div className="text-xs text-white/45 mt-0.5 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TRƯỜNG ĐH KHOA HỌC TỰ NHIÊN</div>
            </div>
          )}
        </div>
        <div className="mx-4 mb-2 h-px bg-white/10" />
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative"
                style={{ background: active ? "rgba(255,255,255,0.15)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.8)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: active ? 600 : 500, justifyContent: sidebarOpen ? "flex-start" : "center" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.95)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; } }}>
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? "#D5B370" : "inherit" }} />
                {sidebarOpen && (
                  <>
                    <span className={`flex-1 text-left whitespace-nowrap text-white ${active ? "text-[14px]" : "text-[13px]"}`}>{item.label}</span>
                    {item.badge && (
                      <span className="text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5" style={{ background: "var(--accent)", fontSize: "10px" }}>{item.badge}</span>
                    )}
                  </>
                )}
                {!sidebarOpen && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
                )}
              </button>
            );
          })}
        </nav>
        <div className="mx-4 mt-2 h-px bg-white/10" />
        <div className={`p-4 flex items-center gap-3 flex-shrink-0 ${sidebarOpen ? "" : "justify-center"}`}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(213,179,112,0.12)", border: "2px solid rgba(213,179,112,0.3)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NV</span>
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nguyễn Văn An</div>
              <div className="text-xs text-white/40 truncate font-mono">21127001</div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3 relative z-40">
          {/* Sidebar toggle — desktop only */}
          <button onClick={() => setSidebarOpen(s => !s)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hidden md:block">
            {sidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
          </button>
          {/* Mobile: app logo/brand */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" }}>
              <span className="text-white text-[10px] font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>C</span>
            </div>
            <span className="font-bold text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{SECTION_TITLES[activeSection]}</span>
          </div>
          {/* Desktop: breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {SECTION_TITLES[activeSection]}
            </span>
            {activeSection === "academic" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {academicSubTab === "summary" ? "Tổng kết" : "Tiến độ học tập"}
                </span>
              </>
            )}
            {activeSection === "schedule" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {scheduleTab === "tkb" ? "TKB Tuần" : "TKB Thi"}
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <HelpButton />
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); }} className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: "9px" }}>{unread}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-sm" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông báo</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {NOTIFICATIONS.map(n => {
                      const isUnread = !readIds.has(n.id);
                      return (
                        <div key={n.id} className={`px-4 py-3 hover:bg-secondary/50 transition-colors ${isUnread ? "bg-secondary/30" : ""}`}>
                          <div className="flex items-start gap-2 mb-1">
                            {isUnread && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent)" }} />}
                            <p className={`text-xs leading-snug flex-1 ${isUnread ? "font-semibold text-foreground" : "text-foreground"}`}>{n.title}</p>
                          </div>
                          <div className="flex items-center justify-between mt-1 pl-4">
                            <span className="text-xs text-muted-foreground">{n.time}</span>
                            <button onClick={() => { markRead(n.id); setSelectedNotif(n); setActiveSection("notifications"); setNotifOpen(false); }} className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>Chi tiết</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-border">
                    <button onClick={() => { setActiveSection("notifications"); setNotifOpen(false); setSelectedNotif(null); }} className="w-full py-3 text-sm font-semibold hover:bg-secondary/50 transition-colors" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tất cả</button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={avatarRef}>
              <button onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: "rgba(213,179,112,0.12)", color: "var(--accent)", border: "2px solid rgba(213,179,112,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "12px" }}>
                NV
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-4 flex items-center gap-3 border-b border-border">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base" style={{ background: "rgba(213,179,112,0.12)", color: "var(--accent)", border: "2px solid rgba(213,179,112,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NV</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{STUDENT_PROFILE.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">{STUDENT_PROFILE.officialEmail}</div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setActiveSection("profile"); setAvatarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors text-foreground">
                      <User className="w-4 h-4 text-muted-foreground" /> Hồ sơ cá nhân
                    </button>
                    <button onClick={() => { setAvatarOpen(false); setShowLogoutConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors text-destructive">
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Đăng xuất">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-20 md:pb-6 bg-background">
          {activeSection === "profile"        && <ProfileSection />}
          {activeSection === "academic"       && <AcademicSection subTab={academicSubTab} setSubTab={setAcademicSubTab} />}
          {activeSection === "survey"         && <SurveySection />}
          {activeSection === "schedule"       && <ScheduleSection tab={scheduleTab} setTab={setScheduleTab} />}
          {activeSection === "tuition"        && <TuitionSection />}
          {activeSection === "notifications"  && <NotificationsSection selectedNotif={selectedNotif} setSelectedNotif={(n) => { if (n) markRead(n.id); setSelectedNotif(n); }} readIds={readIds} />}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-bottom">
        <div className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2.5 px-0.5 transition-colors"
                style={{ color: active ? "var(--primary)" : "#718096" }}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center font-bold"
                      style={{ background: "var(--accent)", fontSize: "8px" }}>{item.badge}</span>
                  )}
                </div>
                <span className="text-[8.5px] font-medium leading-tight text-center w-full truncate px-0.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <AIChatbot />
    </div>
  );
}

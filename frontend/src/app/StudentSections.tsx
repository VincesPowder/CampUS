import React, { useState, useRef, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import {
  User, BookOpen, ClipboardList, CalendarDays, CreditCard, Bell,
  ChevronRight, X, Search, Filter, Download, CheckCircle2,
  Pencil, BarChart2,
} from "lucide-react";
import {
  STUDENT_PROFILE, FAMILY_DATA, COURSE_DATA, TUITION_DATA, NOTIFICATIONS, CREDIT_GROUPS_DATA, RADAR_AXES,
  AVAILABLE_SURVEYS,
  type FamilyMember, type CourseRecord, type Notification, type Survey,
} from "../data/mockData";
import {
  TKB_DATA, EXAM_DATA, DAYS, CA_LABELS, TKBCellCard, getWeekDates,
} from "./shared";

// ─── Nav types ────────────────────────────────────────────────────────────────
export type NavSection = "profile" | "academic" | "survey" | "schedule" | "tuition" | "notifications";

export const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "profile",       label: "Hồ sơ cá nhân", icon: User },
  { id: "academic",      label: "Học tập",        icon: BookOpen },
  { id: "survey",        label: "Khảo sát",       icon: ClipboardList, badge: 2 },
  { id: "schedule",      label: "Lịch học / thi", icon: CalendarDays },
  { id: "tuition",       label: "Học phí",        icon: CreditCard },
  { id: "notifications", label: "Thông báo",      icon: Bell, badge: 3 },
];

export const SECTION_TITLES: Record<NavSection, string> = {
  profile:       "Hồ sơ cá nhân",
  academic:      "Học tập",
  survey:        "Khảo sát",
  schedule:      "Lịch học / thi",
  tuition:       "Học phí",
  notifications: "Thông báo",
};

// ─── Family popup (editable) ──────────────────────────────────────────────────
function FamilyModal({ member, onClose, onSave }: {
  member: FamilyMember;
  onClose: () => void;
  onSave: (updated: FamilyMember) => void;
}) {
  const [draft, setDraft] = useState<FamilyMember>({ ...member });

  function set(key: keyof FamilyMember, val: string) {
    setDraft(prev => ({ ...prev, [key]: val }));
  }

  const fields: { label: string; key: keyof FamilyMember; wide?: boolean }[] = [
    { label: "Họ và Tên",          key: "name" },
    { label: "Năm Sinh",           key: "dob" },
    { label: "Quan Hệ",            key: "rel" },
    { label: "Nghề Nghiệp",        key: "job" },
    { label: "Nơi Làm Việc",       key: "workplace" },
    { label: "Số điện thoại",      key: "phone" },
    { label: "Email",              key: "email" },
    { label: "Dân Tộc",            key: "ethnic" },
    { label: "Tôn Giáo",           key: "religion" },
    { label: "Quốc Tịch",          key: "nationality" },
    { label: "Tỉnh / Thành",       key: "province" },
    { label: "Phường / Xã",        key: "ward" },
    { label: "Hộ Khẩu Thường Trú", key: "address", wide: true },
  ];

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground bg-background outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chỉnh sửa thông tin thành viên gia đình
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <p className="text-xs mb-4" style={{ color: "#dc2626" }}>* Tất cả trường bắt buộc điền</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {fields.map(f => (
              <div key={f.key} className={f.wide ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {f.label} <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  value={draft[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className={inputCls}
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px" }}
                  placeholder={`Nhập ${f.label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border" style={{ background: "var(--background)" }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-border hover:opacity-80 transition-opacity"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)", background: "rgba(37,52,79,0.1)" }}>
            Hủy
          </button>
          <button onClick={() => { onSave(draft); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ background: "rgba(37,52,79,0.1)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", border: "1px solid rgba(37,52,79,0.2)" }}>
            <CheckCircle2 className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Family Tab ───────────────────────────────────────────────────────────────
function FamilyTab() {
  const [members, setMembers] = useState<FamilyMember[]>([...FAMILY_DATA]);
  const [selected, setSelected] = useState<FamilyMember | null>(null);

  function handleSave(updated: FamilyMember) {
    setMembers(prev => prev.map(m => m.name === selected?.name ? updated : m));
  }

  return (
    <>
      <div className="p-5" style={{ fontSize: "11.5px" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(37,52,79,0.2)" }}>
                {["Họ tên", "Ngày sinh", "Quan hệ", "Nghề nghiệp", "Nơi làm việc", "SĐT", "Mail"].map(col => (
                  <th key={col} className="border border-border px-3 py-2 text-left font-semibold"
                    style={{ fontSize: "11.5px", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((row, i) => (
                <tr key={i} className="transition-colors cursor-pointer group" onClick={() => setSelected(row)} title="Nhấn để chỉnh sửa"
                  style={{ background: selected?.name === row.name ? "rgba(37,52,79,0.1)" : undefined }}
                  onMouseEnter={e => { if (selected?.name !== row.name) (e.currentTarget as HTMLElement).style.background = "rgba(37,52,79,0.06)"; }}
                  onMouseLeave={e => { if (selected?.name !== row.name) (e.currentTarget as HTMLElement).style.background = ""; }}>
                  <td className="border border-border px-3 py-2.5 font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      {row.name}
                      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </span>
                  </td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">{row.dob}</td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">{row.rel}</td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">{row.job}</td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">{row.workplace}</td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">{row.phone}</td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">{row.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Nhấn vào một dòng để chỉnh sửa thông tin.</p>
      </div>
      {selected && (
        <FamilyModal member={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      )}
    </>
  );
}

// ─── Field helper (ReadOnly for Top Section) ─────────────────────────────────
function Field({ label, value }: { label: string; value: string | undefined }) {
  const displayValue = value ? value : <span className="text-muted-foreground opacity-60 italic">Chưa cập nhật</span>;
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
      <div className="text-sm font-medium text-foreground">{displayValue}</div>
    </div>
  );
}

// ─── fmt helper ───────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("vi-VN"); }

// ─── Tuition Section ─────────────────────────────────────────────────────────
export function TuitionSection() {
  function parseNhHk(nhHk: string) {
    const yearMatch = nhHk.match(/\d{2,4}-\d{2,4}/);
    const hkMatch   = nhHk.match(/HK\s*(\d)/i);
    return { namHoc: yearMatch ? yearMatch[0] : nhHk, hocKy: hkMatch ? `HK${hkMatch[1]}` : nhHk };
  }

  const parsed       = TUITION_DATA.map(d => ({ nhHk: d.nhHk, ...parseNhHk(d.nhHk) }));
  const uniqueNamHoc = Array.from(new Set(parsed.map(p => p.namHoc)));
  const [selNamHoc, setSelNamHoc] = useState(uniqueNamHoc[0]);
  const ALL_HKS = ["HK1", "HK2", "HK3"] as const;
  const [selHK, setSelHK] = useState<string>("HK3");


  const matchNhHk = parsed.find(p => p.namHoc === selNamHoc && p.hocKy === selHK)?.nhHk ?? TUITION_DATA[0].nhHk;
  const semester = TUITION_DATA.find(d => d.nhHk === matchNhHk)!;
  const totalTC       = semester.rows.reduce((s, r) => s + r.soTC, 0);
  const totalTiet     = semester.rows.reduce((s, r) => s + r.soTiet, 0);
  const totalTcHp     = semester.rows.reduce((s, r) => s + r.soTcHocPhi, 0);
  const totalHocPhi   = semester.rows.reduce((s, r) => s + r.hocPhi, 0);
  const totalGiam     = semester.rows.reduce((s, r) => s + r.giam, 0);
  const totalHoTro    = semester.rows.reduce((s, r) => s + r.hoTro, 0);
  const totalThucDong = semester.rows.reduce((s, r) => s + r.hocPhiThucDong, 0);
  const totalChiPhi   = semester.rows.reduce((s, r) => s + r.chiPhi, 0);
  const headerCls = "px-3 py-2.5 font-semibold text-white text-center whitespace-nowrap";
  const cellCls   = "px-3 py-2.5 text-center text-xs";

  return (
    <div className="space-y-5 w-full">
      <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tra Cứu Học Phí</h1>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Năm học:</label>
          <select value={selNamHoc} onChange={e => setSelNamHoc(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {uniqueNamHoc.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Học kỳ:</label>
          <select value={selHK} onChange={e => setSelHK(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {ALL_HKS.map(h => <option key={h} value={h}>Học kỳ {h.replace("HK", "")}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--primary)" }}>
                {["STT","NH/HK","Mã MH / Lớp / Môn Học","Số TC","Số Tiết","Số TC Học Phí","Học Phí","Giảm","Hỗ Trợ Học Phí","Học Phí Thực Đóng","Chi Phí","Ghi Chú"].map(h => (
                  <th key={h} className={headerCls} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {semester.rows.map((row, i) => (
                <tr key={row.stt} style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }} className="hover:brightness-95 transition-all">
                  <td className={cellCls + " text-muted-foreground"}>{row.stt}</td>
                  <td className={cellCls}>{row.nhHk}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <div className="font-medium text-muted-foreground" style={{ fontSize: 10 }}>[{row.maMon}/{row.lop}]</div>
                    <div className="font-medium">{row.tenMon}</div>
                  </td>
                  <td className={cellCls}>{row.soTC.toFixed(1)}</td>
                  <td className={cellCls}>{row.soTiet}</td>
                  <td className={cellCls}>{row.soTcHocPhi.toFixed(2)}</td>
                  <td className={cellCls + " font-medium"}>{fmt(row.hocPhi)}</td>
                  <td className={cellCls}>{row.giam}</td>
                  <td className={cellCls}>{row.hoTro}</td>
                  <td className={cellCls + " font-semibold"} style={{ color: "var(--primary)" }}>{fmt(row.hocPhiThucDong)}</td>
                  <td className={cellCls}>{row.chiPhi}</td>
                  <td className={cellCls}>{row.ghiChu || "—"}</td>
                </tr>
              ))}
              <tr className="font-bold" style={{ background: "#dde4f5", borderTop: "2px solid #C5CCB7" }}>
                <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng Cộng:</td>
                <td className={cellCls + " font-bold"}>{totalTC.toFixed(1)}</td>
                <td className={cellCls + " font-bold"}>{totalTiet}</td>
                <td className={cellCls + " font-bold"}>{totalTcHp.toFixed(2)}</td>
                <td className={cellCls + " font-bold"}>{fmt(totalHocPhi)}</td>
                <td className={cellCls + " font-bold"}>{totalGiam}</td>
                <td className={cellCls + " font-bold"}>{totalHoTro}</td>
                <td className={cellCls + " font-bold"} style={{ color: "var(--primary)" }}>{fmt(totalThucDong)}</td>
                <td className={cellCls + " font-bold"}>{totalChiPhi}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-6 py-3">
          <span className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng số tiền phải đóng:</span>
          <span className="text-base font-bold" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{fmt(totalThucDong)}</span>
        </div>
        <p className="text-xs text-muted-foreground pr-1">Ngày cập nhật: {semester.ngayCapNhat}</p>
      </div>
    </div>
  );
}

// ─── GPA helpers ──────────────────────────────────────────────────────────────
function gpaFromScore(s: number) {
  if (s >= 8.5) return 4.0;
  if (s >= 8.0) return 3.7;
  if (s >= 7.5) return 3.5;
  if (s >= 7.0) return 3.0;
  if (s >= 6.5) return 2.5;
  if (s >= 5.5) return 2.0;
  if (s >= 5.0) return 1.5;
  if (s >= 4.0) return 1.0;
  return 0;
}

// ─── Progress Section ─────────────────────────────────────────────────────────
export function ProgressSection() {
  const totalReq  = CREDIT_GROUPS_DATA.reduce((s, g) => s + g.req, 0);
  const totalDone = CREDIT_GROUPS_DATA.reduce((s, g) => s + g.done, 0);
  const totalDebt = 5;
  const totalLeft = totalReq - totalDone - totalDebt;

  const PIE_DATA = [
    { name: "Hoàn thành", value: totalDone, color: "var(--primary)" },
    { name: "Còn thiếu",  value: totalLeft, color: "#C5CCB7" },
    { name: "Đang nợ",    value: totalDebt, color: "var(--accent)" },
  ];

  const years = Array.from(new Set(COURSE_DATA.map(c => c.namHoc)));
  const [selYear, setSelYear] = useState(years[0]);
  const [selSem,  setSelSem]  = useState<number>(() => {
    const s = Array.from(new Set(COURSE_DATA.filter(c => c.namHoc === years[0]).map(c => c.hocKy))).sort();
    return s[0];
  });
  const [selCourse, setSelCourse] = useState<string>(() => {
    const first = COURSE_DATA.filter(c => c.namHoc === years[0] && c.hocKy === Array.from(new Set(COURSE_DATA.filter(c2 => c2.namHoc === years[0]).map(c2 => c2.hocKy))).sort()[0]);
    return first[0]?.maMon ?? "";
  });
  const [ccScore,   setCcScore]   = useState("");
  const [gkScore,   setGkScore]   = useState("");
  const [ckScore,   setCkScore]   = useState("");
  const [ccWeight,  setCcWeight]  = useState(10);
  const [gkWeight,  setGkWeight]  = useState(30);
  const [targetScore10, setTargetScore10] = useState(7.0);

  const semsForYear  = Array.from(new Set(COURSE_DATA.filter(c => c.namHoc === selYear).map(c => c.hocKy))).sort();
  const validSem     = semsForYear.includes(selSem) ? selSem : semsForYear[0];
  const coursesInSem = COURSE_DATA.filter(c => c.namHoc === selYear && c.hocKy === validSem);
  const validCourse  = coursesInSem.find(c => c.maMon === selCourse)?.maMon ?? (coursesInSem[0]?.maMon ?? "");
  const course       = coursesInSem.find(c => c.maMon === validCourse);

  const prevKey = useRef("");
  useEffect(() => {
    const key = `${selYear}-${validSem}-${validCourse}`;
    if (prevKey.current !== key) {
      prevKey.current = key;
      setGkScore(course?.diemGK != null ? String(course.diemGK) : "");
      setCkScore(course?.diemCK != null ? String(course.diemCK) : "");
    }
  }, [selYear, validSem, validCourse, course]);

  const ckWeight   = Math.max(0, 100 - ccWeight - gkWeight);
  const ccNum      = parseFloat(ccScore) || 0;
  const gkNum      = parseFloat(gkScore) || 0;
  const ckNum      = parseFloat(ckScore) || 0;
  const hasAny     = ccScore !== "" || gkScore !== "" || ckScore !== "";
  const totalScore = hasAny ? (ccNum * ccWeight + gkNum * gkWeight + ckNum * ckWeight) / 100 : null;
  const gpaEst     = totalScore !== null ? gpaFromScore(totalScore) : null;
  const ckNeeded   = ckWeight > 0 ? (targetScore10 * 100 - ccNum * ccWeight - gkNum * gkWeight) / ckWeight : null;
  const feasible   = ckNeeded !== null && ckNeeded <= 10;
  const weightSum  = ccWeight + gkWeight + ckWeight;

  const selectCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-[var(--input-background)]";
  const inputCls  = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="flex flex-col md:flex-row gap-5 min-w-0">
      <div className="w-full md:flex-[0_0_26%] md:min-w-[180px] md:max-w-[280px] space-y-4 overflow-hidden">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 text-xs font-bold text-white text-center" style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Thông tin chung
          </div>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse", fontFamily: "'Inter', sans-serif" }}>
            <tbody>
              {([
                ["Mã SV",              STUDENT_PROFILE.mssv],
                ["Họ tên SV",          STUDENT_PROFILE.fullName],
                ["Giáo dục đại cương", "40/56"],
                ["KT cơ sở ngành",     "30/38"],
                ["Tốt nghiệp",         "0/10"],
                ["Chuyên ngành",       "3/34"],
                ["Đạt GDTC",          "Chưa cập nhật"],
                ["Đạt GDQP",          "Chưa cập nhật"],
                ["Đạt TĐNN",          "Chưa cập nhật"],
                ["Tổng TC tích lũy",  `${totalDone}/${totalReq}`],
                ["Điểm TB tích lũy",  "2.85"],
                ["Đủ ĐK tốt nghiệp", "Chưa"],
              ] as [string, string][]).map(([label, value], i) => (
                <tr key={label} style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }}>
                  <td className="px-3 py-2 text-muted-foreground border-b border-border leading-tight">{label}</td>
                  <td className="px-3 py-2 border-b border-border text-right font-medium leading-tight"
                    style={{ color: label === "Tổng TC tích lũy" ? "#11284D" : label === "Đủ ĐK tốt nghiệp" ? "#D5B370" : "#101A2C", fontWeight: label === "Tổng TC tích lũy" ? 700 : 500 }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 text-xs font-bold text-white text-center" style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Nhóm học phần
          </div>
          <div className="divide-y divide-gray-100">
            {CREDIT_GROUPS_DATA.filter(g => g.req > 0).map((g, i) => {
              const pct = (g.done / g.req) * 100;
              const done = g.done >= g.req;
              return (
                <div key={g.code} className="px-3 py-2.5" style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{g.code}</span>
                    <span className="text-[10px] font-bold" style={{ color: done ? "#22c55e" : "#11284D" }}>{g.done}/{g.req}</span>
                  </div>
                  <div className="text-[11px] text-foreground mb-1.5 leading-tight">{g.name}</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#DDD3BC" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "#22c55e" : "#11284D", transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>Tiến độ tín chỉ</h3>
          <p className="text-xs text-muted-foreground mb-2">Hoàn thành / Còn thiếu / Đang nợ</p>
          {(() => {
            const cx = 90, cy = 90, outerR = 82, innerR = 54;
            const total = PIE_DATA.reduce((s, d) => s + d.value, 0);
            let cumAngle = -Math.PI / 2;
            const slices = PIE_DATA.map(d => {
              const startA = cumAngle;
              const sweep = (d.value / total) * 2 * Math.PI * 0.995;
              cumAngle += (d.value / total) * 2 * Math.PI;
              const endA = startA + sweep;
              const large = sweep > Math.PI ? 1 : 0;
              const path = [
                `M ${cx + outerR * Math.cos(startA)} ${cy + outerR * Math.sin(startA)}`,
                `A ${outerR} ${outerR} 0 ${large} 1 ${cx + outerR * Math.cos(endA)} ${cy + outerR * Math.sin(endA)}`,
                `L ${cx + innerR * Math.cos(endA)} ${cy + innerR * Math.sin(endA)}`,
                `A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * Math.cos(startA)} ${cy + innerR * Math.sin(startA)}`,
                "Z",
              ].join(" ");
              return { ...d, path };
            });
            return (
              <div className="flex flex-col items-center w-full">
                <svg width="100%" viewBox="0 0 180 180" style={{ display: "block", maxWidth: 200, margin: "0 auto" }}>
                  {slices.map((s, i) => <path key={`donut-${i}`} d={s.path} fill={s.color} />)}
                  <text x="90" y="84" textAnchor="middle" fontSize="22" fontWeight="bold" fontFamily="Plus Jakarta Sans, sans-serif" fill="#11284D">{totalDone}</text>
                  <text x="90" y="103" textAnchor="middle" fontSize="11" fill="#718096">/{totalReq} TC</text>
                </svg>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {PIE_DATA.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[11px] text-muted-foreground">{d.name}</span>
                      <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>Chỉ số phù hợp chuyên ngành</h3>
          <p className="text-xs text-muted-foreground mb-2">Dựa trên điểm các nhóm môn học</p>
          {(() => {
            const cx = 110, cy = 105, r = 75;
            const n = RADAR_AXES.length;
            const angles = RADAR_AXES.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);
            const levels = [0.25, 0.5, 0.75, 1.0];
            const gridPts = (lvl: number) => RADAR_AXES.map((_, i) => `${cx + r * lvl * Math.cos(angles[i])},${cy + r * lvl * Math.sin(angles[i])}`).join(" ");
            const scorePts = RADAR_AXES.map((d, i) => { const ratio = d.score / d.fullMark; return `${cx + r * ratio * Math.cos(angles[i])},${cy + r * ratio * Math.sin(angles[i])}`; }).join(" ");
            const dotPts = RADAR_AXES.map((d, i) => { const ratio = d.score / d.fullMark; return { x: cx + r * ratio * Math.cos(angles[i]), y: cy + r * ratio * Math.sin(angles[i]), score: d.score }; });
            const labelR = r + 22;
            return (
              <svg width="100%" viewBox="0 0 220 210" style={{ display: "block", maxWidth: 260, margin: "0 auto" }}>
                {levels.map((lvl, i) => <polygon key={`grid-lvl-${i}`} points={gridPts(lvl)} fill="none" stroke="#DDD3BC" strokeWidth="1" />)}
                {RADAR_AXES.map((_, i) => <line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + r * Math.cos(angles[i])} y2={cy + r * Math.sin(angles[i])} stroke="#DDD3BC" strokeWidth="1" />)}
                <polygon points={scorePts} fill="#11284D" fillOpacity="0.22" stroke="#11284D" strokeWidth="2" />
                {dotPts.map((pt, i) => <circle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#11284D" />)}
                {RADAR_AXES.map((d, i) => {
                  const lx = cx + labelR * Math.cos(angles[i]);
                  const ly = cy + labelR * Math.sin(angles[i]);
                  return <text key={`lbl-${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="#4A5568" fontFamily="Inter, sans-serif">{d.subject}</text>;
                })}
              </svg>
            );
          })()}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--primary)" }}>
            <BarChart2 className="w-4 h-4 text-white/70" />
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dự Đoán Điểm Số</h3>
          </div>
          <div className="p-4 flex flex-col sm:flex-row gap-5 flex-wrap">
            <div className="w-full sm:flex-[0_0_200px] sm:min-w-[160px] space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Năm học</label>
                <select value={selYear} onChange={e => { setSelYear(e.target.value); const s = Array.from(new Set(COURSE_DATA.filter(c => c.namHoc === e.target.value).map(c => c.hocKy))).sort(); setSelSem(s[0]); }} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Học kỳ</label>
                <select value={validSem} onChange={e => setSelSem(Number(e.target.value))} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }}>
                  {semsForYear.map(s => <option key={s} value={s}>Học kỳ {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Môn học</label>
                <select value={validCourse} onChange={e => setSelCourse(e.target.value)} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }}>
                  {coursesInSem.map(c => <option key={c.maMon} value={c.maMon}>{c.tenMon || c.maMon}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mục tiêu điểm (hệ 10)</label>
                <input type="number" min={0} max={10} step={0.5} value={targetScore10}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setTargetScore10(Math.min(10, Math.max(0, v))); }}
                  placeholder="0 – 10" className={inputCls} style={{ fontFamily: "'Inter', sans-serif" }} />
                <div className="flex gap-1 mt-1.5">
                  {[5.5, 6.5, 7.0, 7.5, 8.5].map(t => (
                    <button key={t} onClick={() => setTargetScore10(t)}
                      className="flex-1 py-1 rounded-md text-[10px] font-bold transition-all"
                      style={{ background: targetScore10 === t ? "#11284D" : "#EEF2FF", color: targetScore10 === t ? "#fff" : "#718096", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-[240px] space-y-3">
              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#EEE9E0" }}>
                <div className="grid grid-cols-[1fr_80px] gap-0 border-b border-border">
                  <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Điểm (0 – 10)</div>
                  <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide text-center border-l border-border" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tỉ lệ (%)</div>
                </div>
                {[
                  { label: "Quá trình", score: ccScore, setScore: setCcScore, weight: ccWeight, setWeight: (v: number) => setCcWeight(Math.min(100, Math.max(0, v))), editable: true },
                  { label: "Giữa kỳ",  score: gkScore, setScore: setGkScore, weight: gkWeight, setWeight: (v: number) => setGkWeight(Math.min(100, Math.max(0, v))), editable: true },
                  { label: "Cuối kỳ",  score: ckScore, setScore: setCkScore, weight: ckWeight, setWeight: null, editable: false },
                ].map((row, i) => (
                  <div key={row.label} className="grid grid-cols-[1fr_80px] gap-0 border-b border-border last:border-0" style={{ background: i % 2 === 0 ? "#fff" : "#EEE9E0" }}>
                    <div className="px-3 py-2.5 flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Điểm {row.label}</label>
                      <input type="number" min={0} max={10} step={0.1} value={row.score} onChange={e => row.setScore(e.target.value)} placeholder="0 – 10"
                        className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary bg-[var(--input-background)]" style={{ fontFamily: "'Inter', sans-serif" }} />
                    </div>
                    <div className="border-l border-border px-2 py-2.5 flex flex-col gap-1 items-center justify-center">
                      {row.editable ? (
                        <input type="number" min={0} max={100} step={5} value={row.weight} onChange={e => row.setWeight!(Number(e.target.value))}
                          className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-primary bg-[var(--input-background)]"
                          style={{ fontFamily: "'Inter', sans-serif", color: "var(--primary)" }} />
                      ) : (
                        <div className="text-center">
                          <span className="text-sm font-bold" style={{ color: ckWeight < 0 ? "#D5B370" : "#475569", fontFamily: "'Inter', sans-serif" }}>{ckWeight}%</span>
                          <div className="text-[9px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>tự động</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {weightSum !== 100 && (
                  <div className="px-3 py-2 flex items-center gap-1.5 border-t border-orange-100" style={{ background: "#fffbeb" }}>
                    <span className="text-[10px] font-semibold text-amber-600" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Tổng tỉ lệ: {weightSum}% {weightSum > 100 ? "(vượt quá 100%)" : `(thiếu ${100 - weightSum}%)`}
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-xl p-3" style={{ background: "#E0D8C4" }}>
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Điểm tổng kết (hệ 10)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold leading-none" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalScore !== null ? totalScore.toFixed(2) : "—"}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-[#D8D3C9] self-center hidden sm:block" />
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>GPA ước tính</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: gpaEst === null ? "#718096" : gpaEst >= 3.0 ? "#22c55e" : gpaEst >= 2.0 ? "#f59e0b" : "#D5B370" }}>
                        {gpaEst !== null ? gpaEst.toFixed(1) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">/4.0</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: ckNeeded !== null && !feasible ? "#fff5f5" : "#E0D8C4", border: `1px dashed ${ckNeeded !== null && !feasible ? "#fca5a5" : "#C5CCB7"}` }}>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Cần điểm Cuối kỳ bao nhiêu để đạt {targetScore10.toFixed(1)}/10?
                </p>
                {ckWeight <= 0 ? (
                  <p className="text-xs text-muted-foreground">Tỉ lệ điểm CK bằng 0%, không thể dự đoán.</p>
                ) : !hasAny ? (
                  <p className="text-xs text-muted-foreground">Nhập ít nhất một điểm để xem dự đoán.</p>
                ) : feasible ? (
                  <p className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>
                    Cần ít nhất{" "}<span className="font-bold text-base" style={{ color: "var(--primary)" }}>{Math.max(0, ckNeeded!).toFixed(1)}</span>{" "}/10 để đạt tổng kết {targetScore10.toFixed(1)}/10
                  </p>
                ) : (
                  <p className="text-sm font-semibold" style={{ color: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Không thể đạt {targetScore10.toFixed(1)}/10 với điểm GK hiện tại. Hãy điều chỉnh mục tiêu.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Academic Section ─────────────────────────────────────────────────────────
export function AcademicSection({ subTab, setSubTab }: { subTab: "summary" | "progress"; setSubTab: (t: "summary" | "progress") => void }) {
  const [filterYear, setFilterYear] = useState("Tất cả");
  const [filterTerm, setFilterTerm] = useState("Tất cả");

  const allYears = Array.from(new Set(COURSE_DATA.map(c => c.namHoc)));
  const years = ["Tất cả", ...allYears];
  const availableTerms = filterYear === "Tất cả"
    ? Array.from(new Set(COURSE_DATA.map(c => c.hocKy))).sort()
    : Array.from(new Set(COURSE_DATA.filter(c => c.namHoc === filterYear).map(c => c.hocKy))).sort();
  const terms = ["Tất cả", ...availableTerms.map(String)];
  const filtered = COURSE_DATA.filter(c => {
    if (filterYear !== "Tất cả" && c.namHoc !== filterYear) return false;
    if (filterTerm !== "Tất cả" && c.hocKy !== Number(filterTerm)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center border-b border-border">
        {(["summary", "progress"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className="px-6 py-2.5 text-sm font-medium transition-colors relative"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: subTab === t ? "var(--primary)" : "var(--muted-foreground)", fontWeight: subTab === t ? 600 : 400, background: "transparent" }}>
            {t === "summary" ? "Tổng kết" : "Tiến độ học tập"}
            {subTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)", marginBottom: -1 }} />}
          </button>
        ))}
      </div>
      {subTab === "summary" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Năm học:</label>
              <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterTerm("Tất cả"); }}
                className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                {years.map(y => <option key={y} value={y}>{y === "Tất cả" ? "Tất cả năm học" : `Năm học ${y}`}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Học kỳ:</label>
              <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                {terms.map(t => <option key={t} value={t}>{t === "Tất cả" ? "Tất cả học kỳ" : `Học kỳ ${t}`}</option>)}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} môn học</span>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--primary)" }}>
                  {[
                    { label: "STT",          cls: "w-10  text-center" },
                    { label: "Năm học",      cls: "w-16  text-center" },
                    { label: "Học kỳ",       cls: "w-14  text-center" },
                    { label: "Mã môn học",   cls: "w-24  text-center" },
                    { label: "Tên môn học",  cls: "text-left" },
                    { label: "Số TC",        cls: "w-12  text-center" },
                    { label: "Lớp",          cls: "w-20  text-center" },
                    { label: "Loại điểm",    cls: "w-20  text-center" },
                    { label: "Điểm (hệ 10)", cls: "w-20  text-center" },
                    { label: "Điểm GK",      cls: "w-16  text-center" },
                    { label: "Điểm CK",      cls: "w-16  text-center" },
                    { label: "Chương trình", cls: "w-24  text-center" },
                    { label: "Hệ",           cls: "w-14  text-center" },
                  ].map(c => (
                    <th key={c.label} className={`px-2 py-2.5 font-semibold text-white whitespace-nowrap ${c.cls}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.stt} style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }} className="hover:brightness-95 transition-all">
                    <td className="px-2 py-2 text-center text-muted-foreground">{row.stt}</td>
                    <td className="px-2 py-2 text-center">{row.namHoc}</td>
                    <td className="px-2 py-2 text-center">{row.hocKy}</td>
                    <td className="px-2 py-2 text-center font-medium" style={{ color: "var(--primary)" }}>{row.maMon}</td>
                    <td className="px-2 py-2 text-left">{row.tenMon || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-2 py-2 text-center">{row.soTC || "—"}</td>
                    <td className="px-2 py-2 text-center">{row.lop}</td>
                    <td className="px-2 py-2 text-center">{row.loaiDiem || "—"}</td>
                    <td className="px-2 py-2 text-center">{row.diem10 ?? "—"}</td>
                    <td className="px-2 py-2 text-center">{row.diemGK ?? "—"}</td>
                    <td className="px-2 py-2 text-center">{row.diemCK ?? "—"}</td>
                    <td className="px-2 py-2 text-center">{row.chuongTrinh}</td>
                    <td className="px-2 py-2 text-center">{row.he}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {subTab === "progress" && <ProgressSection />}
    </div>
  );
}


// ─── Profile Section (Hoàn thiện API & Giao diện Figma 100%) ────────────────
export function ProfileSection({ avatarUrl, onAvatarChange }: { avatarUrl: string | null; onAvatarChange: (url: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const { accounts } = useMsal();
  const [innerTab, setInnerTab] = useState<"personal" | "family">("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<any>({ ...STUDENT_PROFILE });
  const [saved, setSaved] = useState<any>({ ...STUDENT_PROFILE });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAvatarChange(url);
  }

  // Tự động lấy MSSV từ Microsoft Entra ID
  const activeAccount = accounts[0];
  const currentMssv = activeAccount?.username ? activeAccount.username.split('@')[0] : STUDENT_PROFILE.mssv; 

  useEffect(() => {
    fetch(`/api/profile/${currentMssv}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi kết nối Backend");
        return res.json();
      })
      .then(data => {
        setSaved(data);
        setDraft(data);
        setCanUpdate(data.canUpdate ?? false);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi:", err);
        setLoading(false);
      });
  }, [currentMssv]);

  const tabs = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "family",   label: "Thông tin gia đình" },
  ] as const;

  async function handleSave() {
    try {
      const res = await fetch(`/api/profile/${currentMssv}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAddress: draft.currentAddress,
          phone: draft.phone,
          personalEmail: draft.personalEmail
        })
      });
      if (res.ok) {
        setSaved({ ...draft });
        setIsEditing(false);
      } else {
        alert("Lỗi cập nhật từ Backend.");
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleCancel() { setDraft({ ...saved }); setIsEditing(false); }
  function handleExportPdf() { window.print(); }

  // Field tĩnh có làm mờ khi thiếu dữ liệu
  function Field({ label, value }: { label: string; value: string | undefined }) {
    const displayValue = value ? value : <span className="text-muted-foreground opacity-60 italic">Chưa cập nhật</span>;
    return (
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
        <div className="text-sm font-medium text-foreground">{displayValue}</div>
      </div>
    );
  }

  // Field linh động hỗ trợ Edit & ReadOnly
  function EField({ label, fieldKey, readOnly = false }: { label: string; fieldKey: string; readOnly?: boolean }) {
    const value = saved[fieldKey as keyof typeof saved] as string;
    const displayValue = value ? value : <span className="text-muted-foreground opacity-60 italic">Chưa cập nhật</span>;

    if (!isEditing || readOnly) {
      return (
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
          <div className="text-sm font-medium text-foreground">{displayValue}</div>
        </div>
      );
    }
    return (
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
        <input value={(draft[fieldKey as keyof typeof draft] as string) || ""}
          onChange={e => setDraft((prev: any)  => ({ ...prev, [fieldKey]: e.target.value }))}
          className="w-full border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors"
          style={{ borderColor: "#C5CCB7", fontFamily: "'Inter', sans-serif", color: "var(--foreground)", background: "var(--input-background, #fff)" }} />
      </div>
    );
  }

  if (loading) return <div className="p-5 text-center text-sm text-muted-foreground">Đang tải dữ liệu từ cơ sở dữ liệu...</div>;

  return (
    <div className="w-full space-y-5">
      {/* ── Khối Thông tin chung ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border" style={{ background: "#11284D" }}>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin chung</h2>
        </div>
        <div className="p-5 flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start">
          {/* Avatar Area */}
          <div className="flex flex-col items-center justify-center sm:w-48 flex-shrink-0">
            <div className="relative group mb-3">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4" style={{ borderColor: "#11284D" }} />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 text-xl font-bold"
                    style={{ borderColor: "#11284D", background: "#fff", color: "#11284D", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    NV
                  </div>
              }
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)" }}
                title="Đổi ảnh đại diện">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{saved.fullName}</div>
              <div className="text-[11px] text-muted-foreground mb-2">Sinh viên</div>
              <div className="inline-block px-4 py-1 rounded-full text-[11px] font-bold text-white shadow-sm"
                   style={{ background: "#D5B370", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {saved.status || "Đang học"}
              </div>
            </div>
          </div>
          
          {/* Vertical Divider */}
          <div className="hidden sm:block w-px bg-border self-stretch flex-shrink-0" />
          
          {/* Lưới 9 ô dữ liệu (3x3) */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            <Field label="MSSV"                value={saved.mssv} />
            <Field label="Ngày sinh"           value={saved.dob} />
            <Field label="Nơi sinh"            value={saved.placeOfBirth} />
            
            <Field label="Giới tính"           value={saved.gender} />
            <Field label="Khóa"                value={saved.course} />
            <Field label="Bậc đào tạo"         value={saved.level} />
            
            <Field label="Ngành"               value={saved.major} />
            <Field label="Loại hình đào tạo"   value={saved.trainingType} />
            <Field label="Chuyên ngành"        value={saved.specialization} />
          </div>
        </div>
      </div>

      {/* ── Khối Thông tin cá nhân / Gia đình ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ outline: isEditing ? "2px solid #11284D" : "none" }}>
        <div className="flex items-center border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setInnerTab(t.id)}
              className="px-6 py-3 text-sm font-medium transition-colors relative"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: innerTab === t.id ? "#fff" : "var(--muted-foreground)", fontWeight: innerTab === t.id ? 600 : 400, background: innerTab === t.id ? "#11284D" : "transparent" }}>
              {t.label}
            </button>
          ))}
          <div className="ml-auto pr-4 flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors hover:opacity-80"
                  style={{ background: "rgba(37,52,79,0.1)", borderColor: "rgba(37,52,79,0.2)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hủy</button>
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lưu
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} disabled={!canUpdate}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${canUpdate ? "hover:opacity-80" : "opacity-50 cursor-not-allowed"}`}
                style={{ background: "rgba(37,52,79,0.1)", borderColor: "rgba(37,52,79,0.2)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16L8.5 15 16.5 7a1.414 1.414 0 0 0-2-2L6.5 13 4 16z" />
                </svg>
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
        
        {!canUpdate && (
           <div className="px-5 py-2.5 text-[11.5px] font-semibold bg-red-50 text-red-600 border-b border-red-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
             Thời gian cập nhật hồ sơ đã kết thúc.
           </div>
        )}

        {isEditing && (
          <div className="px-5 py-2 text-xs font-medium" style={{ background: "rgba(37,52,79,0.1)", color: "var(--primary)", borderBottom: "1px solid #C5CCB7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Đang ở chế độ chỉnh sửa — nhấn <strong>Lưu</strong> để xác nhận hoặc <strong>Hủy</strong> để thoát.
          </div>
        )}
        
        {innerTab === "personal" && (
          <div className="p-5 space-y-6 [&_.text-sm]:text-[11.5px] [&_.text-xs]:text-[10px]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CCCD / Giấy tờ tùy thân</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <EField label="Số CCCD"    fieldKey="cccd" />
                <EField label="Ngày cấp"   fieldKey="issuedDate" />
                <EField label="Nơi cấp"    fieldKey="issuedPlace" />
                <EField label="Quốc tịch"  fieldKey="nationality" readOnly />
                <EField label="Dân tộc"    fieldKey="ethnic" />
                <EField label="Tôn giáo"   fieldKey="religion" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Địa chỉ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <EField label="Địa chỉ thường trú" fieldKey="permanentAddress" />
                <EField label="Địa chỉ hiện nay"   fieldKey="currentAddress" />
                <EField label="Địa chỉ liên lạc"   fieldKey="contactAddress" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin liên hệ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <EField label="Điện thoại"       fieldKey="phone" />
                <EField label="Email cá nhân"    fieldKey="personalEmail" />
                <EField label="Email chính thức" fieldKey="officialEmail" readOnly />
                <EField label="Ngày vào trường"  fieldKey="enrolledDate" readOnly />
                <EField label="Ngày vào Đoàn"    fieldKey="joinUnionDate" />
                <EField label="Ngày vào Đảng"    fieldKey="joinPartyDate" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin người liên lạc</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <EField label="Tên người liên hệ"   fieldKey="advisor" readOnly />
                <EField label="SĐT người liên hệ"   fieldKey="advisorPhone" readOnly />
                <EField label="Email người liên hệ" fieldKey="advisorEmail" readOnly />
                <EField label="Quan hệ"             fieldKey="advisorRelation" readOnly />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin ngân hàng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <EField label="Số thẻ ngân hàng"  fieldKey="bankNumber" />
                <EField label="Ngân hàng liên kết" fieldKey="bank" />
                <EField label="Chi nhánh"          fieldKey="bankBranch" />
              </div>
            </div>
          </div>
        )}
        {innerTab === "family" && <FamilyTab />}
      </div>
      <div className="flex justify-end">
        <button onClick={handleExportPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:bg-secondary/60"
          style={{ borderColor: "#C5CCB7", color: "var(--muted-foreground)", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16h12" /><path d="M10 3v9" /><path d="M6.5 8.5L10 12l3.5-3.5" />
          </svg>
          Xuất PDF
        </button>
      </div>
    </div>
  );
}

// ─── Survey Section ───────────────────────────────────────────────────────────
const RATING_LABELS: Record<number, string> = { 1: "Rất tệ", 2: "Tệ", 3: "Bình thường", 4: "Tốt", 5: "Rất tốt" };
type CourseResponse = { rating: number | null; detailed: boolean; comment: string };

function ratingColor(n: number) {
  return n === 1 ? "#E8384D" : n === 2 ? "#F4703A" : n === 3 ? "#F9C02B" : n === 4 ? "#2ABDA8" : "#4BC06B";
}

function SurveyForm({ survey, onDone }: { survey: Survey; onDone: (id: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, CourseResponse>>(
    Object.fromEntries(survey.courses.map(c => [c.id, { rating: null, detailed: false, comment: "" }]))
  );
  const setRating   = (id: string, v: number)  => setResponses(p => ({ ...p, [id]: { ...p[id], rating: v } }));
  const setDetailed = (id: string, v: boolean) => setResponses(p => ({ ...p, [id]: { ...p[id], detailed: v } }));
  const setComment  = (id: string, v: string)  => setResponses(p => ({ ...p, [id]: { ...p[id], comment: v } }));
  const allRated = survey.courses.every(c => responses[c.id].rating !== null);

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f5e9" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>Đã gửi đánh giá thành công!</h2>
        <p className="text-sm text-muted-foreground mb-6">Cảm ơn bạn đã hoàn thành khảo sát. Ý kiến của bạn giúp nhà trường cải thiện chất lượng giảng dạy.</p>
        <button onClick={() => onDone(survey.id)} className="px-6 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Survey header card ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 sm:px-6 py-4" style={{ background: "var(--primary)" }}>
          <h2 className="text-sm sm:text-base font-bold text-white leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{survey.title}</h2>
        </div>
        <div className="px-4 sm:px-6 py-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{survey.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Hạn:</span>
              <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{survey.deadline}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Đơn vị:</span>
              <span className="text-xs font-medium text-muted-foreground">ĐHKHTN, ĐHQG HCM</span>
            </div>
          </div>
          <div className="pt-1 border-t border-border">
            <p className="text-[11px] text-muted-foreground italic mb-2">Thang điểm từ 1 đến 5:</p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {[1,2,3,4,5].map(n => (
                <div key={n} className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center text-white flex-shrink-0" style={{ background: ratingColor(n) }}>{n}</span>
                  <span className="text-xs text-muted-foreground">{RATING_LABELS[n]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Course cards ── */}
      {survey.courses.map((course, idx) => {
        const res = responses[course.id];
        const rated = res.rating !== null;
        return (
          <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Course header */}
            <div className="px-4 py-3 flex items-start gap-3 border-b border-border" style={{ background: "#dde4f5" }}>
              <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={{ background: "var(--primary)" }}>{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{course.name}</p>
                {course.code !== "—" && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{course.code}</p>}
              </div>
              {rated && (
                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: ratingColor(res.rating!) + "22", color: ratingColor(res.rating!), fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {RATING_LABELS[res.rating!]}
                </span>
              )}
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Rating choice */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>Đánh giá chung về môn học và giảng viên</p>
                  {/* Rating buttons — larger touch targets on mobile */}
                  <div className="flex gap-2 sm:gap-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => { setRating(course.id, n); setDetailed(course.id, false); }} title={RATING_LABELS[n]}
                        className="flex-1 sm:flex-none sm:w-11 sm:h-11 aspect-square rounded-full text-sm font-bold border-2 transition-all active:scale-95"
                        style={{
                          borderColor: res.rating === n ? ratingColor(n) : "#e2e8f0",
                          background: res.rating === n ? ratingColor(n) : "#fff",
                          color: res.rating === n ? "#fff" : "#4A5568",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Open-ended comment */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Góp ý thêm (không bắt buộc)</p>
                <textarea value={res.comment} onChange={e => setComment(course.id, e.target.value)}
                  placeholder="Ý kiến của bạn về môn học, giảng viên..." rows={3}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }} />
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Submit row ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-4">
        {!allRated && (
          <p className="text-xs text-amber-600 font-medium px-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Vui lòng đánh giá tất cả {survey.courses.length} môn học trước khi gửi.
          </p>
        )}
        <button disabled={!allRated} onClick={() => setSubmitted(true)}
          className="sm:ml-auto px-7 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ background: allRated ? "#11284D" : "#C5CCB7", cursor: allRated ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Gửi đánh giá
        </button>
      </div>
    </div>
  );
}

export function SurveySection() {
  const [selectedId, setSelectedId] = useState<string | null>(AVAILABLE_SURVEYS.length === 1 ? AVAILABLE_SURVEYS[0].id : null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const selected = AVAILABLE_SURVEYS.find(s => s.id === selectedId) ?? null;

  function handleDone(id: string) {
    setCompletedIds(prev => new Set([...prev, id]));
    setSelectedId(null);
  }

  if (AVAILABLE_SURVEYS.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#E0D8C4" }}>
            <ClipboardList className="w-7 h-7" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Không có khảo sát nào cần thực hiện</p>
            <p className="text-xs text-muted-foreground">Khi có khảo sát mới, bạn sẽ nhận được thông báo.</p>
          </div>
        </div>
      </div>
    );
  }
  if (AVAILABLE_SURVEYS.length > 1 && !selected) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div>
          <h2 className="text-base font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>Khảo sát đang mở</h2>
          <p className="text-xs text-muted-foreground">Chọn một khảo sát để bắt đầu.</p>
        </div>
        {AVAILABLE_SURVEYS.map(sv => {
          const done = completedIds.has(sv.id);
          return (
            <button key={sv.id} onClick={() => setSelectedId(sv.id)}
              className="w-full text-left bg-card rounded-2xl border overflow-hidden group transition-colors"
              style={{ borderColor: done ? "#22c55e" : "var(--border)" }}>
              <div className="h-1" style={{ background: done ? "#22c55e" : "var(--primary)" }} />
              <div className="px-5 py-4">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sv.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{sv.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{sv.courses.length} môn học</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: done ? "#22c55e" : "var(--accent)" }}>
                    {done ? "Hoàn thành" : `Hạn: ${sv.deadline}`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className="w-full max-w-3xl mx-auto">
      {AVAILABLE_SURVEYS.length > 1 && selected && (
        <button onClick={() => setSelectedId(null)}
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
          style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Quay lại danh sách khảo sát
        </button>
      )}
      <SurveyForm survey={selected ?? AVAILABLE_SURVEYS[0]} onDone={handleDone} />
    </div>
  );
}

// ─── Schedule Section ─────────────────────────────────────────────────────────
export function ScheduleSection({ tab, setTab }: { tab: "tkb" | "thi"; setTab: (t: "tkb" | "thi") => void }) {
  const [namHoc, setNamHoc] = useState("2025-2026");
  const [hocKy,  setHocKy]  = useState("HK1");
  const [tuan,   setTuan]   = useState(28);
  const TODAY_DAY = 1;
  const weekData = TKB_DATA[tuan] ?? {};
  const dates    = getWeekDates(tuan);
  const selectCls = "border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white";

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Năm học:</label>
          <select value={namHoc} onChange={e => setNamHoc(e.target.value)} className={selectCls} style={{ fontFamily: "'Inter', sans-serif" }}>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Học kỳ:</label>
          <select value={hocKy} onChange={e => setHocKy(e.target.value)} className={selectCls} style={{ fontFamily: "'Inter', sans-serif" }}>
            <option value="HK1">Học kỳ 1</option>
            <option value="HK2">Học kỳ 2</option>
            <option value="HK3">Học kỳ 3</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tuần:</label>
          <select value={tuan} onChange={e => setTuan(Number(e.target.value))} className={selectCls} style={{ fontFamily: "'Inter', sans-serif" }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(w => <option key={w} value={w}>Tuần {w}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
        </div>
      </div>
      <div className="flex items-center border-b border-border">
        {([["tkb", "TKB Tuần"], ["thi", "TKB Thi"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-6 py-2.5 text-sm font-medium transition-colors relative"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: tab === id ? "var(--primary)" : "var(--muted-foreground)", fontWeight: tab === id ? 600 : 400, background: "transparent" }}>
            {label}
            {tab === id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)", marginBottom: -1 }} />}
          </button>
        ))}
      </div>
      {tab === "tkb" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-center gap-6" style={{ background: "#1e3a5f" }}>
            <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{hocKy}</span>
            <span className="text-white opacity-40 text-xs">|</span>
            <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{namHoc}</span>
            <span className="text-white opacity-40 text-xs">|</span>
            <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tuần {tuan}</span>
            <span className="text-white opacity-40 text-xs">|</span>
            <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{dates[0]} → {dates[6]}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs" style={{ minWidth: 700, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  {DAYS.map((day, i) => {
                    const isToday = i === TODAY_DAY;
                    return (
                      <th key={day} className="border-2 border-border px-2 py-2 text-center"
                        style={{ background: isToday ? "#fff7ed" : "#fff", color: isToday ? "#d97706" : "#1e3a5f", fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 120 }}>
                        <div style={{ fontSize: 12, fontWeight: 800 }}>{day}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6 }}>{dates[i]}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {CA_LABELS.map((ca, caIdx) => (
                  <tr key={caIdx} style={{ background: "#fff" }}>
                    {DAYS.map((_, dayIdx) => {
                      const cell = weekData[dayIdx]?.[caIdx] ?? null;
                      if (cell === "span") return null;
                      const entry = cell as import("./shared").TKBEntry | null;
                      const isToday = dayIdx === TODAY_DAY;
                      const spanRows = entry?.span ?? 1;
                      return (
                        <td key={dayIdx} rowSpan={spanRows} className="border-2 border-border px-2 py-1.5 align-top"
                          style={{ height: 130, background: isToday && entry ? "rgba(245,158,11,0.1)" : undefined }}>
                          {entry ? <TKBCellCard entry={entry} caTime={ca.time} /> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "tkb" && (
        <div className="flex items-center justify-between">
          <button onClick={() => setTuan(t => Math.max(1, t - 1))} disabled={tuan <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground bg-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <ChevronRight className="w-4 h-4 rotate-180" /> Tuần trước
          </button>
          
          <button onClick={() => setTuan(t => Math.min(10, t + 1))} disabled={tuan >= 10}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground bg-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tuần sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {tab === "thi" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: "var(--primary)" }}>
                  {["STT", "Môn học", "Mã Lớp", "Thứ", "Ngày thi", "Giờ thi", "Thời gian", "Phòng thi", "Hình thức"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-bold text-white border-r border-white/10 last:border-r-0 whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXAM_DATA.map((ex, i) => (
                  <tr key={i} className="hover:bg-blue-100/60 transition-colors" style={{ background: i % 2 === 0 ? "#fff" : "#EBF4FF" }}>
                    <td className="px-3 py-3 border-b border-border text-center font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-3 border-b border-border font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.tenMon}</td>
                    <td className="px-3 py-3 border-b border-border font-mono text-xs text-muted-foreground">{ex.maNhom}</td>
                    <td className="px-3 py-3 border-b border-border text-muted-foreground">{ex.thu}</td>
                    <td className="px-3 py-3 border-b border-border font-semibold text-foreground">{ex.ngayThi}</td>
                    <td className="px-3 py-3 border-b border-border text-muted-foreground whitespace-nowrap">{ex.gio}</td>
                    <td className="px-3 py-3 border-b border-border text-muted-foreground whitespace-nowrap">{ex.thoiGian}</td>
                    <td className="px-3 py-3 border-b border-border">
                      <span className="font-bold" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.phong}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-border">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap ${ex.hinhThuc === "Thực hành" ? "bg-green-50 text-green-700" : ex.hinhThuc === "Trắc nghiệm" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.hinhThuc}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────
const ALL_KHOA  = Array.from(new Set(NOTIFICATIONS.map(n => n.khoa).filter(Boolean))).sort();
const ALL_PHONG = Array.from(new Set(NOTIFICATIONS.map(n => n.phong).filter(Boolean))).sort();

export function NotificationsSection({ selectedNotif, setSelectedNotif, readIds = new Set<number>() }: {
  selectedNotif: Notification | null;
  setSelectedNotif: (n: Notification | null) => void;
  readIds?: Set<number>;
}) {
  const [search,     setSearch]     = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selKhoa,    setSelKhoa]    = useState<string[]>([]);
  const [selPhong,   setSelPhong]   = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggleKhoa(v: string) { setSelKhoa(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }
  function togglePhong(v: string) { setSelPhong(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }
  function clearAll() { setSelKhoa([]); setSelPhong([]); }
  const activeCount = selKhoa.length + selPhong.length;

  const filtered = NOTIFICATIONS.filter(n => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    const matchKhoa   = selKhoa.length === 0  || (n.khoa  && selKhoa.includes(n.khoa));
    const matchPhong  = selPhong.length === 0 || (n.phong && selPhong.includes(n.phong));
    return matchSearch && matchKhoa && matchPhong;
  });

  function NotifTags({ n }: { n: Notification }) {
    return (
      <div className="flex gap-1 flex-wrap mt-0.5">
        {n.khoa  && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#E0D8C4", color: "var(--primary)" }}>{n.khoa}</span>}
        {n.phong && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#fdf4ff", color: "#7c3aed" }}>{n.phong}</span>}
      </div>
    );
  }

  if (selectedNotif) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-3" style={{ background: "var(--primary)" }}>
            <button onClick={() => setSelectedNotif(null)} className="text-white/70 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Chi tiết thông báo</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {selectedNotif.khoa  && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E0D8C4", color: "var(--primary)" }}>{selectedNotif.khoa}</span>}
              {selectedNotif.phong && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fdf4ff", color: "#7c3aed" }}>{selectedNotif.phong}</span>}
              {!selectedNotif.read && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--accent)" }}>Chưa đọc</span>}
            </div>
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedNotif.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedNotif.time}</p>
            <p className="text-sm leading-relaxed text-foreground">{selectedNotif.body}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông báo</h1>
        <span className="text-xs text-muted-foreground">{filtered.length}/{NOTIFICATIONS.length} thông báo</span>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm thông báo..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary bg-card transition-colors"
            style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button onClick={() => setFilterOpen(o => !o)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all"
            style={{ borderColor: activeCount > 0 ? "#11284D" : "#e2e8f0", background: activeCount > 0 ? "#11284D" : "#fff", color: activeCount > 0 ? "#fff" : "#475569", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Filter className="w-4 h-4" />
            <span>Lọc</span>
            {activeCount > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>{activeCount}</span>}
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>Lọc thông báo</span>
                {activeCount > 0 && <button onClick={clearAll} className="text-xs font-semibold hover:opacity-70 transition-opacity" style={{ color: "var(--accent)" }}>Xoá tất cả</button>}
              </div>
              <div className="px-4 pt-3 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Khoa / Bộ môn</p>
                <div className="space-y-1">
                  {ALL_KHOA.map(k => (
                    <label key={k} className="flex items-center gap-2.5 cursor-pointer group py-1">
                      <div onClick={() => toggleKhoa(k)} className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: selKhoa.includes(k) ? "#11284D" : "#cbd5e1", background: selKhoa.includes(k) ? "#11284D" : "#fff" }}>
                        {selKhoa.includes(k) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className="text-sm text-foreground select-none group-hover:text-foreground transition-colors" onClick={() => toggleKhoa(k)} style={{ fontFamily: "'Inter', sans-serif" }}>{k}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">{NOTIFICATIONS.filter(n => n.khoa === k).length}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mx-4 h-px bg-border" />
              <div className="px-4 pt-3 pb-4">
                <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#7c3aed", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Phòng / Ban</p>
                <div className="space-y-1">
                  {ALL_PHONG.map(p => (
                    <label key={p} className="flex items-center gap-2.5 cursor-pointer group py-1">
                      <div onClick={() => togglePhong(p)} className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: selPhong.includes(p) ? "#7c3aed" : "#cbd5e1", background: selPhong.includes(p) ? "#7c3aed" : "#fff" }}>
                        {selPhong.includes(p) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className="text-sm text-foreground select-none group-hover:text-foreground transition-colors" onClick={() => togglePhong(p)} style={{ fontFamily: "'Inter', sans-serif" }}>{p}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">{NOTIFICATIONS.filter(n => n.phong === p).length}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {activeCount > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {selKhoa.map(k => <button key={k} onClick={() => toggleKhoa(k)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80" style={{ background: "#E0D8C4", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k} <X className="w-3 h-3" /></button>)}
          {selPhong.map(p => <button key={p} onClick={() => togglePhong(p)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80" style={{ background: "#fdf4ff", color: "#7c3aed", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p} <X className="w-3 h-3" /></button>)}
        </div>
      )}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Không tìm thấy thông báo phù hợp.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => {
              const isUnread = !readIds.has(n.id);
              return (
              <div key={n.id} onClick={() => setSelectedNotif(n)}
                className="px-5 py-4 cursor-pointer transition-colors flex items-start gap-3"
                style={{ background: isUnread ? "#dde4f5" : "transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#dde4f580"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isUnread ? "#dde4f5" : "transparent"; }}>
                <div className="flex-shrink-0 mt-1.5">
                  {isUnread
                    ? <span className="w-2 h-2 rounded-full block" style={{ background: "var(--primary)" }} />
                    : <span className="w-2 h-2 block" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm mb-0.5 ${isUnread ? "font-bold text-foreground" : "font-normal text-muted-foreground"}`}>{n.title}</p>
                  <NotifTags n={n} />
                  <p className="text-xs text-muted-foreground truncate mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
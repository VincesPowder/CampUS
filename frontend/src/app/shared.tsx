// ─── Shared components, schedule types, data, and TKBCellCard ───────────────
// Used by App.tsx, StudentSections.tsx, and AdminSections.tsx
import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Mail, X, Copy, Check } from "lucide-react";
import logoImg from "@/imports/Artboard_5.png";

const CONTACTS = [
  { label: "Phòng đào tạo",  mail: "daotao@hcmus.edu.vn" },
  { label: "Phòng giáo vụ",  mail: "giaovu@hcmus.edu.vn" },
  { label: "Phòng kỹ thuật", mail: "kythuat@hcmus.edu.vn" },
];

export function SidebarLogo({ open }: { open: boolean }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: open ? 72 : 36,
        height: open ? 72 : 36,
        background: "rgba(255,255,255,0.2)",
        border: "1.5px solid rgba(255,255,255,0.3)",
        transition: "all 0.3s",
        padding: open ? 12 : 6,
      }}>
      <img src={logoImg} alt="CampUS" style={{ mixBlendMode: "screen", filter: "brightness(0) invert(1)" }} className="w-full h-full object-contain" />
    </div>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [contacts, setContacts] = useState<any[]>([
    { label: "Giáo vụ", mail: "giaovu@fit.hcmus.edu.vn", role: "Học vụ" },
    { label: "Phòng Đào tạo", mail: "pdt_khtn@hcmus.edu.vn", role: "Học vụ" },
    { label: "AmongUS", mail: "campusofficial2026@gmail.com", role: "Hỗ trợ kĩ thuật" },
  ]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/contacts')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
          setContacts(data.data.map((c: any) => ({
            label: c.label,
            mail: c.email || c.mail,
            phone: c.phone,
            role: c.role
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCopy = (email: string, idx: number) => {
    navigator.clipboard.writeText(email);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

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
        <div 
          className="fixed left-1/2 -translate-x-1/2 top-[58px] w-max max-w-[calc(100vw-1.5rem)] sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-full sm:mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" 
          style={{ zIndex: 200 }}
        >
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Liên hệ hỗ trợ
            </h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {contacts.map((c, idx) => (
              <div 
                key={c.label || idx} 
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-secondary/40 transition-colors"
              >
                {/* Cột Tên & Vai trò: cố định chiều rộng (210px) để dấu : thẳng hàng */}
                <div className="w-[210px] shrink-0 flex items-center justify-between pr-2">
                  <span className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {c.label}
                    {c.role && (
                      <span className="text-[11px] text-muted-foreground font-normal ml-1">
                        ({c.role})
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-foreground">:</span>
                </div>

                {/* Cột Email */}
                <a 
                  href={`mailto:${c.mail}`} 
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-mono" 
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {c.mail}
                </a>

                {/* Nút Copy: ml-auto tự động đẩy sát về lề phải */}
                <button
                  onClick={() => handleCopy(c.mail, idx)}
                  className="p-1.5 ml-auto rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Sao chép email"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function abbreviateName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words.map(w => w[0].toUpperCase()).join(".");
}

// ─── Schedule types, data, and TKBCellCard ────────────────────────────────────

export type HinhThuc = "TẬP TRUNG" | "TRỰC TUYẾN" | "HỌC BÙ TRỰC TIẾP" | "HỌC BÙ TRỰC TUYẾN" | "NGHỈ";

export type TKBEntry = {
  tenMon: string; 
  maMon?: string; 
  maNhom: string; 
  tiet: string; 
  gio?: string;       // 👈 Bổ sung trường giờ học
  gv: string; 
  email: string;
  hinhThuc: HinhThuc; 
  ngonNgu: string; 
  phong: string; 
  isLab?: boolean; 
  span?: number;
};

export type TKBCell = TKBEntry | "span" | null;

export type ExamEntry = {
  tenMon: string; maNhom: string; ngayThi: string; thu: string;
  ca: string; gio: string; thoiGian: string; phong: string; soThi: number; hinhThuc: string;
};

const E = {
  td:   (note = ""): TKBEntry => ({ tenMon: "Thể dục 2"                        + (note ? ` (${note})` : ""), maNhom: "24C07", tiet: "1–5",  gio: "07:30 – 11:10", gv: "Đ.T.Quang",           email: "dtquang@hcmus.edu.vn",    hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Việt", phong: "Sân thể dục", span: 2 }),
  ktlt: (note = ""): TKBEntry => ({ tenMon: "Kinh tế CT Mác – Lênin"            + (note ? ` (${note})` : ""), maNhom: "24C04", tiet: "1–5",  gio: "07:30 – 11:10", gv: "M.T.K.Trinh",         email: "mktrinh@hcmus.edu.vn",    hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Việt", phong: "C.33",        span: 2 }),
  cslt: (note = ""): TKBEntry => ({ tenMon: "Cơ sở dữ liệu"                    + (note ? ` (${note})` : ""), maNhom: "24C07", tiet: "1–5",  gio: "07:30 – 11:10", gv: "V.T.M.Hằng",          email: "vtmhang@fit.hcmus.edu.vn",hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Anh",  phong: "I.42",        span: 2 }),
  csth: (note = ""): TKBEntry => ({ tenMon: "Cơ sở dữ liệu [TH]"               + (note ? ` (${note})` : ""), maNhom: "24C07", tiet: "3–5",  gio: "09:30 – 11:30", gv: "T.N.H.Đức / L.H.Cơ", email: "tnhduc@fit.hcmus.edu.vn", hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Anh",  phong: "I.52", isLab: true, span: 1 }),
  nmlt: (note = ""): TKBEntry => ({ tenMon: "Nhập môn CN phần mềm"             + (note ? ` (${note})` : ""), maNhom: "24C07", tiet: "6–10", gio: "13:30 – 17:10", gv: "N.Vũ",               email: "nvu@fit.hcmus.edu.vn",    hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Anh",  phong: "I.32",        span: 2 }),
  talt: (note = ""): TKBEntry => ({ tenMon: "Toán ứng dụng & TK CNTT"          + (note ? ` (${note})` : ""), maNhom: "24C04", tiet: "6–10", gio: "13:30 – 17:10", gv: "V.Q.Hoàng",           email: "vqhoang@fit.hcmus.edu.vn",hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Việt", phong: "I.35",        span: 2 }),
  tath: (note = ""): TKBEntry => ({ tenMon: "Toán ứng dụng & TK CNTT [TH]"     + (note ? ` (${note})` : ""), maNhom: "24C04", tiet: "1–3",  gio: "07:30 – 09:30", gv: "T.T.T.Nhi / N.N.Toàn",email: "tttnhi@fit.hcmus.edu.vn", hinhThuc: "TẬP TRUNG", ngonNgu: "Tiếng Việt", phong: "I.52", isLab: true, span: 1 }),
};

export function makeWeek(overrides: Partial<Record<number, (TKBCell | undefined)[]>> = {}): Record<number, TKBCell[]> {
  const base: Record<number, (TKBEntry | null)[]> = {
    0: [E.td(),   null,     null,     null],
    1: [E.cslt(), null,     null,     null],
    2: [null,     E.csth(), E.talt(), null],
    3: [null,     null,     E.nmlt(), null],
    4: [E.tath(), null,     null,     null],
    5: [E.ktlt(), null,     null,     null],
  };
  for (const [d, slots] of Object.entries(overrides)) {
    const di = Number(d);
    if (!base[di]) base[di] = [null, null, null, null];
    (slots as (TKBCell | undefined)[]).forEach((s, i) => {
      if (s !== undefined) (base[di] as TKBCell[])[i] = s as TKBEntry | null;
    });
  }
  const result: Record<number, TKBCell[]> = {};
  for (const [d, slots] of Object.entries(base)) {
    const di = Number(d);
    const row: TKBCell[] = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      const e = slots[i] as TKBEntry | null;
      if (!e) continue;
      row[i] = e;
      const sp = e.span ?? 1;
      for (let j = 1; j < sp && i + j < 4; j++) row[i + j] = "span";
    }
    result[di] = row;
  }
  return result;
}

export const TKB_DATA: Record<number, Record<number, TKBCell[]>> = {
  28: makeWeek(),
  29: makeWeek(),
  30: makeWeek(),
  31: makeWeek({ 0: [null, null, null, null] }),
  32: makeWeek({ 1: [E.cslt("Kiểm tra GK"), null, null, null] }),
  33: makeWeek(),
  34: makeWeek({ 5: [null, null, null, null] }),
  35: makeWeek({ 2: [null, E.csth("Kiểm tra GK"), E.talt("KT GK"), null], 3: [null, null, E.nmlt("Kiểm tra GK"), null] }),
  36: makeWeek(),
  37: makeWeek({ 1: [E.cslt("Ôn tập CK"), null, null, null], 2: [null, E.csth("Ôn tập"), E.talt("Ôn tập CK"), null], 3: [null, null, E.nmlt("Ôn tập CK"), null] }),
  38: makeWeek({ 1: [null,null,null,null], 2:[null,null,null,null], 3:[null,null,null,null], 4:[null,null,null,null] }),
};

export const EXAM_DATA: ExamEntry[] = [
  { tenMon: "Thể dục 2",                    maNhom: "24C07", ngayThi: "24/11/2025", thu: "Thứ hai",  ca: "Ca 1", gio: "07:30", thoiGian: "120 phút", phong: "Sân thể dục", soThi: 48,  hinhThuc: "Thực hành" },
  { tenMon: "Kinh tế CT Mác – Lênin",       maNhom: "24C04", ngayThi: "26/11/2025", thu: "Thứ tư",  ca: "Ca 1", gio: "07:30", thoiGian: "90 phút",  phong: "C.33",        soThi: 120, hinhThuc: "Tự luận" },
  { tenMon: "Cơ sở dữ liệu",               maNhom: "24C07", ngayThi: "28/11/2025", thu: "Thứ sáu", ca: "Ca 2", gio: "09:55", thoiGian: "90 phút",  phong: "I.42",        soThi: 90,  hinhThuc: "Tự luận" },
  { tenMon: "Cơ sở dữ liệu [TH]",          maNhom: "24C07", ngayThi: "29/11/2025", thu: "Thứ bảy", ca: "Ca 1", gio: "07:30", thoiGian: "90 phút",  phong: "I.52",        soThi: 45,  hinhThuc: "Thực hành" },
  { tenMon: "Nhập môn CN phần mềm",         maNhom: "24C07", ngayThi: "01/12/2025", thu: "Thứ hai", ca: "Ca 3", gio: "13:30", thoiGian: "90 phút",  phong: "I.32",        soThi: 60,  hinhThuc: "Thực hành" },
  { tenMon: "Toán ứng dụng & TK CNTT",      maNhom: "24C04", ngayThi: "03/12/2025", thu: "Thứ tư",  ca: "Ca 3", gio: "13:30", thoiGian: "90 phút",  phong: "I.35",        soThi: 100, hinhThuc: "Tự luận" },
  { tenMon: "Toán ứng dụng & TK CNTT [TH]", maNhom: "24C04", ngayThi: "05/12/2025", thu: "Thứ sáu", ca: "Ca 1", gio: "07:30", thoiGian: "90 phút",  phong: "I.52",        soThi: 50,  hinhThuc: "Thực hành" },
];

export const DAYS = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"];

export const CA_LABELS = [
  { label: "Ca 1", time: "07:30 – 11:10", tiet: "Tiết 1–4" },
  { label: "Ca 2", time: "09:30 – 11:30", tiet: "Tiết 3–5" },
  { label: "Ca 3", time: "13:30 – 17:10", tiet: "Tiết 7–10" },
  { label: "Ca 4", time: "15:30 – 17:30", tiet: "Tiết 8–10" },
];

const YEAR_START = new Date(2026, 0, 5);

export function getWeekDates(week: number): string[] {
  const d = new Date(YEAR_START);
  d.setDate(YEAR_START.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`;
  });
}
// Trong frontend/src/app/shared.tsx

export const HINH_THUC_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  "TẬP TRUNG":          { bg: "bg-gray-100",  text: "text-gray-500",   label: "Tập trung" },
  "TRỰC TIẾP":          { bg: "bg-gray-100",  text: "text-gray-500",   label: "Trực tiếp" },
  "TRỰC TUYẾN":         { bg: "bg-blue-50",   text: "text-blue-600",   label: "Trực tuyến" },
  "HỌC BÙ TRỰC TIẾP":  { bg: "bg-amber-50",  text: "text-amber-700",  label: "Học bù (TT)" },
  "HỌC BÙ TRỰC TUYẾN": { bg: "bg-purple-50", text: "text-purple-600", label: "Học bù (OL)" },
  "NGHỈ":               { bg: "bg-red-50",    text: "text-red-600",    label: "Nghỉ" },
};

// Trong frontend/src/app/shared.tsx

export function TKBCellCard({ entry, caTime }: { entry: TKBEntry; caTime?: string }) {
  if (!entry) return null;

  const isEn = entry.ngonNgu === "Tiếng Anh";
  const rawHt = (entry.hinhThuc || "").trim();
  const isNghi = rawHt.toLowerCase().includes("nghỉ");
  
  const htStyle = HINH_THUC_STYLE[rawHt.toUpperCase()] || 
                  HINH_THUC_STYLE[rawHt] || 
                  { bg: "bg-gray-100", text: "text-gray-500", label: rawHt || "Trực tiếp" };
  
  const textColor = "rgba(0,0,0,0.9)";
  const displayTime = entry.gio || caTime || "07:30 – 11:10";
  const displayTiet = entry.tiet ? (entry.tiet.startsWith("Tiết") ? entry.tiet : `Tiết ${entry.tiet}`) : "";

  return (
    <div className="text-[11px] leading-tight space-y-1 min-w-0 h-full">
      {/* Badge phòng học */}
      <div className="flex items-center gap-1 flex-wrap">
        {entry.phong && (
          <span className="inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
            {entry.phong}
          </span>
        )}
        {entry.isLab && (
          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 border border-orange-200">TH</span>
        )}
        {isEn && (
          <span className="inline-block text-[9px] font-bold px-1 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">EN</span>
        )}
      </div>

      {/* Tên môn học */}
      <div className="font-bold text-[11px] leading-snug" style={{ color: "var(--primary)" }}>
        {entry.tenMon}
      </div>

      {/* Mã lớp / LHP */}
      <div className="text-[10px]" style={{ color: textColor }}>
        LHP: <span className="font-mono">{entry.maNhom}</span>
      </div>

      {/* Giờ học & tiết học */}
      {(displayTime || displayTiet) && (
        <div className="text-[10px]" style={{ color: textColor }}>
          {displayTime}
        </div>
      )}

      {/* Giảng viên & Email */}
      {entry.gv && <div className="text-[10px] truncate" style={{ color: textColor }}>GV: {entry.gv}</div>}
      {entry.email && <div className="text-[10px] truncate" style={{ color: textColor }}>{entry.email}</div>}

      {/* 👇 HÌNH THỨC HỌC: HIỂN THỊ CHỮ NGHỈ MÀU ĐỎ NỔI BẬT 👇 */}
      <div className="text-[9px] pt-0.5 space-y-0.5" style={{ color: textColor }}>
        <div>
          Hình thức học:{" "}
          <span className={isNghi ? "text-red-600 font-bold" : ""}>
            {isNghi ? "Nghỉ" : (htStyle?.label || rawHt || "Trực tiếp")}
          </span>
        </div>
        <div>Ngôn ngữ: {entry.ngonNgu || "tiếng Việt"}</div>
      </div>
    </div>
  );
}
// ─── LƯỚI THỜI KHÓA BIỂU TUẦN ─────────────────────────────────────────────────
export function TKBWeekGrid({
  weekData,
  dates,
  todayDay = -1,
  onRemoveSlot,
  onClickCell,
  headerDark = false,
}: {
  weekData: Record<number, TKBCell[]>;
  dates: string[];
  todayDay?: number;
  onRemoveSlot?: (dayIdx: number, caIdx: number) => void;
  onClickCell?: (dayIdx: number, caIdx: number, entry: TKBEntry) => void;
  headerDark?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs" style={{ minWidth: 700, tableLayout: "fixed" }}>
        <thead>
          <tr>
            {DAYS.map((day, i) => {
              const isToday = i === todayDay;
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
                const entry = cell as TKBEntry | null;
                const isToday = dayIdx === todayDay;
                const spanRows = entry?.span ?? 1;
                const clickable = !!onClickCell && !!entry;
                return (
                  <td key={dayIdx} rowSpan={spanRows} className="border-2 border-border px-2 py-1.5 align-top relative group"
                    style={{ height: 130, background: isToday && entry ? "rgba(245,158,11,0.1)" : undefined, cursor: clickable ? "pointer" : undefined }}
                    onClick={() => entry && onClickCell?.(dayIdx, caIdx, entry)}>
                    {entry ? (
                      <>
                        <TKBCellCard entry={entry} caTime={ca.time} />
                        {onRemoveSlot && (
                          <button onClick={e => { e.stopPropagation(); onRemoveSlot(dayIdx, caIdx); }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-white/80 hover:bg-red-50 transition-opacity"
                            title="Xóa tiết này">
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
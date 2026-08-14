import React, { useState, useRef, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
function getAvatarInitials(fullName: string): string {
  return fullName.trim().split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join("");
}
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
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<FamilyMember>({ ...member });
  const [errors, setErrors] = useState<Partial<Record<keyof FamilyMember, boolean>>>({});

  function set(key: keyof FamilyMember, val: string) {
    setDraft(prev => ({ ...prev, [key]: val }));
    if (val.trim()) setErrors(prev => ({ ...prev, [key]: false }));
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

  function handleSave() {
    const newErrors: Partial<Record<keyof FamilyMember, boolean>> = {};
    fields.forEach(f => { if (!draft[f.key]?.trim()) newErrors[f.key] = true; });
    if (Object.values(newErrors).some(Boolean)) { setErrors(newErrors); return; }
    onSave(draft);
    onClose();
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {mode === "view" ? "Thông tin thành viên gia đình" : "Chỉnh sửa thông tin thành viên"}
          </h3>
          <div className="flex items-center gap-2">
            {mode === "view" && (
              <button onClick={() => setMode("edit")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Pencil className="w-3 h-3" /> Chỉnh sửa
              </button>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {mode === "view" ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {fields.map(f => (
                <div key={f.key} className={f.wide ? "col-span-2" : ""}>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {f.label}
                  </div>
                  <div className="text-sm text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {member[f.key] || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs mb-4" style={{ color: "#dc2626" }}>* Tất cả trường bắt buộc điền</p>
              {hasErrors && (
                <div className="mb-4 px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Vui lòng điền đầy đủ các trường bắt buộc (đánh dấu <strong>&nbsp;*&nbsp;</strong>)
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(f => (
                  <div key={f.key} className={f.wide ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {f.label} <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      value={draft[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm text-foreground bg-background outline-none transition-colors"
                      style={{
                        fontFamily: "'Inter', sans-serif", fontSize: "12px",
                        border: errors[f.key] ? "1.5px solid #dc2626" : "1px solid var(--border)",
                        boxShadow: errors[f.key] ? "0 0 0 2px rgba(220,38,38,0.1)" : undefined,
                      }}
                      placeholder={`Nhập ${f.label.toLowerCase()}...`}
                    />
                    {errors[f.key] && (
                      <p className="text-xs mt-1" style={{ color: "#dc2626", fontFamily: "'Inter', sans-serif" }}>Không được để trống</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border" style={{ background: "var(--background)" }}>
          {mode === "view" ? (
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold border hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)", background: "rgba(37,52,79,0.08)", borderColor: "rgba(37,52,79,0.2)" }}>
              Đóng
            </button>
          ) : (
            <>
              <button onClick={() => { setDraft({ ...member }); setErrors({}); setMode("view"); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold border hover:opacity-80 transition-opacity"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)", background: "rgba(37,52,79,0.08)", borderColor: "rgba(37,52,79,0.2)" }}>
                Hủy
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <CheckCircle2 className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Family Tab (Đã tích hợp API & Chuẩn UI Figma) ────────────────────────────
function FamilyTab({ mssv, initialMembers, onUpdateSuccess }: { 
  mssv: string; 
  initialMembers: any[]; 
  onUpdateSuccess: (updated: any) => void 
}) {
  const [members, setMembers] = useState<any[]>(initialMembers);
  const [selected, setSelected] = useState<any | null>(null);

  // Cập nhật state nếu dữ liệu từ API cha (ProfileSection) thay đổi
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Xử lý gọi API PUT cập nhật thông tin người thân
  async function handleSave(updated: any) {
    try {
      const res = await fetch(`/api/students/${mssv}/family/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: updated.phone,
          email: updated.email,
          job: updated.job,
          workplace: updated.workplace,
          address: updated.address,
          province: updated.province,
          ward: updated.ward
        })
      });

      if (res.ok) {
        // Cập nhật lại UI lập tức
        setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
        onUpdateSuccess(updated);
      } else {
        alert("Lỗi khi cập nhật thông tin người thân từ Backend.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối đến máy chủ.");
    }
  }

  return (
    <>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              {/* Header màu xám nhạt chuẩn thiết kế */}
              <tr style={{ background: "#d1d5db" }}> 
                {["Họ tên", "Ngày sinh", "Quan hệ", "Nghề nghiệp", "Nơi làm việc", "SĐT", "Mail"].map(col => (
                  <th key={col} className="border border-gray-300 px-4 py-3 text-left font-semibold text-slate-800"
                    style={{ fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((row, i) => (
                <tr key={i} className="transition-colors cursor-pointer hover:bg-slate-50" 
                  onClick={() => setSelected(row)} title="Nhấn để xem chi tiết">
                  <td className="border border-gray-300 px-4 py-3 text-[13px] font-medium text-slate-900">{row.name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[13px] text-slate-600">{row.dob}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[13px] text-slate-600">{row.rel}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[13px] text-slate-600">{row.job}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[13px] text-slate-600">{row.workplace}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[13px] text-slate-600">{row.phone}</td>
                  <td className="border border-gray-300 px-4 py-3 text-[13px] text-slate-600">{row.email}</td>
                </tr>
              ))}
              {/* Dòng trống cuối cùng để UI ôm gọn giống hệt ảnh design */}
              <tr>
                {Array.from({ length: 7 }).map((_, idx) => (
                  <td key={`empty-${idx}`} className="border border-gray-300 px-4 py-5"></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 px-4 pb-4">Nhấn vào một dòng để xem chi tiết thông tin.</p>
      </div>
      {selected && (
        <FamilyModal member={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      )}
    </>
  );
}

// ─── Field helper (ReadOnly for Top Section) ─────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium text-foreground">{value || "—"}</div>
    </div>
  );
}

// Helper format number
function fmt(n: number) { 
  return n.toLocaleString("vi-VN"); 
}

export function TuitionSection() {
  const { accounts } = useMsal();
  const currentMssv = accounts[0]?.username ? accounts[0].username.split('@')[0] : "24127158";

  // 1. GỌI TẤT CẢ HOOKS Ở TRÊN CÙNG
  const [tuitionList, setTuitionList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selNamHoc, setSelNamHoc] = useState<string>("");
  const [selHK, setSelHK] = useState<string>("");

  // 2. Fetch dữ liệu từ API
  useEffect(() => {
    fetch(`/api/students/${currentMssv}/tuition`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
          setTuitionList(data.data);
          
          // Tự động set giá trị mặc định cho Dropdown dựa trên data API trả về
          const uniqueNamHoc = Array.from(new Set(data.data.map((item: any) => item.namHoc))).filter(y => y !== "—").sort((a: any, b: any) => b.localeCompare(a));
          const uniqueHocKy = Array.from(new Set(data.data.map((item: any) => item.tenHocKy))).filter(hk => hk !== "—").sort();
          
          if (uniqueNamHoc.length > 0) setSelNamHoc(uniqueNamHoc[0] as string);
          if (uniqueHocKy.length > 0) setSelHK(uniqueHocKy[0] as string);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải dữ liệu học phí:", err);
        setLoading(false);
      });
  }, [currentMssv]);

  // 3. Xử lý UI Đang tải (PHẢI ĐẶT SAU TẤT CẢ CÁC HOOKS)
  if (loading) {
    return <div className="p-5 text-center text-muted-foreground">Đang tải dữ liệu học phí...</div>;
  }

  // 4. Render dữ liệu
  const uniqueNamHoc = Array.from(new Set(tuitionList.map(item => item.namHoc))).filter(y => y !== "—").sort((a, b) => b.localeCompare(a));
  const uniqueHocKy = Array.from(new Set(tuitionList.map(item => item.tenHocKy))).filter(hk => hk !== "—").sort();

  const rows = tuitionList.filter(item => item.namHoc === selNamHoc && item.tenHocKy === selHK);

  const totalTC       = rows.reduce((s: number, r: any) => s + (r.soTc || 0), 0);
  const totalTiet     = rows.reduce((s: number, r: any) => s + (r.soTiet || 0), 0);
  const totalTcHocPhi = rows.reduce((s: number, r: any) => s + (r.soTcHocPhi || 0), 0);
  const totalHocPhi   = rows.reduce((s: number, r: any) => s + (r.hocPhiGoc || 0), 0);
  const totalGiam     = rows.reduce((s: number, r: any) => s + (r.mucGiam || 0), 0);
  const totalHoTro    = rows.reduce((s: number, r: any) => s + (r.hoTro || 0), 0);
  const totalThucDong = rows.reduce((s: number, r: any) => s + (r.thucDong || 0), 0);
  const totalChiPhi   = rows.reduce((s: number, r: any) => s + (r.chiPhiKhac || 0), 0);
  
  const ngayCapNhat   = rows.length > 0 && rows[0].ngayThanhToan ? rows[0].ngayThanhToan : "Chưa thanh toán/cập nhật";

  const headerCls = "px-3 py-2.5 font-semibold text-white text-center whitespace-nowrap";
  const cellCls   = "px-3 py-2.5 text-center text-xs";

  return (
    <div className="space-y-5 w-full">
      <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tra Cứu Học Phí</h1>
      
      {tuitionList.length === 0 ? (
        <div className="p-5 text-center text-muted-foreground bg-card rounded-xl border border-border">
          Không có dữ liệu học phí nào được tìm thấy trên hệ thống.
        </div>
      ) : (
        <>
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
                {uniqueHocKy.map(h => <option key={h} value={h}>{h}</option>)}
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
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-5 text-center text-muted-foreground text-sm">
                        Không có dữ liệu cho năm học và học kỳ đã chọn.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: any, i: number) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }} className="hover:brightness-95 transition-all">
                        <td className={cellCls + " text-muted-foreground"}>{i + 1}</td>
                        <td className={cellCls}>{row.nhhk}</td>
                        <td className="px-3 py-2.5 text-xs text-left">
                          <div className="font-medium text-muted-foreground" style={{ fontSize: 10 }}>[{row.maMh}/{row.maLhp}]</div>
                          <div className="font-medium text-foreground">{row.tenMon}</div>
                        </td>
                        <td className={cellCls}>{row.soTc.toFixed(1)}</td>
                        <td className={cellCls}>{row.soTiet}</td>
                        <td className={cellCls}>{row.soTcHocPhi.toFixed(2)}</td>
                        <td className={cellCls + " font-medium"}>{fmt(row.hocPhiGoc)}</td>
                        <td className={cellCls}>{fmt(row.mucGiam)}</td>
                        <td className={cellCls}>{fmt(row.hoTro)}</td>
                        <td className={cellCls + " font-semibold"} style={{ color: "var(--primary)" }}>{fmt(row.thucDong)}</td>
                        <td className={cellCls}>{fmt(row.chiPhiKhac)}</td>
                        <td className={cellCls}>{row.ghiChu}</td>
                      </tr>
                    ))
                  )}
                  
                  {rows.length > 0 && (
                    <tr className="font-bold" style={{ background: "#dde4f5", borderTop: "2px solid #C5CCB7" }}>
                      <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng Cộng:</td>
                      <td className={cellCls + " font-bold"}>{totalTC.toFixed(1)}</td>
                      <td className={cellCls + " font-bold"}>{totalTiet}</td>
                      <td className={cellCls + " font-bold"}>{totalTcHocPhi.toFixed(2)}</td>
                      <td className={cellCls + " font-bold"}>{fmt(totalHocPhi)}</td>
                      <td className={cellCls + " font-bold"}>{fmt(totalGiam)}</td>
                      <td className={cellCls + " font-bold"}>{fmt(totalHoTro)}</td>
                      <td className={cellCls + " font-bold"} style={{ color: "var(--primary)" }}>{fmt(totalThucDong)}</td>
                      <td className={cellCls + " font-bold"}>{fmt(totalChiPhi)}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-6 py-3 shadow-sm">
              <span className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng số tiền phải đóng:</span>
              <span className="text-[17px] font-bold" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{fmt(totalThucDong)} VNĐ</span>
            </div>
            <p className="text-xs text-muted-foreground pr-1">Trạng thái/Cập nhật: {ngayCapNhat}</p>
          </div>
        </>
      )}
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
const COURSE_GROUP_MAP: Record<string, string> = {
  "BAA00004": "LL_CT", "BAA00101": "LL_CT", "BAA00012": "LL_CT",
  "BAA00005": "XH_TC",
  "MTH00005": "TN_BB", "MTH00006": "TN_BB", "MTH00007": "TN_BB",
  "MTH00008": "TN_BB", "MTH00009": "TN_BB", "MTH00058": "TN_BB", "MTH00057": "TN_BB",
  "PHY00005": "TN_TC1",
  "CSC00004": "TH_BB",
  "BAA00021": "GD_TC", "BAA00022": "GD_TC",
  "BAA00030": "GD_QP",
  "CSC10003": "CN_CS", "CSC10004": "CN_CS", "CSC10006": "CN_CS",
  "CSC10007": "CN_CS", "CSC10008": "CN_CS", "CSC10009": "CN_CS",
  "CSC10012": "CN_CS", "CSC10014": "CN_CS", "CSC14003": "CN_CS",
  "CSC10002": "CN_NG",
  "CSC10121": "CN_TD",
};

function fmtYear(y: string) {
  const [a, b] = y.split("-");
  return `20${a}-20${b}`;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>;
  const bg = score >= 8 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: bg, minWidth: 38 }}>
      {score.toFixed(1)}
    </span>
  );
}

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
  const [bonusScore, setBonusScore] = useState("");
  const [ccWeight,  setCcWeight]  = useState(10);
  const [gkWeight,  setGkWeight]  = useState(30);
  const [targetScoreStr, setTargetScoreStr] = useState("7.0");
  const targetScore10 = Math.min(10, Math.max(0, parseFloat(targetScoreStr) || 0));
  const [predictTarget, setPredictTarget] = useState<"cc" | "gk" | "ck">("ck");

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
  const bonusNum   = Math.min(parseFloat(bonusScore) || 0, 1);
  const hasAny     = ccScore !== "" || gkScore !== "" || ckScore !== "";
  const rawScore   = hasAny ? (ccNum * ccWeight + gkNum * gkWeight + ckNum * ckWeight) / 100 : null;
  const totalScore = rawScore !== null ? Math.min(10, rawScore + bonusNum) : null;
  const gpaEst     = totalScore !== null ? gpaFromScore(totalScore) : null;

  const adjustedTarget = Math.max(0, targetScore10 - bonusNum);
  const predWeight = predictTarget === "cc" ? ccWeight : predictTarget === "gk" ? gkWeight : ckWeight;
  const predContribOthers =
    predictTarget === "cc" ? gkNum * gkWeight + ckNum * ckWeight :
    predictTarget === "gk" ? ccNum * ccWeight + ckNum * ckWeight :
                             ccNum * ccWeight + gkNum * gkWeight;
  const predicted  = predWeight > 0 ? (adjustedTarget * 100 - predContribOthers) / predWeight : null;
  const feasible   = predicted !== null && predicted >= 0 && predicted <= 10;
  const weightSum  = ccWeight + gkWeight + ckWeight;

  const selectCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-[var(--input-background)]";
  const inputCls  = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary";

  // Build grouped course map
  const groupedCourses = new Map<string, typeof COURSE_DATA>();
  COURSE_DATA.forEach(c => {
    const grp = COURSE_GROUP_MAP[c.maMon];
    if (!grp) return;
    if (!groupedCourses.has(grp)) groupedCourses.set(grp, []);
    groupedCourses.get(grp)!.push(c);
  });

  const thCls = "px-3 py-2 text-left text-[11px] font-semibold border-b border-border";
  const tdCls = "px-3 py-2 text-[11px] border-b border-border";

  return (
    <div className="space-y-4">
      {/* ── Row 1: Thông tin chung + Nhóm học phần ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border overflow-hidden">
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
                  <td className="px-3 py-2 border-b border-border text-left font-medium leading-tight"
                    style={{ color: label === "Tổng TC tích lũy" ? "#11284D" : label === "Đủ ĐK tốt nghiệp" ? "#D5B370" : "#101A2C", fontWeight: label === "Tổng TC tích lũy" ? 700 : 500 }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-border overflow-hidden">
          <div className="px-4 py-2.5 text-xs font-bold text-white text-center" style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Nhóm học phần
          </div>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse", fontFamily: "'Inter', sans-serif" }}>
            <tbody>
              {CREDIT_GROUPS_DATA.filter(g => g.req > 0).map((g, i) => {
                const done = g.done >= g.req;
                return (
                  <tr key={g.code} style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }}>
                    <td className="px-3 py-2 text-foreground border-b border-border leading-tight">{g.name}</td>
                    <td className="px-3 py-2 border-b border-border text-right font-bold whitespace-nowrap" style={{ color: done ? "#22c55e" : "var(--primary)" }}>{g.done}/{g.req}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 2: Kết quả chi tiết (left) + Charts (right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Left: Kết quả chi tiết theo nhóm học phần */}
        <div className="bg-card border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 font-bold text-sm text-white flex-shrink-0 text-center" style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}>
            KẾT QUẢ CHI TIẾT THEO TỪNG NHÓM HỌC PHẦN
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            {CREDIT_GROUPS_DATA.filter(g => groupedCourses.has(g.code)).map(g => {
              const rows = groupedCourses.get(g.code)!;
              return (
                <div key={g.code} className="mb-0">
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#dde4f5" }}>
                    <span className="text-[12px] font-semibold" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{g.name}</span>
                    <span className="text-[11px]" style={{ color: "var(--primary)", opacity: 0.7, fontFamily: "'Inter', sans-serif" }}>(Tích lũy: {g.done}/{g.req})</span>
                  </div>
                  <table className="w-full" style={{ borderCollapse: "collapse", fontFamily: "'Inter', sans-serif" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th className={thCls} style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mã MH</th>
                        <th className={thCls} style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", width: "38%" }}>Tên MH</th>
                        <th className={`${thCls} text-center`} style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Số TC</th>
                        <th className={`${thCls} text-center`} style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Năm Học</th>
                        <th className={`${thCls} text-center`} style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>HK</th>
                        <th className={`${thCls} text-center`} style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c, ri) => (
                        <tr key={`${c.maMon}-${c.namHoc}-${c.hocKy}`} style={{ background: ri % 2 === 0 ? "#fff" : "#f8fafc" }}>
                          <td className={`${tdCls} font-mono text-muted-foreground`}>{c.maMon}</td>
                          <td className={`${tdCls} text-foreground`}>{c.tenMon || c.maMon}</td>
                          <td className={`${tdCls} text-center text-foreground`}>{c.soTC || "—"}</td>
                          <td className={`${tdCls} text-center text-muted-foreground`}>{fmtYear(c.namHoc)}</td>
                          <td className={`${tdCls} text-center text-muted-foreground`}>{c.hocKy}</td>
                          <td className={`${tdCls} text-center font-mono font-bold`}>{c.diem10 != null ? c.diem10.toFixed(1) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-3">
          <div className="bg-card border border-border p-4">
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

          <div className="bg-card border border-border p-4 overflow-hidden">
            <h3 className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>Chỉ số phù hợp chuyên ngành</h3>
            <p className="text-xs text-muted-foreground mb-2">Di chuột vào trục để xem chi tiết</p>
            {(() => {
              const GROUPS = [
                { label: ["Trí tuệ nhân tạo", "& KH Dữ liệu"], fullName: "Trí tuệ nhân tạo & Khoa học dữ liệu", score: 7.6, fullMark: 10,
                  specs: ["Khoa học máy tính", "Công nghệ tri thức", "Thị giác máy tính", "Khoa học dữ liệu"] },
                { label: ["Hệ thống & Mạng"], fullName: "Hệ thống & Mạng", score: 6.7, fullMark: 10,
                  specs: ["Mạng máy tính và Viễn thông", "(hướng An toàn thông tin)"] },
                { label: ["Phân tích &", "PT Phần mềm"], fullName: "Phân tích & Phát triển Phần mềm", score: 8.0, fullMark: 10,
                  specs: ["Công nghệ phần mềm", "Hệ thống thông tin"] },
                { label: ["Tổng quan", "& Ứng dụng rộng"], fullName: "Tổng quan & Ứng dụng rộng", score: 7.3, fullMark: 10,
                  specs: ["Công nghệ thông tin"] },
              ];
              const cx = 140, cy = 140, r = 88;
              const n = 4;
              // standard orientation: top / right / bottom / left
              const angles = GROUPS.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);
              const levels = [0.25, 0.5, 0.75, 1.0];
              const scorePts = GROUPS.map((d, i) => { const ratio = d.score / d.fullMark; return `${cx + r * ratio * Math.cos(angles[i])},${cy + r * ratio * Math.sin(angles[i])}`; }).join(" ");
              const dotPts = GROUPS.map((d, i) => { const ratio = d.score / d.fullMark; return { x: cx + r * ratio * Math.cos(angles[i]), y: cy + r * ratio * Math.sin(angles[i]) }; });
              const labelR = r + 24;
              const ttW = 162, ttPad = 8, ttLineH = 13;
              // scale ticks on top axis (i=0): 2.5, 5, 7.5, 10
              const ticks = levels.map(lvl => ({ lvl, val: Math.round(lvl * 10) }));

              return (
                <svg width="100%" viewBox="-100 -10 480 300" style={{ display: "block", width: "100%", maxWidth: "100%", margin: "0 auto", overflow: "hidden" }}>
                  <style>{`
                    .rg { cursor: pointer; }
                    .rg .rtt { display: none; }
                    .rg:hover .rtt { display: block; }
                    .rg:hover .rlbl { fill: #11284D; font-weight: 700; }
                    .rg:hover .rdot { r: 5; fill: #D5B370; }
                  `}</style>

                  {/* concentric circle grid */}
                  {levels.map((lvl, i) => (
                    <circle key={i} cx={cx} cy={cy} r={r * lvl} fill="none" stroke="#D1D5DB" strokeWidth={i === 3 ? 1.5 : 0.8} />
                  ))}
                  {/* axis lines */}
                  {GROUPS.map((_, i) => (
                    <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angles[i])} y2={cy + r * Math.sin(angles[i])} stroke="#9CA3AF" strokeWidth="1" />
                  ))}
                  {/* scale ticks on top axis */}
                  {ticks.map(({ lvl, val }) => (
                    <text key={val} x={cx + 4} y={cy - r * lvl + 3} fontSize="7.5" fill="#9CA3AF" fontFamily="Inter, sans-serif">{val}</text>
                  ))}

                  {/* score polygon */}
                  <polygon points={scorePts} fill="#11284D" fillOpacity="0.15" stroke="#11284D" strokeWidth="2" strokeLinejoin="round" />

                  {/* axis groups (hover) */}
                  {GROUPS.map((d, i) => {
                    const lx = cx + labelR * Math.cos(angles[i]);
                    const ly = cy + labelR * Math.sin(angles[i]);
                    const pt = dotPts[i];
                    const anchor = i === 1 ? "start" : i === 3 ? "end" : "middle";
                    const tw = 200;
                    const ttH = ttPad * 2 + 14 + 13 + d.specs.length * ttLineH + 4;
                    // all tooltips point inward toward chart center
                    let ttX = lx - tw / 2;
                    let ttY = ly + 6;
                    if (i === 0) { ttX = lx - tw / 2; ttY = ly + 4; }
                    if (i === 1) { ttX = lx - tw - 6; ttY = ly - ttH / 2; }
                    if (i === 2) { ttX = lx - tw / 2; ttY = ly - ttH - 4; }
                    if (i === 3) { ttX = lx + 6; ttY = ly - ttH / 2; }

                    return (
                      <g key={i} className="rg">
                        <circle cx={lx} cy={ly} r={26} fill="transparent" />
                        <circle className="rdot" cx={pt.x} cy={pt.y} r={3.5} fill="#11284D" />
                        <text className="rlbl" x={lx} y={ly - (d.label.length - 1) * 6} textAnchor={anchor} fontSize="9" fill="#4A5568" fontFamily="Inter, sans-serif">
                          {d.label.map((line, li) => (
                            <tspan key={li} x={lx} dy={li === 0 ? 0 : 12}>{line}</tspan>
                          ))}
                        </text>
                        <g className="rtt">
                          <rect x={ttX} y={ttY} width={tw} height={ttH} rx="5" fill="white" stroke="#C5CCB7" strokeWidth="1" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.14))" }} />
                          <text x={ttX + ttPad} y={ttY + ttPad + 10} fontSize="10" fontWeight="700" fill="#11284D" fontFamily="Inter, sans-serif">{d.fullName}</text>
                          <text x={ttX + ttPad} y={ttY + ttPad + 23} fontSize="9" fill="#D5B370" fontFamily="Inter, sans-serif" fontWeight="600">Điểm nhóm: {d.score.toFixed(1)} / {d.fullMark}</text>
                          <line x1={ttX + ttPad} y1={ttY + ttPad + 30} x2={ttX + tw - ttPad} y2={ttY + ttPad + 30} stroke="#EEE9E0" strokeWidth="1" />
                          {d.specs.map((s, si) => (
                            <text key={si} x={ttX + ttPad} y={ttY + ttPad + 43 + si * ttLineH} fontSize="8.5" fill="#374151" fontFamily="Inter, sans-serif">• {s}</text>
                          ))}
                        </g>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* ── Grade Predictor ── */}
          <div className="bg-card border border-border overflow-hidden">
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--primary)" }}>
              <BarChart2 className="w-4 h-4 text-white/70" />
              <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dự Đoán Điểm Số</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Row 1 – selectors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Năm học</label>
                  <select value={selYear} onChange={e => { setSelYear(e.target.value); const s = Array.from(new Set(COURSE_DATA.filter(c => c.namHoc === e.target.value).map(c => c.hocKy))).sort(); setSelSem(s[0]); }} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", background: "white" }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Học kỳ</label>
                  <select value={validSem} onChange={e => setSelSem(Number(e.target.value))} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", background: "white" }}>
                    {semsForYear.map(s => <option key={s} value={s}>HK {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Môn học</label>
                  <select value={validCourse} onChange={e => setSelCourse(e.target.value)} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", background: "white" }}>
                    {coursesInSem.map(c => <option key={c.maMon} value={c.maMon}>{c.tenMon || c.maMon}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 – score table */}
              <div className="border border-border overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: "#dde4f5" }}>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">Thành phần</th>
                      <th className="text-center px-3 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide w-[80px] border-l border-border">Tỉ lệ (%)</th>
                      <th className="text-center px-3 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide border-l border-border">Điểm (0–10)</th>
                      <th className="text-center px-3 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide w-[64px] border-l border-border whitespace-nowrap">Dự đoán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { key: "cc" as const, label: "Quá trình (CC)", score: ccScore, setScore: setCcScore, weight: ccWeight, setWeight: (v: number) => setCcWeight(Math.min(100, Math.max(0, v))), autoWeight: false },
                      { key: "gk" as const, label: "Giữa kỳ (GK)",  score: gkScore, setScore: setGkScore, weight: gkWeight, setWeight: (v: number) => setGkWeight(Math.min(100, Math.max(0, v))), autoWeight: false },
                      { key: "ck" as const, label: "Cuối kỳ (CK)",  score: ckScore, setScore: setCkScore, weight: ckWeight, setWeight: null, autoWeight: true },
                    ] as const).map((row, i) => {
                      const isPredicting = predictTarget === row.key;
                      return (
                        <tr key={row.key} style={{ background: i % 2 === 0 ? "#fff" : "#f1f5f9" }}>
                          <td className="px-3 py-2 font-medium text-foreground border-b border-border">{row.label}</td>
                          <td className="px-3 py-2 text-center border-b border-l border-border">
                            {row.autoWeight ? (
                              <span className="font-bold text-xs" style={{ color: ckWeight < 0 ? "#ef4444" : "#475569" }}>{ckWeight}%</span>
                            ) : (
                              <input type="number" min={0} max={100} step={5} value={row.weight}
                                onChange={e => (row as { setWeight: (v: number) => void }).setWeight(Number(e.target.value))}
                                className="w-14 border border-border px-1.5 py-1 text-xs text-center font-bold focus:outline-none focus:border-primary bg-white"
                                style={{ color: "var(--primary)" }} />
                            )}
                          </td>
                          <td className="px-3 py-2 text-center border-b border-l border-border">
                            <input type="number" min={0} max={10} step={0.1} value={row.score}
                              onChange={e => row.setScore(e.target.value)}
                              placeholder={isPredicting ? "để trống" : "0–10"}
                              className={`w-20 border px-1.5 py-1 text-xs text-center focus:outline-none focus:border-primary bg-white ${isPredicting ? "border-dashed border-primary/50 text-muted-foreground" : "border-border"}`} />
                          </td>
                          <td className="px-3 py-2 text-center border-b border-l border-border">
                            <button onClick={() => setPredictTarget(row.key)}
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto transition-colors"
                              style={{ borderColor: isPredicting ? "var(--primary)" : "#ccc", background: "#fff" }}
                              title={`Dự đoán điểm ${row.label}`}>
                              {isPredicting && <span className="w-2.5 h-2.5 rounded-full block" style={{ background: "var(--primary)" }} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Bonus row */}
                    <tr style={{ background: "#f1f5f9" }}>
                      <td className="px-3 py-2 font-medium text-foreground border-b border-border">Điểm cộng</td>
                      <td className="px-3 py-2 text-center text-[10px] text-muted-foreground border-b border-l border-border">10%</td>
                      <td className="px-3 py-2 text-center border-b border-l border-border">
                        <input type="number" min={0} max={1} step={0.1} value={bonusScore}
                          onChange={e => setBonusScore(e.target.value)} placeholder="0–1"
                          className="w-20 border border-border px-1.5 py-1 text-xs text-center focus:outline-none focus:border-primary bg-white" />
                      </td>
                      <td className="px-3 py-2 border-b border-l border-border" />
                    </tr>
                  </tbody>
                </table>
                {weightSum !== 100 && (
                  <div className="px-3 py-1.5 border-t border-amber-200" style={{ background: "#fffbeb" }}>
                    <span className="text-[10px] font-semibold text-amber-600">
                      Tổng tỉ lệ: {weightSum}% {weightSum > 100 ? "(vượt 100%)" : `(thiếu ${100 - weightSum}%)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 3 – two result panels side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Left: total score calculator */}
                <div className="border border-border p-3 flex flex-col gap-1.5" style={{ background: "#dde4f5" }}>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">Điểm tổng kết</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold leading-none" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {ccScore !== "" && gkScore !== "" && ckScore !== "" && totalScore !== null
                        ? totalScore.toFixed(2) : "—"}
                    </span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {ccScore === "" || gkScore === "" || ckScore === ""
                      ? "Nhập đủ CC + GK + CK để xem kết quả"
                      : "Đã tính đủ 3 thành phần"}
                  </p>
                </div>

                {/* Right: prediction */}
                <div className="border border-border p-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Dự đoán điểm</div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-muted-foreground whitespace-nowrap">Mục tiêu:</label>
                    <input type="number" min={0} max={10} step={0.1} value={targetScoreStr}
                      onChange={e => setTargetScoreStr(e.target.value)}
                      placeholder="0–10"
                      className="flex-1 border border-border px-2 py-1 text-xs text-center font-bold focus:outline-none focus:border-primary bg-white" style={{ color: "var(--primary)" }} />
                  </div>
                  <hr className="border-border" />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      Cần {predictTarget === "cc" ? "QT" : predictTarget === "gk" ? "GK" : "CK"}:
                    </span>
                    {predWeight <= 0 ? (
                      <span className="text-[10px] text-muted-foreground">Tỉ lệ = 0%</span>
                    ) : predicted !== null ? (
                      feasible ? (
                        <>
                          <span className="text-base font-bold leading-none" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{predicted.toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground">/10</span>
                        </>
                      ) : (
                        <span className="text-[12px] font-semibold" style={{ color: "#ef4444" }}>{predicted < 0 ? " Đã đủ điểm" : " Không khả thi"}</span>
                      )
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Nhập điểm còn lại</span>
                    )}
                  </div>
                </div>
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
export function ProfileSection({ avatarUrl, onAvatarChange, onProfileSave }: { avatarUrl: string | null; onAvatarChange: (url: string) => void; onProfileSave?: (p: typeof STUDENT_PROFILE) => void }) {
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
    fetch(`/api/students/${currentMssv}`)
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

  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  
  const REQUIRED_FIELDS = new Set(["cccd", "issuedDate", "issuedPlace", "phone", "personalEmail"]);

async function handleSave() {
    // 1. Kiểm tra validate các trường bắt buộc (từ hàm cũ)
    const newErrors = new Set<string>();
    REQUIRED_FIELDS.forEach(key => {
      if (!draft[key as keyof typeof draft]?.toString().trim()) {
        newErrors.add(key);
      }
    });

    // Nếu có lỗi thì hiển thị lỗi và dừng lại
    if (newErrors.size > 0) { 
      setFieldErrors(newErrors); 
      return; 
    }
    
    // Nếu không có lỗi, xóa các lỗi cũ đi
    setFieldErrors(new Set());

    // 2. Gọi API để cập nhật dữ liệu (từ hàm mới)
    try {
      const res = await fetch(`/api/students/${currentMssv}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAddress: draft.currentAddress,
          phone: draft.phone,
          personalEmail: draft.personalEmail
        })
      });

      // 3. Xử lý kết quả trả về
      if (res.ok) {
        // Cập nhật state và UI nếu API thành công (kết hợp cả 2 hàm)
        const updated = { ...draft };
        setSaved(updated);
        onProfileSave?.(updated); // Giữ lại callback của hàm cũ
        setIsEditing(false);
      } else {
        alert("Lỗi cập nhật từ Backend.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối đến máy chủ.");
    }
  }

  function handleCancel() { setDraft({ ...saved }); setFieldErrors(new Set()); setIsEditing(false); }
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
  function EField({ label, fieldKey, readOnly = false }: { label: string; fieldKey: keyof typeof draft; readOnly?: boolean }) {
    const value = saved[fieldKey] as string;
    const isRequired = REQUIRED_FIELDS.has(fieldKey as string);
    const hasError = fieldErrors.has(fieldKey as string);
    if (!isEditing || readOnly) {
      return (
        <div>
          <div className="text-xs text-muted-foreground mb-1">{label}</div>
          <div className="text-sm font-medium text-foreground">{value || "—"}</div>
        </div>
      );
    }
    return (
      <div>
        <div className="text-xs text-muted-foreground mb-1">
          {label}{isRequired && <span style={{ color: "#dc2626" }}> *</span>}
        </div>
        <input value={draft[fieldKey] as string}
          onChange={e => {
            setDraft((prev: any) => ({ ...prev, [fieldKey]: e.target.value }));
            if (e.target.value.trim()) setFieldErrors((prev: Set<string>) => { const s = new Set(prev); s.delete(fieldKey as string); return s; });
          }}
          className="w-full rounded-lg px-2 py-1.5 text-sm outline-none transition-colors"
          style={{
            border: hasError ? "1.5px solid #dc2626" : "1px solid #C5CCB7",
            boxShadow: hasError ? "0 0 0 2px rgba(220,38,38,0.1)" : undefined,
            fontFamily: "'Inter', sans-serif", color: "var(--foreground)",
          }} />
        {hasError && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>Không được để trống</p>}
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border" style={{ background: "#11284D" }}>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin chung</h2>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-4">
          {/* Col 1: avatar + tên */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4" style={{ borderColor: "var(--primary)" }} />
                : <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center border-4 font-bold"
                    style={{ borderColor: "var(--primary)", background: "rgba(37,52,79,0.08)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: saved.fullName.trim().split(/\s+/).length >= 4 ? "13px" : "16px" }}>
                    {getAvatarInitials(saved.fullName)}
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
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{saved.fullName}</div>
              <div className="text-xs text-muted-foreground">{saved.role}</div>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: "var(--accent)" }}>{saved.status}</span>
            </div>
          </div>
          {/* Cols 2-4: fields, 3 per row */}
          <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 sm:gap-y-4">
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
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors hover:opacity-80"
                style={{ background: "rgba(37,52,79,0.1)", borderColor: "rgba(37,52,79,0.2)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 16L8.5 15 16.5 7a1.414 1.414 0 0 0-2-2L6.5 13 4 16z" />
                </svg>
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="px-5 py-2 text-xs font-medium" style={{ background: "rgba(37,52,79,0.1)", color: "var(--primary)", borderBottom: "1px solid #C5CCB7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Đang ở chế độ chỉnh sửa — nhấn <strong>Lưu</strong> để xác nhận hoặc <strong>Hủy</strong> để thoát.
          </div>
        )}
        {innerTab === "personal" && (
          <div className="p-5 space-y-6 [&_.text-sm]:text-[11.5px] [&_.text-xs]:text-[10px]">
            {isEditing && fieldErrors.size > 0 && (
              <div className="px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                Vui lòng điền đầy đủ các trường bắt buộc (đánh dấu <strong>&nbsp;*&nbsp;</strong>)
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CCCD / Giấy tờ tùy thân</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                <EField label="Số CCCD"    fieldKey="cccd" />
                <EField label="Ngày cấp"  fieldKey="issuedDate" />
                <EField label="Nơi cấp"   fieldKey="issuedPlace" />
                <EField label="Quốc tịch" fieldKey="nationality" readOnly />
                <EField label="Dân tộc"   fieldKey="ethnic" />
                <EField label="Tôn giáo"  fieldKey="religion" />
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
                <EField label="Tên người liên hệ"   fieldKey="advisor" />
                <EField label="SĐT người liên hệ"   fieldKey="advisorPhone" />
                <EField label="Email người liên hệ" fieldKey="advisorEmail" />
                <EField label="Quan hệ"             fieldKey="advisorRelation" />
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
        {innerTab === "family" && (
          <FamilyTab 
            mssv={currentMssv} 
            initialMembers={saved.family || []} 
            onUpdateSuccess={(updatedMember) => {
              // Đồng bộ lại state chính của Profile
              setSaved((prev: any) => ({
                ...prev,
                family: prev.family.map((m: any) => m.id === updatedMember.id ? updatedMember : m)
              }));
            }} 
          />
        )}
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

function ratingColor(n: number) {
  return n === 1 ? "#E8384D" : n === 2 ? "#F4703A" : n === 3 ? "#F9C02B" : n === 4 ? "#2ABDA8" : "#4BC06B";
}

type CourseResponse = { 
  rating: number | null; 
  detailed: boolean; 
  comment: string 
};

function SurveyForm({ survey, isReadOnly, onDone }: { survey: any; isReadOnly?: boolean; onDone: (id: string) => void }) {
  const { accounts } = useMsal();
  const currentMssv = accounts[0]?.username ? accounts[0].username.split('@')[0] : "24127158";
  
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, CourseResponse>>({});

  // Khởi tạo responses, hỗ trợ load lại dữ liệu cũ nếu backend trả về (c.rating, c.comment)
  useEffect(() => {
    if (survey && survey.courses) {
      setResponses(
        Object.fromEntries(survey.courses.map((c: any) => [
          c.id, 
          { 
            rating: c.rating ?? null, // Lấy rating cũ (nếu có)
            detailed: false, 
            comment: c.comment ?? ""  // Lấy comment cũ (nếu có)
          }
        ]))
      );
    }
  }, [survey]);

  const setRating   = (id: string, v: number)  => setResponses(p => ({ ...p, [id]: { ...p[id], rating: v } }));
  const setDetailed = (id: string, v: boolean) => setResponses(p => ({ ...p, [id]: { ...p[id], detailed: v } }));
  const setComment  = (id: string, v: string)  => setResponses(p => ({ ...p, [id]: { ...p[id], comment: v } }));
  
  const allRated = survey.courses && survey.courses.length > 0 && survey.courses.every((c: any) => responses[c.id]?.rating !== null);

  const handleSubmit = async () => {
    if (!allRated || isReadOnly) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/students/${currentMssv}/surveys/${survey.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Lỗi khi gửi khảo sát.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Lỗi kết nối server.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between" style={{ background: "var(--primary)" }}>
          <h2 className="text-sm sm:text-base font-bold text-white leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{survey.title}</h2>
          {isReadOnly && (
            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full whitespace-nowrap">
              Bản xem trước
            </span>
          )}
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
      {survey.courses.map((course: any, idx: number) => {
        const res = responses[course.id] || { rating: null, comment: "" };
        const rated = res.rating !== null;
        return (
          <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden">
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
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>Đánh giá chung về môn học và giảng viên</p>
                  <div className="flex gap-2 sm:gap-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} 
                        onClick={() => {
                          if (isReadOnly) return; // Chặn click nếu đang ở chế độ xem
                          setRating(course.id, n); 
                          setDetailed(course.id, false); 
                        }} 
                        title={RATING_LABELS[n]}
                        className={`flex-1 sm:flex-none sm:w-11 sm:h-11 aspect-square rounded-full text-sm font-bold border-2 transition-all ${isReadOnly ? "cursor-default opacity-90" : "active:scale-95"}`}
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

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Góp ý thêm (không bắt buộc)</p>
                <textarea 
                  value={res.comment} 
                  onChange={e => setComment(course.id, e.target.value)}
                  readOnly={isReadOnly} // Khóa text area
                  placeholder={isReadOnly ? "Không có góp ý." : "Ý kiến của bạn về môn học, giảng viên..."} 
                  rows={3}
                  className={`w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-colors ${isReadOnly ? "bg-gray-50 focus:border-border cursor-default text-muted-foreground" : "focus:border-primary text-foreground"}`}
                  style={{ fontFamily: "'Inter', sans-serif" }} />
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Submit row (Ẩn hoàn toàn nếu isReadOnly) ── */}
      {!isReadOnly && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-4">
          {!allRated && (
            <p className="text-xs text-amber-600 font-medium px-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Vui lòng đánh giá tất cả {survey.courses.length} môn học trước khi gửi.
            </p>
          )}
          <button disabled={!allRated || isSubmitting} onClick={handleSubmit}
            className="sm:ml-auto px-7 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: allRated ? "#11284D" : "#C5CCB7", cursor: allRated ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      )}
    </div>
  );
}

export function SurveySection({ onDone }: { onDone?: () => void }) {
  const { accounts } = useMsal();
  const currentMssv = accounts[0]?.username ? accounts[0].username.split('@')[0] : "24127158";

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/students/${currentMssv}/surveys`)
      .then(res => res.json())
      .then(resData => {
        if (resData.status === "success" && resData.data) {
          setSurveys(resData.data);
          const doneIds = resData.data
            .filter((s: any) => s.status === "completed")
            .map((s: any) => s.id);
          setCompletedIds(new Set(doneIds));
          
          // Chỉ tự động mở form nếu có đúng 1 khảo sát VÀ nó chưa được hoàn thành
          if (resData.data.length === 1 && resData.data[0].status !== "completed") {
            setSelectedId(resData.data[0].id);
          }
        }
      })
      .catch(err => console.error("Fetch surveys error:", err))
      .finally(() => setLoading(false));
  }, [currentMssv]);

  const selected = surveys.find(s => s.id === selectedId) ?? null;
  const isSelectedDone = selected ? completedIds.has(selected.id) : false;

  function handleDone(id: string) {
    setCompletedIds(prev => new Set([...prev, id]));
    // Cập nhật trạng thái local
    setSurveys(prev => prev.map(s => s.id === id ? { ...s, status: "completed" } : s));
    setSelectedId(null);
    if (onDone) onDone();
  }

  if (loading) {
    return (
      <div className="w-full py-20 text-center text-sm text-muted-foreground">
        Đang tải danh sách khảo sát...
      </div>
    );
  }

  if (surveys.length === 0) {
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

  if (!selected) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div>
          <h2 className="text-base font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>Danh sách khảo sát</h2>
          <p className="text-xs text-muted-foreground">Chọn một khảo sát để bắt đầu hoặc xem lại.</p>
        </div>
        {surveys.map(sv => {
          const done = completedIds.has(sv.id);
          return (
            <button key={sv.id} 
              onClick={() => setSelectedId(sv.id)} // LUÔN CHO PHÉP CLICK VÀO KỂ CẢ KHI ĐÃ XONG
              className="w-full text-left bg-card rounded-2xl border overflow-hidden transition-colors group hover:border-primary"
              style={{ borderColor: done ? "#22c55e" : "var(--border)" }}>
              <div className="h-1" style={{ background: done ? "#22c55e" : "var(--primary)" }} />
              <div className="px-5 py-4">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sv.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{sv.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{sv.courses.length} môn học / câu hỏi</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: done ? "#22c55e" : "var(--accent)" }}>
                    {done ? "Đã Hoàn thành" : `Hạn: ${sv.deadline}`}
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
      {/* Nút quay lại luôn được hiển thị khi đang trong chế độ form */}
      <button onClick={() => setSelectedId(null)}
        className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
        style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Quay lại danh sách khảo sát
      </button>
      
      {/* Truyền cờ isReadOnly xuống SurveyForm nếu đã hoàn thành */}
      <SurveyForm survey={selected} isReadOnly={isSelectedDone} onDone={handleDone} />
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
                  <tr key={i} className="hover:bg-blue-100/60 transition-colors" style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }}>
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
export function NotificationsSection({ onRead }: { onRead?: () => void }) {
  const { accounts } = useMsal();
  const currentMssv = accounts[0]?.username ? accounts[0].username.split('@')[0] : "24127158";

  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selKhoa, setSelKhoa] = useState<string[]>([]);
  const [selPhong, setSelPhong] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  // Gọi API lấy dữ liệu thông báo thật
  useEffect(() => {
    fetch(`/api/students/${currentMssv}/notifications`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setNotifs(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi khi tải thông báo:", err);
        setLoading(false);
      });
  }, [currentMssv]);

  // Click ra ngoài để đóng filter popup
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Xử lý Click mở thông báo & Đánh dấu đã đọc xuống Backend
  const handleNotifClick = async (n: any) => {
    setSelectedNotif(n);
    if (n.trangThaiDoc === 0) {
      try {
        const res = await fetch(`/api/students/${currentMssv}/notifications/${n.maTb}/read`, { method: 'POST' });
        if (res.ok) {
          setNotifs(prev => prev.map(item => 
            item.maTb === n.maTb ? { ...item, trangThaiDoc: 1 } : item
          ));
          if (onRead) onRead();
        }
      } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
      }
    }
  };

  // Trích xuất list Khoa/Phòng để làm Bộ Lọc Động
  const ALL_KHOA  = Array.from(new Set(notifs.map(n => n.khoa).filter(Boolean))).sort() as string[];
  const ALL_PHONG = Array.from(new Set(notifs.map(n => n.phong).filter(Boolean))).sort() as string[];

  function toggleKhoa(v: string) { setSelKhoa(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }
  function togglePhong(v: string) { setSelPhong(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]); }
  function clearAll() { setSelKhoa([]); setSelPhong([]); }
  const activeCount = selKhoa.length + selPhong.length;

  const filtered = notifs.filter(n => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || n.tieuDe.toLowerCase().includes(q) || n.noiDung.toLowerCase().includes(q);
    const matchKhoa   = selKhoa.length === 0  || (n.khoa  && selKhoa.includes(n.khoa));
    const matchPhong  = selPhong.length === 0 || (n.phong && selPhong.includes(n.phong));
    return matchSearch && matchKhoa && matchPhong;
  });

  function NotifTags({ n }: { n: any }) {
    return (
      <div className="flex gap-1 flex-wrap mt-0.5">
        {n.khoa  && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#E0D8C4", color: "var(--primary)" }}>{n.khoa}</span>}
        {n.phong && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#fdf4ff", color: "#7c3aed" }}>{n.phong}</span>}
      </div>
    );
  }

  if (loading) {
    return <div className="p-5 text-center text-muted-foreground text-sm font-medium">Đang tải thông báo...</div>;
  }

  // --- Màn hình chi tiết ---
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
            </div>
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedNotif.tieuDe}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedNotif.ngayDang}</p>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{selectedNotif.noiDung}</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Màn hình danh sách ---
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông báo</h1>
        <span className="text-xs text-muted-foreground">{filtered.length}/{notifs.length} thông báo</span>
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
              
              {ALL_KHOA.length > 0 && (
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
                        <span className="ml-auto text-[11px] text-muted-foreground">{notifs.filter(n => n.khoa === k).length}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {ALL_KHOA.length > 0 && ALL_PHONG.length > 0 && <div className="mx-4 h-px bg-border" />}
              
              {ALL_PHONG.length > 0 && (
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
                        <span className="ml-auto text-[11px] text-muted-foreground">{notifs.filter(n => n.phong === p).length}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
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
              const isUnread = n.trangThaiDoc === 0;
              return (
              <div key={n.maTb} onClick={() => handleNotifClick(n)}
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
                  <p className={`text-sm mb-0.5 ${isUnread ? "font-bold text-foreground" : "font-normal text-muted-foreground"}`}>{n.tieuDe}</p>
                  <NotifTags n={n} />
                  <p className="text-xs text-muted-foreground truncate mt-1">{n.noiDung}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.ngayDang}</p>
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
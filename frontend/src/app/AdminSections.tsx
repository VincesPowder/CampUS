import React, { useState, useRef, useEffect } from "react";
import {
  User, BookOpen, ClipboardList, CalendarDays, CreditCard, Bell,
  ChevronRight, LogOut, X, ChevronsLeft, ChevronsRight,
  CheckCircle2, Search, Filter, Download, Upload, Plus, Pencil, Eye, EyeOff,
  Users, BarChart2, Shield, Trash2, Check,
  ArrowLeft, Lock, RotateCcw, Edit2,
} from "lucide-react";
import {
  TKBCellCard, TKBEntry, TKBCell, ExamEntry, TKB_DATA, EXAM_DATA, DAYS, CA_LABELS,
  HINH_THUC_STYLE, getWeekDates, HinhThuc, SidebarLogo, TKBWeekGrid,
  getInitials, abbreviateName,
} from "./shared";
import type { Account } from "../data/mockData";
import {
  NOTIFICATIONS, ADMIN_STUDENTS, TUITION_DATA, FAMILY_DATA,
  type AdminStudent, type Notification, type FamilyMember,
  KHOA_LIST, MOCK_ADMIN_SURVEYS, MOCK_RESULTS, ACADEMIC_COURSES, makeMockGrades,
  CNTT_TKB, LOP_INFO,
  ACADEMIC_YEARS, type AcademicYear,
  type AdminSurveyItem, type SurveyQuestion, type QuestionType,
  type GradeStatus, type AdminCourseItem, type StudentGradeRow,
  EXAM_STATUS_COLORS, GRADE_EDIT_REASONS, NOTIF_KHOA_OPTS, NOTIF_PHONG_OPTS, TUITION_HK_LIST,
} from "../data/mockData";

export const getAdminEmail = () => {
  return (
    localStorage.getItem("user_email") ||
    localStorage.getItem("email") ||
    sessionStorage.getItem("user_email") ||
    (window as any).__CURRENT_ADMIN_EMAIL__ ||
    "24127262@student.hcmus.edu.vn"
  );
};

export const adminFetch = (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  headers.set("X-Admin-Email", getAdminEmail());
  return fetch(url, { ...options, headers });
};

// ─── Admin: Student Detail / Edit Modal ──────────────────────────────────────
type StudentModalMode = "view" | "edit";

type GlobalEditPerm = {
  enabled: boolean;
  from: string;
  to: string;
  nganhs: string[];
  khoas: string[];
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-border"
      style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {title}
    </div>
  );
}

function MField({ label, value, editable, onChange }: {
  label: string; value: string; editable?: boolean; onChange?: (v: string) => void;
}) {
  const inputCls = "w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-background transition-colors";
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
      {editable && onChange
        ? <input value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
        : <div className="text-sm font-medium text-foreground">{value || "—"}</div>}
    </div>
  );
}

function StudentModal({ student, mode: initMode, onClose, onSave }: {
  student: any;
  mode: StudentModalMode;
  onClose: () => void;
  onSave: (updated: any) => void;
}) {
  const [mode, setMode] = useState<StudentModalMode>(initMode);
  const [form, setForm] = useState<any>({ ...student });
  const [activeTab, setActiveTab] = useState<"info" | "family">("info");
  const [familyData, setFamilyData] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  useEffect(() => {
  if (student?.mssv) {
    setLoading(true);
    adminFetch(`/api/admin/students/${student.mssv}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setForm(data.data);
          setFamilyData(data.data.family || []);
        }
      })
      .catch(err => console.error("Lỗi fetch chi tiết sinh viên:", err))
      .finally(() => setLoading(false));
  }
}, [student?.mssv]);

  const editableFields: { label: string; key: string }[] = [
    { label: "Họ và tên",    key: "hoTen" },
    { label: "MSSV",         key: "mssv" },
    { label: "Email",        key: "email" },
    { label: "Giới tính",    key: "gioiTinh" },
    { label: "Khoá",         key: "khoa" },
    { label: "Khoa/Ngành",   key: "nganh" },
    { label: "Bậc đào tạo",  key: "bacDT" },
    { label: "Loại đào tạo", key: "loaiDT" },
    { label: "Chuyên ngành", key: "chuyenNganh" },
  ];

  const handleSaveChanges = async () => {
  try {
    const payload = {
      ...form,
      family: familyData
    };
    const res = await adminFetch(`/api/admin/students/${student.mssv}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === "success") {
      onSave(payload);
      setMode("view");
    } else {
      alert(data.message || "Lỗi lưu dữ liệu.");
    }
  } catch (e) {
    console.error(e);
    alert("Không thể kết nối đến máy chủ.");
  }
};

  const handleAddFamilyMember = () => {
    setFamilyData(prev => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        dob: "",
        rel: "Cha",
        job: "",
        workplace: "",
        phone: "",
        email: "",
        ethnic: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        address: ""
      } as any
    ]);
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyData(prev => prev.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: "info"   as const, label: "Hồ sơ sinh viên" },
    { id: "family" as const, label: "Thông tin gia đình" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0" style={{ background: "var(--primary)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 bg-white/15 text-white" style={PJS}>
            {form.hoTen ? form.hoTen.split(" ").slice(-1)[0][0] : "S"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base leading-tight" style={PJS}>{form.hoTen}</div>
            <div className="text-white/60 text-xs font-mono mt-0.5">{form.mssv} · {form.nganh}</div>
          </div>
          <div className="flex gap-2">
            {mode === "view" && (
              <button onClick={() => setMode("edit")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors" style={PJS}>
                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0 bg-card px-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); }}
              className="py-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors"
              style={{
                borderColor: activeTab === t.id ? "var(--primary)" : "transparent",
                color: activeTab === t.id ? "var(--primary)" : "var(--muted-foreground)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Avatar + quick info */}
              <div className="flex items-center gap-4 pb-5 border-b border-border">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "var(--primary)", ...PJS }}>
                  {form.hoTen ? form.hoTen.split(" ").slice(-1)[0][0] : "S"}
                </div>
                <div>
                  <div className="font-bold text-foreground text-base" style={PJS}>{form.hoTen}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{form.nganh} · {form.bacDT}</div>
                  <div className="mt-1.5 flex gap-2 flex-wrap">
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700" style={PJS}>Đang học</span>
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{form.loaiDT}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin học tập */}
              <div>
                <SectionHeader title="Thông tin học tập" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {editableFields.map(f => (
                    <MField key={f.key} label={f.label}
                      value={form[f.key]}
                      editable={mode === "edit" && f.key !== "mssv"}
                      onChange={v => setForm((p: any) => ({ ...p, [f.key]: v }))} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="Thông tin cá nhân" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: "Ngày sinh (dd/mm/yyyy)", key: "ngaySinh" },
                    { label: "Nơi sinh",      key: "noiSinh" },
                    { label: "CCCD",          key: "cccd" },
                    { label: "Ngày cấp",      key: "ngayCap" },
                    { label: "Nơi cấp",       key: "noiCap" },
                    { label: "Quốc tịch",     key: "quocTich" },
                    { label: "Dân tộc",       key: "danToc" },
                    { label: "Tôn giáo",      key: "tonGiao" },
                    { label: "Số điện thoại", key: "sdt" },
                  ].map(r => (
                    <MField key={r.key} label={r.label} value={form[r.key] || ""} editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, [r.key]: v }))} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="Địa chỉ" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: "Địa chỉ thường trú", key: "thuongTru" },
                    { label: "Địa chỉ hiện nay",   key: "hienNay" },
                    { label: "Địa chỉ liên lạc",   key: "lienLac" },
                  ].map(r => (
                    <MField key={r.key} label={r.label} value={form[r.key] || ""} editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, [r.key]: v }))} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="Thông tin liên hệ" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    { label: "Email cá nhân",    key: "personalEmail" },
                    { label: "Email chính thức", key: "email" },
                    { label: "Ngày vào trường",  key: "ngayVaoTruong" },
                    { label: "Ngày vào Đoàn",    key: "ngayVaoDoan" },
                    { label: "Ngày vào Đảng",    key: "ngayVaoDang" },
                  ].map(r => (
                    <MField key={r.key} label={r.label} value={form[r.key] || ""} editable={mode === "edit" && r.key !== "email"} onChange={v => setForm((p: any) => ({ ...p, [r.key]: v }))} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="Thông tin người liên lạc" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <MField label="Tên người liên hệ"   value={form.cvTen || ""}   editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, cvTen: v }))} />
                  <MField label="SĐT người liên hệ"   value={form.cvSdt || ""}   editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, cvSdt: v }))} />
                  <MField label="Email người liên hệ" value={form.cvEmail || ""} editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, cvEmail: v }))} />
                  <MField label="Quan hệ"             value={form.cvQuanHe || ""} editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, cvQuanHe: v }))} />
                </div>
              </div>

              <div>
                <SectionHeader title="Tài khoản ngân hàng" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <MField label="Ngân hàng"     value={form.nganHang || ""} editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, nganHang: v }))} />
                  <MField label="Số tài khoản"  value={form.stk || ""}      editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, stk: v }))} />
                  <MField label="Chi nhánh"     value={form.chiNhanh || ""} editable={mode === "edit"} onChange={v => setForm((p: any) => ({ ...p, chiNhanh: v }))} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "family" && (
            <div className="space-y-4">
              {mode === "edit" && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleAddFamilyMember}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:opacity-90 transition-opacity"
                    style={PJS}
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm người thân
                  </button>
                </div>
              )}
              {familyData.map((m, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-border" style={{ background: "rgba(37,52,79,0.06)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--primary)" }}>
                        {m.name ? m.name[0] : "?"}
                      </div>
                      <span className="font-semibold text-sm text-foreground" style={PJS}>{m.name || "Chưa có tên"}</span>
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m.rel}</span>
                    </div>
                    {mode === "edit" && (
                      <button
                        onClick={() => handleRemoveFamilyMember(i)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        title="Xóa người thân này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                    {[
                      { label: "Họ và tên",     key: "name" },
                      { label: "Quan hệ",       key: "rel" },
                      { label: "Năm sinh",      key: "dob" },
                      { label: "Nghề nghiệp",   key: "job" },
                      { label: "Nơi làm việc",  key: "workplace" },
                      { label: "Số điện thoại", key: "phone" },
                      { label: "Email",         key: "email" },
                      { label: "Dân tộc",       key: "ethnic" },
                      { label: "Tôn giáo",      key: "religion" },
                      { label: "Quốc tịch",     key: "nationality" },
                      { label: "Địa chỉ",       key: "address" },
                    ].map(r => (
                      <MField key={r.key} label={r.label} value={String((m as any)[r.key] ?? "")}
                        editable={mode === "edit"}
                        onChange={v => setFamilyData(prev => prev.map((mem, mi) => mi === i ? { ...mem, [r.key]: v } : mem))} />
                    ))}
                  </div>
                </div>
              ))}
              {familyData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">Chưa có thông tin gia đình trong hệ thống.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "edit" && (
          <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <button onClick={() => { setForm({ ...student }); setMode("view"); }}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors" style={PJS}>Huỷ</button>
            <button onClick={handleSaveChanges}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>Lưu thay đổi</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin: Add Student Modal ────────────────────────────────────────────────
function AddStudentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: any) => void }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER = { fontFamily: "'Inter', sans-serif" };
  const blank = { hoTen: "", mssv: "", email: "", gioiTinh: "Nam", khoa: "2024", nganh: "Khoa học máy tính", bacDT: "Đại học", loaiDT: "Chính quy", chuyenNganh: "" };
  const [draft, setDraft] = useState<any>(blank);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fields: { label: string; key: string; required?: boolean; span2?: boolean }[] = [
    { label: "Họ và tên",    key: "hoTen",       required: true,  span2: true },
    { label: "MSSV",         key: "mssv",        required: true },
    { label: "Email",        key: "email",       required: false, span2: true },
    { label: "Giới tính",    key: "gioiTinh" },
    { label: "Khoá",         key: "khoa" },
    { label: "Khoa/Ngành",   key: "nganh",       required: true },
    { label: "Bậc đào tạo",  key: "bacDT" },
    { label: "Loại đào tạo", key: "loaiDT" },
    { label: "Chuyên ngành", key: "chuyenNganh", span2: true },
  ];

  async function handleSave() {
    const errs = new Set<string>();
    fields.filter(f => f.required).forEach(f => { if (!draft[f.key]) errs.add(f.key); });
    if (errs.size > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (data.status === 'success') {
        onAdd(draft);
        onClose();
      } else {
        alert(data.message || "Không thể thêm sinh viên.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (key: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background transition-colors ${errors.has(key) ? "border-red-400 ring-1 ring-red-300" : "border-border"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ background: "var(--primary)" }}>
          <div>
            <div className="font-bold text-white text-base" style={PJS}>Thêm sinh viên mới</div>
            <div className="text-white/60 text-xs mt-0.5" style={INTER}>Điền đầy đủ thông tin bên dưới</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {fields.map(f => (
              <div key={f.key} className={f.span2 ? "col-span-2" : ""}>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5" style={PJS}>
                  {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <input
                  value={draft[f.key]}
                  onChange={e => { setDraft((p: any) => ({ ...p, [f.key]: e.target.value })); setErrors(p => { const n = new Set(p); n.delete(f.key); return n; }); }}
                  className={inputCls(f.key)}
                  style={INTER}
                  placeholder={f.required ? `Nhập ${f.label.toLowerCase()}...` : ""}
                />
                {errors.has(f.key) && <p className="text-red-400 text-[11px] mt-1">Trường này là bắt buộc</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors" style={PJS}>Huỷ</button>
          <button onClick={handleSave} disabled={submitting} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "var(--primary)", ...PJS }}>
            {submitting ? "Đang thêm..." : "Thêm sinh viên"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Student Management ───────────────────────────────────────────────
function StudentManagement() {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{ khoa: string; nganh: string; bacDT: string; loaiDT: string }>({
    khoa: "", nganh: "", bacDT: "", loaiDT: "",
  });
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ student: any; mode: StudentModalMode } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [permOpen, setPermOpen] = useState(false);
  const [globalPerm, setGlobalPerm] = useState<GlobalEditPerm>({
    enabled: false, from: "", to: "", nganhs: [], khoas: [],
  });

  // 1. Fetch danh sách sinh viên từ backend
  const fetchStudents = async () => {
  setLoading(true);
  try {
    const res = await adminFetch('/api/admin/students'); // Thay fetch -> adminFetch
    const data = await res.json();
    if (data.status === 'success') setStudents(data.data);
  } catch (e) {
    console.error("Lỗi fetch sinh viên:", e);
  } finally {
    setLoading(false);
  }
};

  // 2. Fetch trạng thái quyền chỉnh sửa hồ sơ
  const fetchPermission = async () => {
    try {
      const res = await adminFetch('/api/admin/profile-edit-permission');
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setGlobalPerm(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch quyền chỉnh sửa:", e);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchPermission();
  }, []);

  // 3. Lưu cài đặt quyền chỉnh sửa
  const handleSavePermission = async (newPerm: GlobalEditPerm) => {
    setGlobalPerm(newPerm);
    try {
      await adminFetch('/api/admin/profile-edit-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerm)
      });
    } catch (e) {
      console.error("Lỗi lưu quyền chỉnh sửa:", e);
    }
  };

  // 4. Xóa sinh viên
  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminFetch(`/api/admin/students/${deleteTarget.mssv}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStudents(prev => prev.filter(s => s.mssv !== deleteTarget.mssv));
        setDeleteTarget(null);
      } else {
        alert(data.message || "Không thể xóa sinh viên.");
      }
    } catch (e) {
      console.error("Lỗi xóa sinh viên:", e);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  // 5. Xuất file CSV
  const handleExportCSV = () => {
  window.open(`/api/admin/students/export?admin_email=${encodeURIComponent(getAdminEmail())}`, '_blank');
};

  // 6. Nhập file CSV
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await adminFetch('/api/admin/students/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(data.message || "Nhập file thành công!");
        fetchStudents();
      } else {
        alert(data.message || "Lỗi khi nhập file.");
      }
    } catch (err) {
      console.error("Lỗi import CSV:", err);
      alert("Lỗi kết nối khi gửi file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const allKhoa  = Array.from(new Set(students.map(s => s.khoa).filter(Boolean)));
  const allNganh = Array.from(new Set(students.map(s => s.nganh).filter(Boolean)));
  const allBac   = Array.from(new Set(students.map(s => s.bacDT).filter(Boolean)));
  const allLoai  = Array.from(new Set(students.map(s => s.loaiDT).filter(Boolean)));

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.hoTen.toLowerCase().includes(q) || s.mssv.includes(q) || s.email.toLowerCase().includes(q);
    const matchKhoa  = !filters.khoa  || s.khoa  === filters.khoa;
    const matchNganh = !filters.nganh || s.nganh === filters.nganh;
    const matchBac   = !filters.bacDT || s.bacDT === filters.bacDT;
    const matchLoai  = !filters.loaiDT|| s.loaiDT=== filters.loaiDT;
    return matchSearch && matchKhoa && matchNganh && matchBac && matchLoai;
  });

  function clearFilters() { setFilters({ khoa: "", nganh: "", bacDT: "", loaiDT: "" }); }
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const cols = ["Họ và Tên", "MSSV", "Mail", "Giới tính", "Khoá", "Bậc ĐT", "Khoa", "Loại ĐT", "Chuyên ngành"];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-bold text-base mb-2 text-foreground" style={PJS}>Xóa sinh viên?</h3>
            <p className="text-sm text-muted-foreground mb-1">Bạn có chắc chắn muốn xóa sinh viên</p>
            <p className="text-sm font-semibold text-foreground mb-5" style={PJS}>
              {deleteTarget.hoTen} ({deleteTarget.mssv})
            </p>
            <p className="text-xs text-muted-foreground mb-6">Mọi dữ liệu học tập, học phí, khảo sát liên quan sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors" style={PJS}>
                Hủy
              </button>
              <button onClick={handleDeleteStudent} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity bg-red-600" style={PJS}>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student View / Edit Modal */}
      {modal && (
        <StudentModal
          student={modal.student}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={updated => {
            setStudents(prev => prev.map(s => s.mssv === updated.mssv ? { ...s, ...updated } : s));
          }}
        />
      )}

      {/* Add Student Modal */}
      {addOpen && (
        <AddStudentModal
          onClose={() => setAddOpen(false)}
          onAdd={s => fetchStudents()}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, MSSV, email..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors bg-card"
            style={{ fontFamily: "'Inter', sans-serif" }} />
        </div>
        <button onClick={() => setFilterOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
          style={{ borderColor: filterOpen || activeFilters > 0 ? "#11284D" : "#e2e8f0", background: "#fff", color: filterOpen || activeFilters > 0 ? "#11284D" : "var(--muted-foreground)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Filter className="w-4 h-4" /> Bộ lọc
          {activeFilters > 0 && <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: "var(--accent)" }}>{activeFilters}</span>}
        </button>
        <div className="hidden sm:flex flex-1" />
        <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium transition-colors text-muted-foreground hover:bg-muted" style={{ background: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Download className="w-4 h-4" /> Xuất
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium transition-colors text-muted-foreground hover:bg-muted" style={{ background: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Upload className="w-4 h-4" /> Nhập
        </button>
        <button onClick={() => setPermOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors"
          style={{ borderColor: permOpen || globalPerm.enabled ? "var(--primary)" : "#e2e8f0", background: globalPerm.enabled ? "var(--primary)" : "#fff", color: globalPerm.enabled ? "#fff" : "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Lock className="w-4 h-4" /> Quyền chỉnh sửa
          {globalPerm.enabled && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
        </button>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      {/* Permission Section */}
      {permOpen && (
        <div className="mb-4 bg-card rounded-xl border border-border overflow-hidden flex-shrink-0">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between" style={{ background: "var(--primary)" }}>
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quyền chỉnh sửa hồ sơ</span>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {globalPerm.enabled ? "Đang bật" : "Đang tắt"}
              </span>
              <button onClick={() => handleSavePermission({ ...globalPerm, enabled: !globalPerm.enabled })}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
                style={{ background: globalPerm.enabled ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: globalPerm.enabled ? "translateX(18px)" : "translateX(2px)" }} />
              </button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Từ ngày</label>
                <input type="date" value={globalPerm.from} onChange={e => handleSavePermission({ ...globalPerm, from: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đến ngày</label>
                <input type="date" value={globalPerm.to} onChange={e => handleSavePermission({ ...globalPerm, to: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background transition-colors" />
              </div>
            </div>
            {globalPerm.enabled && globalPerm.from && globalPerm.to && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-green-50 border border-green-200 text-green-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                Sinh viên có thể chỉnh sửa hồ sơ từ {globalPerm.from} đến {globalPerm.to}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Section */}
      {filterOpen && (
        <div className="mb-4 bg-card rounded-xl border border-border px-5 py-4 flex flex-wrap gap-4 items-end flex-shrink-0">
          {[
            { label: "Khoá",    key: "khoa"  as const, options: allKhoa  },
            { label: "Khoa/Ngành", key: "nganh" as const, options: allNganh },
            { label: "Bậc ĐT",  key: "bacDT" as const, options: allBac   },
            { label: "Loại ĐT", key: "loaiDT"as const, options: allLoai  },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.label}</label>
              <select value={filters[f.key]} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }}>
                <option value="">Tất cả</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-accent transition-colors border border-border hover:border-[#D5B370]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
        <div className="overflow-auto h-full">
          <table className="w-full text-xs" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--primary)" }}>
                {cols.map(c => <th key={c} className="px-3 py-2.5 text-left font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{c}</th>)}
                <th className="px-3 py-2.5 w-16 text-center text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length + 1} className="px-4 py-12 text-center text-muted-foreground text-sm">Đang tải danh sách sinh viên...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={cols.length + 1} className="px-4 py-12 text-center text-muted-foreground text-sm">Không tìm thấy sinh viên phù hợp.</td></tr>
              ) : filtered.map((s) => {
                const now = new Date().toISOString().slice(0, 10);
                const permActive = globalPerm.enabled && globalPerm.from <= now && now <= globalPerm.to;
                return (
                  <tr key={s.mssv} onClick={() => setModal({ student: s, mode: "view" })}
                    className="group hover:brightness-95 transition-all cursor-pointer"
                    style={{ background: "var(--card)" }}>
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {s.hoTen}
                        {permActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" title="Đang trong đợt chỉnh sửa" />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.mssv}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.email}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.gioiTinh}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.khoa}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.bacDT}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.nganh}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.loaiDT}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.chuyenNganh || "—"}</td>
                    <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ student: s, mode: "edit" })}
                          className="p-1 rounded hover:bg-muted" title="Chỉnh sửa hồ sơ">
                          <Pencil className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                        </button>
                        <button onClick={() => setDeleteTarget(s)}
                          className="p-1 rounded hover:bg-red-50 text-red-500" title="Xóa sinh viên">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 flex-shrink-0">Hiển thị {filtered.length} / {students.length} sinh viên</p>
    </div>
  );
}
// ─── Admin: Survey Management (Khảo sát) ─────────────────────────────────────
function AdminSurveySection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<"all" | "active" | "closed">("all");
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [resultModal, setResultModal] = useState<any | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch danh sách khảo sát từ Backend
  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/surveys?status=${activeStatus}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setSurveys(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch khảo sát:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [activeStatus, search]);

  // Xóa khảo sát
  const handleDelete = async (maks: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khảo sát này và toàn bộ kết quả phản hồi?")) return;
    try {
      const res = await adminFetch(`/api/admin/surveys/${maks}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === 'success') {
        fetchSurveys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mở modal xem kết quả thống kê
  const handleOpenResults = async (s: any) => {
    setResultModal(s);
    setDetailLoading(true);
    try {
      const res = await adminFetch(`/api/admin/surveys/${s.id}`);
      const data = await res.json();
      if (data.status === 'success') {
        setDetailData(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch chi tiết khảo sát:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const activeCount = surveys.filter(s => s.status === 'active').length;
  const closedCount = surveys.filter(s => s.status === 'closed').length;
  const avgRate = surveys.length > 0 ? Math.round(surveys.reduce((a, b) => a + (b.responseRate || 0), 0) / surveys.length) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 flex-shrink-0">
        {[
          { label: "Tổng khảo sát", val: surveys.length, col: "var(--primary)" },
          { label: "Đang diễn ra", val: activeCount, col: "#16a34a" },
          { label: "Đã kết thúc", val: closedCount, col: "#6b7280" },
          { label: "Tỷ lệ phản hồi TB", val: `${avgRate}%`, col: "var(--accent)" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <span className="text-2xl font-bold block mb-1" style={{ color: s.col, ...PJS }}>{s.val}</span>
            <span className="text-xs text-muted-foreground" style={INTER}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {(["all", "active", "closed"] as const).map(st => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeStatus === st ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
              style={PJS}
            >
              {st === "all" ? "Tất cả" : st === "active" ? "Đang diễn ra" : "Đã kết thúc"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm khảo sát..."
              className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card outline-none focus:border-primary"
              style={INTER}
            />
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity bg-primary"
            style={PJS}
          >
            <Plus className="w-3.5 h-3.5" /> Tạo khảo sát
          </button>
        </div>
      </div>

      {/* List Surveys */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {loading ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Đang tải danh sách khảo sát...</p>
        ) : surveys.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Không tìm thấy khảo sát nào.</p>
        ) : (
          surveys.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`} style={PJS}>
                      {s.status === 'active' ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </span>
                    <h3 className="font-bold text-base text-foreground" style={PJS}>{s.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3" style={INTER}>{s.description || "Không có mô tả."}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap" style={INTER}>
                    <span>Hạn nộp: <strong>{s.deadline}</strong></span>
                    <span>Phản hồi: <strong>{s.submittedCount}/{s.totalTarget} ({s.responseRate}%)</strong></span>
                    <span>Số mục đánh giá: <strong>{s.questionsCount}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenResults(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors text-primary"
                    style={PJS}
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Kết quả
                  </button>
                  <button
                    onClick={() => window.open(`/api/admin/surveys/${s.id}/export?admin_email=${encodeURIComponent(getAdminEmail())}`, '_blank')}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Xuất kết quả CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    title="Xóa khảo sát"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thống kê kết quả */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setResultModal(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-white">
              <div>
                <h3 className="font-bold text-base" style={PJS}>{resultModal.title}</h3>
                <p className="text-white/70 text-xs mt-0.5">Tỷ lệ hoàn thành: {resultModal.responseRate}% ({resultModal.submittedCount}/{resultModal.totalTarget} sinh viên)</p>
              </div>
              <button onClick={() => setResultModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {detailLoading ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Đang tải thống kê...</p>
              ) : !detailData || !detailData.questions || detailData.questions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Chưa có câu hỏi hoặc dữ liệu phản hồi.</p>
              ) : (
                detailData.questions.map((q: any, qi: number) => (
                  <div key={q.id} className="rounded-xl border border-border p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-foreground" style={PJS}>
                        {qi+1}. {q.content} {q.code !== '—' && <span className="text-xs text-muted-foreground font-normal">({q.code})</span>}
                      </h4>
                      <span className="text-base font-bold text-accent" style={PJS}>{q.averageRating} / 5.0 ⭐</span>
                    </div>

                    {/* Breakdown các mức sao 1 -> 5 */}
                    <div className="space-y-1.5 mb-4">
                      {q.ratingBreakdown && q.ratingBreakdown.map((b: any) => (
                        <div key={b.star} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-medium">{b.star} sao:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${b.percentage}%` }} />
                          </div>
                          <span className="w-14 text-right text-muted-foreground">{b.count} ({b.percentage}%)</span>
                        </div>
                      ))}
                    </div>

                    {/* Nhận xét bằng chữ của sinh viên */}
                    {q.textResponses && q.textResponses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Ý kiến nhận xét ({q.textResponses.length}):</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {q.textResponses.map((txt: string, ti: number) => (
                            <p key={ti} className="text-xs p-2 bg-card rounded border border-border text-foreground leading-relaxed">{txt}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Khảo sát mới */}
      {createModal && (
        <CreateSurveyModal onClose={() => setCreateModal(false)} onCreated={() => { setCreateModal(false); fetchSurveys(); }} />
      )}
    </div>
  );
}

// Modal tạo khảo sát mới
function CreateSurveyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("2026-08-30");
  const [questions, setQuestions] = useState<any[]>([
    { name: "Đánh giá chất lượng môn học và phương pháp giảng dạy", code: "Học phần 1" }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { name: "", code: "" }]);
  };

  const handleSave = async () => {
    if (!title.trim()) { alert("Vui lòng nhập tiêu đề khảo sát."); return; }
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, deadline, questions })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onCreated();
      } else {
        alert(data.message || "Lỗi tạo khảo sát.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-white">
          <h3 className="font-bold text-base" style={PJS}>Tạo đợt khảo sát mới</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Tiêu đề khảo sát *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề khảo sát..." className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" style={INTER} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Mô tả</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả mục đích khảo sát..." className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none" style={INTER} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Hạn nộp</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>

          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-primary" style={PJS}>Danh sách mục khảo sát / câu hỏi</span>
              <button type="button" onClick={handleAddQuestion} className="text-xs text-primary font-semibold hover:underline" style={PJS}>+ Thêm mục</button>
            </div>
            {questions.map((q, qi) => (
              <div key={qi} className="p-3 mb-2.5 border border-border rounded-lg bg-muted/20 space-y-2">
                <input value={q.name} onChange={e => setQuestions(prev => prev.map((item, i) => i === qi ? { ...item, name: e.target.value } : item))} placeholder={`Tên mục / câu hỏi ${qi+1}...`} className="w-full border border-border rounded px-2.5 py-1.5 text-xs bg-background" />
                <input value={q.code} onChange={e => setQuestions(prev => prev.map((item, i) => i === qi ? { ...item, code: e.target.value } : item))} placeholder="Mã môn học / phân loại (nếu có)..." className="w-full border border-border rounded px-2.5 py-1 text-xs bg-background" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-card">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted" style={PJS}>Hủy</button>
          <button onClick={handleSave} disabled={submitting} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50" style={PJS}>
            {submitting ? "Đang tạo..." : "Tạo khảo sát"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Helper Functions & Styles ───────────────────────────────────────────────
function calcTK(cc: number | null, gk: number | null, ck: number | null): number | null {
  if (cc === null || gk === null || ck === null) return null;
  return Math.round((cc * 0.1 + gk * 0.3 + ck * 0.6) * 10) / 10;
}

function gradeColor(d: number | null): string {
  if (d === null) return "var(--muted-foreground)";
  if (d >= 5) return "#16a34a";
  return "#dc2626";
}

function isYearOpen(status: any): boolean {
  if (status === true || status === 1 || status === "1") return true;
  if (status === false || status === 0 || status === "0") return false;
  const s = String(status || "").toLowerCase().trim();
  return s === "open" || s === "mở" || s === "đang mở" || s === "hoạt động" || s === "active";
}

// ─── Modal: Chỉnh sửa điểm sinh viên ─────────────────────────────────────────
function GradeEditModal({ student, courseId, onClose, onSave }: {
  student: StudentGradeRow; courseId?: string; onClose: () => void;
  onSave: (updated: StudentGradeRow) => void;
}) {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
  const [cc, setCC] = useState(String(student.diemCC ?? ""));
  const [gk, setGK] = useState(String(student.diemGK ?? ""));
  const [ck, setCK] = useState(String(student.diemCK ?? ""));
  const [lyDo, setLyDo] = useState(student.ghiChu || "");
  const [customLyDo, setCustomLyDo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toNum = (s: string) => s.trim() === "" ? null : parseFloat(s);
  const tkPreview = calcTK(toNum(cc), toNum(gk), toNum(ck));
  const lyDoOptions = GRADE_EDIT_REASONS;
  const isOther = lyDo === "Khác (Other)";
  const canSave = lyDo !== "" && (!isOther || customLyDo.trim() !== "");

  async function handleSave() {
    const reason = isOther ? customLyDo.trim() : lyDo;
    const ccN = toNum(cc); const gkN = toNum(gk); const ckN = toNum(ck);
    const updatedPayload = { ...student, diemCC: ccN, diemGK: gkN, diemCK: ckN, diemTK: calcTK(ccN, gkN, ckN), ghiChu: reason };

    setSubmitting(true);
    try {
      if (courseId) {
        await adminFetch(`/api/admin/academic/courses/${courseId}/grades/${student.mssv}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPayload)
        });
      }
      onSave(updatedPayload);
      onClose();
    } catch (e) {
      console.error(e);
      onSave(updatedPayload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const scoreInput = (label: string, pct: string, val: string, set: (v: string) => void) => (
    <div key={label}>
      <label className="block text-xs font-semibold text-muted-foreground mb-1" style={PJS}>
        {label} <span className="font-normal text-muted-foreground">({pct})</span>
      </label>
      <input 
        type="number" min={0} max={10} step={0.1} value={val} onChange={e => set(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-background" 
        style={INTER} 
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between" style={{ background: "linear-gradient(135deg,#11284D,#264B6F)" }}>
          <div>
            <p className="text-white font-bold text-sm" style={PJS}>Chỉnh sửa điểm</p>
            <p className="text-white/70 text-xs mt-0.5" style={INTER}>{student.mssv} — {student.hoTen}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card/20 hover:bg-card/30 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {scoreInput("Điểm CC", "10%", cc, setCC)}
            {scoreInput("Điểm GK", "30%", gk, setGK)}
            {scoreInput("Điểm CK", "60%", ck, setCK)}
          </div>
          <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--background)" }}>
            <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Điểm tổng kết (tự động)</span>
            <span className="text-lg font-bold" style={{ ...PJS, color: gradeColor(tkPreview) }}>
              {tkPreview !== null ? tkPreview.toFixed(1) : "—"}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1" style={PJS}>
              Lý do chỉnh sửa <span className="text-red-500">*</span>
            </label>
            <select value={lyDo} onChange={e => setLyDo(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-card" style={INTER}>
              <option value="">— Chọn lý do —</option>
              {lyDoOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {isOther && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1" style={PJS}>
                Mô tả lý do <span className="text-red-500">*</span>
              </label>
              <textarea rows={2} value={customLyDo} onChange={e => setCustomLyDo(e.target.value)} placeholder="Nhập lý do cụ thể..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 bg-background" style={INTER} />
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-card border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:bg-muted transition-colors" style={PJS}>
            Hủy
          </button>
          <button onClick={handleSave} disabled={!canSave || submitting} className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            style={{ ...PJS, background: canSave && !submitting ? "#11284D" : "#9ca3af", cursor: canSave && !submitting ? "pointer" : "not-allowed" }}>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Thêm / Chỉnh sửa Năm học ──────────────────────────────────────────
function AcademicYearModal({ year, onClose, onSave }: {
  year: AcademicYear | null;
  onClose: () => void;
  onSave: (y: AcademicYear) => void;
}) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const isEdit = !!year;
  const [namBatDau, setNamBatDau] = useState(year ? parseInt(year.id.split("-")[0]) + 2000 : new Date().getFullYear());
  const [soHocKy, setSoHocKy] = useState(year?.soHocKy ?? 3);
  const [ngayBatDau, setNgayBatDau] = useState(year?.ngayBatDau ?? "");
  const [ngayKetThuc, setNgayKetThuc] = useState(year?.ngayKetThuc ?? "");
  const [status, setStatus] = useState<AcademicYear["status"]>(isYearOpen(year?.status) ? "open" : "closed");

  const namKetThuc = namBatDau + 1;
  const shortId = `${String(namBatDau).slice(2)}-${String(namKetThuc).slice(2)}`;
  const label = `${namBatDau}–${namKetThuc}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <div>
            <p className="font-bold text-white text-sm" style={PJS}>{isEdit ? "Chỉnh sửa năm học" : "Thêm năm học mới"}</p>
            {!isEdit && <p className="text-white/60 text-xs mt-0.5" style={PJS}>Năm học {label} · Mã: {shortId}</p>}
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Năm bắt đầu</label>
              <input type="number" value={namBatDau} min={2020} max={2040}
                onChange={e => setNamBatDau(Number(e.target.value))}
                className={iCls} disabled={isEdit} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Năm kết thúc</label>
              <input value={namKetThuc} className={iCls} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Số học kỳ</label>
            <select value={soHocKy} onChange={e => setSoHocKy(Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>
              <option value={2}>2 học kỳ</option>
              <option value={3}>3 học kỳ (Hè)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Ngày bắt đầu HK1</label>
              <input value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} placeholder="VD: 01/09/2026" className={iCls} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Ngày kết thúc</label>
              <input value={ngayKetThuc} onChange={e => setNgayKetThuc(e.target.value)} placeholder="VD: 31/08/2027" className={iCls} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-2" style={PJS}>Trạng thái</label>
            <div className="flex gap-2">
              {(["open", "closed"] as const).map(s => {
                const cfg = { open: { label: "Mở", color: "#16a34a" }, closed: { label: "Đóng", color: "#6b7280" } }[s];
                return (
                  <button key={s} onClick={() => setStatus(s)} type="button"
                    className="flex-1 py-2 rounded-lg border text-xs font-semibold transition-all"
                    style={{ 
                      background: status === s ? cfg.color + "18" : "var(--card)", 
                      borderColor: status === s ? cfg.color : "var(--border)", 
                      color: status === s ? cfg.color : "var(--muted-foreground)", 
                      fontFamily: "'Plus Jakarta Sans', sans-serif" 
                    }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => onSave({ id: isEdit ? year!.id : shortId, label, ngayBatDau, ngayKetThuc, soHocKy, status })}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>
            {isEdit ? "Lưu thay đổi" : "Thêm năm học"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component: AdminAcademicSection ───────────────────────────────────
export function AdminAcademicSection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
  const PRIMARY = "#11284D";

  const [activeTab, setActiveTab] = useState<"courses" | "years">("courses");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearModal, setYearModal] = useState<AcademicYear | null | "new">(null);
  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseItem | null>(null);
  const [filterNamHoc, setFilterNamHoc] = useState("all");
  const [filterHK, setFilterHK] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<GradeStatus | "all">("all");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeRow[]>([]);
  const [editTarget, setEditTarget] = useState<StudentGradeRow | null>(null);
  const [confirmLock, setConfirmLock] = useState(false);
  const [gradeSearch, setGradeSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch toàn bộ môn học phần trực tiếp từ Database
  const fetchCourses = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (filterNamHoc && filterNamHoc !== "all") params.append("namHoc", filterNamHoc);
    if (filterHK !== "all") params.append("hocKy", String(filterHK));
    if (filterStatus !== "all") params.append("status", filterStatus);
    if (filterKhoa !== "all") params.append("khoa", filterKhoa);
    if (search) params.append("search", search);

    const res = await adminFetch(`/api/admin/academic/courses?${params.toString()}`); // Thay bằng adminFetch
    const data = await res.json();
    if (data.status === "success") setCourses(data.data);
  } catch (e) {
    console.error("Lỗi fetch môn học:", e);
  } finally {
    setLoading(false);
  }
};

  // 2. Fetch danh sách năm học từ Database và chuẩn hoá trạng thái open/closed
  const fetchYears = async () => {
    try {
      const res = await adminFetch('/api/admin/academic/years');
      const data = await res.json();
      if (data.status === "success" && data.data) {
        const normalized = data.data.map((y: any) => {
          const rawStatus = y.status ?? y.trangThai ?? y.trangthai ?? y.trangthai_mo;
          return {
            ...y,
            status: isYearOpen(rawStatus) ? "open" : "closed"
          };
        });
        setAcademicYears(normalized);
      }
    } catch (e) {
      console.error("Lỗi fetch năm học:", e);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchYears();
  }, [filterNamHoc, filterHK, filterStatus, filterKhoa, search]);

  const namHocOptions = ["all", ...Array.from(new Set(courses.map(c => c.namHoc)))];
  const khoaOptions = Array.from(new Set(courses.map(c => c.khoa).filter(Boolean))).sort();
  const filtered = courses;

  async function openDetail(course: AdminCourseItem) {
  if (course.status === "pending") return;
  setSelectedCourse(course);
  setLoading(true);
  try {
    const res = await adminFetch(`/api/admin/academic/courses/${course.id}/grades`); // adminFetch
    const data = await res.json();
    if (data.status === "success") setGrades(data.data);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
    setGradeSearch("");
    setScreen("detail");
  }
}

  async function handleLockPublish() {
    if (!selectedCourse) return;
    try {
      const res = await adminFetch(`/api/admin/academic/courses/${selectedCourse.id}/lock`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        const today = new Date().toLocaleDateString("vi-VN");
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, status: "locked", ngayNopDiem: today } : c));
        setSelectedCourse(prev => prev ? { ...prev, status: "locked", ngayNopDiem: today } : prev);
        setConfirmLock(false);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khóa điểm.");
    }
  }

  function handleSaveGrade(updated: StudentGradeRow) {
    setGrades(prev => prev.map(g => g.mssv === updated.mssv ? updated : g));
  }

  const handleExportGrades = () => {
  if (!selectedCourse) return;
  window.open(`/api/admin/academic/courses/${selectedCourse.id}/export-grades?admin_email=${encodeURIComponent(getAdminEmail())}`, '_blank');
};

  const statusBadge = (status: any, small = false) => {
    const raw = String(status || "").toLowerCase();
    let cfg = { bg: "#f3f4f6", text: "#6b7280", label: "Đang chờ", dot: "#9ca3af" };

    if (raw.includes("lock") || raw.includes("close") || raw.includes("khóa") || raw.includes("đã khóa")) {
      cfg = { bg: "#f0fdf4", text: "#16a34a", label: "Đã khóa", dot: "#22c55e" };
    } else if (raw.includes("upload") || raw.includes("tải") || raw.includes("nộp") || raw.includes("open")) {
      cfg = { bg: "#fffbeb", text: "#b45309", label: "Đã tải lên", dot: "#f59e0b" };
    } else {
      cfg = { bg: "#f3f4f6", text: "#6b7280", label: "Đang chờ", dot: "#9ca3af" };
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}
            style={{ background: cfg.bg, color: cfg.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    );
  };

  const avg = (arr: (number | null)[]) => {
    const nums = arr.filter((n): n is number => n !== null);
    if (!nums.length) return null;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
  };

  const scoreCell = (v: number | null) => (
    <td className="px-3 py-2.5 text-center font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif", color: gradeColor(v) }}>
      {v !== null ? v.toFixed(1) : "—"}
    </td>
  );

  const saveYear = async (y: AcademicYear) => {
    try {
      const isEdit = academicYears.some(x => x.id === y.id);
      const url = isEdit ? `/api/admin/academic/years/${y.id}` : `/api/admin/academic/years`;
      const method = isEdit ? "PUT" : "POST";
      
      await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(y)
      });
      fetchYears();
      setYearModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  const setCurrentYear = async (id: string) => {
    try {
      setAcademicYears(prev => prev.map(y => y.id === id ? { ...y, status: "open" } : y));
      await adminFetch(`/api/admin/academic/years/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" })
      });
      fetchYears();
    } catch (e) {
      console.error(e);
    }
  };

  const closeYear = async (id: string) => {
    try {
      setAcademicYears(prev => prev.map(y => y.id === id ? { ...y, status: "closed" } : y));
      await adminFetch(`/api/admin/academic/years/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" })
      });
      fetchYears();
    } catch (e) {
      console.error(e);
    }
  };

  if (screen === "list") {
    const pending  = filtered.filter(c => {
      const s = String(c.status || "").toLowerCase();
      return s === "pending" || s === "chưa nộp";
    }).length;

    const uploaded = filtered.filter(c => {
      const s = String(c.status || "").toLowerCase();
      return s === "uploaded" || s === "open" || s.includes("tải");
    }).length;

    const locked   = filtered.filter(c => {
      const s = String(c.status || "").toLowerCase();
      return s === "locked" || s === "closed" || s.includes("khóa");
    }).length;

    // Đếm chính xác số lượng năm học mở và đóng
    const yOpen   = academicYears.filter(y => y.status === "open").length;
    const yClosed = academicYears.filter(y => y.status === "closed").length;

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground" style={PJS}>Quản lý học tập</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={INTER}>Theo dõi điểm số và quản lý năm học</p>
          </div>
        </div>
        <div className="flex gap-0 border-b border-border mb-5 flex-shrink-0">
          {([["courses", "Môn học & Điểm"], ["years", "Năm học"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all"
              style={{ borderColor: activeTab === id ? "var(--primary)" : "transparent", color: activeTab === id ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════ TAB 1: MÔN HỌC & ĐIỂM ══════════════════ */}
        {activeTab === "courses" && (
          <>
            <div className="flex gap-3 mb-5">
              {[
                { label: "Đang chờ nộp điểm", val: pending,  bg: "#f9fafb", bord: "#e5e7eb", col: "#6b7280", status: "pending"  as GradeStatus },
                { label: "Đã tải lên",         val: uploaded, bg: "#fffbeb", bord: "#fde68a", col: "#b45309", status: "uploaded" as GradeStatus },
                { label: "Đã khóa & công bố",  val: locked,   bg: "#f0fdf4", bord: "#bbf7d0", col: "#16a34a", status: "locked"   as GradeStatus },
              ].map(s => {
                const active = filterStatus === s.status;
                return (
                  <button key={s.label} onClick={() => setFilterStatus(active ? "all" : s.status)}
                          className="flex-1 rounded-xl border px-4 py-2.5 flex items-center gap-2.5 transition-all hover:shadow-md"
                          style={{ background: s.bg, borderColor: active ? s.col : s.bord, boxShadow: active ? `0 0 0 2px ${s.col}33` : undefined }}>
                    <span className="font-bold leading-none text-[20px]" style={{ ...PJS, color: s.col }}>{s.val}</span>
                    <span className="text-xs leading-none" style={{ ...INTER, color: active ? s.col : "#6b7280" }}>{s.label}{active ? " ✓" : ""}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <select 
                value={filterNamHoc} 
                onChange={e => setFilterNamHoc(e.target.value)} 
                className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" 
                style={PJS}
              >
                <option value="all">Tất cả năm học</option>
                {namHocOptions.filter(n => n !== "all").map(n => (
                  <option key={n} value={n}>Năm học {n}</option>
                ))}
              </select>

              <select 
                value={String(filterHK)} 
                onChange={e => setFilterHK(e.target.value === "all" ? "all" : Number(e.target.value))} 
                className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" 
                style={PJS}
              >
                <option value="all">Tất cả học kỳ</option>
                <option value="1">Học kỳ 1</option>
                <option value="2">Học kỳ 2</option>
                <option value="3">Học kỳ 3</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value as GradeStatus | "all")} 
                className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" 
                style={PJS}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="uploaded">Đã tải lên</option>
                <option value="locked">Đã khóa</option>
              </select>

              <select 
                value={filterKhoa} 
                onChange={e => setFilterKhoa(e.target.value)} 
                className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" 
                style={PJS}
              >
                <option value="all">Tất cả khoa</option>
                {khoaOptions.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Course Table */}
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs" style={{ minWidth: 780 }}>
                <thead>
                  <tr style={{ background: PRIMARY }}>
                    {["STT","Mã MH","Tên môn học","Lớp","TC","Khoa","Giảng viên","Số SV","Trạng thái","Ngày nộp"].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap first:pl-4" style={PJS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="text-center py-16 text-muted-foreground" style={INTER}>Đang tải dữ liệu từ CSDL...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-16 text-muted-foreground" style={INTER}>Không tìm thấy môn học nào</td></tr>
                  ) : filtered.map((c, i) => {
                    const clickable = c.status !== "pending";
                    const rowBg = i % 2 === 1 ? "#dde4f5" : "var(--card)";
                    return (
                      <tr key={c.id} className={`border-b border-border transition-colors ${clickable ? "cursor-pointer hover:brightness-95" : ""}`}
                          style={{ background: rowBg }} onClick={() => openDetail(c)}>
                        <td className="pl-4 pr-3 py-3 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-3 font-semibold text-foreground" style={PJS}>{c.maMon}</td>
                        <td className="px-3 py-3"><span className="font-medium text-foreground" style={PJS}>{c.tenMon}</span></td>
                        <td className="px-3 py-3 text-muted-foreground">{c.lop}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{c.soTC}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-muted text-primary whitespace-nowrap">
                            {c.khoa}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{c.giangVien}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{c.soSV}</td>
                        <td className="px-3 py-3">{statusBadge(c.status, true)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{c.ngayNopDiem ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right" style={INTER}>
              Hiển thị {filtered.length} môn học phần từ CSDL &mdash; nhấn vào hàng <span className="font-medium text-amber-600">Đã tải lên</span> hoặc <span className="font-medium text-green-600">Đã khóa</span> để xem bảng điểm chi tiết
            </p>
          </>
        )}

        {/* ══════════════════ TAB 2: NĂM HỌC ══════════════════ */}
        {activeTab === "years" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {yearModal !== null && (
              <AcademicYearModal year={yearModal === "new" ? null : yearModal} onClose={() => setYearModal(null)} onSave={saveYear} />
            )}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {[
                  { label: "Đang mở",  val: yOpen,   bg: "#f0fdf4", bord: "#bbf7d0", col: "#16a34a" },
                  { label: "Đã đóng",  val: yClosed, bg: "#f9fafb", bord: "#e5e7eb", col: "#6b7280" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border px-4 py-3 flex items-center gap-3" style={{ background: s.bg, borderColor: s.bord }}>
                    <span className="text-2xl font-bold" style={{ color: s.col, ...PJS }}>{s.val}</span>
                    <span className="text-xs text-muted-foreground" style={PJS}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-xs text-muted-foreground" style={INTER}>{academicYears.length} năm học trong hệ thống</p>
                <button onClick={() => setYearModal("new")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "var(--primary)", ...PJS }}>
                  <Plus className="w-4 h-4" /> Thêm năm học
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border">
                <table className="w-full text-xs" style={{ minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: "var(--primary)" }}>
                      {["Năm học", "Mã", "Ngày bắt đầu", "Ngày kết thúc", "Số HK", "Trạng thái", "Thao tác"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-white font-semibold whitespace-nowrap" style={PJS}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Chưa có năm học nào trong hệ thống.</td></tr>
                    ) : (
                      academicYears.map((y, i) => {
                        const isOpen = y.status === "open";
                        return (
                          <tr key={y.id} className="border-b border-border hover:brightness-[0.97] transition-all" style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)" }}>
                            <td className="px-4 py-3 font-bold text-foreground" style={PJS}>{y.label}</td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">{y.id}</td>
                            <td className="px-4 py-3 text-muted-foreground">{y.ngayBatDau || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{y.ngayKetThuc || "—"}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{y.soHocKy}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-400"}`} />
                                {isOpen ? "Mở" : "Đóng"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setYearModal(y)} title="Chỉnh sửa" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {!isOpen ? (
                                  <button onClick={() => setCurrentYear(y.id)} title="Mở năm học" className="p-1.5 rounded-md hover:bg-green-50 text-green-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button onClick={() => closeYear(y.id)} title="Đóng năm học" className="p-1.5 rounded-md hover:bg-muted text-gray-500">
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════ VIEW CHI TIẾT BẢNG ĐIỂM ══════════════════
  const course = selectedCourse!;
  const isLocked = course.status === "locked";
  const filteredGrades = grades.filter(g => {
    if (!gradeSearch.trim()) return true;
    const q = gradeSearch.toLowerCase();
    return g.mssv.includes(q) || g.hoTen.toLowerCase().includes(q);
  });
  const tkVals = grades.map(g => g.diemTK);
  const avgTK = avg(tkVals);
  const passCount = grades.filter(g => g.diemTK !== null && g.diemTK >= 5).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setScreen("list"); setSelectedCourse(null); }}
            className="w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground" style={PJS}>{course.tenMon}</h2>
              {statusBadge(course.status, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5" style={INTER}>{course.maMon} &middot; Lớp {course.lop} &middot; {course.giangVien} &middot; HK{course.hocKy}</p>
          </div>
        </div>
        {!isLocked ? (
          <button onClick={() => setConfirmLock(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white flex-shrink-0 hover:opacity-90 transition-opacity" style={{ ...PJS, background: PRIMARY }}>
            <Lock className="w-3.5 h-3.5" /> Khóa điểm &amp; Công bố
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-green-700 flex-shrink-0" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <Lock className="w-3.5 h-3.5" /> Điểm đã được khóa &amp; công bố
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Tổng sinh viên", val: String(grades.length), col: PRIMARY },
          { label: "Đạt (≥ 5.0)",    val: String(passCount),     col: "#16a34a" },
          { label: "Rớt (< 5.0)",    val: String(grades.length - passCount), col: "#dc2626" },
          { label: "Điểm TB",        val: avgTK !== null ? avgTK.toFixed(1) : "—", col: gradeColor(avgTK) },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm flex items-center gap-2.5">
            <span className="text-xl font-bold flex-shrink-0" style={{ ...PJS, color: s.col }}>{s.val}</span>
            <span className="text-xs text-muted-foreground leading-tight" style={INTER}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={gradeSearch} onChange={e => setGradeSearch(e.target.value)} placeholder="Tìm MSSV hoặc tên sinh viên..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" style={INTER} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border">
        <table className="w-full text-xs" style={{ minWidth: 700 }}>
          <thead>
            <tr style={{ background: PRIMARY }}>
              {["STT","MSSV","Họ và tên","CC (10%)","GK (30%)","CK (60%)","Tổng kết","Ghi chú",""].map(h => (
                <th key={h} className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap first:pl-4" style={PJS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-muted-foreground" style={INTER}>Đang tải bảng điểm từ CSDL...</td></tr>
            ) : filteredGrades.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-muted-foreground" style={INTER}>Không tìm thấy sinh viên</td></tr>
            ) : filteredGrades.map((g, i) => (
              <tr key={g.mssv} className="border-b border-border group" style={{ background: "var(--card)" }}>
                <td className="pl-4 pr-3 py-2.5 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground font-semibold">{g.mssv}</td>
                <td className="px-3 py-2.5 font-medium text-foreground" style={PJS}>{g.hoTen}</td>
                {scoreCell(g.diemCC)}{scoreCell(g.diemGK)}{scoreCell(g.diemCK)}
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: g.diemTK !== null && g.diemTK >= 5 ? "#f0fdf4" : "#fef2f2", color: gradeColor(g.diemTK) }}>
                    {g.diemTK !== null ? g.diemTK.toFixed(1) : "—"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground max-w-[120px] truncate" title={g.ghiChu || undefined}>{g.ghiChu || "—"}</td>
                <td className="px-3 py-2.5 w-10">
                  {!isLocked && (
                    <button onClick={() => setEditTarget(g)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredGrades.length > 0 && (
              <tr className="border-t-2 border-border bg-card">
                <td colSpan={3} className="pl-4 pr-3 py-2.5 text-xs font-bold text-muted-foreground" style={PJS}>Trung bình lớp</td>
                {[avg(filteredGrades.map(g => g.diemCC)), avg(filteredGrades.map(g => g.diemGK)), avg(filteredGrades.map(g => g.diemCK)), avg(filteredGrades.map(g => g.diemTK))].map((v, k) => (
                  <td key={k} className="px-3 py-2.5 text-center text-sm font-bold" style={{ fontFamily: "'Inter', sans-serif", color: gradeColor(v) }}>{v !== null ? v.toFixed(1) : "—"}</td>
                ))}
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-2 flex-shrink-0">
        <button onClick={handleExportGrades} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-border text-muted-foreground transition-colors hover:bg-muted" style={{ background: "#fff", ...PJS }}>
          <Download className="w-3.5 h-3.5" /> Xuất Excel
        </button>
      </div>
      {editTarget && <GradeEditModal student={editTarget} courseId={course.id} onClose={() => setEditTarget(null)} onSave={updated => { handleSaveGrade(updated); setEditTarget(null); }} />}
      {confirmLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setConfirmLock(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fff7ed" }}><Lock className="w-6 h-6 text-orange-500" /></div>
            <h3 className="text-center text-base font-bold text-foreground mb-2" style={PJS}>Khóa điểm &amp; Công bố</h3>
            <p className="text-center text-sm text-muted-foreground mb-5" style={INTER}>Sau khi khóa, điểm sẽ được công bố cho sinh viên và <strong>không thể chỉnh sửa</strong> trực tiếp. Bạn có chắc chắn?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmLock(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-card transition-colors" style={PJS}>Hủy</button>
              <button onClick={handleLockPublish} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ ...PJS, background: "#ea580c" }}>Xác nhận khóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Schedule Section ──────────────────────────────────────────────────
type AdminScheduleTab = "schedule" | "exams";

type AdminScheduleEntry = {
  id: any;
  tenMon: string;
  maMon: string;
  lop: string;
  giangVien: string;
  thu: string;
  tiet: string;
  gio: string;
  phong: string;
  tuan: string;
  hinhThuc: string;
  hocKy: number;
  namHoc: string;
};

type AdminExamEntry = ExamEntry & { id: any; namHoc?: string; hocKy?: number };

function ScheduleModal({ item, onClose, onSave }: {
  item: AdminScheduleEntry | null; onClose: () => void; onSave: (e: AdminScheduleEntry) => void;
}) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const blank: AdminScheduleEntry = {
    id: `LH_${Date.now()}`,
    tenMon: "",
    maMon: "",
    lop: "24C07",
    giangVien: "Giảng viên",
    thu: "Thứ hai",
    tiet: "1–3",
    gio: "07:30 – 10:00",
    phong: "C.42",
    tuan: "1–15",
    hinhThuc: "Trực tiếp",
    hocKy: 1,
    namHoc: "25-26",
  };
  const [form, setForm] = useState<AdminScheduleEntry>(item ?? blank);
  const set = (k: keyof AdminScheduleEntry, v: string | number) => setForm(p => ({ ...p, [k]: v }));
  const thuOpts = DAYS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <span className="font-bold text-white text-sm" style={PJS}>{item ? "Chỉnh sửa lịch học" : "Thêm lịch học"}</span>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tên môn học</label><input value={form.tenMon} onChange={e => set("tenMon", e.target.value)} className={iCls} placeholder="Nhập tên môn học..." /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã môn</label><input value={form.maMon} onChange={e => set("maMon", e.target.value)} className={iCls} placeholder="VD: CSC10001" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Lớp</label><input value={form.lop} onChange={e => set("lop", e.target.value)} className={iCls} placeholder="VD: 24C07" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giảng viên</label><input value={form.giangVien} onChange={e => set("giangVien", e.target.value)} className={iCls} placeholder="Tên giảng viên..." /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Thứ</label><select value={form.thu} onChange={e => set("thu", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{thuOpts.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giờ học</label><input value={form.gio} onChange={e => set("gio", e.target.value)} className={iCls} placeholder="VD: 07:30 – 10:00" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Phòng học</label><input value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} placeholder="VD: C.42" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tuần học</label><input value={form.tuan} onChange={e => set("tuan", e.target.value)} className={iCls} placeholder="VD: 1–15" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Hình thức</label><select value={form.hinhThuc} onChange={e => set("hinhThuc", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}><option value="Trực tiếp">Trực tiếp</option><option value="Trực tuyến">Trực tuyến</option></select></div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => { onSave(form); onClose(); }} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>{item ? "Lưu thay đổi" : "Thêm lịch học"}</button>
        </div>
      </div>
    </div>
  );
}

function ExamModal({ exam, onClose, onSave }: { exam: AdminExamEntry | null; onClose: () => void; onSave: (e: AdminExamEntry) => void; }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  
  const blank: AdminExamEntry = { 
    id: `LT_${Date.now()}`, 
    tenMon: "", 
    maNhom: "", 
    ngayThi: "", 
    thu: "Thứ hai", 
    ca: "Ca 1", 
    gio: "07:30 – 09:30", 
    thoiGian: "90 phút", 
    phong: "", 
    soThi: 45, 
    hinhThuc: "Tự luận" 
  };
  
  const [form, setForm] = useState<AdminExamEntry>(exam ?? blank);
  const set = (k: keyof AdminExamEntry, v: string | number) => setForm(p => ({ ...p, [k]: v }));
  const thuOpts = DAYS;
  const caMap = Object.fromEntries(CA_LABELS.map(c => [c.label, c.time]));
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <span className="font-bold text-white text-sm" style={PJS}>{exam ? "Chỉnh sửa lịch thi" : "Thêm lịch thi"}</span>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tên môn học</label><input value={form.tenMon} onChange={e => set("tenMon", e.target.value)} className={iCls} placeholder="Nhập tên môn học..." /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã nhóm / Lớp</label><input value={form.maNhom} onChange={e => set("maNhom", e.target.value)} className={iCls} placeholder="VD: 24C07" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Phòng thi</label><input value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} placeholder="VD: I.42" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngày thi (dd/mm/yyyy)</label><input value={form.ngayThi} onChange={e => set("ngayThi", e.target.value)} className={iCls} placeholder="VD: 28/11/2026" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Thứ</label><select value={form.thu} onChange={e => set("thu", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{thuOpts.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ca thi</label><select value={form.ca} onChange={e => { const c = e.target.value; set("ca", c); set("gio", caMap[c] ?? ""); }} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{Object.keys(caMap).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giờ thi</label><input value={form.gio} onChange={e => set("gio", e.target.value)} className={iCls} placeholder="VD: 07:30 – 09:30" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Thời gian làm bài</label><input value={form.thoiGian} onChange={e => set("thoiGian", e.target.value)} className={iCls} placeholder="VD: 90 phút" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Số thí sinh</label><input type="number" value={form.soThi} onChange={e => set("soThi", Number(e.target.value))} className={iCls} min={0} /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Hình thức thi</label><select value={form.hinhThuc} onChange={e => set("hinhThuc", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{["Tự luận","Trắc nghiệm","Thực hành","Vấn đáp"].map(h => <option key={h} value={h}>{h}</option>)}</select></div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => { onSave(form); onClose(); }} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>{exam ? "Lưu thay đổi" : "Thêm lịch thi"}</button>
        </div>
      </div>
    </div>
  );
}

function AdminScheduleSection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const [tab, setTab] = useState<AdminScheduleTab>("schedule");
  const [filterNamHoc, setFilterNamHoc] = useState("all");
  const [filterHK, setFilterHK] = useState<number | "all">("all");
  const [filterThu, setFilterThu] = useState("all");
  const [search, setSearch] = useState("");
  const [scheduleModal, setScheduleModal] = useState<AdminScheduleEntry | null | "new">(null);
  const [examModal, setExamModal] = useState<AdminExamEntry | null | "new">(null);

  const [classes, setClasses] = useState<AdminScheduleEntry[]>([]);
  const [exams, setExams] = useState<AdminExamEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch danh sách Lịch học từ Backend
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterNamHoc !== "all") params.append("namHoc", filterNamHoc);
      if (filterHK !== "all") params.append("hocKy", String(filterHK));
      if (filterThu !== "all") params.append("thu", filterThu);
      if (search) params.append("search", search);

      const res = await adminFetch(`/api/admin/schedule/classes?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setClasses(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch lịch học:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch danh sách Lịch thi từ Backend
  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await adminFetch(`/api/admin/schedule/exams?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setExams(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch lịch thi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "schedule") fetchClasses();
    else fetchExams();
  }, [tab, filterNamHoc, filterHK, filterThu, search]);

  // Lưu lịch học
  const handleSaveSchedule = async (entry: AdminScheduleEntry) => {
    const isEdit = classes.some(c => c.id === entry.id);
    const url = isEdit ? `/api/admin/schedule/classes/${entry.id}` : `/api/admin/schedule/classes`;
    const method = isEdit ? "PUT" : "POST";

    try {
      await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      fetchClasses();
      setScheduleModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Xóa lịch học
  const handleDeleteSchedule = async (id: any) => {
    if (!confirm("Bạn có chắc muốn xóa lịch học này?")) return;
    try {
      await adminFetch(`/api/admin/schedule/classes/${id}`, { method: "DELETE" });
      fetchClasses();
    } catch (e) {
      console.error(e);
    }
  };

  // Lưu lịch thi
  const handleSaveExam = async (entry: AdminExamEntry) => {
    const isEdit = exams.some(e => e.id === entry.id);
    const url = isEdit ? `/api/admin/schedule/exams/${entry.id}` : `/api/admin/schedule/exams`;
    const method = isEdit ? "PUT" : "POST";

    try {
      await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      fetchExams();
      setExamModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Xóa lịch thi
  const handleDeleteExam = async (id: any) => {
    if (!confirm("Bạn có chắc muốn xóa lịch thi này?")) return;
    try {
      await adminFetch(`/api/admin/schedule/exams/${id}`, { method: "DELETE" });
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {scheduleModal !== null && (
        <ScheduleModal item={scheduleModal === "new" ? null : scheduleModal} onClose={() => setScheduleModal(null)} onSave={handleSaveSchedule} />
      )}
      {examModal !== null && (
        <ExamModal exam={examModal === "new" ? null : examModal} onClose={() => setExamModal(null)} onSave={handleSaveExam} />
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-4 flex-shrink-0">
        {([["schedule", "Thời khóa biểu tuần"], ["exams", "Lịch thi"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); }}
            className="px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all"
            style={{ borderColor: tab === t ? "var(--primary)" : "transparent", color: tab === t ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "schedule" ? "Tìm theo tên môn, mã MH, phòng, GV, lớp..." : "Tìm môn thi, lớp, phòng thi..."}
            className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-card outline-none focus:border-primary" style={INTER} />
        </div>
        {tab === "schedule" && (
          <select value={filterThu} onChange={e => setFilterThu(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-card" style={PJS}>
            <option value="all">Tất cả thứ</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <button onClick={() => window.open(tab === "schedule" ? '/api/admin/schedule/classes/export' : '/api/admin/schedule/exams/export', '_blank')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted bg-card transition-colors" style={PJS}>
          <Download className="w-3.5 h-3.5" /> Xuất Excel
        </button>
        <button onClick={() => tab === "schedule" ? setScheduleModal("new") : setExamModal("new")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 bg-primary transition-opacity" style={PJS}>
          <Plus className="w-3.5 h-3.5" /> {tab === "schedule" ? "Thêm lịch học" : "Thêm lịch thi"}
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-card">
        {tab === "schedule" ? (
          <table className="w-full text-xs" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ background: "var(--primary)" }}>
                {["STT","Mã MH","Tên môn học","Lớp","Giảng viên","Thứ","Thời gian","Phòng","Tuần","Hình thức",""].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap first:pl-4" style={PJS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">Đang tải lịch học từ CSDL...</td></tr>
              ) : classes.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">Không có lịch học nào.</td></tr>
              ) : classes.map((c, i) => (
                <tr key={c.id} className="border-b border-border hover:brightness-95 transition-all" style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)" }}>
                  <td className="pl-4 pr-3 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground" style={PJS}>{c.maMon}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground" style={PJS}>{c.tenMon}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.lop}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.giangVien}</td>
                  <td className="px-3 py-2.5 font-semibold text-primary" style={PJS}>{c.thu}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.gio}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{c.phong}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.tuan}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-primary font-medium">{c.hinhThuc}</span></td>
                  <td className="px-3 py-2.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setScheduleModal(c)} className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteSchedule(c.id)} className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ background: "var(--primary)" }}>
                {["STT","Tên môn học","Mã nhóm","Ngày thi","Thứ","Ca","Giờ thi","Thời gian","Phòng","Số thí sinh","Hình thức",""].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap first:pl-4" style={PJS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">Đang tải lịch thi từ CSDL...</td></tr>
              ) : exams.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">Không có lịch thi nào.</td></tr>
              ) : exams.map((e, i) => (
                <tr key={e.id} className="border-b border-border hover:brightness-95 transition-all" style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)" }}>
                  <td className="pl-4 pr-3 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5 font-bold text-foreground" style={PJS}>{e.tenMon}</td>
                  <td className="px-3 py-2.5 text-muted-foreground font-mono">{e.maNhom}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground" style={PJS}>{e.ngayThi}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.thu}</td>
                  <td className="px-3 py-2.5 font-semibold text-primary">{e.ca}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.gio}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{e.thoiGian}</td>
                  <td className="px-3 py-2.5 font-bold text-accent">{e.phong}</td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{e.soThi}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-primary font-medium">{e.hinhThuc}</span></td>
                  <td className="px-3 py-2.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setExamModal(e)} className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteExam(e.id)} className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
// ─── Admin: Notifications Section (Quản lý Thông báo) ────────────────────────
function AdminNotificationsSection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);

  // 1. Fetch danh sách thông báo từ Backend
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/notifications?department=${encodeURIComponent(selectedDept)}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setNotifications(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch thông báo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedDept, search]);

  // 2. Xóa thông báo
  const handleDelete = async (matb: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
    try {
      const res = await adminFetch(`/api/admin/notifications/${matb}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === 'success') {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const departments = ["all", "Phòng Đào tạo", "Phòng Công tác SV", "Phòng Kế hoạch Tài chính", "Khoa CNTT"];
  const totalReads = notifications.reduce((acc, n) => acc + (n.readCount || 0), 0);
  const avgReadRate = notifications.length > 0 ? Math.round(notifications.reduce((acc, n) => acc + (n.readRate || 0), 0) / notifications.length) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 flex-shrink-0">
        {[
          { label: "Tổng số thông báo", val: notifications.length, col: "var(--primary)" },
          { label: "Đã phát hành", val: notifications.length, col: "#16a34a" },
          { label: "Tổng lượt đọc", val: totalReads, col: "var(--accent)" },
          { label: "Tỷ lệ đọc trung bình", val: `${avgReadRate}%`, col: "#2563eb" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <span className="text-2xl font-bold block mb-1" style={{ color: s.col, ...PJS }}>{s.val}</span>
            <span className="text-xs text-muted-foreground" style={INTER}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${selectedDept === d ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
              style={PJS}
            >
              {d === "all" ? "Tất cả đơn vị" : d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung..."
              className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card outline-none focus:border-primary w-60"
              style={INTER}
            />
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity bg-primary"
            style={PJS}
          >
            <Plus className="w-3.5 h-3.5" /> Tạo thông báo
          </button>
        </div>
      </div>

      {/* Danh sách thông báo */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {loading ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Đang tải danh sách thông báo...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Không tìm thấy thông báo nào.</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary" style={PJS}>
                      {n.department}
                    </span>
                    <h3 className="font-bold text-base text-foreground" style={PJS}>{n.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed" style={INTER}>
                    {n.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap" style={INTER}>
                    <span>Ngày đăng: <strong>{n.date}</strong></span>
                    <span>Đối tượng: <strong>{n.target}</strong></span>
                    <span>Đã xem: <strong>{n.readCount}/{n.totalTarget} ({n.readRate}%)</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewItem(n)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-muted"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditItem(n)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-blue-600 hover:bg-muted"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Xem chi tiết thông báo */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setViewItem(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-white">
              <div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-semibold">{viewItem.department}</span>
                <p className="text-white/70 text-xs mt-1">Đăng ngày: {viewItem.date}</p>
              </div>
              <button onClick={() => setViewItem(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <h3 className="font-bold text-lg text-foreground leading-snug" style={PJS}>{viewItem.title}</h3>
              <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/20 p-4 rounded-xl border border-border" style={INTER}>
                {viewItem.content}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Đối tượng nhận: <strong>{viewItem.target}</strong></span>
                <span>Lượt đọc: <strong>{viewItem.readCount}/{viewItem.totalTarget} sinh viên</strong></span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-border flex justify-end bg-card">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted" style={PJS}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo thông báo mới */}
      {createModal && (
        <NotificationFormModal
          onClose={() => setCreateModal(false)}
          onSaved={() => { setCreateModal(false); fetchNotifications(); }}
        />
      )}

      {/* Modal Chỉnh sửa thông báo */}
      {editItem && (
        <NotificationFormModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); fetchNotifications(); }}
        />
      )}
    </div>
  );
}

// Modal tạo / chỉnh sửa thông báo
function NotificationFormModal({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: () => void }) {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [department, setDepartment] = useState(initial?.department || "Khoa CNTT");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { alert("Vui lòng nhập tiêu đề thông báo."); return; }
    if (!content.trim()) { alert("Vui lòng nhập nội dung thông báo."); return; }

    setSubmitting(true);
    const url = isEdit ? `/api/admin/notifications/${initial.id}` : `/api/admin/notifications`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, department })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onSaved();
      } else {
        alert(data.message || "Lỗi lưu thông báo.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-white">
          <h3 className="font-bold text-base" style={PJS}>{isEdit ? "Chỉnh sửa thông báo" : "Soạn thông báo mới"}</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Tiêu đề thông báo *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề..." className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-primary" style={INTER} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Đơn vị phát hành</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" style={PJS}>
              <option value="Khoa CNTT">Khoa CNTT</option>
              <option value="Phòng Đào tạo">Phòng Đào tạo</option>
              <option value="Phòng Công tác SV">Phòng Công tác SV</option>
              <option value="Phòng Kế hoạch Tài chính">Phòng Kế hoạch Tài chính</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Nội dung thông báo *</label>
            <textarea rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập nội dung thông báo gửi đến sinh viên..." className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none outline-none focus:border-primary leading-relaxed" style={INTER} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-card">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted" style={PJS}>Hủy</button>
          <button onClick={handleSave} disabled={submitting} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50" style={PJS}>
            {submitting ? "Đang phát hành..." : (isEdit ? "Lưu thay đổi" : "Phát hành thông báo")}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Admin: Tuition Management (Quản lý Học phí) ─────────────────────────────
function AdminTuitionSection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalDue: 0,
    totalPaid: 0,
    totalDebt: 0,
    totalStudents: 0,
    paidStudents: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [search, setSearch] = useState("");
  const [detailStudent, setDetailStudent] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<{ mssv: string; item: any } | null>(null);

  // 1. Fetch dữ liệu học phí & thống kê từ Backend
  const fetchTuitionData = async () => {
  setLoading(true);
  try {
    const [resList, resStats] = await Promise.all([
      adminFetch(`/api/admin/tuition/students?status=${statusFilter}&search=${encodeURIComponent(search)}`),
      adminFetch('/api/admin/tuition/stats')
    ]);
    const dataList = await resList.json();
    const dataStats = await resStats.json();
    if (dataList.status === 'success') setStudents(dataList.data);
    if (dataStats.status === 'success') setStats(dataStats.data);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchTuitionData();
  }, [statusFilter, search]);

  // 2. Xác nhận thanh toán học phí toàn bộ cho sinh viên
  const handleConfirmPayAll = async (mssv: string) => {
    if (!confirm(`Xác nhận thu toàn bộ học phí cho sinh viên ${mssv}?`)) return;
    try {
      const res = await adminFetch(`/api/admin/tuition/students/${mssv}/pay`, { method: "POST" });
      const data = await res.json();
      if (data.status === 'success') {
        fetchTuitionData();
        if (detailStudent && detailStudent.mssv === mssv) {
          setDetailStudent(null);
        }
      } else {
        alert(data.message || "Lỗi cập nhật học phí.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối máy chủ.");
    }
  };

  // 3. Cập nhật chi tiết 1 khoản học phí
  const handleSaveEditItem = async (mssv: string, malhp: string, payload: any) => {
    try {
      const res = await adminFetch(`/api/admin/tuition/records/${mssv}/${malhp}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchTuitionData();
        setEditItem(null);
        if (detailStudent && detailStudent.mssv === mssv) {
          setDetailStudent((prev: any) => ({
            ...prev,
            items: prev.items.map((it: any) => it.malhp === malhp ? { ...it, ...payload, thucDong: payload.hocPhiGoc - payload.mucGiam } : it)
          }));
        }
      } else {
        alert(data.message || "Lỗi lưu học phí.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 flex-shrink-0">
        {[
          { label: "Tổng học phí phải thu", val: formatVND(stats.totalDue), col: "var(--primary)" },
          { label: "Đã thu", val: formatVND(stats.totalPaid), col: "#16a34a" },
          { label: "Công nợ chưa thu", val: formatVND(stats.totalDebt), col: "#dc2626" },
          { label: "Tỷ lệ hoàn thành", val: `${stats.completionRate}% (${stats.paidStudents}/${stats.totalStudents} SV)`, col: "var(--accent)" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <span className="text-xl font-bold block mb-1" style={{ color: s.col, ...PJS }}>{s.val}</span>
            <span className="text-xs text-muted-foreground" style={INTER}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {(["all", "unpaid", "paid"] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === st ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
              style={PJS}
            >
              {st === "all" ? "Tất cả" : st === "unpaid" ? "Chưa thanh toán" : "Đã thanh toán"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm MSSV, tên sinh viên..."
              className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card outline-none focus:border-primary w-64"
              style={INTER}
            />
          </div>
          <button
            onClick={() => window.open('/api/admin/tuition/export', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground bg-card"
            style={PJS}
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Table danh sách sinh viên & học phí */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs" style={{ minWidth: 850 }}>
          <thead>
            <tr style={{ background: "var(--primary)" }}>
              {["STT", "MSSV", "Họ và tên", "Khóa", "Số môn", "Tổng TC", "Học phí gốc", "Miễn giảm", "Thực đóng", "Trạng thái", "Ngày đóng", "Thao tác"].map(h => (
                <th key={h} className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap first:pl-4" style={PJS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">Đang tải dữ liệu học phí...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">Không tìm thấy sinh viên nào.</td></tr>
            ) : (
              students.map((s, i) => {
                const isPaid = s.trangThai === "Đã thanh toán";
                return (
                  <tr key={s.mssv} className="border-b border-border hover:brightness-95 transition-all" style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)" }}>
                    <td className="pl-4 pr-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-foreground" style={PJS}>{s.mssv}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground" style={PJS}>{s.hoTen}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.lop}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{s.soMon}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{s.tongTC}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{formatVND(s.hocPhiGoc)}</td>
                    <td className="px-3 py-2.5 font-mono text-amber-600">{s.mucGiam > 0 ? formatVND(s.mucGiam) : "—"}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-primary">{formatVND(s.thucDong)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-green-500" : "bg-red-500"}`} />
                        {s.trangThai}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.ngayThanhToan || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailStudent(s)}
                          className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold"
                          style={PJS}
                        >
                          Chi tiết
                        </button>
                        {!isPaid && (
                          <button
                            onClick={() => handleConfirmPayAll(s.mssv)}
                            className="px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-[11px] font-bold"
                            style={PJS}
                            title="Xác nhận thu học phí"
                          >
                            Thu tiền
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Xem chi tiết các khoản học phí của 1 sinh viên */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setDetailStudent(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-white">
              <div>
                <h3 className="font-bold text-base" style={PJS}>{detailStudent.hoTen} ({detailStudent.mssv})</h3>
                <p className="text-white/70 text-xs mt-0.5">Tổng thực đóng: {formatVND(detailStudent.thucDong)} &middot; {detailStudent.items.length} môn học phần</p>
              </div>
              <button onClick={() => setDetailStudent(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-2 font-semibold">Môn học</th>
                    <th className="pb-2 font-semibold text-center">TC</th>
                    <th className="pb-2 font-semibold text-right">Gốc</th>
                    <th className="pb-2 font-semibold text-right">Miễn giảm</th>
                    <th className="pb-2 font-semibold text-right">Thực đóng</th>
                    <th className="pb-2 font-semibold text-center">Trạng thái</th>
                    <th className="pb-2 font-semibold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detailStudent.items.map((it: any) => (
                    <tr key={it.malhp} className="hover:bg-muted/30">
                      <td className="py-2.5">
                        <div className="font-bold text-foreground" style={PJS}>{it.tenMon}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{it.maMon} &middot; Lớp: {it.malhp}</div>
                      </td>
                      <td className="py-2.5 text-center text-muted-foreground">{it.soTc}</td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">{formatVND(it.hocPhiGoc)}</td>
                      <td className="py-2.5 text-right font-mono text-amber-600">{it.mucGiam > 0 ? formatVND(it.mucGiam) : "—"}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-primary">{formatVND(it.thucDong)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.trangThai === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {it.trangThai}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => setEditItem({ mssv: detailStudent.mssv, item: it })}
                          className="p-1 rounded text-muted-foreground hover:text-blue-600"
                          title="Chỉnh sửa miễn giảm / học phí"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-card">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted"
                style={PJS}
              >
                Đóng
              </button>
              {detailStudent.trangThai !== 'Đã thanh toán' && (
                <button
                  onClick={() => handleConfirmPayAll(detailStudent.mssv)}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
                  style={PJS}
                >
                  Xác nhận thanh toán toàn bộ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa chi tiết một môn học phí */}
      {editItem && (
        <EditTuitionItemModal
          item={editItem.item}
          onClose={() => setEditItem(null)}
          onSave={payload => handleSaveEditItem(editItem.mssv, editItem.item.malhp, payload)}
        />
      )}
    </div>
  );
}

// Modal chỉnh sửa 1 môn học phí
function EditTuitionItemModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (p: any) => void }) {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

  const [hocPhiGoc, setHocPhiGoc] = useState(item.hocPhiGoc || 0);
  const [mucGiam, setMucGiam] = useState(item.mucGiam || 0);
  const [trangThai, setTrangThai] = useState(item.trangThai || "Chưa thanh toán");
  const [ghiChu, setGhiChu] = useState(item.ghiChu || "");

  const thucDong = Math.max(0, hocPhiGoc - mucGiam);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-white">
          <h3 className="font-bold text-sm" style={PJS}>{item.tenMon}</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Học phí gốc (VNĐ)</label>
            <input type="number" value={hocPhiGoc} onChange={e => setHocPhiGoc(Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Miễn giảm / Học bổng (VNĐ)</label>
            <input type="number" value={mucGiam} onChange={e => setMucGiam(Number(e.target.value))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div className="p-3 bg-muted rounded-lg flex justify-between items-center text-xs font-semibold">
            <span>Thực đóng sau giảm:</span>
            <span className="text-primary text-sm font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(thucDong)}</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Trạng thái thanh toán</label>
            <select value={trangThai} onChange={e => setTrangThai(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
              <option value="Chưa thanh toán">Chưa thanh toán</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" style={PJS}>Ghi chú</label>
            <input value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Nhập lý do miễn giảm hoặc ghi chú..." className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" style={INTER} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-card">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted" style={PJS}>Hủy</button>
          <button onClick={() => onSave({ hocPhiGoc, mucGiam, trangThai, ghiChu })} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90" style={PJS}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin App ────────────────────────────────────────────────────────────────
type AdminSection = "students" | "academic" | "survey" | "schedule" | "tuition" | "notifications";

const ADMIN_NAV: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "students",      label: "Quản lý sinh viên", icon: Users },
  { id: "academic",      label: "Quản lý học tập",   icon: BookOpen },
  { id: "survey",        label: "Khảo sát",          icon: ClipboardList },
  { id: "schedule",      label: "Lịch học / thi",    icon: CalendarDays },
  { id: "tuition",       label: "Học phí",           icon: CreditCard },
  { id: "notifications", label: "Thông báo",         icon: Bell },
];

export function AdminApp({ onLogout, HelpButton, adminProfile }: { onLogout: () => void; HelpButton: React.ComponentType; adminProfile: Account }) {
  const [section, setSection] = useState<AdminSection>("students");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [readSurveyIds, setReadSurveyIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const email = adminProfile?.email || (adminProfile as any)?.mail || "";
    if (email) {
      localStorage.setItem("user_email", email);
      (window as any).__CURRENT_ADMIN_EMAIL__ = email;
    }
  }, [adminProfile]);

  useEffect(() => {
  adminFetch('/api/admin/sidebar-badges')
    .then(res => res.json())
    .then(json => {
      if (json.status === 'success' && json.data) {
        setBadges(json.data);
      }
    })
    .catch(err => console.warn("Lỗi tải sidebar badges:", err));
}, [section]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const surveyNotifs = MOCK_ADMIN_SURVEYS.filter(s => s.status === "open" && s.responses > 0);
  const unreadNotifs = surveyNotifs.filter(s => !readSurveyIds.has(s.id));

  function handleLogout() {
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
    setTimeout(() => { setShowLogoutSuccess(false); onLogout(); }, 1600);
  }

  const sectionLabel: Record<AdminSection, string> = {
    students: "Quản lý sinh viên", academic: "Quản lý học tập", survey: "Khảo sát",
    schedule: "Lịch học / thi", tuition: "Học phí", notifications: "Thông báo",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "var(--background)" }}>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(213,179,112,0.1)" }}><LogOut className="w-7 h-7" style={{ color: "var(--accent)" }} /></div>
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</h3>
            <p className="text-sm text-muted-foreground mb-6">Bạn có chắc chắn muốn đăng xuất không?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hủy</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
      {showLogoutSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-xs flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(34,197,94,0.1)" }}><CheckCircle2 className="w-8 h-8 text-emerald-500" /></div>
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất thành công!</h3>
            <p className="text-sm text-muted-foreground">Đang chuyển về trang đăng nhập...</p>
          </div>
        </div>
      )}

      <aside className="hidden md:flex flex-shrink-0 flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-xl" style={{ width: sidebarOpen ? 220 : 56, background: "var(--primary)" }}>
        <div className="flex flex-col items-center pt-5 pb-4 px-3 flex-shrink-0">
          <SidebarLogo open={sidebarOpen} />
          {sidebarOpen && (
            <div className="text-center mt-3">
              <div className="font-bold text-white leading-tight tracking-wide text-[14px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CampUS Admin</div>
              <div className="text-xs text-white/45 mt-1.5 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TRƯỜNG ĐH KHOA HỌC TỰ NHIÊN</div>
            </div>
          )}
        </div>
        <div className="mx-3 h-px bg-card/10 flex-shrink-0" />
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            const badgeCount = badges[item.id] || 0;

            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative"
                style={{
                  background: active ? "rgba(255,255,255,0.18)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: active ? 600 : 500,
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? "#D5B370" : "inherit" }} />

                {sidebarOpen ? (
                  <>
                    <span className="flex-1 text-left text-[13px] whitespace-nowrap">{item.label}</span>
                    {/* Badge số màu vàng nổi bật */}
                    {badgeCount > 0 && (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ background: "var(--accent)" }}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </>
                ) : (
                  /* Chấm đỏ nhỏ khi thu gọn Sidebar */
                  badgeCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                  )
                )}
              </button>
            );
          })}
        </nav>
        <div className="mx-3 h-px bg-card/10 flex-shrink-0" />
        <div className="p-3 flex items-center gap-3 flex-shrink-0" style={{ justifyContent: sidebarOpen ? "flex-start" : "center" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: "var(--accent)", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {getInitials(adminProfile.name)}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{abbreviateName(adminProfile.name)}</div>
              <div className="text-xs text-white/40 truncate font-mono">{adminProfile.msid}</div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          {/* Sidebar toggle — desktop only */}
          <button onClick={() => setSidebarOpen(s => !s)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hidden md:block">
            {sidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
          </button>
          {/* Mobile: shield icon + section label */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" }}>
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sectionLabel[section]}</span>
          </div>
          {/* Desktop: breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sectionLabel[section]}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Help */}
            <HelpButton />

            {/* Admin avatar dropdown */}
            <div className="relative" ref={avatarRef}>
              <button onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:opacity-80 transition-opacity"
                style={{ background: "var(--accent)", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {getInitials(adminProfile.name)}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-4 flex items-center gap-3 border-b border-border">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0" style={{ background: "var(--accent)", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {getInitials(adminProfile.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{adminProfile.name}</p>
                      <p className="text-xs text-muted-foreground truncate font-mono">{adminProfile.msid}</p>
                    </div>
                  </div>
                  <button onClick={() => { setAvatarOpen(false); setShowLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/25 transition-colors text-destructive">
                    <LogOut className="w-4 h-4" />
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
            {/* Logout */}
            <button onClick={() => setShowLogoutConfirm(true)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive" title="Đăng xuất">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden p-3 sm:p-5 md:p-6 pb-20 md:pb-6 flex flex-col min-h-0">
          {section === "students"      && <StudentManagement />}
          {section === "survey"        && <AdminSurveySection />}
          {section === "tuition"       && <AdminTuitionSection />}
          {section === "schedule"      && <AdminScheduleSection />}
          {section === "notifications" && <AdminNotificationsSection />}
          {section === "academic"      && <AdminAcademicSection />}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
        <div className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)}
                className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2.5 px-0.5 transition-colors"
                style={{ color: active ? "#11284D" : "var(--muted-foreground)" }}>
                <Icon className="w-5 h-5" style={{ color: active ? "#D5B370" : undefined }} />
                <span className="text-[8px] font-medium leading-tight text-center w-full truncate px-0.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: active ? "#11284D" : "var(--muted-foreground)" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

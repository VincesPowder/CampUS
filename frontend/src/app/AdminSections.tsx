import React, { useState, useRef, useEffect } from "react";
import {
  User, BookOpen, ClipboardList, CalendarDays, CreditCard, Bell,
  ChevronRight, LogOut, X, ChevronsLeft, ChevronsRight,
  CheckCircle2, Search, Filter, Download, Upload, Plus, Pencil,
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
      fetch(`/api/admin/students/${student.mssv}`)
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
      const res = await fetch(`/api/admin/students/${student.mssv}`, {
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
      const res = await fetch('/api/admin/students', {
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
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      if (data.status === 'success') {
        setStudents(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch danh sách sinh viên:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch trạng thái quyền chỉnh sửa hồ sơ
  const fetchPermission = async () => {
    try {
      const res = await fetch('/api/admin/profile-edit-permission');
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
      await fetch('/api/admin/profile-edit-permission', {
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
      const res = await fetch(`/api/admin/students/${deleteTarget.mssv}`, {
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
    window.open('/api/admin/students/export', '_blank');
  };

  // 6. Nhập file CSV
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/students/import', {
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
// ─── Admin: Survey Section ────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 8); }

function AdminSurveySection() {
  type View = "list" | "create" | "edit" | "access" | "results" | "preview";
  const [view, setView]       = useState<View>("list");
  const [surveys, setSurveys] = useState<AdminSurveyItem[]>(MOCK_ADMIN_SURVEYS);
  const [activeSurvey, setActiveSurvey] = useState<AdminSurveyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSurveyItem | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [filterStatus, setFilterStatus] = useState<AdminSurveyItem["status"][]>([]);
  const [filterKhoa, setFilterKhoa]     = useState<string[]>([]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = surveys.filter(sv => {
    const matchStatus = filterStatus.length === 0 || filterStatus.includes(sv.status);
    const matchKhoa   = filterKhoa.length === 0   || sv.targetKhoa.some(k => filterKhoa.includes(k));
    return matchStatus && matchKhoa;
  });
  const hasFilter = filterStatus.length > 0 || filterKhoa.length > 0;

  const blankSurvey = (): AdminSurveyItem => ({
    id: uid(), title: "", description: "", questions: [], status: "draft",
    openFrom: "", openTo: "", targetKhoa: [], responses: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  const [draft, setDraft] = useState<AdminSurveyItem>(blankSurvey);
  const [accessDraft, setAccessDraft] = useState<AdminSurveyItem | null>(null);
  const isEditing = view === "edit";

  const statusLabel: Record<AdminSurveyItem["status"], { label: string; cls: string }> = {
    draft:  { label: "Nháp",    cls: "bg-muted text-muted-foreground" },
    open:   { label: "Đang mở", cls: "bg-green-100 text-green-700" },
    closed: { label: "Đã đóng", cls: "bg-red-50 text-red-500" },
  };

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-card";
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  function goList() { setView("list"); setActiveSurvey(null); }
  function openCreate() { setDraft(blankSurvey()); setView("create"); }
  function openEdit(sv: AdminSurveyItem) {
    setDraft({ ...sv, questions: sv.questions.map(q => ({ ...q, options: [...q.options] })) });
    setActiveSurvey(sv); setView("edit");
  }
  function openAccess(sv: AdminSurveyItem) {
    setAccessDraft({ ...sv, targetKhoa: [...sv.targetKhoa] });
    setActiveSurvey(sv); setView("access");
  }
  function openResults(sv: AdminSurveyItem) { setActiveSurvey(sv); setView("results"); }
  function openPreview(sv: AdminSurveyItem) { setActiveSurvey(sv); setView("preview"); }

  function saveDraft() {
    setSurveys(prev => {
      const exists = prev.find(s => s.id === draft.id);
      return exists ? prev.map(s => s.id === draft.id ? draft : s) : [...prev, draft];
    });
    goList();
  }
  function saveAccess() {
    if (!accessDraft) return;
    setSurveys(prev => prev.map(s => s.id === accessDraft.id ? { ...s, ...accessDraft } : s));
    goList();
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    setSurveys(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function addQuestion(type: QuestionType) {
    const q: SurveyQuestion = { id: uid(), type, text: "", options: type === "radio" || type === "checkbox" ? ["Lựa chọn 1"] : [], required: false };
    setDraft(d => ({ ...d, questions: [...d.questions, q] }));
  }
  function updateQuestion(id: string, patch: Partial<SurveyQuestion>) {
    setDraft(d => ({ ...d, questions: d.questions.map(q => q.id === id ? { ...q, ...patch } : q) }));
  }
  function removeQuestion(id: string) {
    setDraft(d => ({ ...d, questions: d.questions.filter(q => q.id !== id) }));
  }
  function moveQuestion(id: string, dir: -1 | 1) {
    setDraft(d => {
      const arr = [...d.questions];
      const i = arr.findIndex(q => q.id === id);
      if (i + dir < 0 || i + dir >= arr.length) return d;
      [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]];
      return { ...d, questions: arr };
    });
  }
  function addOption(qid: string) {
    setDraft(d => ({ ...d, questions: d.questions.map(q => q.id === qid ? { ...q, options: [...q.options, `Lựa chọn ${q.options.length + 1}`] } : q) }));
  }
  function updateOption(qid: string, oi: number, val: string) {
    setDraft(d => ({ ...d, questions: d.questions.map(q => q.id === qid ? { ...q, options: q.options.map((o, i) => i === oi ? val : o) } : q) }));
  }
  function removeOption(qid: string, oi: number) {
    setDraft(d => ({ ...d, questions: d.questions.map(q => q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== oi) } : q) }));
  }

  const BackBtn = ({ label = "Quay lại danh sách" }: { label?: string }) => (
    <button onClick={goList} className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity flex-shrink-0" style={{ color: "var(--primary)", ...PJS }}>
      <ChevronRight className="w-3.5 h-3.5 rotate-180" /> {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="font-bold text-base mb-2" style={PJS}>Xóa khảo sát?</h3>
            <p className="text-sm text-muted-foreground mb-1">Bạn có chắc chắn muốn xóa khảo sát</p>
            <p className="text-sm font-semibold text-foreground mb-5" style={PJS}>"{deleteTarget.title}"?</p>
            <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors" style={PJS}>Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#ef4444", ...PJS }}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <p className="text-sm text-muted-foreground mr-auto" style={PJS}>{filtered.length} / {surveys.length} khảo sát</p>
            <div className="relative" ref={filterRef}>
              <button onClick={() => setFilterOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${hasFilter ? "border-[#11284D] text-primary" : "border-border text-muted-foreground hover:border-border"}`}
                style={{ background: "#fff", ...PJS }}>
                <Filter className="w-3.5 h-3.5" />
                Lọc {hasFilter && <span className="ml-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--primary)" }}>{filterStatus.length + filterKhoa.length}</span>}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-xl p-4 w-64 space-y-4">
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide" style={PJS}>Trạng thái</div>
                    <div className="space-y-1.5">
                      {(["open","closed","draft"] as const).map(s => {
                        const checked = filterStatus.includes(s);
                        return (
                          <label key={s} className="flex items-center gap-2 cursor-pointer">
                            <div onClick={() => setFilterStatus(prev => checked ? prev.filter(x => x !== s) : [...prev, s])}
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${checked ? "bg-[#11284D] border-[#11284D]" : "border-border"}`}>
                              {checked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${statusLabel[s].cls}`} style={PJS}>{statusLabel[s].label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide" style={PJS}>Khoa</div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {KHOA_LIST.map(k => {
                        const checked = filterKhoa.includes(k);
                        return (
                          <label key={k} className="flex items-center gap-2 cursor-pointer">
                            <div onClick={() => setFilterKhoa(prev => checked ? prev.filter(x => x !== k) : [...prev, k])}
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${checked ? "bg-[#11284D] border-[#11284D]" : "border-border"}`}>
                              {checked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-xs text-foreground">{k}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {hasFilter && (
                    <button onClick={() => { setFilterStatus([]); setFilterKhoa([]); }} className="text-xs font-semibold text-red-400 hover:opacity-70 transition-opacity w-full text-center" style={PJS}>Xóa bộ lọc</button>
                  )}
                </div>
              )}
            </div>
            <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--primary)", ...PJS }}>
              <Plus className="w-3.5 h-3.5" /> Tạo khảo sát
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {filtered.length === 0 && (
              <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
                <p className="text-sm" style={PJS}>Không tìm thấy khảo sát nào phù hợp với bộ lọc.</p>
              </div>
            )}
            {filtered.map(sv => {
              const st = statusLabel[sv.status];
              return (
                <div key={sv.id} onClick={() => openPreview(sv)}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`} style={PJS}>{st.label}</span>
                      <span className="text-[10px] text-muted-foreground">{sv.createdAt}</span>
                    </div>
                    <div className="font-semibold text-sm text-foreground mb-0.5" style={PJS}>{sv.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{sv.description}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      <span>{sv.questions.length} câu hỏi</span>
                      {sv.responses > 0 && <span className="font-semibold text-primary">{sv.responses} phản hồi</span>}
                      {sv.targetKhoa.length > 0 && <span>{sv.targetKhoa.length === KHOA_LIST.length ? "Tất cả khoa" : sv.targetKhoa.slice(0,2).join(", ") + (sv.targetKhoa.length > 2 ? ` +${sv.targetKhoa.length - 2}` : "")}</span>}
                      {sv.openFrom && <span>{sv.openFrom} → {sv.openTo}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 self-end sm:self-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(sv)} className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors" style={PJS}>Chỉnh sửa</button>
                    <button onClick={() => openAccess(sv)} className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors" style={PJS}>Truy cập</button>
                    {sv.responses > 0 && (
                      <button onClick={() => openResults(sv)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ background: "var(--primary)", ...PJS }}>Kết quả</button>
                    )}
                    <button onClick={() => setDeleteTarget(sv)} className="px-2.5 py-1.5 rounded-lg border border-red-100 text-[11px] font-semibold text-red-400 hover:bg-red-50 transition-colors" style={PJS}>Xóa</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "preview" && activeSurvey && (
        <div className="flex-1 overflow-y-auto pr-1">
          <BackBtn />
          <div className="max-w-2xl mx-auto space-y-4 pb-8">
            <div className="bg-card border-t-4 border-[#11284D] rounded-xl p-5 border border-border shadow-sm">
              <div className="text-[11px] font-semibold text-white px-2 py-0.5 rounded mb-3 w-fit" style={{ background: "var(--primary)", ...PJS }}>Xem trước (giao diện sinh viên)</div>
              <div className="text-xl font-bold text-foreground mb-2" style={PJS}>{activeSurvey.title || "Không có tiêu đề"}</div>
              {activeSurvey.description && <p className="text-sm text-muted-foreground">{activeSurvey.description}</p>}
              <div className="text-xs text-muted-foreground mt-3">Trường Đại học Khoa học Tự nhiên, ĐHQG HCM</div>
            </div>
            {activeSurvey.questions.length === 0 && (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                <p className="text-sm" style={PJS}>Khảo sát này chưa có câu hỏi nào.</p>
              </div>
            )}
            {activeSurvey.questions.map((q, qi) => (
              <div key={q.id} className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-3">
                <div className="text-sm font-semibold text-foreground" style={PJS}>
                  {qi + 1}. {q.text || <span className="text-muted-foreground font-normal">Câu hỏi trống</span>}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </div>
                {q.type === "radio" && <div className="space-y-2 pl-1">{q.options.map((opt, oi) => (<label key={oi} className="flex items-center gap-2.5 cursor-pointer"><div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" /><span className="text-sm text-foreground">{opt}</span></label>))}</div>}
                {q.type === "checkbox" && <div className="space-y-2 pl-1">{q.options.map((opt, oi) => (<label key={oi} className="flex items-center gap-2.5 cursor-pointer"><div className="w-4 h-4 rounded border-2 border-border flex-shrink-0" /><span className="text-sm text-foreground">{opt}</span></label>))}</div>}
                {q.type === "rating" && <div className="flex gap-2 pl-1">{[1,2,3,4,5].map(s => { const c = s===1?"#E8384D":s===2?"#F4703A":s===3?"#F9C02B":s===4?"#2ABDA8":"#4BC06B"; return (<button key={s} className="w-10 h-10 rounded-full border-2 text-sm font-bold text-white transition-colors" style={{ background: c, borderColor: c }}>{s}</button>); })}</div>}
                {q.type === "text" && <textarea rows={3} placeholder="Nhập câu trả lời..." className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none transition-colors" readOnly />}
              </div>
            ))}
            {activeSurvey.questions.length > 0 && (
              <div className="flex justify-end">
                <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-white opacity-60 cursor-not-allowed" style={{ background: "var(--primary)", ...PJS }}>Gửi khảo sát</button>
              </div>
            )}
          </div>
        </div>
      )}

      {(view === "create" || view === "edit") && (
        <div className="flex-1 overflow-y-auto pr-1">
          <BackBtn label={isEditing ? "Quay lại danh sách" : "Hủy tạo mới"} />
          <div className="max-w-2xl mx-auto space-y-4 pb-8">
            <div className="bg-card border-t-4 border-[#11284D] rounded-xl p-5 shadow-sm border border-border">
              <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Tiêu đề khảo sát" className="w-full text-xl font-bold text-foreground outline-none border-b border-transparent focus:border-border pb-1 mb-3 bg-transparent" style={PJS} />
              <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                placeholder="Mô tả khảo sát (tuỳ chọn)" rows={2}
                className="w-full text-sm text-muted-foreground outline-none resize-none border-b border-transparent focus:border-border bg-transparent" />
            </div>

            {draft.questions.map((q, qi) => (
              <div key={q.id} className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <input value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })}
                      placeholder="Câu hỏi" className="w-full text-sm font-semibold text-foreground outline-none border-b border-border focus:border-primary pb-1 bg-transparent" />
                  </div>
                  <select value={q.type}
                    onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType, options: e.target.value === "radio" || e.target.value === "checkbox" ? (q.options.length ? q.options : ["Lựa chọn 1"]) : [] })}
                    className="border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-primary bg-card flex-shrink-0" style={PJS}>
                    <option value="radio">Một lựa chọn</option>
                    <option value="checkbox">Nhiều lựa chọn</option>
                    <option value="rating">Đánh giá sao</option>
                    <option value="text">Câu trả lời dài</option>
                  </select>
                </div>
                {(q.type === "radio" || q.type === "checkbox") && (
                  <div className="space-y-2 pl-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 flex-shrink-0 border border-border ${q.type === "radio" ? "rounded-full" : "rounded"}`} />
                        <input value={opt} onChange={e => updateOption(q.id, oi, e.target.value)}
                          className="flex-1 text-sm text-foreground outline-none border-b border-transparent focus:border-border bg-transparent" />
                        <button onClick={() => removeOption(q.id, oi)} className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <button onClick={() => addOption(q.id)} className="text-xs text-primary font-semibold hover:opacity-70 flex items-center gap-1" style={PJS}>
                      <Plus className="w-3 h-3" /> Thêm lựa chọn
                    </button>
                  </div>
                )}
                {q.type === "rating" && <div className="flex gap-2 pl-2">{[1,2,3,4,5].map(s => { const c = s===1?"#E8384D":s===2?"#F4703A":s===3?"#F9C02B":s===4?"#2ABDA8":"#4BC06B"; return <div key={s} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>{s}</div>; })}</div>}
                {q.type === "text" && <div className="pl-2"><div className="border-b border-border text-xs text-muted-foreground py-1">Câu trả lời dài...</div></div>}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} className="accent-[#11284D]" /> Bắt buộc
                  </label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveQuestion(q.id, -1)} disabled={qi === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5 -rotate-90 text-muted-foreground" /></button>
                    <button onClick={() => moveQuestion(q.id, 1)} disabled={qi === draft.questions.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5 rotate-90 text-muted-foreground" /></button>
                    <button onClick={() => removeQuestion(q.id)} className="p-1 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-card rounded-xl border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground text-center mb-3" style={PJS}>Thêm câu hỏi</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {([["radio","Một lựa chọn"],["checkbox","Nhiều lựa chọn"],["rating","Đánh giá sao"],["text","Câu trả lời dài"]] as const).map(([type, label]) => (
                  <button key={type} onClick={() => addQuestion(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors" style={PJS}>
                    <Plus className="w-3 h-3" />{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={goList} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
              <button onClick={saveDraft} className="px-5 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>
                {isEditing ? "Lưu thay đổi" : "Lưu nháp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "access" && accessDraft && (
        <div className="flex-1 overflow-y-auto pr-1">
          <BackBtn />
          <div className="max-w-xl mx-auto space-y-4 pb-8">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="font-bold text-base text-foreground mb-1" style={PJS}>{accessDraft.title}</div>
              <div className="text-xs text-muted-foreground mb-5">{accessDraft.questions.length} câu hỏi · {accessDraft.responses} phản hồi</div>
              <div className="mb-5">
                <div className="text-xs font-bold text-muted-foreground mb-2" style={PJS}>Trạng thái</div>
                <div className="flex gap-2">
                  {(["draft","open","closed"] as const).map(s => (
                    <button key={s} onClick={() => setAccessDraft(a => a ? { ...a, status: s } : a)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${accessDraft.status === s ? "border-[#11284D] text-primary bg-[#11284D]/5" : "border-border text-muted-foreground hover:border-border"}`}
                      style={PJS}>{statusLabel[s].label}</button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <div className="text-xs font-bold text-muted-foreground mb-2" style={PJS}>Thời gian mở – đóng</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1"><label className="text-[11px] text-muted-foreground block mb-1">Từ ngày</label><input type="date" value={accessDraft.openFrom} onChange={e => setAccessDraft(a => a ? { ...a, openFrom: e.target.value } : a)} className={inputCls} /></div>
                  <div className="flex-1"><label className="text-[11px] text-muted-foreground block mb-1">Đến ngày</label><input type="date" value={accessDraft.openTo} onChange={e => setAccessDraft(a => a ? { ...a, openTo: e.target.value } : a)} className={inputCls} /></div>
                </div>
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-muted-foreground" style={PJS}>Khoa được truy cập</div>
                  <button onClick={() => setAccessDraft(a => a ? { ...a, targetKhoa: a.targetKhoa.length === KHOA_LIST.length ? [] : [...KHOA_LIST] } : a)}
                    className="text-[11px] font-semibold text-primary hover:opacity-70 transition-opacity" style={PJS}>
                    {accessDraft.targetKhoa.length === KHOA_LIST.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="space-y-2">
                  {KHOA_LIST.map(k => {
                    const checked = accessDraft.targetKhoa.includes(k);
                    return (
                      <label key={k} className="flex items-center gap-2.5 cursor-pointer group">
                        <div onClick={() => setAccessDraft(a => a ? { ...a, targetKhoa: checked ? a.targetKhoa.filter(x => x !== k) : [...a.targetKhoa, k] } : a)}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${checked ? "bg-[#11284D] border-[#11284D]" : "border-border group-hover:border-primary/50"}`}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-sm text-foreground">{k}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button onClick={goList} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
                <button onClick={saveAccess} className="px-5 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>Lưu cài đặt</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "results" && activeSurvey && (() => {
        const results = MOCK_RESULTS[activeSurvey.id] ?? [];
        const totalResponses = activeSurvey.responses;
        return (
          <div className="flex-1 overflow-y-auto pr-1">
            <BackBtn />
            <div className="max-w-2xl mx-auto space-y-4 pb-8">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className="font-bold text-base text-foreground mb-3" style={PJS}>{activeSurvey.title}</div>
                <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                  <div><div className="text-3xl font-bold" style={{ color: "var(--primary)", ...PJS }}>{totalResponses}</div><div className="text-xs text-muted-foreground" style={PJS}>Tổng phản hồi</div></div>
                  <div className="hidden sm:block h-10 w-px bg-muted" />
                  <div><div className="text-sm font-semibold text-foreground" style={PJS}>{activeSurvey.questions.length} câu hỏi</div>{activeSurvey.openFrom && <div className="text-xs text-muted-foreground">{activeSurvey.openFrom} – {activeSurvey.openTo}</div>}</div>
                  <div className="ml-auto"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusLabel[activeSurvey.status].cls}`} style={PJS}>{statusLabel[activeSurvey.status].label}</span></div>
                </div>
              </div>
              {results.map((r, ri) => {
                const max = Math.max(...r.data.map(d => d.count), 1);
                const total = r.data.reduce((s, d) => s + d.count, 0);
                const isRating = r.question.type === "rating";
                const avgRating = isRating ? r.data.reduce((s, d, i) => s + (i + 1) * d.count, 0) / (total || 1) : 0;
                return (
                  <div key={ri} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                    <div className="text-xs text-muted-foreground mb-1">{ri + 1}. {r.question.type === "radio" ? "Một lựa chọn" : r.question.type === "checkbox" ? "Nhiều lựa chọn" : r.question.type === "rating" ? "Đánh giá sao" : "Văn bản"}</div>
                    <div className="font-semibold text-sm text-foreground mb-4" style={PJS}>{r.question.text}</div>
                    {isRating && (
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                        <div className="text-4xl font-bold" style={{ color: "var(--primary)", ...PJS }}>{avgRating.toFixed(1)}</div>
                        <div>
                          <div className="flex gap-1">{[1,2,3,4,5].map(s => (<div key={s} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: s <= Math.round(avgRating) ? "#11284D" : "#e5e7eb", color: s <= Math.round(avgRating) ? "#fff" : "#9ca3af" }}>{s}</div>))}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">{total} đánh giá</div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2.5">
                      {r.data.map((d, di) => (
                        <div key={di}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-foreground">{d.label}</span>
                            <span className="font-semibold text-muted-foreground" style={PJS}>{d.count} <span className="font-normal text-muted-foreground">({total > 0 ? Math.round(d.count / total * 100) : 0}%)</span></span>
                          </div>
                          <div className="h-6 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.count / max) * 100}%`, background: d.color, opacity: 0.85 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {results.length === 0 && (
                <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
                  <p className="text-sm" style={PJS}>Chưa có dữ liệu kết quả.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Admin: Academic / Grade Management ──────────────────────────────────────
function calcTK(cc: number | null, gk: number | null, ck: number | null): number | null {
  if (cc === null || gk === null || ck === null) return null;
  return Math.round((cc * 0.1 + gk * 0.3 + ck * 0.6) * 10) / 10;
}

function gradeColor(d: number | null): string {
  if (d === null) return "var(--muted-foreground)";
  if (d >= 5) return "#16a34a";
  return "#dc2626";
}

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
        await fetch(`/api/admin/academic/courses/${courseId}/grades/${student.mssv}`, {
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
      <label className="block text-xs font-semibold text-muted-foreground mb-1" style={PJS}>{label} <span className="font-normal text-muted-foreground">({pct})</span></label>
      <input type="number" min={0} max={10} step={0.1} value={val} onChange={e => set(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" style={INTER} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between" style={{ background: "linear-gradient(135deg,#11284D,#264B6F)" }}>
          <div><p className="text-white font-bold text-sm" style={PJS}>Chỉnh sửa điểm</p><p className="text-white/70 text-xs mt-0.5" style={INTER}>{student.mssv} — {student.hoTen}</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card/20 hover:bg-card/30 flex items-center justify-center text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {scoreInput("Điểm CC", "10%", cc, setCC)}
            {scoreInput("Điểm GK", "30%", gk, setGK)}
            {scoreInput("Điểm CK", "60%", ck, setCK)}
          </div>
          <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--background)" }}>
            <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Điểm tổng kết (tự động)</span>
            <span className="text-lg font-bold" style={{ ...PJS, color: gradeColor(tkPreview) }}>{tkPreview !== null ? tkPreview.toFixed(1) : "—"}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1" style={PJS}>Lý do chỉnh sửa <span className="text-red-500">*</span></label>
            <select value={lyDo} onChange={e => setLyDo(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-card" style={INTER}>
              <option value="">— Chọn lý do —</option>
              {lyDoOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {isOther && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1" style={PJS}>Mô tả lý do <span className="text-red-500">*</span></label>
              <textarea rows={2} value={customLyDo} onChange={e => setCustomLyDo(e.target.value)} placeholder="Nhập lý do cụ thể..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2" style={INTER} />
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-card border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:bg-muted transition-colors" style={PJS}>Hủy</button>
          <button onClick={handleSave} disabled={!canSave || submitting} className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            style={{ ...PJS, background: canSave && !submitting ? "#11284D" : "#9ca3af", cursor: canSave && !submitting ? "pointer" : "not-allowed" }}>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMonHocYearModal({ yearId, maxHK, initial, onClose, onSave }: {
  yearId: string; maxHK: number;
  initial?: AdminCourseItem | null;
  onClose: () => void;
  onSave: (course: AdminCourseItem) => void;
}) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const isEdit = !!initial;
  const [maMon, setMaMon] = useState(initial?.maMon ?? "");
  const [tenMon, setTenMon] = useState(initial?.tenMon ?? "");
  const [soTC, setSoTC] = useState(initial?.soTC ?? 3);
  const [soTiet, setSoTiet] = useState(initial?.soTiet ?? 45);
  const [hocKy, setHocKy] = useState(initial?.hocKy ?? 1);
  const [maNhom, setMaNhom] = useState(initial?.maNhom ?? "");
  const [tenNhom, setTenNhom] = useState(initial?.tenNhom ?? "");
  const [khoa, setKhoa] = useState(initial?.khoa ?? "CNTT");
  const canSave = maMon.trim() && tenMon.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <p className="font-bold text-white text-sm" style={PJS}>{isEdit ? "Chỉnh sửa môn học" : "Thêm môn học vào năm học"}</p>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Mã môn *</label>
              <input value={maMon} onChange={e => setMaMon(e.target.value.toUpperCase())} placeholder="VD: CSC10006" className={iCls} disabled={isEdit} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Học kỳ *</label>
              <select value={hocKy} onChange={e => setHocKy(Number(e.target.value))} className={iCls} style={PJS}>
                {Array.from({ length: maxHK }, (_, i) => i + 1).map(hk => (
                  <option key={hk} value={hk}>Học kỳ {hk}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Tên môn học *</label>
            <input value={tenMon} onChange={e => setTenMon(e.target.value)} placeholder="VD: Cơ sở dữ liệu" className={iCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Số TC</label>
              <input type="number" value={soTC} min={1} max={8} onChange={e => setSoTC(Number(e.target.value))} className={iCls} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Số tiết</label>
              <input type="number" value={soTiet} min={1} onChange={e => setSoTiet(Number(e.target.value))} className={iCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Mã nhóm</label>
              <input value={maNhom} onChange={e => setMaNhom(e.target.value)} placeholder="VD: L01" className={iCls} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Tên nhóm</label>
              <input value={tenNhom} onChange={e => setTenNhom(e.target.value)} placeholder="VD: Nhóm 1" className={iCls} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Khoa</label>
            <input value={khoa} onChange={e => setKhoa(e.target.value)} placeholder="VD: CNTT" className={iCls} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors" style={PJS}>Huỷ</button>
          <button disabled={!canSave} onClick={() => onSave({ ...(initial ?? { id: `c${Date.now()}`, lop: maNhom || "24C01", giangVien: "Giảng viên", emailGV: "", soSV: 0, status: "pending" as const }), maMon: maMon.trim(), tenMon: tenMon.trim(), soTC, soTiet, hocKy, maNhom: maNhom.trim(), tenNhom: tenNhom.trim(), khoa, namHoc: yearId })}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "var(--primary)", ...PJS }}>
            {isEdit ? "Lưu thay đổi" : "Thêm môn học"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [status, setStatus] = useState<AcademicYear["status"]>(year?.status ?? "open");

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
                    style={{ background: status === s ? cfg.color + "18" : "#fff", borderColor: status === s ? cfg.color : "var(--border)", color: status === s ? cfg.color : "var(--muted-foreground)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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

function AdminAcademicSection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
  const PRIMARY = "#11284D";

  const [activeTab, setActiveTab] = useState<"courses" | "years">("courses");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearModal, setYearModal] = useState<AcademicYear | null | "new">(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [yearHkFilter, setYearHkFilter] = useState<number | "all">("all");
  const [yearSearch, setYearSearch] = useState("");
  const [addMonHocModal, setAddMonHocModal] = useState(false);
  const [editYearCourse, setEditYearCourse] = useState<AdminCourseItem | null>(null);
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

      const res = await fetch(`/api/admin/academic/courses?${params.toString()}`);
      const data = await res.json();
      if (data.status === "success") {
        setCourses(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch danh sách môn học:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch danh sách năm học từ Database
  const fetchYears = async () => {
    try {
      const res = await fetch('/api/admin/academic/years');
      const data = await res.json();
      if (data.status === "success") {
        setAcademicYears(data.data);
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
      const res = await fetch(`/api/admin/academic/courses/${course.id}/grades`);
      const data = await res.json();
      if (data.status === "success") {
        setGrades(data.data);
      }
    } catch (e) {
      console.error("Lỗi fetch điểm lớp học phần:", e);
    } finally {
      setLoading(false);
      setGradeSearch("");
      setScreen("detail");
    }
  }

  async function handleLockPublish() {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/academic/courses/${selectedCourse.id}/lock`, { method: "POST" });
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
    window.open(`/api/admin/academic/courses/${selectedCourse.id}/export-grades`, '_blank');
  };

  // Hàm statusBadge an toàn tuyệt đối với mọi dữ liệu
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
            style={{ background: cfg?.bg || "#f3f4f6", color: cfg?.text || "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg?.dot || "#9ca3af" }} />
        {cfg?.label || "Đang chờ"}
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
      
      await fetch(url, {
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
      await fetch(`/api/admin/academic/years/${id}`, {
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
      await fetch(`/api/admin/academic/years/${id}`, {
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
    const pending  = filtered.filter(c => c.status === "pending").length;
    const uploaded = filtered.filter(c => c.status === "uploaded").length;
    const locked   = filtered.filter(c => c.status === "locked").length;

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

        {/* Môn học & Điểm tab */}
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

        {/* Năm học tab */}
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
                      {["Năm học", "Mã", "Ngày bắt đầu", "Ngày kết thúc", "Số HK", "Trạng thái", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-white font-semibold whitespace-nowrap" style={PJS}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.map((y, i) => (
                      <tr key={y.id} className="border-b border-border hover:brightness-[0.97] transition-all" style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)" }}>
                        <td className="px-4 py-3 font-bold text-foreground" style={PJS}>{y.label}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{y.id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{y.ngayBatDau || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{y.ngayKetThuc || "—"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{y.soHocKy}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${y.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {y.status === "open" ? "Mở" : "Đóng"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setYearModal(y)} title="Chỉnh sửa" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {y.status !== "open" && (
                              <button onClick={() => setCurrentYear(y.id)} title="Mở năm học" className="p-1.5 rounded-md hover:bg-green-50 text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {y.status !== "closed" && (
                              <button onClick={() => closeYear(y.id)} title="Đóng năm học" className="p-1.5 rounded-md hover:bg-muted text-gray-500">
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View Chi tiết bảng điểm của Lớp học phần
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
type AdminExamEntry = ExamEntry & { id: number };



function ExamModal({ exam, onClose, onSave }: { exam: AdminExamEntry | null; onClose: () => void; onSave: (e: AdminExamEntry) => void; }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const blank: AdminExamEntry = { 
      id: Date.now(), 
      tenMon: "", 
      maNhom: "", 
      ngayThi: "", 
      thu: "Thứ hai", 
      ca: "Ca 1", 
      gio: "07:30 – 09:30", 
      thoiGian: "90 phút", 
      phong: "", 
      soThi: 0, 
      hinhThuc: "Tự luận" 
    };  const [form, setForm] = useState<AdminExamEntry>(exam ?? blank);
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
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tên môn học</label><input value={form.tenMon} onChange={e => set("tenMon", e.target.value)} className={iCls} placeholder="Nhập tên môn..." /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã nhóm / Lớp</label><input value={form.maNhom} onChange={e => set("maNhom", e.target.value)} className={iCls} placeholder="VD: 24C07" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Phòng thi</label><input value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} placeholder="VD: I.42" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngày thi (dd/mm/yyyy)</label><input value={form.ngayThi} onChange={e => set("ngayThi", e.target.value)} className={iCls} placeholder="VD: 28/11/2025" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Thứ</label><select value={form.thu} onChange={e => set("thu", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{thuOpts.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ca thi</label><select value={form.ca} onChange={e => { const c = e.target.value; set("ca", c); set("gio", caMap[c] ?? ""); }} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{Object.keys(caMap).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giờ thi</label><input value={form.gio} onChange={e => set("gio", e.target.value)} className={iCls} readOnly style={{ background: "#f8fafc", color: "var(--muted-foreground)" }} /></div>
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

function TKBSlotModal({ onClose, onSave, maxWeeks }: { onClose: () => void; onSave: (day: number, ca: number, entry: TKBEntry, tuanBatDau: number, tuanKetThuc: number) => void; maxWeeks: number; }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const [form, setForm] = useState({ maMon: "", tenMon: "", maNhom: "", tiet: "1–5", gv: "", email: "", phong: "", ngonNgu: "Tiếng Việt", hinhThuc: "TẬP TRUNG" as HinhThuc, isLab: false, span: 2 });
  const [day, setDay] = useState(0);
  const [ca, setCa] = useState(0);
  const [tuanBatDau, setTuanBatDau] = useState(1);
  const [tuanKetThuc, setTuanKetThuc] = useState(Math.min(10, maxWeeks));
  const DAYS_OPT = DAYS.slice(0, 6);
  const CA_OPT   = CA_LABELS.map(c => `${c.label} (${c.time})`);
  const htOpts = Object.keys(HINH_THUC_STYLE).filter(h => h !== "NGHỈ") as HinhThuc[];
  const set = (k: string, v: string | boolean | number) => setForm(p => ({ ...p, [k]: v }));
  const soTuan = tuanKetThuc - tuanBatDau + 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <span className="font-bold text-white text-sm" style={PJS}>Thêm môn học vào TKB</span>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã môn</label><input value={form.maMon} onChange={e => set("maMon", e.target.value.toUpperCase())} className={iCls} placeholder="VD: CSC10003" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã nhóm / Lớp</label><input value={form.maNhom} onChange={e => set("maNhom", e.target.value)} className={iCls} placeholder="VD: 24C07" /></div>
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tên môn học</label><input value={form.tenMon} onChange={e => set("tenMon", e.target.value)} className={iCls} placeholder="Nhập tên môn..." /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngày trong tuần</label><select value={day} onChange={e => setDay(Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{DAYS_OPT.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ca học</label><select value={ca} onChange={e => setCa(Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{CA_OPT.map((c, i) => <option key={i} value={i}>{c}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Phòng học</label><input value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} placeholder="VD: I.32" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giảng viên</label><input value={form.gv} onChange={e => set("gv", e.target.value)} className={iCls} placeholder="Họ tên viết tắt" /></div>
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Email GV</label><input value={form.email} onChange={e => set("email", e.target.value)} className={iCls} placeholder="gv@hcmus.edu.vn" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Hình thức</label><select value={form.hinhThuc} onChange={e => set("hinhThuc", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{htOpts.map(h => <option key={h} value={h}>{HINH_THUC_STYLE[h].label}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngôn ngữ</label><select value={form.ngonNgu} onChange={e => set("ngonNgu", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}><option value="Tiếng Việt">Tiếng Việt</option><option value="Tiếng Anh">Tiếng Anh</option></select></div>
          <div className="flex items-center gap-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isLab} onChange={e => set("isLab", e.target.checked)} className="accent-[#11284D]" /><span className="text-sm text-muted-foreground" style={PJS}>Thực hành (TH)</span></label></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Số ca chiếm (span)</label><select value={form.span} onChange={e => set("span", Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}><option value={1}>1 ca</option><option value={2}>2 ca (Ca đôi)</option></select></div>
          <div className="col-span-2 pt-2 border-t border-border">
            <label className="text-[11px] font-semibold text-muted-foreground block mb-2" style={PJS}>
              Khoảng tuần học áp dụng
              <span className="ml-1.5 font-normal">({soTuan} tuần · tối đa tuần {maxWeeks})</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">Từ tuần</label>
                <input type="number" min={1} max={maxWeeks} value={tuanBatDau}
                  onChange={e => { const v = Math.min(maxWeeks, Math.max(1, Number(e.target.value))); setTuanBatDau(v); if (tuanKetThuc < v) setTuanKetThuc(v); }}
                  className={iCls} />
              </div>
              <div className="pt-4 text-muted-foreground font-bold">→</div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">Đến tuần</label>
                <input type="number" min={tuanBatDau} max={maxWeeks} value={tuanKetThuc}
                  onChange={e => setTuanKetThuc(Math.min(maxWeeks, Math.max(tuanBatDau, Number(e.target.value))))}
                  className={iCls} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => {
            if (!form.tenMon.trim()) return;
            const tietMap: Record<number, string> = { 0: "1–5", 1: "3–5", 2: "6–10", 3: "8–10" };
            onSave(day, ca, { ...form, tiet: tietMap[ca] ?? "1–5" } as TKBEntry, tuanBatDau, tuanKetThuc);
            onClose();
          }} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>
            Thêm vào TKB
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSlotModal({ dayIdx, caIdx, entry, onClose, onSave }: {
  dayIdx: number; caIdx: number; entry: TKBEntry;
  onClose: () => void; onSave: (e: TKBEntry) => void;
}) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const [form, setForm] = useState<TKBEntry>({ ...entry });
  const htOpts = Object.keys(HINH_THUC_STYLE) as HinhThuc[];
  const set = (k: keyof TKBEntry, v: string | boolean | number) => setForm(p => ({ ...p, [k]: v }));
  const DAYS_LABEL = DAYS;
  const CA_LABEL   = CA_LABELS.map(c => `${c.label} · ${c.time}`);
  const isNghi = form.hinhThuc === "NGHỈ";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <div>
            <span className="font-bold text-white text-sm" style={PJS}>Chỉnh sửa tiết học</span>
            <div className="text-xs text-white/60 mt-0.5">{DAYS_LABEL[dayIdx]} · {CA_LABEL[caIdx]}</div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tên môn học</label><input value={form.tenMon} onChange={e => set("tenMon", e.target.value)} className={iCls} /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã nhóm / Lớp</label><input value={form.maNhom} onChange={e => set("maNhom", e.target.value)} className={iCls} /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Phòng học</label><input value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giảng viên</label><input value={form.gv} onChange={e => set("gv", e.target.value)} className={iCls} /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Email GV</label><input value={form.email} onChange={e => set("email", e.target.value)} className={iCls} /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Hình thức</label>
            <select value={form.hinhThuc} onChange={e => set("hinhThuc", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>
              {htOpts.map(h => <option key={h} value={h}>{HINH_THUC_STYLE[h].label}</option>)}
            </select>
          </div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngôn ngữ</label>
            <select value={form.ngonNgu} onChange={e => set("ngonNgu", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>
              <option>Tiếng Việt</option><option>Tiếng Anh</option>
            </select>
          </div>
          <div className="flex items-center gap-3 col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.isLab} onChange={e => set("isLab", e.target.checked)} className="accent-[#11284D]" />
              <span className="text-sm text-muted-foreground" style={PJS}>Thực hành (TH)</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => { if (isNghi || form.tenMon.trim()) { onSave(form); onClose(); } }}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}



function AdminScheduleSection() {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const [tab, setTab] = useState<"tkb" | "thi">("tkb");
  const [exams, setExams] = useState<AdminExamEntry[]>(EXAM_DATA.map((e, i) => ({ ...e, id: i + 1 })));
  const [examModal, setExamModal] = useState<AdminExamEntry | null | "new">(null);
  const [deleteExam, setDeleteExam] = useState<AdminExamEntry | null>(null);
  const [examSearch, setExamSearch] = useState("");
  const filteredExams = exams.filter(e => {
    const q = examSearch.toLowerCase();
    return !q || e.tenMon.toLowerCase().includes(q) || e.maNhom.toLowerCase().includes(q) || e.phong.toLowerCase().includes(q);
  });

  function saveExam(e: AdminExamEntry) {
    setExams(prev => {
      const exists = prev.find(x => x.id === e.id);
      return exists ? prev.map(x => x.id === e.id ? e : x) : [...prev, e];
    });
  }
  function removeExam(id: number) { setExams(prev => prev.filter(e => e.id !== id)); setDeleteExam(null); }

  const [tuan, setTuan] = useState(1);
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [filterLop, setFilterLop] = useState("Tất cả");
  const [filterTKBKhoa, setFilterTKBKhoa] = useState("Tất cả");
  const [tkbEditMode, setTkbEditMode] = useState(false);
  const [tkbData, setTkbData] = useState<Record<number, Record<number, TKBCell[]>>>({});
  const [deleteSlotConfirm, setDeleteSlotConfirm] = useState<{ day: number; ca: number; tenMon: string } | null>(null);
  const [editSlotTarget, setEditSlotTarget] = useState<{ day: number; ca: number; entry: TKBEntry } | null>(null);
  const [localLopInfo, setLocalLopInfo] = useState<Record<string, { khoa: string; data: Record<number, Record<number, TKBCell[]>> }>>({ ...LOP_INFO });

  const allTKBKhoa = ["Tất cả", ...Array.from(new Set(Object.values(localLopInfo).map(l => l.khoa)))];
  const allLops = ["Tất cả", ...Object.keys(localLopInfo).filter(lop =>
    filterTKBKhoa === "Tất cả" || localLopInfo[lop].khoa === filterTKBKhoa
  )];

  useEffect(() => {
    if (filterLop === "Tất cả") { setTkbData({}); return; }
    const raw = localLopInfo[filterLop]?.data ?? {};
    const sorted = Object.keys(raw).map(Number).sort((a, b) => a - b);
    const remapped: Record<number, Record<number, TKBCell[]>> = {};
    sorted.forEach((k, i) => { remapped[i + 1] = raw[k]; });
    setTkbData(remapped);
    setTuan(1);
  }, [filterLop, localLopInfo]);

  const weekData = tkbData[tuan] ?? {};
  const dates    = getWeekDates(tuan);
  const TODAY_DAY = 1;

  function handleRemoveSlot(day: number, ca: number) {
    const cell = weekData[day]?.[ca];
    const entry = (cell && cell !== "span") ? cell as TKBEntry : null;
    if (entry) setDeleteSlotConfirm({ day, ca, tenMon: entry.tenMon });
  }
  function confirmDeleteSlot() {
    if (deleteSlotConfirm) { removeSlot(deleteSlotConfirm.day, deleteSlotConfirm.ca); setDeleteSlotConfirm(null); }
  }
  function saveEditSlot(updated: TKBEntry) {
    if (!editSlotTarget) return;
    setTkbData(prev => {
      const week = { ...(prev[tuan] ?? {}) };
      const row  = [...(week[editSlotTarget.day] ?? [null, null, null, null])];
      row[editSlotTarget.ca] = updated;
      week[editSlotTarget.day] = row;
      return { ...prev, [tuan]: week };
    });
  }

  function addSlot(day: number, ca: number, entry: TKBEntry, tuanBatDau: number, tuanKetThuc: number) {
    setTkbData(prev => {
      const updated = { ...prev };
      for (let t = tuanBatDau; t <= tuanKetThuc; t++) {
        if (!updated[t]) continue;
        const week = { ...updated[t] };
        const row = [...(week[day] ?? [null, null, null, null])] as TKBCell[];
        row[ca] = entry;
        if (entry.span === 2 && ca + 1 < 4) row[ca + 1] = "span";
        week[day] = row;
        updated[t] = week;
      }
      return updated;
    });
  }
  function removeSlot(day: number, ca: number) {
    setTkbData(prev => {
      const week = { ...(prev[tuan] ?? {}) };
      const row  = [...(week[day] ?? [null, null, null, null])];
      const entry = row[ca] as TKBEntry | null;
      row[ca] = null;
      if (entry?.span === 2 && ca + 1 < 4 && row[ca + 1] === "span") row[ca + 1] = null;
      week[day] = row;
      return { ...prev, [tuan]: week };
    });
  }

  const visibleWeekData: Record<number, TKBCell[]> = {};
  Object.entries(weekData).forEach(([d, slots]) => {
    const dayIdx = Number(d);
    if (filterLop === "Tất cả") { visibleWeekData[dayIdx] = slots; }
    else { visibleWeekData[dayIdx] = slots.map(cell => { if (!cell || cell === "span") return cell; return (cell as TKBEntry).maNhom === filterLop ? cell : null; }) as TKBCell[]; }
  });

  // Collect all scheduled slots for the selector row in edit mode
  const weekSlotsList: { day: number; ca: number; entry: TKBEntry }[] = [];
  Object.entries(visibleWeekData).forEach(([d, slots]) => {
    slots.forEach((cell, caIdx) => {
      if (cell && cell !== "span") weekSlotsList.push({ day: Number(d), ca: caIdx, entry: cell as TKBEntry });
    });
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-4">
      {/* Delete slot confirmation */}
      {deleteSlotConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}><Trash2 className="w-7 h-7 text-red-400" /></div>
            <h3 className="font-bold text-base mb-2" style={PJS}>Xóa tiết học?</h3>
            <p className="text-sm text-muted-foreground mb-1">Môn: <span className="font-semibold text-foreground">{deleteSlotConfirm.tenMon}</span></p>
            <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteSlotConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card" style={PJS}>Hủy</button>
              <button onClick={confirmDeleteSlot} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#ef4444", ...PJS }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit slot modal */}
      {editSlotTarget && (
        <EditSlotModal dayIdx={editSlotTarget.day} caIdx={editSlotTarget.ca} entry={editSlotTarget.entry}
          onClose={() => setEditSlotTarget(null)} onSave={e => { saveEditSlot(e); setEditSlotTarget(null); }} />
      )}
      {deleteExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}><Trash2 className="w-7 h-7 text-red-400" /></div>
            <h3 className="font-bold text-base mb-2" style={PJS}>Xóa lịch thi?</h3>
            <p className="text-sm text-muted-foreground mb-1">Môn: <span className="font-semibold text-foreground">{deleteExam.tenMon}</span></p>
            <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteExam(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors" style={PJS}>Hủy</button>
              <button onClick={() => removeExam(deleteExam.id)} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#ef4444", ...PJS }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      {examModal !== null && <ExamModal exam={examModal === "new" ? null : examModal} onClose={() => setExamModal(null)} onSave={saveExam} />}
      {addSlotOpen && <TKBSlotModal onClose={() => setAddSlotOpen(false)} onSave={addSlot} maxWeeks={Object.keys(tkbData).length || 10} />}

      <div className="flex gap-0 border-b border-border flex-shrink-0">
        {([["tkb", "TKB Tuần"], ["thi", "Lịch thi"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all"
            style={{ borderColor: tab === id ? "#11284D" : "transparent", color: tab === id ? "#11284D" : "var(--muted-foreground)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "tkb" && (
        <div className="flex-1 flex flex-col min-h-0 gap-3 overflow-y-auto">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Khoa:</span>
              <select value={filterTKBKhoa} onChange={e => { setFilterTKBKhoa(e.target.value); setFilterLop("Tất cả"); }}
                className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif" }}>
                {allTKBKhoa.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Lớp:</span>
              <select value={filterLop} onChange={e => setFilterLop(e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                {allLops.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Tuần:</span>
              <select value={tuan} onChange={e => setTuan(Number(e.target.value))}
                className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif" }}>
                {(Object.keys(tkbData).length > 0 ? Object.keys(tkbData).map(Number).sort((a, b) => a - b) : Array.from({ length: 10 }, (_, i) => i + 1)).map(w => <option key={w} value={w}>Tuần {w}</option>)}
              </select>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground" style={{ background: "#fff", ...PJS }}>
                <Download className="w-3.5 h-3.5" /> Xuất
              </button>
              <button onClick={() => setTkbEditMode(m => !m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
                style={{ background: tkbEditMode ? "var(--primary)" : "#fff", color: tkbEditMode ? "#fff" : "var(--muted-foreground)", borderColor: tkbEditMode ? "var(--primary)" : "var(--border)", ...PJS }}>
                <Edit2 className="w-3.5 h-3.5" /> {tkbEditMode ? "Lưu" : "Chỉnh sửa"}
              </button>
              {tkbEditMode && filterLop !== "Tất cả" && (
                <button onClick={() => setAddSlotOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90" style={{ background: "var(--primary)", ...PJS }}>
                  <Plus className="w-3.5 h-3.5" /> Thêm môn học
                </button>
              )}
            </div>
          </div>

          {/* Grid or empty state */}
          {filterLop === "Tất cả" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-card rounded-xl border border-border py-16 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#eef1fb" }}>
                <CalendarDays className="w-7 h-7" style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-sm font-semibold text-foreground" style={PJS}>Chọn lớp để xem lịch học</p>
              <p className="text-xs text-muted-foreground" style={PJS}>Vui lòng chọn khoa và lớp cụ thể ở bộ lọc phía trên.</p>
            </div>
          ) : (
            <>
              {/* Slot selector row (edit mode only) */}
              {tkbEditMode && (
                <div className="flex-shrink-0 bg-card rounded-xl border border-border px-4 py-3">
                  <p className="text-[11px] font-semibold text-muted-foreground text-[#1e3a5f]" style={PJS}>Chọn môn cần chỉnh sửa: <span className="font-normal italic">Nhấn vào ô trong bảng để chỉnh sửa.</span></p>
                </div>
              )}

              <div className="bg-card rounded-xl border border-border flex flex-col">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-center gap-3 flex-wrap rounded-t-xl" style={{ background: "#1e3a5f" }}>
                  {localLopInfo[filterLop] && <>
                    <span className="text-xs font-bold text-white" style={PJS}>{localLopInfo[filterLop].khoa}</span>
                    <span className="text-white/30 text-xs">|</span>
                    <span className="text-xs font-bold text-white" style={PJS}>Lớp {filterLop}</span>
                    <span className="text-white/30 text-xs">|</span>
                  </>}
                  <span className="text-xs font-bold text-white" style={PJS}>Tuần {tuan}</span>
                  <span className="text-white/30 text-xs">|</span>
                  <span className="text-xs font-bold text-white" style={PJS}>{dates[0]} → {dates[6]}</span>
                </div>
                <TKBWeekGrid
                  weekData={visibleWeekData}
                  dates={dates}
                  todayDay={TODAY_DAY}
                  onRemoveSlot={tkbEditMode ? handleRemoveSlot : undefined}
                  onClickCell={tkbEditMode ? (day, ca, entry) => setEditSlotTarget({ day, ca, entry }) : undefined}
                />
              </div>
              <div className="flex items-center justify-between flex-shrink-0">
                <button onClick={() => { const keys = Object.keys(tkbData).map(Number).sort((a, b) => a - b); const idx = keys.indexOf(tuan); if (idx > 0) setTuan(keys[idx - 1]); }} disabled={!Object.keys(tkbData).map(Number).sort((a, b) => a - b).find((_, i, arr) => arr[i] < tuan)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground bg-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all" style={PJS}>
                  <ChevronRight className="w-4 h-4 rotate-180" /> Tuần trước
                </button>
                <button onClick={() => { const keys = Object.keys(tkbData).map(Number).sort((a, b) => a - b); const idx = keys.indexOf(tuan); if (idx < keys.length - 1) setTuan(keys[idx + 1]); }} disabled={!Object.keys(tkbData).map(Number).sort((a, b) => a - b).find((_, i, arr) => arr[i] > tuan)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground bg-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all" style={PJS}>
                  Tuần sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "thi" && (
        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={examSearch} onChange={e => setExamSearch(e.target.value)} placeholder="Tìm theo môn, lớp, phòng..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div className="hidden sm:flex flex-1" />
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground" style={{ background: "#fff", ...PJS }}><Upload className="w-4 h-4" /> Nhập</button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground" style={{ background: "#fff", ...PJS }}><Download className="w-4 h-4" /> Xuất</button>
            <button onClick={() => setExamModal("new")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--primary)", ...PJS }}>
              <Plus className="w-4 h-4" /> Thêm lịch thi
            </button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ minWidth: 780 }}>
                <thead>
                  <tr style={{ background: "var(--primary)" }}>
                    {["STT", "Môn học", "Mã Lớp", "Thứ", "Ngày thi", "Giờ thi", "Thời gian", "Phòng thi", "Hình thức", ""].map(h => (
                      <th key={h} className="px-3 py-3 text-center text-xs font-bold text-white border-r border-white/10 last:border-r-0 whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">Không có lịch thi phù hợp.</td></tr>
                  ) : filteredExams.map((ex, i) => (
                    <tr key={ex.id} className="group hover:bg-blue-100/60 transition-colors" style={{ background: i % 2 === 0 ? "#fff" : "#dde4f5" }}>
                      <td className="px-3 py-3 border-b border-border text-center font-mono text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-3 border-b border-border font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.tenMon}</td>
                      <td className="px-3 py-3 border-b border-border font-mono text-xs text-muted-foreground">{ex.maNhom}</td>
                      <td className="px-3 py-3 border-b border-border text-muted-foreground">{ex.thu}</td>
                      <td className="px-3 py-3 border-b border-border font-semibold text-foreground">{ex.ngayThi}</td>
                      <td className="px-3 py-3 border-b border-border text-muted-foreground whitespace-nowrap">{ex.gio}</td>
                      <td className="px-3 py-3 border-b border-border text-muted-foreground whitespace-nowrap">{(ex as any).thoiGian ?? ex.ca}</td>
                      <td className="px-3 py-3 border-b border-border">
                        <span className="font-bold" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.phong}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-border">
                        <span className="text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap"
                          style={{ background: EXAM_STATUS_COLORS[ex.hinhThuc]?.bg ?? "#f9fafb", color: EXAM_STATUS_COLORS[ex.hinhThuc]?.text ?? "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.hinhThuc}</span>
                      </td>
                      <td className="px-3 py-3 border-b border-border">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setExamModal(ex)} className="p-1 rounded hover:bg-muted" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} /></button>
                          <button onClick={() => setDeleteExam(ex)} className="p-1 rounded hover:bg-red-50" title="Xóa"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex-shrink-0">Hiển thị {filteredExams.length} / {exams.length} lịch thi</p>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Notifications Section ────────────────────────────────────────────
type AdminNotif = Notification & { status: "draft" | "sent" };

function NotifComposeModal({ notif, onClose, onSave }: { notif: AdminNotif | null; onClose: () => void; onSave: (n: AdminNotif) => void; }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const blankNotif = (): AdminNotif => ({ id: Date.now(), title: "", body: "", time: "Vừa xong", read: false, khoa: "", phong: "", status: "draft" });
  const [form, setForm] = useState<AdminNotif>(notif ?? blankNotif());
  const set = (k: keyof AdminNotif, v: string) => setForm(p => ({ ...p, [k]: v }));
  const khoaOpts = NOTIF_KHOA_OPTS;
  const phongOpts = NOTIF_PHONG_OPTS;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0" style={{ background: "var(--primary)" }}>
          <span className="font-bold text-white text-sm" style={PJS}>{notif ? "Chỉnh sửa thông báo" : "Tạo thô text-[#1e3a5f]ng báo mới"}</span>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Tiêu đề <span className="text-red-400">*</span></label><input value={form.title} onChange={e => set("title", e.target.value)} className={iCls} placeholder="Nhập tiêu đề thông báo..." /></div>
          <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Nội dung <span className="text-red-400">*</span></label><textarea value={form.body} onChange={e => set("body", e.target.value)} rows={5} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card resize-none transition-colors" placeholder="Nhập nội dung thông báo..." style={{ fontFamily: "'Inter', sans-serif" }} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Khoa / Bộ môn</label><select value={form.khoa} onChange={e => set("khoa", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{khoaOpts.map(k => <option key={k} value={k}>{k || "— Không chọn —"}</option>)}</select></div>
            <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Phòng / Ban</label><select value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{phongOpts.map(p => <option key={p} value={p}>{p || "— Không chọn —"}</option>)}</select></div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1" style={PJS}>Trạng thái</label>
            <div className="flex gap-2">
              {(["draft","sent"] as const).map(s => (
                <button key={s} onClick={() => set("status", s)}
                  className="flex-1 py-2 rounded-lg border text-xs font-bold transition-all"
                  style={{ borderColor: form.status === s ? "#11284D" : "#e2e8f0", background: "var(--card)", color: form.status === s ? "#11284D" : "var(--muted-foreground)", ...PJS }}>
                  {s === "draft" ? "📝 Lưu nháp" : "📤 Gửi ngay"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => { if (form.title.trim() && form.body.trim()) { onSave(form); onClose(); } }}
            disabled={!form.title.trim() || !form.body.trim()}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
            style={{ background: "var(--primary)", ...PJS }}>
            {form.status === "draft" ? "Lưu nháp" : "Gửi thông báo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminNotificationsSection() {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const [notifs, setNotifs] = useState<AdminNotif[]>(NOTIFICATIONS.map(n => ({ ...n, status: "sent" as const })));
  const [compose, setCompose] = useState<AdminNotif | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminNotif | null>(null);
  const [selected, setSelected] = useState<AdminNotif | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "draft" | "sent">("");
  const [filterKhoa, setFilterKhoa] = useState("");
  const [filterPhong, setFilterPhong] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const allKhoa  = Array.from(new Set(notifs.map(n => n.khoa).filter(Boolean))).sort();
  const allPhong = Array.from(new Set(notifs.map(n => n.phong).filter(Boolean))).sort();
  const activeFilters = [filterStatus, filterKhoa, filterPhong].filter(Boolean).length;

  const filtered = notifs.filter(n => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    const matchS = !filterStatus || n.status === filterStatus;
    const matchK = !filterKhoa  || n.khoa === filterKhoa;
    const matchP = !filterPhong || n.phong === filterPhong;
    return matchQ && matchS && matchK && matchP;
  });

  function saveNotif(n: AdminNotif) {
    setNotifs(prev => {
      const exists = prev.find(x => x.id === n.id);
      const withTime = { ...n, time: exists ? n.time : new Date().toLocaleDateString("vi-VN") + " vừa xong" };
      return exists ? prev.map(x => x.id === n.id ? withTime : x) : [withTime, ...prev];
    });
  }
  function deleteNotif(id: number) { setNotifs(prev => prev.filter(n => n.id !== id)); setDeleteTarget(null); if (selected?.id === id) setSelected(null); }

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

  const DeleteModal = () => deleteTarget ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}><Trash2 className="w-7 h-7 text-red-400" /></div>
        <h3 className="font-bold text-base mb-2" style={PJS}>Xóa thông báo?</h3>
        <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{deleteTarget.title}</p>
        <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3 w-full">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors" style={PJS}>Hủy</button>
          <button onClick={() => deleteNotif(deleteTarget.id)} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#ef4444", ...PJS }}>Xóa</button>
        </div>
      </div>
    </div>
  ) : null;

  if (selected) {
    return (
      <div className="flex-1 flex flex-col min-h-0 max-w-3xl mx-auto w-full gap-4">
        {compose !== null && <NotifComposeModal notif={compose === "new" ? null : compose} onClose={() => setCompose(null)} onSave={saveNotif} />}
        <DeleteModal />
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70" style={{ color: "var(--primary)", ...PJS }}>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Quay lại danh sách
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden flex-1">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between" style={{ background: "var(--primary)" }}>
            <h2 className="text-sm font-semibold text-white" style={PJS}>Chi tiết thông báo</h2>
            <div className="flex gap-2">
              <button onClick={() => setCompose(selected)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 text-white text-xs font-semibold hover:bg-card/25 transition-colors" style={PJS}><Pencil className="w-3.5 h-3.5" /> Chỉnh sửa</button>
              <button onClick={() => setDeleteTarget(selected)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 text-white text-xs font-semibold hover:bg-red-500/80 transition-colors" style={PJS}><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {statusBadge(selected.status)}
              {selected.khoa  && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-primary">{selected.khoa}</span>}
              {selected.phong && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fdf4ff] text-[#7c3aed]">{selected.phong}</span>}
              {!selected.read && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-card text-accent">Chưa đọc</span>}
            </div>
            <h3 className="font-bold text-base mb-2 text-foreground" style={PJS}>{selected.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selected.time}</p>
            <p className="text-sm leading-relaxed text-foreground">{selected.body}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-4">
      {compose !== null && <NotifComposeModal notif={compose === "new" ? null : compose} onClose={() => setCompose(null)} onSave={saveNotif} />}
      <DeleteModal />
      <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex-1 relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm theo tiêu đề, nội dung..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif" }} />
        </div>
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button onClick={() => setFilterOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors"
            style={{ borderColor: filterOpen || activeFilters > 0 ? "#11284D" : "#e2e8f0", background: "#fff", color: filterOpen || activeFilters > 0 ? "#11284D" : "var(--muted-foreground)", ...PJS }}>
            <Filter className="w-4 h-4" /> Bộ lọc
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: "var(--accent)" }}>{activeFilters}</span>}
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-xl p-4 w-72 space-y-4">
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Trạng thái</div>
                <div className="flex gap-2">
                  {[["", "Tất cả"], ["sent", "Đã gửi"], ["draft", "Nháp"]].map(([v, label]) => (
                    <button key={v} onClick={() => setFilterStatus(v as typeof filterStatus)} className="flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all"
                      style={{ borderColor: filterStatus === v ? "#11284D" : "#e2e8f0", background: "var(--card)", color: filterStatus === v ? "#11284D" : "var(--muted-foreground)", ...PJS }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Khoa / Bộ môn</div>
                <select value={filterKhoa} onChange={e => setFilterKhoa(e.target.value)} className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <option value="">Tất cả</option>
                  {allKhoa.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Phòng / Ban</div>
                <select value={filterPhong} onChange={e => setFilterPhong(e.target.value)} className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <option value="">Tất cả</option>
                  {allPhong.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {activeFilters > 0 && (
                <button onClick={() => { setFilterStatus(""); setFilterKhoa(""); setFilterPhong(""); }}
                  className="w-full text-xs font-semibold text-accent hover:opacity-70 transition-opacity text-center" style={PJS}>Xóa bộ lọc</button>
              )}
            </div>
          )}
        </div>
        <div className="hidden sm:flex flex-1" />
        <button onClick={() => setCompose("new")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--primary)", ...PJS }}><Plus className="w-4 h-4" /> Tạo thông báo</button>
      </div>
      <div className="flex flex-wrap gap-3 flex-shrink-0">
        {[
          { label: "Tổng", val: notifs.length, color: "var(--primary)" },
          { label: "Đã gửi", val: notifs.filter(n => n.status === "sent").length, color: "#2563eb" },
          { label: "Nháp", val: notifs.filter(n => n.status === "draft").length, color: "var(--muted-foreground)" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 flex-1 min-w-[100px]">
            <span className="text-2xl font-bold" style={{ color: s.color, ...PJS }}>{s.val}</span>
            <span className="text-xs text-muted-foreground" style={PJS}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
        <div className="overflow-auto h-full">
          <table className="w-full text-xs" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--primary)" }}>
                {["Tiêu đề","Nguồn","Thời gian","Trạng thái",""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Không có thông báo phù hợp.</td></tr>
              ) : filtered.map((n, i) => (
                <tr key={n.id} className="group hover:brightness-95 transition-all cursor-pointer"
                  style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)" }} onClick={() => setSelected(n)}>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className={`font-medium text-foreground truncate ${!n.read ? "font-semibold" : ""}`}>{n.title}</div>
                    <div className="text-muted-foreground truncate mt-0.5" style={{ fontSize: 11 }}>{n.body.slice(0, 60)}…</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {n.khoa  && <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-primary mr-1">{n.khoa}</span>}
                    {n.phong && <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#fdf4ff] text-[#7c3aed]">{n.phong}</span>}
                    {!n.khoa && !n.phong && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{n.time}</td>
                  <td className="px-4 py-3">{statusBadge(n.status)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setCompose(n)} className="p-1 rounded hover:bg-card" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} /></button>
                      <button onClick={() => setDeleteTarget(n)} className="p-1 rounded hover:bg-red-50" title="Xóa"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground flex-shrink-0">Hiển thị {filtered.length} / {notifs.length} thông báo</p>
    </div>
  );
}

// ─── Admin: Tuition Section ───────────────────────────────────────────────────
type TuitionRow = {
  stt: number; nhHk: string; maMon: string; lop: string; tenMon: string;
  soTcHocPhi: number; hocPhi: number; giam: number; hoTro: number;
  hocPhiThucDong: number; chiPhi: number; ghiChu: string;
  trangThai: string; ngayThanhToan: string; mssv: string;
};

function fmt(n: number) { return n.toLocaleString("vi-VN"); }

function AdminTuitionSection() {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  function parseNhHk(nhHk: string) {
    const m = nhHk.match(/^(\d{2}-\d{2})\/(\d)$/);
    return m ? { namHoc: m[1], hocKy: `HK${m[2]}` } : { namHoc: nhHk, hocKy: "" };
  }

  const allParsed = TUITION_DATA.map(d => ({ nhHk: d.nhHk, ...parseNhHk(d.nhHk) }));
  const uniqueYears = Array.from(new Set(allParsed.map(p => p.namHoc)));
  const ALL_HKS = TUITION_HK_LIST;
  const allNganh = ["Tất cả", ...Array.from(new Set(ADMIN_STUDENTS.map(s => s.nganh)))];

  const [selNamHoc, setSelNamHoc] = useState(uniqueYears[0]);
  const [selHocKy, setSelHocKy] = useState("HK3");
  const [selNganh, setSelNganh] = useState("Tất cả");
  const [selLop, setSelLop] = useState("Tất cả");
  const [mssvSearch, setMssvSearch] = useState("");
  const [selMssv, setSelMssv] = useState("");
  const [mssvOpen, setMssvOpen] = useState(false);
  const mssvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (mssvRef.current && !mssvRef.current.contains(e.target as Node)) setMssvOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const [allData, setAllData] = useState(() =>
    TUITION_DATA.map(d => ({
      ...d,
      rows: d.rows.map((r, i) => ({
        ...r,
        trangThai: i % 3 === 0 ? "Chưa thanh toán" : "Đã thanh toán",
        ngayThanhToan: i % 3 === 0 ? "" : "03/07/2026",
        mssv: ADMIN_STUDENTS[i % ADMIN_STUDENTS.length].mssv,
      } as TuitionRow)),
    }))
  );
  const [editRow, setEditRow] = useState<TuitionRow | null>(null);
  const [editDraft, setEditDraft] = useState<TuitionRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TuitionRow | null>(null);

  const matchNhHk = allParsed.find(p => p.namHoc === selNamHoc && p.hocKy === selHocKy)?.nhHk;
  const semData = allData.find(d => d.nhHk === matchNhHk) ?? allData[0];
  const allLops = ["Tất cả", ...Array.from(new Set(semData.rows.map(r => r.lop)))];
  const filteredMssv = ADMIN_STUDENTS.filter(s =>
    !mssvSearch || s.mssv.includes(mssvSearch) || s.hoTen.toLowerCase().includes(mssvSearch.toLowerCase())
  );

  const rows = semData.rows.filter(r =>
    (selLop === "Tất cả" || r.lop === selLop) &&
    (!selMssv || r.mssv === selMssv)
  );
  const totalTcHp     = rows.reduce((s, r) => s + r.soTcHocPhi, 0);
  const totalHocPhi   = rows.reduce((s, r) => s + r.hocPhi, 0);
  const totalGiam     = rows.reduce((s, r) => s + r.giam, 0);
  const totalHoTro    = rows.reduce((s, r) => s + r.hoTro, 0);
  const totalThucDong = rows.reduce((s, r) => s + r.hocPhiThucDong, 0);
  const totalChiPhi   = rows.reduce((s, r) => s + r.chiPhi, 0);

  function saveEditRow() {
    if (!editDraft) return;
    setAllData(prev => prev.map(d => d.nhHk !== semData.nhHk ? d : { ...d, rows: d.rows.map(r => r.stt === editDraft.stt ? editDraft : r) }));
    setEditRow(null); setEditDraft(null);
  }
  function addRow() {
    const nhHk = semData.nhHk;
    const newRow: TuitionRow = { stt: semData.rows.length + 1, nhHk, maMon: "", lop: "", tenMon: "Môn học mới", soTcHocPhi: 3, hocPhi: 0, giam: 0, hoTro: 0, hocPhiThucDong: 0, chiPhi: 0, ghiChu: "", trangThai: "Chưa thanh toán", ngayThanhToan: "", mssv: "" };
    setAllData(prev => prev.map(d => d.nhHk !== nhHk ? d : { ...d, rows: [...d.rows, newRow] }));
    setEditRow(newRow); setEditDraft({ ...newRow });
  }
  function confirmDelete() {
    if (!deleteConfirm) return;
    const nhHk = semData.nhHk;
    setAllData(prev => prev.map(d => d.nhHk !== nhHk ? d : { ...d, rows: d.rows.filter(r => r.stt !== deleteConfirm.stt).map((r, i) => ({ ...r, stt: i + 1 })) }));
    setDeleteConfirm(null);
  }

  const selCls = "border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white";
  const hdrCls = "px-2 py-2.5 font-bold text-white text-center whitespace-nowrap text-[11px] border-r border-white/10 last:border-r-0";
  const cel    = "px-2 py-0 text-center text-xs";
  const COL_W  = [40,72,190,72,110,90,90,110,95,120,110,95,56];

  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    "Đã thanh toán":   { bg: "bg-green-50",  text: "text-green-700" },
    "Chưa thanh toán": { bg: "bg-red-50",    text: "text-red-600"   },
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3">
      {/* Edit modal */}
      {editRow && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
              <span className="font-bold text-white text-sm" style={PJS}>Chỉnh sửa bản ghi học phí</span>
              <button onClick={() => { setEditRow(null); setEditDraft(null); }}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {([
                { label: "Mã môn",      key: "maMon"          as keyof TuitionRow },
                { label: "Lớp",                  key: "lop"            as keyof TuitionRow },
                { label: "Tên môn học",          key: "tenMon"         as keyof TuitionRow, full: true },
                { label: "MSSV",                 key: "mssv"           as keyof TuitionRow },
                { label: "Số TC Học Phí", key: "soTcHocPhi"  as keyof TuitionRow, num: true },
                { label: "Học Phí Gốc",          key: "hocPhi"         as keyof TuitionRow, num: true },
                { label: "Mức Giảm",   key: "giam"           as keyof TuitionRow, num: true },
                { label: "Hỗ Trợ",       key: "hoTro"          as keyof TuitionRow, num: true },
                { label: "Thực Đóng", key: "hocPhiThucDong" as keyof TuitionRow, num: true },
                { label: "Chi Phí Khác",          key: "chiPhi"         as keyof TuitionRow, num: true },
                { label: "Ghi Chú",              key: "ghiChu"         as keyof TuitionRow, full: true },
                { label: "Ngày Thanh Toán",      key: "ngayThanhToan"  as keyof TuitionRow },
              ] as { label: string; key: keyof TuitionRow; full?: boolean; num?: boolean }[]).map(f => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>{f.label}</label>
                  <input type={f.num ? "number" : "text"} value={editDraft[f.key] as string | number}
                    onChange={e => setEditDraft(prev => prev ? { ...prev, [f.key]: f.num ? Number(e.target.value) : e.target.value } : prev)}
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card transition-colors" />
                </div>
              ))}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Trạng Thái Thanh Toán</label>
                <select value={editDraft.trangThai} onChange={e => setEditDraft(p => p ? { ...p, trangThai: e.target.value } : p)}
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card">
                  <option>Đã thanh toán</option><option>Chưa thanh toán</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => { setEditRow(null); setEditDraft(null); }} className="flex-1 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
              <button onClick={saveEditRow} className="flex-1 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff1f2" }}>
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="font-bold text-base mb-2" style={PJS}>Xóa bản ghi?</h3>
            <p className="text-sm text-muted-foreground mb-1">Môn: <span className="font-semibold text-foreground">{deleteConfirm.tenMon}</span></p>
            <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors" style={PJS}>Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "#ef4444", ...PJS }}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter — row 1: Năm học, Học kỳ + actions */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={PJS}>Năm học:</span>
          <select value={selNamHoc} onChange={e => { setSelNamHoc(e.target.value); setSelLop("Tất cả"); }} className={selCls} style={PJS}>
            {uniqueYears.map(y => <option key={y} value={y}>{y.replace(/(\d{2})-(\d{2})/, "20$1–20$2")}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={PJS}>Học kỳ:</span>
          <select value={selHocKy} onChange={e => { setSelHocKy(e.target.value); setSelLop("Tất cả"); }} className={selCls} style={PJS}>
            {ALL_HKS.map(h => <option key={h} value={h}>Học kỳ {h.replace("HK", "")}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground bg-white hover:bg-muted transition-colors" style={PJS}><Upload className="w-4 h-4" /> Nhập</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground bg-white hover:bg-muted transition-colors" style={PJS}><Download className="w-4 h-4" /> Xuất</button>
          <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}><Plus className="w-4 h-4" /> Thêm dòng</button>
        </div>
      </div>

      {/* Filter — row 2: Khoa, Lớp, MSSV */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={PJS}>Khoa:</span>
          <select value={selNganh} onChange={e => setSelNganh(e.target.value)} className={selCls} style={PJS}>
            {allNganh.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={PJS}>Lớp:</span>
          <select value={selLop} onChange={e => setSelLop(e.target.value)} className={selCls} style={PJS}>
            {allLops.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2" ref={mssvRef}>
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap" style={PJS}>MSSV:</span>
          <div className="relative">
            <div className="flex items-center gap-1 border border-border rounded-lg bg-white overflow-hidden" style={{ minWidth: 220 }}>
              <Search className="w-3.5 h-3.5 text-muted-foreground ml-2 flex-shrink-0" />
              <input value={selMssv ? `${selMssv} – ${ADMIN_STUDENTS.find(s => s.mssv === selMssv)?.hoTen ?? ""}` : mssvSearch}
                onChange={e => { if (selMssv) { setSelMssv(""); setMssvSearch(""); } else { setMssvSearch(e.target.value); } setMssvOpen(true); }}
                onFocus={() => setMssvOpen(true)}
                placeholder="Tìm MSSV hoặc tên..."
                className="flex-1 px-2 py-1.5 text-sm outline-none bg-transparent" />
              {selMssv && <button onClick={() => { setSelMssv(""); setMssvSearch(""); }} className="px-2 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>}
            </div>
            {mssvOpen && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-xl w-72 max-h-48 overflow-y-auto">
                {filteredMssv.length === 0
                  ? <p className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy sinh viên.</p>
                  : filteredMssv.map(s => (
                    <button key={s.mssv} onClick={() => { setSelMssv(s.mssv); setMssvSearch(""); setMssvOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 flex items-center gap-2 transition-colors">
                      <span className="font-medium text-foreground">{s.hoTen}</span>
                      <span className="font-mono text-xs text-muted-foreground ml-auto">{s.mssv}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse", fontSize: 12, tableLayout: "auto", width: "100%" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--primary)" }}>
                {["STT","NH/HK","Mã LHP / Môn Học","Số TCHP","Học Phí Gốc","Mức Giảm","Hỗ Trợ","Thực Đóng","Chi Phí Khác","Ghi Chú","Trạng Thái TT","Ngày TT",""].map((h, idx, arr) => (
                  <th key={h} className={hdrCls} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", borderRight: idx < arr.length - 1 ? "1px solid #0a1e3a" : "none" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={13} className="py-12 text-center text-sm text-muted-foreground">Không có dữ liệu học phí.</td></tr>
              ) : rows.map((row, i) => {
                const st = STATUS_STYLE[row.trangThai] ?? { bg: "bg-gray-50", text: "text-gray-500" };
                return (
                  <tr key={row.stt} className="group hover:brightness-95 transition-all" style={{ background: i % 2 === 1 ? "#dde4f5" : "var(--card)", height: 44 }}>
                    <td className={cel + " whitespace-nowrap text-muted-foreground font-mono"}>{row.stt}</td>
                    <td className={cel + " whitespace-nowrap font-mono text-muted-foreground"}>{row.nhHk}</td>
                    <td className="px-2 py-0" style={{ minWidth: 160 }}>
                      <div className="font-mono text-[10px] text-muted-foreground leading-tight">{row.maMon}/{row.lop}</div>
                      <div className="font-medium text-foreground text-[11px] leading-tight">{row.tenMon}</div>
                    </td>
                    <td className={cel + " whitespace-nowrap"}>{row.soTcHocPhi.toFixed(2)}</td>
                    <td className={cel + " whitespace-nowrap font-medium"}>{fmt(row.hocPhi)}</td>
                    <td className={cel + " whitespace-nowrap"}>{row.giam ? fmt(row.giam) : "—"}</td>
                    <td className={cel + " whitespace-nowrap"}>{row.hoTro ? fmt(row.hoTro) : "—"}</td>
                    <td className={cel + " whitespace-nowrap font-semibold"} style={{ color: "var(--primary)" }}>{fmt(row.hocPhiThucDong)}</td>
                    <td className={cel + " whitespace-nowrap"}>{row.chiPhi ? fmt(row.chiPhi) : "—"}</td>
                    <td className={cel + " text-muted-foreground"} style={{ maxWidth: 120 }}><span className="truncate block">{row.ghiChu || "—"}</span></td>
                    <td className={cel + " whitespace-nowrap"}>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{row.trangThai}</span>
                    </td>
                    <td className={cel + " whitespace-nowrap text-muted-foreground"}>{row.ngayThanhToan || "—"}</td>
                    <td className="px-1 py-0 text-center whitespace-nowrap">
                      <div className="flex gap-0.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditRow(row); setEditDraft({ ...row }); }} className="p-1 rounded hover:bg-muted" title="Chỉnh sửa"><Pencil className="w-3 h-3" style={{ color: "var(--primary)" }} /></button>
                        <button onClick={() => setDeleteConfirm(row)} className="p-1 rounded hover:bg-red-50" title="Xóa"><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length > 0 && (
                <tr style={{ background: "#dde4f5", borderTop: "2px solid #C5CCB7", height: 40 }}>
                  <td colSpan={3} className="px-3 py-0 text-right text-xs font-bold whitespace-nowrap" style={PJS}>Tổng Cộng:</td>
                  <td className={cel + " font-bold whitespace-nowrap"}>{totalTcHp.toFixed(2)}</td>
                  <td className={cel + " font-bold whitespace-nowrap"}>{fmt(totalHocPhi)}</td>
                  <td className={cel + " font-bold whitespace-nowrap"}>{fmt(totalGiam)}</td>
                  <td className={cel + " font-bold whitespace-nowrap"}>{fmt(totalHoTro)}</td>
                  <td className={cel + " font-bold whitespace-nowrap"} style={{ color: "var(--primary)" }}>{fmt(totalThucDong)}</td>
                  <td className={cel + " font-bold whitespace-nowrap"}>{fmt(totalChiPhi)}</td>
                  <td colSpan={4} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-muted-foreground">{rows.length} bản ghi · Cập nhật: {semData.ngayCapNhat}</p>
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-2.5">
          <span className="text-sm font-semibold text-foreground" style={PJS}>Tổng thực đóng:</span>
          <span className="text-base font-bold" style={{ color: "var(--primary)", ...PJS }}>{fmt(totalThucDong)}</span>
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
            return (
              <button key={item.id} onClick={() => setSection(item.id)} title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                style={{ background: active ? "rgba(255,255,255,0.18)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: active ? 600 : 500, justifyContent: sidebarOpen ? "flex-start" : "center" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? "#D5B370" : "inherit" }} />
                {sidebarOpen && <span className="flex-1 text-left text-[13px] whitespace-nowrap">{item.label}</span>}
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
            {/* Survey notification bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: "9px" }}>
                    {unreadNotifs.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-sm" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Kết quả khảo sát</h3>
                    {unreadNotifs.length > 0 && (
                      <button onClick={() => setReadSurveyIds(new Set(surveyNotifs.map(s => s.id)))}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {surveyNotifs.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-center text-muted-foreground">Không có thông báo mới</p>
                    ) : surveyNotifs.map(s => {
                      const isUnread = !readSurveyIds.has(s.id);
                      return (
                        <div key={s.id} className="px-4 py-3 flex items-start gap-3 hover:bg-secondary/40 transition-colors cursor-pointer"
                          onClick={() => { setReadSurveyIds(prev => new Set([...prev, s.id])); setSection("survey"); setNotifOpen(false); }}>
                          {isUnread && <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />}
                          {!isUnread && <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 opacity-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Có thêm <span className="font-bold text-foreground">{s.responses}</span> lượt phản hồi</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-border px-4 py-2">
                    <button onClick={() => { setSection("survey"); setNotifOpen(false); }}
                      className="w-full text-center text-xs font-semibold py-1 hover:text-primary transition-colors"
                      style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Xem tất cả khảo sát
                    </button>
                  </div>
                </div>
              )}
            </div>
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

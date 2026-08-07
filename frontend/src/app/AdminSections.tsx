import React, { useState, useRef, useEffect } from "react";
import {
  User, BookOpen, ClipboardList, CalendarDays, CreditCard, Bell,
  ChevronRight, LogOut, X, ChevronsLeft, ChevronsRight,
  CheckCircle2, Search, Filter, Download, Upload, Plus, Pencil,
  Users, BarChart2, Shield, Trash2, Check,
  ArrowLeft, Lock, RotateCcw,
} from "lucide-react";
import {
  TKBCellCard, TKBEntry, TKBCell, ExamEntry, TKB_DATA, EXAM_DATA, DAYS, CA_LABELS,
  HINH_THUC_STYLE, getWeekDates, HinhThuc,
} from "./shared";
import {
  NOTIFICATIONS, ADMIN_STUDENTS, TUITION_DATA,
  type AdminStudent, type Notification,
  KHOA_LIST, MOCK_ADMIN_SURVEYS, MOCK_RESULTS, ACADEMIC_COURSES, makeMockGrades,
  type AdminSurveyItem, type SurveyQuestion, type QuestionType,
  type GradeStatus, type AdminCourseItem, type StudentGradeRow,
} from "../data/mockData";

// ─── Admin: Student Detail / Edit Modal ──────────────────────────────────────
type StudentModalMode = "view" | "edit";

function StudentModal({ student, mode: initMode, onClose, onSave }: {
  student: AdminStudent;
  mode: StudentModalMode;
  onClose: () => void;
  onSave: (updated: AdminStudent) => void;
}) {
  const [mode, setMode] = useState<StudentModalMode>(initMode);
  const [form, setForm] = useState<AdminStudent>({ ...student });
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const inputCls = "w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card transition-colors";

  const extra = {
    ngaySinh:   student.mssv === "24127001" ? "15/03/2006" : `${(parseInt(student.mssv.slice(-2)) % 28 + 1).toString().padStart(2,"0")}/0${(parseInt(student.mssv.slice(-1)) % 9 + 1)}/200${parseInt(student.mssv.slice(-1)) % 6 + 3}`,
    noiSinh:    ["TP. Hồ Chí Minh","Hà Nội","Đà Nẵng","Cần Thơ","Bình Dương"][parseInt(student.mssv.slice(-1)) % 5],
    cccd:       `0${student.mssv}${student.mssv.slice(-3)}`,
    sdt:        `09${student.mssv.slice(-8)}`,
    diaChi:     `${parseInt(student.mssv.slice(-2))} Nguyễn Văn Cừ, Q.5, TP. Hồ Chí Minh`,
    trangThai:  "Đang học",
    nganHang:   "Vietcombank",
    stk:        `100${student.mssv}`,
  };

  const fields: { label: string; key: keyof AdminStudent; editable?: boolean }[] = [
    { label: "Họ và tên",      key: "hoTen",       editable: true },
    { label: "MSSV",           key: "mssv",        editable: false },
    { label: "Email",          key: "email",       editable: true },
    { label: "Giới tính",      key: "gioiTinh",    editable: true },
    { label: "Khoá",           key: "khoa",        editable: true },
    { label: "Ngành",          key: "nganh",       editable: true },
    { label: "Bậc đào tạo",    key: "bacDT",       editable: true },
    { label: "Loại đào tạo",   key: "loaiDT",      editable: true },
    { label: "Chuyên ngành",   key: "chuyenNganh", editable: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0" style={{ background: "var(--primary)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 bg-card/20 text-white" style={PJS}>
            {student.hoTen.split(" ").slice(-1)[0][0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base" style={PJS}>{student.hoTen}</div>
            <div className="text-white/60 text-xs font-mono">{student.mssv}</div>
          </div>
          <div className="flex gap-2">
            {mode === "view" && (
              <button onClick={() => setMode("edit")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 text-white text-xs font-semibold hover:bg-card/25 transition-colors" style={PJS}>
                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg bg-card/15 text-white hover:bg-card/25 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "var(--primary)", ...PJS }}>
              {student.hoTen.split(" ").slice(-1)[0][0]}
            </div>
            <div>
              <div className="font-bold text-foreground text-base" style={PJS}>{student.hoTen}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{student.nganh} · {student.bacDT}</div>
              <div className="mt-1.5 flex gap-2 flex-wrap">
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700" style={PJS}>{extra.trangThai}</span>
                <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{student.loaiDT}</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Thông tin học tập</div>
              <div className="grid grid-cols-2 gap-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <div className="text-[11px] text-muted-foreground mb-1" style={PJS}>{f.label}</div>
                    {mode === "edit" && f.editable ? (
                      <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className={inputCls} />
                    ) : (
                      <div className="text-sm font-medium text-foreground">{student[f.key]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Thông tin cá nhân</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Ngày sinh",  val: extra.ngaySinh },
                  { label: "Nơi sinh",   val: extra.noiSinh },
                  { label: "CCCD",       val: extra.cccd },
                  { label: "Số điện thoại", val: extra.sdt },
                ].map(r => (
                  <div key={r.label}>
                    <div className="text-[11px] text-muted-foreground mb-1" style={PJS}>{r.label}</div>
                    {mode === "edit" ? (
                      <input defaultValue={r.val} className={inputCls} />
                    ) : (
                      <div className="text-sm font-medium text-foreground">{r.val}</div>
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="text-[11px] text-muted-foreground mb-1" style={PJS}>Địa chỉ thường trú</div>
                  {mode === "edit" ? (
                    <input defaultValue={extra.diaChi} className={inputCls} />
                  ) : (
                    <div className="text-sm font-medium text-foreground">{extra.diaChi}</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Tài khoản ngân hàng</div>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Ngân hàng", val: extra.nganHang }, { label: "Số tài khoản", val: extra.stk }].map(r => (
                  <div key={r.label}>
                    <div className="text-[11px] text-muted-foreground mb-1" style={PJS}>{r.label}</div>
                    {mode === "edit" ? (
                      <input defaultValue={r.val} className={inputCls} />
                    ) : (
                      <div className="text-sm font-medium text-foreground">{r.val}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {mode === "edit" && (
          <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <button onClick={() => setMode("view")} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
            <button onClick={() => { onSave(form); onClose(); }} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>Lưu thay đổi</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin: Student Management ───────────────────────────────────────────────
function StudentManagement() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{ khoa: string; nganh: string; bacDT: string; loaiDT: string }>({
    khoa: "", nganh: "", bacDT: "", loaiDT: "",
  });
  const [students, setStudents] = useState<AdminStudent[]>(ADMIN_STUDENTS);
  const [modal, setModal] = useState<{ student: AdminStudent; mode: StudentModalMode } | null>(null);

  const allKhoa  = Array.from(new Set(students.map(s => s.khoa)));
  const allNganh = Array.from(new Set(students.map(s => s.nganh)));
  const allBac   = Array.from(new Set(students.map(s => s.bacDT)));
  const allLoai  = Array.from(new Set(students.map(s => s.loaiDT)));

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
  const cols = ["Họ và Tên", "MSSV", "Mail", "Giới tính", "Khoá", "Bậc ĐT", "Ngành", "Loại ĐT", "Chuyên ngành"];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {modal && (
        <StudentModal
          student={modal.student}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={updated => setStudents(prev => prev.map(s => s.mssv === updated.mssv ? updated : s))}
        />
      )}
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
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium transition-colors text-muted-foreground" style={{ background: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Download className="w-4 h-4" /> Xuất
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium transition-colors text-muted-foreground" style={{ background: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Upload className="w-4 h-4" /> Nhập
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      {filterOpen && (
        <div className="mb-4 bg-card rounded-xl border border-border px-5 py-4 flex flex-wrap gap-4 items-end flex-shrink-0">
          {[
            { label: "Khoá",    key: "khoa"  as const, options: allKhoa  },
            { label: "Ngành",   key: "nganh" as const, options: allNganh },
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

      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
        <div className="overflow-auto h-full">
          <table className="w-full text-xs" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--primary)" }}>
                {cols.map(c => <th key={c} className="px-3 py-2.5 text-left font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{c}</th>)}
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={cols.length + 1} className="px-4 py-12 text-center text-muted-foreground text-sm">Không tìm thấy sinh viên phù hợp.</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.mssv} onClick={() => setModal({ student: s, mode: "view" })}
                  className="group hover:brightness-95 transition-all cursor-pointer"
                  style={{ background: "var(--card)" }}>
                  <td className="px-3 py-2.5 font-medium text-foreground">{s.hoTen}</td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.mssv}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.email}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.gioiTinh}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.khoa}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.bacDT}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.nganh}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.loaiDT}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{s.chuyenNganh}</td>
                  <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setModal({ student: s, mode: "edit" })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-card" title="Chỉnh sửa">
                      <Pencil className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 flex-shrink-0">Hiển thị {filtered.length} / {ADMIN_STUDENTS.length} sinh viên</p>
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
          <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(213,179,112,0.1)" }}>
              <Trash2 className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="font-bold text-base mb-2" style={PJS}>Xóa khảo sát?</h3>
            <p className="text-sm text-muted-foreground mb-1">Bạn có chắc chắn muốn xóa khảo sát</p>
            <p className="text-sm font-semibold text-foreground mb-5" style={PJS}>"{deleteTarget.title}"?</p>
            <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card transition-colors" style={PJS}>Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--accent)", ...PJS }}>Xóa</button>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${hasFilter ? "border-[#11284D] text-primary bg-[#11284D]/5" : "border-border text-muted-foreground hover:border-border"}`}
                style={PJS}>
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
                          <div className="h-6 bg-muted rounded-full overflow-hidden">
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
  if (d >= 8.5) return "#1d4ed8";
  if (d >= 7.0) return "#16a34a";
  if (d >= 5.5) return "#b45309";
  return "#dc2626";
}

function GradeEditModal({ student, onClose, onSave }: {
  student: StudentGradeRow; onClose: () => void;
  onSave: (updated: StudentGradeRow) => void;
}) {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
  const [cc, setCC] = useState(String(student.diemCC ?? ""));
  const [gk, setGK] = useState(String(student.diemGK ?? ""));
  const [ck, setCK] = useState(String(student.diemCK ?? ""));
  const [lyDo, setLyDo] = useState("");
  const [customLyDo, setCustomLyDo] = useState("");

  const toNum = (s: string) => s.trim() === "" ? null : parseFloat(s);
  const tkPreview = calcTK(toNum(cc), toNum(gk), toNum(ck));
  const lyDoOptions = ["Phúc khảo (Grade Appeal)","Sai sót nhập liệu (Data Entry Error)","Điểm bổ sung (Make-up Grade)","Khác (Other)"];
  const isOther = lyDo === "Khác (Other)";
  const canSave = lyDo !== "" && (!isOther || customLyDo.trim() !== "");

  function handleSave() {
    const reason = isOther ? customLyDo.trim() : lyDo;
    const ccN = toNum(cc); const gkN = toNum(gk); const ckN = toNum(ck);
    onSave({ ...student, diemCC: ccN, diemGK: gkN, diemCK: ckN, diemTK: calcTK(ccN, gkN, ckN), ghiChu: reason });
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
          <button onClick={handleSave} disabled={!canSave} className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            style={{ ...PJS, background: canSave ? "#11284D" : "#9ca3af", cursor: canSave ? "pointer" : "not-allowed" }}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}

function AdminAcademicSection() {
  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
  const PRIMARY = "#11284D";

  const [screen, setScreen] = useState<"list" | "detail">("list");
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseItem | null>(null);
  const [filterNamHoc, setFilterNamHoc] = useState("25-26");
  const [filterHK, setFilterHK] = useState<number | "all">(3);
  const [filterStatus, setFilterStatus] = useState<GradeStatus | "all">("all");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<AdminCourseItem[]>(ACADEMIC_COURSES);
  const [grades, setGrades] = useState<StudentGradeRow[]>([]);
  const [editTarget, setEditTarget] = useState<StudentGradeRow | null>(null);
  const [confirmLock, setConfirmLock] = useState(false);
  const [gradeSearch, setGradeSearch] = useState("");

  const namHocOptions = Array.from(new Set(courses.map(c => c.namHoc))).sort().reverse();
  const khoaOptions = Array.from(new Set(courses.map(c => c.khoa))).sort();

  const filtered = courses.filter(c => {
    if (c.namHoc !== filterNamHoc) return false;
    if (filterHK !== "all" && c.hocKy !== filterHK) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterKhoa !== "all" && c.khoa !== filterKhoa) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.tenMon.toLowerCase().includes(q) && !c.maMon.toLowerCase().includes(q) && !c.giangVien.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function openDetail(course: AdminCourseItem) {
    if (course.status === "pending") return;
    setSelectedCourse(course);
    setGrades(makeMockGrades(course.id));
    setGradeSearch(""); setScreen("detail");
  }

  function handleLockPublish() {
    if (!selectedCourse) return;
    const today = new Date().toLocaleDateString("vi-VN");
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, status: "locked", ngayNopDiem: today } : c));
    setSelectedCourse(prev => prev ? { ...prev, status: "locked", ngayNopDiem: today } : prev);
    setConfirmLock(false);
  }

  function handleSaveGrade(updated: StudentGradeRow) {
    setGrades(prev => prev.map(g => g.mssv === updated.mssv ? updated : g));
  }

  const statusBadge = (status: GradeStatus, small = false) => {
    const cfg = {
      pending:  { bg: "#f3f4f6", text: "#6b7280", label: "Đang chờ",   dot: "#9ca3af" },
      uploaded: { bg: "#fffbeb", text: "#b45309", label: "Đã tải lên", dot: "#f59e0b" },
      locked:   { bg: "#f0fdf4", text: "#16a34a", label: "Đã khóa",    dot: "#22c55e" },
    }[status];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}
            style={{ background: cfg.bg, color: cfg.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />{cfg.label}
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

  if (screen === "list") {
    const pending  = filtered.filter(c => c.status === "pending").length;
    const uploaded = filtered.filter(c => c.status === "uploaded").length;
    const locked   = filtered.filter(c => c.status === "locked").length;
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground" style={PJS}>Quản lý học tập</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={INTER}>Theo dõi và quản lý điểm số các lớp học phần</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Đang chờ nộp điểm", val: pending,  bg: "#f9fafb", bord: "#e5e7eb", col: "#6b7280", status: "pending"  as GradeStatus },
            { label: "Đã tải lên",         val: uploaded, bg: "#fffbeb", bord: "#fde68a", col: "#b45309", status: "uploaded" as GradeStatus },
            { label: "Đã khóa & công bố",  val: locked,   bg: "#f0fdf4", bord: "#bbf7d0", col: "#16a34a", status: "locked"   as GradeStatus },
          ].map(s => {
            const active = filterStatus === s.status;
            return (
              <button key={s.label} onClick={() => setFilterStatus(active ? "all" : s.status)}
                      className="rounded-xl border px-4 py-3 text-left transition-all hover:shadow-md"
                      style={{ background: s.bg, borderColor: active ? s.col : s.bord, boxShadow: active ? `0 0 0 2px ${s.col}33` : undefined }}>
                <p className="text-2xl font-bold" style={{ ...PJS, color: s.col }}>{s.val}</p>
                <p className="text-xs mt-0.5" style={{ ...INTER, color: active ? s.col : "#6b7280" }}>{s.label}{active ? " ✓" : ""}</p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <select value={filterNamHoc} onChange={e => setFilterNamHoc(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" style={PJS}>
            {namHocOptions.map(n => <option key={n} value={n}>Năm học {n}</option>)}
          </select>
          <select value={String(filterHK)} onChange={e => setFilterHK(e.target.value === "all" ? "all" : Number(e.target.value))} className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" style={PJS}>
            <option value="all">Tất cả học kỳ</option>
            {[1,2,3].map(h => <option key={h} value={h}>Học kỳ {h}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as GradeStatus | "all")} className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" style={PJS}>
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="uploaded">Đã tải lên</option>
            <option value="locked">Đã khóa</option>
          </select>
          <select value={filterKhoa} onChange={e => setFilterKhoa(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" style={PJS}>
            <option value="all">Tất cả khoa</option>
            {khoaOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm môn học, mã MH, giảng viên..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" style={INTER} />
          </div>
          <button onClick={() => { setSearch(""); setFilterHK(3); setFilterNamHoc("25-26"); setFilterStatus("all"); setFilterKhoa("all"); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground transition-colors px-2 py-2" style={PJS}>
            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
          </button>
        </div>
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
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-muted-foreground" style={INTER}>Không tìm thấy kết quả</td></tr>
              ) : filtered.map((c, i) => {
                const clickable = c.status !== "pending";
                return (
                  <tr key={c.id} className={`border-b border-border transition-colors ${clickable ? "cursor-pointer hover:bg-blue-50/60" : ""}`}
                      style={{ background: "var(--card)" }} onClick={() => openDetail(c)}>
                    <td className="pl-4 pr-3 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-3 font-mono font-semibold text-foreground">{c.maMon}</td>
                    <td className="px-3 py-3"><span className={`font-medium ${clickable ? "text-blue-700" : "text-foreground"}`} style={PJS}>{c.tenMon}</span></td>
                    <td className="px-3 py-3 text-muted-foreground">{c.lop}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{c.soTC}</td>
                    <td className="px-3 py-3">
                      <button onClick={e => { e.stopPropagation(); setFilterKhoa(filterKhoa === c.khoa ? "all" : c.khoa); }}
                        className="text-xs px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap"
                        style={{ borderColor: filterKhoa === c.khoa ? PRIMARY : "#e5e7eb", color: filterKhoa === c.khoa ? PRIMARY : "#6b7280", background: filterKhoa === c.khoa ? "#eef1fb" : "transparent" }}>
                        {c.khoa}
                      </button>
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
          {filtered.length} môn học &mdash; nhấn vào hàng <span className="font-medium text-amber-600">Đã tải lên</span> hoặc <span className="font-medium text-green-600">Đã khóa</span> để xem chi tiết
        </p>
      </div>
    );
  }

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
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground" style={PJS}>{course.tenMon}</h2>
              {statusBadge(course.status, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5" style={INTER}>{course.maMon} &middot; Lớp {course.lop} &middot; {course.giangVien} &middot; HK{course.hocKy} {course.namHoc}</p>
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
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-xl font-bold" style={{ ...PJS, color: s.col }}>{s.val}</p>
            <p className="text-xs text-muted-foreground mt-0.5" style={INTER}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={gradeSearch} onChange={e => setGradeSearch(e.target.value)} placeholder="Tìm MSSV hoặc tên sinh viên..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" style={INTER} />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-border text-muted-foreground transition-colors" style={{ background: "#fff", ...PJS }}>
          <Download className="w-3.5 h-3.5" /> Xuất Excel
        </button>
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
            {filteredGrades.length === 0 ? (
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
      {editTarget && <GradeEditModal student={editTarget} onClose={() => setEditTarget(null)} onSave={updated => { handleSaveGrade(updated); setEditTarget(null); }} />}
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

const EXAM_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Thực hành":  { bg: "#f0fdf4", text: "#16a34a" },
  "Tự luận":    { bg: "#fffbeb", text: "#b45309" },
  "Trắc nghiệm":{ bg: "#eff6ff", text: "#1d4ed8" },
};

function ExamModal({ exam, onClose, onSave }: { exam: AdminExamEntry | null; onClose: () => void; onSave: (e: AdminExamEntry) => void; }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const blank: AdminExamEntry = { id: Date.now(), tenMon: "", maNhom: "", ngayThi: "", thu: "Thứ hai", ca: "Ca 1", gio: "07:30 – 09:30", phong: "", soThi: 0, hinhThuc: "Tự luận" };
  const [form, setForm] = useState<AdminExamEntry>(exam ?? blank);
  const set = (k: keyof AdminExamEntry, v: string | number) => setForm(p => ({ ...p, [k]: v }));
  const thuOpts = ["Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy","Chủ nhật"];
  const caMap: Record<string, string> = { "Ca 1": "07:30 – 09:30", "Ca 2": "09:30 – 11:30", "Ca 3": "13:30 – 15:30", "Ca 4": "15:30 – 17:30" };
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

function TKBSlotModal({ onClose, onSave }: { onClose: () => void; onSave: (day: number, ca: number, entry: TKBEntry) => void; }) {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card transition-colors";
  const [form, setForm] = useState({ tenMon: "", maNhom: "", tiet: "1–5", gv: "", email: "", phong: "", ngonNgu: "Tiếng Việt", hinhThuc: "TẬP TRUNG" as HinhThuc, isLab: false, span: 2 });
  const [day, setDay] = useState(0);
  const [ca, setCa] = useState(0);
  const DAYS_OPT = ["Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"];
  const CA_OPT   = ["Ca 1 (07:30–09:30)","Ca 2 (09:30–11:30)","Ca 3 (13:30–15:30)","Ca 4 (15:30–17:30)"];
  const htOpts: HinhThuc[] = ["TẬP TRUNG","TRỰC TUYẾN","HỌC BÙ TRỰC TIẾP","HỌC BÙ TRỰC TUYẾN"];
  const set = (k: string, v: string | boolean | number) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <span className="font-bold text-white text-sm" style={PJS}>Thêm tiết học vào TKB</span>
          <button onClick={onClose}><X className="w-4 h-4 text-white/70 hover:text-white" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngày trong tuần</label><select value={day} onChange={e => setDay(Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{DAYS_OPT.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ca học</label><select value={ca} onChange={e => setCa(Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{CA_OPT.map((c, i) => <option key={i} value={i}>{c}</option>)}</select></div>
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Tên môn học</label><input value={form.tenMon} onChange={e => set("tenMon", e.target.value)} className={iCls} placeholder="Nhập tên môn..." /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Mã nhóm / Lớp</label><input value={form.maNhom} onChange={e => set("maNhom", e.target.value)} className={iCls} placeholder="VD: 24C07" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Phòng học</label><input value={form.phong} onChange={e => set("phong", e.target.value)} className={iCls} placeholder="VD: I.32" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Giảng viên</label><input value={form.gv} onChange={e => set("gv", e.target.value)} className={iCls} placeholder="Họ tên viết tắt" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Email GV</label><input value={form.email} onChange={e => set("email", e.target.value)} className={iCls} placeholder="gv@hcmus.edu.vn" /></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Hình thức</label><select value={form.hinhThuc} onChange={e => set("hinhThuc", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}>{htOpts.map(h => <option key={h} value={h}>{HINH_THUC_STYLE[h].label}</option>)}</select></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Ngôn ngữ</label><select value={form.ngonNgu} onChange={e => set("ngonNgu", e.target.value)} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}><option value="Tiếng Việt">Tiếng Việt</option><option value="Tiếng Anh">Tiếng Anh</option></select></div>
          <div className="flex items-center gap-3"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isLab} onChange={e => set("isLab", e.target.checked)} className="accent-[#11284D]" /><span className="text-sm text-muted-foreground" style={PJS}>Thực hành (TH)</span></label></div>
          <div><label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>Số ca chiếm (span)</label><select value={form.span} onChange={e => set("span", Number(e.target.value))} className={iCls} style={{ fontFamily: "'Inter', sans-serif" }}><option value={1}>1 ca</option><option value={2}>2 ca (Ca đôi)</option></select></div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
          <button onClick={() => {
            if (!form.tenMon.trim()) return;
            const tietMap: Record<number, string> = { 0: "1–5", 1: "3–5", 2: "6–10", 3: "8–10" };
            onSave(day, ca, { ...form, tiet: tietMap[ca] ?? "1–5" } as TKBEntry);
            onClose();
          }} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>
            Thêm vào TKB
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminScheduleSection() {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const [tab, setTab] = useState<"tkb" | "thi">("thi");
  const [exams, setExams] = useState<AdminExamEntry[]>(EXAM_DATA.map((e, i) => ({ ...e, id: i + 1 })));
  const [examModal, setExamModal] = useState<AdminExamEntry | null | "new">(null);
  const [deleteExam, setDeleteExam] = useState<AdminExamEntry | null>(null);
  const [examSearch, setExamSearch] = useState("");
  const [filterHinhThuc, setFilterHinhThuc] = useState("");
  const allHinhThuc = Array.from(new Set(exams.map(e => e.hinhThuc)));
  const filteredExams = exams.filter(e => {
    const q = examSearch.toLowerCase();
    const matchQ = !q || e.tenMon.toLowerCase().includes(q) || e.maNhom.toLowerCase().includes(q) || e.phong.toLowerCase().includes(q);
    const matchH = !filterHinhThuc || e.hinhThuc === filterHinhThuc;
    return matchQ && matchH;
  });

  function saveExam(e: AdminExamEntry) {
    setExams(prev => {
      const exists = prev.find(x => x.id === e.id);
      return exists ? prev.map(x => x.id === e.id ? e : x) : [...prev, e];
    });
  }
  function removeExam(id: number) { setExams(prev => prev.filter(e => e.id !== id)); setDeleteExam(null); }

  const [tuan, setTuan] = useState(28);
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [tkbData, setTkbData] = useState<Record<number, Record<number, TKBCell[]>>>({ ...TKB_DATA });
  const [filterLop, setFilterLop] = useState("Tất cả");
  const allLops = ["Tất cả", "24C04", "24C05", "24C06", "24C07"];
  const weekData = tkbData[tuan] ?? {};
  const dates    = getWeekDates(tuan);
  const TODAY_DAY = 1;

  function addSlot(day: number, ca: number, entry: TKBEntry) {
    setTkbData(prev => {
      const week = { ...(prev[tuan] ?? {}) };
      const row  = [...(week[day] ?? [null, null, null, null])];
      row[ca] = entry;
      if (entry.span === 2 && ca + 1 < 4) row[ca + 1] = "span";
      week[day] = row;
      return { ...prev, [tuan]: week };
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

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-4">
      {deleteExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(213,179,112,0.1)" }}><Trash2 className="w-7 h-7" style={{ color: "var(--accent)" }} /></div>
            <h3 className="font-bold text-base mb-2" style={PJS}>Xóa lịch thi?</h3>
            <p className="text-sm text-muted-foreground mb-1">Môn: <span className="font-semibold text-foreground">{deleteExam.tenMon}</span></p>
            <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteExam(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card" style={PJS}>Hủy</button>
              <button onClick={() => removeExam(deleteExam.id)} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--accent)", ...PJS }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      {examModal !== null && <ExamModal exam={examModal === "new" ? null : examModal} onClose={() => setExamModal(null)} onSave={saveExam} />}
      {addSlotOpen && <TKBSlotModal onClose={() => setAddSlotOpen(false)} onSave={addSlot} />}

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
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Tuần:</span>
              <select value={tuan} onChange={e => setTuan(Number(e.target.value))} className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif" }}>
                {Array.from({ length: 52 }, (_, i) => i + 1).map(w => <option key={w} value={w}>Tuần {w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground" style={PJS}>Lớp:</span>
              <select value={filterLop} onChange={e => setFilterLop(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                {allLops.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setAddSlotOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90" style={{ background: "var(--primary)", ...PJS }}>
                <Plus className="w-3.5 h-3.5" /> Thêm tiết học
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground" style={{ background: "#fff", ...PJS }}>
                <Download className="w-3.5 h-3.5" /> Xuất Excel
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between flex-shrink-0">
            <button onClick={() => setTuan(t => Math.max(1, t - 1))} disabled={tuan <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 transition-all" style={PJS}>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Tuần trước
            </button>
            <span className="text-xs text-muted-foreground" style={PJS}>Tuần {tuan} · {dates[0]} – {dates[6]}</span>
            <button onClick={() => setTuan(t => Math.min(52, t + 1))} disabled={tuan >= 52}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 transition-all" style={PJS}>
              Tuần sau <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
            <div className="overflow-auto h-full">
              <table className="w-full border-collapse text-xs" style={{ minWidth: 860, tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th className="border border-border px-3 py-2 text-center font-bold bg-card text-muted-foreground w-24" style={PJS}>Ca học</th>
                    {DAYS.map((day, i) => {
                      const isToday = i === TODAY_DAY;
                      return (
                        <th key={day} className="border border-border px-2 py-2 text-center font-bold" style={{
                          background: isToday ? "#11284D" : i === 5 ? "#f59e0b" : "var(--muted)",
                          color: isToday ? "#fff" : i === 5 ? "#fff" : "#374151",
                          fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 110,
                        }}>
                          <div className="text-xs">{day}</div>
                          <div className="font-normal text-[10px] opacity-80">{dates[i]}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CA_LABELS.map((ca, caIdx) => (
                    <tr key={caIdx} style={{ background: caIdx % 2 === 0 ? "#fff" : "var(--background)", height: 110 }}>
                      <td className="border border-border px-2 py-2 text-center align-middle" style={{ background: "var(--muted)" }}>
                        <div className="font-bold text-foreground text-xs" style={PJS}>{ca.label}</div>
                        <div className="text-[10px] text-muted-foreground">{ca.time}</div>
                        <div className="text-[10px] text-muted-foreground">{ca.tiet}</div>
                      </td>
                      {DAYS.map((_, dayIdx) => {
                        const cell = visibleWeekData[dayIdx]?.[caIdx] ?? null;
                        if (cell === "span") return null;
                        const entry = cell as TKBEntry | null;
                        const spanRows = entry?.span ?? 1;
                        const isToday = dayIdx === TODAY_DAY;
                        return (
                          <td key={dayIdx} rowSpan={spanRows} className="border border-border px-2 py-1.5 align-top group relative"
                            style={{ background: isToday && entry ? "#eef1ff" : undefined }}>
                            {entry ? (
                              <>
                                <TKBCellCard entry={entry} />
                                <button onClick={() => removeSlot(dayIdx, caIdx)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 transition-all" title="Xóa tiết này">
                                  <X className="w-3 h-3 text-red-400" />
                                </button>
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
          </div>
        </div>
      )}

      {tab === "thi" && (
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={examSearch} onChange={e => setExamSearch(e.target.value)} placeholder="Tìm theo môn, lớp, phòng..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary bg-card" style={{ fontFamily: "'Inter', sans-serif" }} />
            </div>
            <select value={filterHinhThuc} onChange={e => setFilterHinhThuc(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              <option value="">Tất cả hình thức</option>
              {allHinhThuc.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <div className="hidden sm:flex flex-1" />
            <button onClick={() => setExamModal("new")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--primary)", ...PJS }}>
              <Plus className="w-4 h-4" /> Thêm lịch thi
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground" style={{ background: "#fff", ...PJS }}><Upload className="w-4 h-4" /> Nhập</button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground" style={{ background: "#fff", ...PJS }}><Download className="w-4 h-4" /> Xuất</button>
          </div>
          <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
            <div className="overflow-auto h-full">
              <table className="w-full border-collapse text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: "var(--primary)" }}>
                    {["STT","Môn học","Mã nhóm","Thứ","Ngày thi","Ca thi","Giờ thi","Phòng thi","Số TS","Hình thức",""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.length === 0 ? (
                    <tr><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">Không có lịch thi phù hợp.</td></tr>
                  ) : filteredExams.map((ex, i) => {
                    const htStyle = EXAM_STATUS_COLORS[ex.hinhThuc] ?? { bg: "#f5f5f5", text: "#555" };
                    return (
                      <tr key={ex.id} className="group hover:brightness-95 transition-all" style={{ background: "var(--card)" }}>
                        <td className="px-3 py-2.5 text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-3 py-2.5 font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.tenMon}</td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{ex.maNhom}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{ex.thu}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{ex.ngayThi}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{ex.ca}</td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{ex.gio}</td>
                        <td className="px-3 py-2.5"><span className="font-bold px-2 py-0.5 rounded text-[11px]" style={{ background: "#E0D8C4", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.phong}</span></td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{ex.soThi}</td>
                        <td className="px-3 py-2.5"><span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: htStyle.bg, color: htStyle.text }}>{ex.hinhThuc}</span></td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setExamModal(ex)} className="p-1 rounded hover:bg-card" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} /></button>
                            <button onClick={() => setDeleteExam(ex)} className="p-1 rounded hover:bg-red-50" title="Xóa"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
  const khoaOpts = ["", "Khoa CNTT", "Khoa Toán – Tin học", "Khoa Vật lý", "Khoa Hóa học", "Khoa Sinh học", "Khoa Môi trường"];
  const phongOpts = ["", "Phòng Đào tạo", "Phòng Công tác SV", "Phòng Tài chính", "Phòng Khảo thí & ĐBCL", "Ban Giám hiệu"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0" style={{ background: "var(--primary)" }}>
          <span className="font-bold text-white text-sm" style={PJS}>{notif ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}</span>
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
  const [filterRead, setFilterRead] = useState<"" | "unread" | "read">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const allKhoa  = Array.from(new Set(notifs.map(n => n.khoa).filter(Boolean))).sort();
  const allPhong = Array.from(new Set(notifs.map(n => n.phong).filter(Boolean))).sort();
  const activeFilters = [filterStatus, filterKhoa, filterPhong, filterRead].filter(Boolean).length;

  const filtered = notifs.filter(n => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    const matchS = !filterStatus || n.status === filterStatus;
    const matchK = !filterKhoa  || n.khoa === filterKhoa;
    const matchP = !filterPhong || n.phong === filterPhong;
    const matchR = !filterRead  || (filterRead === "unread" ? !n.read : n.read);
    return matchQ && matchS && matchK && matchP && matchR;
  });

  function saveNotif(n: AdminNotif) {
    setNotifs(prev => {
      const exists = prev.find(x => x.id === n.id);
      const withTime = { ...n, time: exists ? n.time : new Date().toLocaleDateString("vi-VN") + " vừa xong" };
      return exists ? prev.map(x => x.id === n.id ? withTime : x) : [withTime, ...prev];
    });
  }
  function deleteNotif(id: number) { setNotifs(prev => prev.filter(n => n.id !== id)); setDeleteTarget(null); if (selected?.id === id) setSelected(null); }
  function toggleRead(n: AdminNotif) { setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: !x.read } : x)); }

  const statusBadge = (s: "draft" | "sent") =>
    s === "draft"
      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground" style={PJS}>Nháp</span>
      : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600" style={PJS}>Đã gửi</span>;

  const DeleteModal = () => deleteTarget ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(213,179,112,0.1)" }}><Trash2 className="w-7 h-7" style={{ color: "var(--accent)" }} /></div>
        <h3 className="font-bold text-base mb-2" style={PJS}>Xóa thông báo?</h3>
        <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{deleteTarget.title}</p>
        <p className="text-xs text-muted-foreground mb-6">Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3 w-full">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card" style={PJS}>Hủy</button>
          <button onClick={() => deleteNotif(deleteTarget.id)} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--accent)", ...PJS }}>Xóa</button>
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
            style={{ borderColor: filterOpen || activeFilters > 0 ? "#11284D" : "#e2e8f0", background: "var(--card)", color: filterOpen || activeFilters > 0 ? "#11284D" : "var(--muted-foreground)", ...PJS }}>
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
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2" style={PJS}>Trạng thái đọc</div>
                <div className="flex gap-2">
                  {[["", "Tất cả"], ["unread", "Chưa đọc"], ["read", "Đã đọc"]].map(([v, label]) => (
                    <button key={v} onClick={() => setFilterRead(v as typeof filterRead)} className="flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all"
                      style={{ borderColor: filterRead === v ? "#11284D" : "#e2e8f0", background: "var(--card)", color: filterRead === v ? "#11284D" : "var(--muted-foreground)", ...PJS }}>
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
                <button onClick={() => { setFilterStatus(""); setFilterKhoa(""); setFilterPhong(""); setFilterRead(""); }}
                  className="w-full text-xs font-semibold text-accent hover:opacity-70 transition-opacity text-center" style={PJS}>Xóa bộ lọc</button>
              )}
            </div>
          )}
        </div>
        <div className="hidden sm:flex flex-1" />
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card text-muted-foreground" style={PJS}><Download className="w-4 h-4" /> Xuất</button>
        <button onClick={() => setCompose("new")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "var(--primary)", ...PJS }}><Plus className="w-4 h-4" /> Tạo thông báo</button>
      </div>
      <div className="flex flex-wrap gap-3 flex-shrink-0">
        {[
          { label: "Tổng", val: notifs.length, color: "var(--primary)" },
          { label: "Đã gửi", val: notifs.filter(n => n.status === "sent").length, color: "#2563eb" },
          { label: "Nháp", val: notifs.filter(n => n.status === "draft").length, color: "var(--muted-foreground)" },
          { label: "Chưa đọc", val: notifs.filter(n => !n.read).length, color: "var(--accent)" },
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
                {["Tiêu đề","Nguồn","Thời gian","Trạng thái","Đọc",""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Không có thông báo phù hợp.</td></tr>
              ) : filtered.map((n, i) => (
                <tr key={n.id} className="group hover:brightness-95 transition-all cursor-pointer"
                  style={{ background: "var(--card)" }} onClick={() => setSelected(n)}>
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
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); toggleRead(n); }}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                      style={{ background: n.read ? "#f0fdf4" : "var(--background)", color: n.read ? "#16a34a" : "#D5B370" }}>
                      {n.read ? <CheckCircle2 className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                      {n.read ? "Đã đọc" : "Chưa đọc"}
                    </button>
                  </td>
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
  soTC: number; soTiet: number; soTcHocPhi: number; hocPhi: number;
  giam: number; hoTro: number; hocPhiThucDong: number; chiPhi: number; ghiChu: string;
};

function fmt(n: number) { return n.toLocaleString("vi-VN"); }

function AdminTuitionSection() {
  const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const [svSearch, setSvSearch] = useState("");
  const [selectedSv, setSelectedSv] = useState<AdminStudent | null>(ADMIN_STUDENTS[0]);
  const [svDropOpen, setSvDropOpen] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const semesters = TUITION_DATA.map(d => d.nhHk);
  const [selectedHk, setSelectedHk] = useState(semesters[0]);
  const [allData, setAllData] = useState(() => TUITION_DATA.map(d => ({ ...d, rows: d.rows.map(r => ({ ...r })) })));
  const [editRow, setEditRow] = useState<TuitionRow | null>(null);
  const [editDraft, setEditDraft] = useState<TuitionRow | null>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (svRef.current && !svRef.current.contains(e.target as Node)) setSvDropOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filteredSv = ADMIN_STUDENTS.filter(s => !svSearch || s.hoTen.toLowerCase().includes(svSearch.toLowerCase()) || s.mssv.includes(svSearch));
  const semData = allData.find(d => d.nhHk === selectedHk)!;
  const rows = semData.rows;
  const totalTC       = rows.reduce((s, r) => s + r.soTC, 0);
  const totalTiet     = rows.reduce((s, r) => s + r.soTiet, 0);
  const totalTcHp     = rows.reduce((s, r) => s + r.soTcHocPhi, 0);
  const totalHocPhi   = rows.reduce((s, r) => s + r.hocPhi, 0);
  const totalGiam     = rows.reduce((s, r) => s + r.giam, 0);
  const totalHoTro    = rows.reduce((s, r) => s + r.hoTro, 0);
  const totalThucDong = rows.reduce((s, r) => s + r.hocPhiThucDong, 0);
  const totalChiPhi   = rows.reduce((s, r) => s + r.chiPhi, 0);

  function saveEditRow() {
    if (!editDraft) return;
    setAllData(prev => prev.map(d => d.nhHk !== selectedHk ? d : { ...d, rows: d.rows.map(r => r.stt === editDraft.stt ? editDraft : r) }));
    setEditRow(null); setEditDraft(null);
  }
  function addRow() {
    const newRow: TuitionRow = { stt: rows.length + 1, nhHk: selectedHk, maMon: "", lop: "", tenMon: "Môn học mới", soTC: 3, soTiet: 45, soTcHocPhi: 3, hocPhi: 0, giam: 0, hoTro: 0, hocPhiThucDong: 0, chiPhi: 0, ghiChu: "" };
    setAllData(prev => prev.map(d => d.nhHk !== selectedHk ? d : { ...d, rows: [...d.rows, newRow] }));
    setEditRow(newRow); setEditDraft({ ...newRow });
  }
  function deleteRow(stt: number) {
    setAllData(prev => prev.map(d => d.nhHk !== selectedHk ? d : { ...d, rows: d.rows.filter(r => r.stt !== stt).map((r, i) => ({ ...r, stt: i + 1 })) }));
  }

  const headerCls = "px-3 py-2.5 font-semibold text-white text-center whitespace-nowrap text-[11px]";
  const cellCls   = "px-3 py-2 text-center text-xs";

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-4">
      {editRow && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="font-bold text-base text-foreground" style={PJS}>Chỉnh sửa môn học</div>
              <button onClick={() => { setEditRow(null); setEditDraft(null); }}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: "Mã môn", key: "maMon" as keyof TuitionRow },
                { label: "Lớp",    key: "lop"   as keyof TuitionRow },
                { label: "Tên môn học", key: "tenMon" as keyof TuitionRow, full: true },
                { label: "Số TC",      key: "soTC"           as keyof TuitionRow, num: true },
                { label: "Số tiết",    key: "soTiet"         as keyof TuitionRow, num: true },
                { label: "TC Học phí", key: "soTcHocPhi"     as keyof TuitionRow, num: true },
                { label: "Học phí",    key: "hocPhi"         as keyof TuitionRow, num: true },
                { label: "Giảm",       key: "giam"           as keyof TuitionRow, num: true },
                { label: "Hỗ trợ",    key: "hoTro"          as keyof TuitionRow, num: true },
                { label: "Thực đóng",  key: "hocPhiThucDong" as keyof TuitionRow, num: true },
                { label: "Chi phí",    key: "chiPhi"         as keyof TuitionRow, num: true },
                { label: "Ghi chú",    key: "ghiChu"         as keyof TuitionRow, full: true },
              ].map(f => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <label className="text-[11px] text-muted-foreground block mb-1" style={PJS}>{f.label}</label>
                  <input type={f.num ? "number" : "text"} value={editDraft[f.key] as string | number}
                    onChange={e => setEditDraft(prev => prev ? { ...prev, [f.key]: f.num ? Number(e.target.value) : e.target.value } : prev)}
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => { setEditRow(null); setEditDraft(null); }} className="flex-1 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-card transition-colors" style={PJS}>Huỷ</button>
              <button onClick={saveEditRow} className="flex-1 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        <div className="relative" ref={svRef}>
          <button onClick={() => setSvDropOpen(o => !o)}
            className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm bg-card hover:border-primary transition-colors min-w-48" style={PJS}>
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">{selectedSv ? selectedSv.hoTen : "Chọn sinh viên"}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" style={{ transform: svDropOpen ? "rotate(-90deg)" : "rotate(90deg)" }} />
          </button>
          {svDropOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-xl w-72">
              <div className="p-2 border-b border-border"><input autoFocus value={svSearch} onChange={e => setSvSearch(e.target.value)} placeholder="Tìm MSSV hoặc tên..." className="w-full px-3 py-1.5 text-sm border border-border rounded-lg outline-none focus:border-primary" /></div>
              <div className="max-h-48 overflow-y-auto">
                {filteredSv.map(s => (
                  <button key={s.mssv} onClick={() => { setSelectedSv(s); setSvDropOpen(false); setSvSearch(""); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2 ${selectedSv?.mssv === s.mssv ? "bg-card" : ""}`}>
                    <span className="font-medium text-foreground">{s.hoTen}</span>
                    <span className="font-mono text-xs text-muted-foreground ml-auto">{s.mssv}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <select value={selectedHk} onChange={e => setSelectedHk(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-card" style={PJS}>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card transition-colors text-muted-foreground" style={PJS}><Upload className="w-4 h-4" /> Nhập Excel</button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card transition-colors text-muted-foreground" style={PJS}><Download className="w-4 h-4" /> Xuất Excel</button>
          <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", ...PJS }}><Plus className="w-4 h-4" /> Thêm dòng</button>
        </div>
      </div>

      {selectedSv && (
        <div className="bg-card rounded-xl border border-border px-5 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: "var(--primary)" }}>{selectedSv.hoTen.split(" ").slice(-1)[0][0]}</div>
          <div>
            <div className="font-semibold text-foreground text-sm" style={PJS}>{selectedSv.hoTen}</div>
            <div className="text-xs text-muted-foreground font-mono">{selectedSv.mssv} · {selectedSv.nganh}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground" style={PJS}>Học phí thực đóng kỳ này</div>
            <div className="font-bold text-base" style={{ color: "var(--primary)", ...PJS }}>{fmt(totalThucDong)}</div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
        <div className="overflow-auto h-full">
          <table className="w-full" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse", fontSize: 12 }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--primary)" }}>
                {["STT","NH/HK","Mã MH / Lớp / Môn Học","Số TC","Số Tiết","TC HP","Học Phí","Giảm","Hỗ Trợ","Thực Đóng","Chi Phí","Ghi Chú",""].map(h => (
                  <th key={h} className={headerCls} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.stt} className="group hover:brightness-95 transition-all" style={{ background: "var(--card)" }}>
                  <td className={cellCls + " text-muted-foreground"}>{row.stt}</td>
                  <td className={cellCls}>{row.nhHk}</td>
                  <td className="px-3 py-2 text-xs"><div className="font-medium text-muted-foreground" style={{ fontSize: 10 }}>[{row.maMon}/{row.lop}]</div><div className="font-medium text-foreground">{row.tenMon}</div></td>
                  <td className={cellCls}>{row.soTC.toFixed(1)}</td>
                  <td className={cellCls}>{row.soTiet}</td>
                  <td className={cellCls}>{row.soTcHocPhi.toFixed(2)}</td>
                  <td className={cellCls + " font-medium"}>{fmt(row.hocPhi)}</td>
                  <td className={cellCls}>{row.giam}</td>
                  <td className={cellCls}>{row.hoTro}</td>
                  <td className={cellCls + " font-semibold"} style={{ color: "var(--primary)" }}>{fmt(row.hocPhiThucDong)}</td>
                  <td className={cellCls}>{row.chiPhi}</td>
                  <td className={cellCls + " text-muted-foreground"}>{row.ghiChu || "—"}</td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditRow(row); setEditDraft({ ...row }); }} className="p-1 rounded hover:bg-card" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} /></button>
                      <button onClick={() => deleteRow(row.stt)} className="p-1 rounded hover:bg-red-50" title="Xóa"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#dde4f5", borderTop: "2px solid #C5CCB7" }}>
                <td colSpan={3} className="px-3 py-2 text-right text-xs font-bold" style={PJS}>Tổng Cộng:</td>
                <td className={cellCls + " font-bold"}>{totalTC.toFixed(1)}</td>
                <td className={cellCls + " font-bold"}>{totalTiet}</td>
                <td className={cellCls + " font-bold"}>{totalTcHp.toFixed(2)}</td>
                <td className={cellCls + " font-bold"}>{fmt(totalHocPhi)}</td>
                <td className={cellCls + " font-bold"}>{totalGiam}</td>
                <td className={cellCls + " font-bold"}>{totalHoTro}</td>
                <td className={cellCls + " font-bold"} style={{ color: "var(--primary)" }}>{fmt(totalThucDong)}</td>
                <td className={cellCls + " font-bold"}>{totalChiPhi}</td>
                <td /><td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-muted-foreground">{rows.length} môn học · Cập nhật: {semData.ngayCapNhat}</p>
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-2.5">
          <span className="text-sm font-semibold text-foreground" style={PJS}>Tổng học phí thực đóng:</span>
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

export function AdminApp({ onLogout, HelpButton }: { onLogout: () => void; HelpButton: React.ComponentType }) {
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
          <div className="relative flex-shrink-0" style={{ width: sidebarOpen ? 100 : 44, height: sidebarOpen ? 100 : 44, transition: "all 0.3s" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            </svg>
          </div>
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
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: "var(--accent)", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AD</div>
          {sidebarOpen && <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Administrator</div><div className="text-xs text-white/40 truncate">admin@hcmus.edu.vn</div></div>}
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
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
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
                AD
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-4 flex items-center gap-3 border-b border-border">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0" style={{ background: "var(--accent)", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AD</div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Administrator</p>
                      <p className="text-xs text-muted-foreground truncate">admin@hcmus.edu.vn</p>
                    </div>
                  </div>
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

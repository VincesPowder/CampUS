import { useState, useRef, useEffect } from "react";
import {
  User, BookOpen, ClipboardList, CalendarDays, CreditCard, Bell,
  GraduationCap, ChevronRight, LogOut, X, ChevronsLeft, ChevronsRight,
  CheckCircle2, Search, Filter, Download, Upload, Plus, Pencil,
  Users, BarChart2, Shield,
} from "lucide-react";
import {
  FAMILY_DATA, STUDENT_PROFILE, NOTIFICATIONS, COURSE_DATA, TUITION_DATA,
  ADMIN_STUDENTS,
  type FamilyMember, type Notification, type CourseRecord, type AdminStudent,
} from "../data/mockData";
import hcmusBg from "../imports/image-14.png";

// ─── Accounts ────────────────────────────────────────────────────────────────
const ACCOUNTS = [
  { username: "admin",   label: "Quản trị viên", email: "admin@hcmus.edu.vn",            initials: "AD", pass: "abc", role: "admin"   as const },
  { username: "student", label: "Sinh viên",      email: "24127001@student.hcmus.edu.vn", initials: "NV", pass: "123", role: "student" as const },
];

// ─── Account Picker Modal ────────────────────────────────────────────────────
function AccountPickerModal({ onLogin }: { onLogin: (role: "admin" | "student") => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Chọn tài khoản để tiếp tục với</p>
            <h2 className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#3E4B8E" }}>
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
            <span className="text-xs font-semibold text-gray-500">Microsoft</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chọn tài khoản
          </p>
          {ACCOUNTS.map(acc => (
            <button
              key={acc.username}
              onClick={() => onLogin(acc.role)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#3E4B8E] hover:bg-[#f0f3ff] transition-all text-left group"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: acc.role === "admin" ? "#3E4B8E" : "#c14954", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {acc.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 group-hover:text-[#3E4B8E]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {acc.label}
                </div>
                <div className="text-xs text-gray-400 truncate">{acc.email}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#3E4B8E] flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-gray-300">©GROUP 3 - AMONG US · HCMUS</p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Student Management ────────────────────────────────────────────────
function StudentManagement() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{ khoa: string; nganh: string; bacDT: string; loaiDT: string }>({
    khoa: "", nganh: "", bacDT: "", loaiDT: "",
  });

  const allKhoa  = Array.from(new Set(ADMIN_STUDENTS.map(s => s.khoa)));
  const allNganh = Array.from(new Set(ADMIN_STUDENTS.map(s => s.nganh)));
  const allBac   = Array.from(new Set(ADMIN_STUDENTS.map(s => s.bacDT)));
  const allLoai  = Array.from(new Set(ADMIN_STUDENTS.map(s => s.loaiDT)));

  const filtered = ADMIN_STUDENTS.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.hoTen.toLowerCase().includes(q) || s.mssv.includes(q) || s.email.toLowerCase().includes(q);
    const matchKhoa  = !filters.khoa  || s.khoa  === filters.khoa;
    const matchNganh = !filters.nganh || s.nganh === filters.nganh;
    const matchBac   = !filters.bacDT || s.bacDT === filters.bacDT;
    const matchLoai  = !filters.loaiDT|| s.loaiDT=== filters.loaiDT;
    return matchSearch && matchKhoa && matchNganh && matchBac && matchLoai;
  });

  function clearFilters() {
    setFilters({ khoa: "", nganh: "", bacDT: "", loaiDT: "" });
  }

  const activeFilters = Object.values(filters).filter(Boolean).length;

  const cols = ["Họ và Tên", "MSSV", "Mail", "Giới tính", "Khoá", "Bậc ĐT", "Ngành", "Loại ĐT", "Chuyên ngành"];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        {/* Search */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, MSSV, email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#3E4B8E] transition-colors bg-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
          style={{
            borderColor: filterOpen || activeFilters > 0 ? "#3E4B8E" : "#e2e8f0",
            background: filterOpen || activeFilters > 0 ? "#eef2ff" : "#fff",
            color: filterOpen || activeFilters > 0 ? "#3E4B8E" : "#64748b",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Filter className="w-4 h-4" />
          Bộ lọc
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: "#c14954" }}>
              {activeFilters}
            </span>
          )}
        </button>

        <div className="flex-1" />

        {/* Action buttons */}
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors text-gray-600" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Download className="w-4 h-4" /> Xuất
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors text-gray-600" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Upload className="w-4 h-4" /> Nhập
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#3E4B8E", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="mb-4 bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-wrap gap-4 items-end flex-shrink-0">
          {[
            { label: "Khoá",    key: "khoa"  as const, options: allKhoa  },
            { label: "Ngành",   key: "nganh" as const, options: allNganh },
            { label: "Bậc ĐT",  key: "bacDT" as const, options: allBac   },
            { label: "Loại ĐT", key: "loaiDT"as const, options: allLoai  },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.label}</label>
              <select
                value={filters[f.key]}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#3E4B8E] bg-white"
                style={{ fontFamily: "'Inter', sans-serif", minWidth: 130, color: "#1e293b" }}
              >
                <option value="">Tất cả</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-[#c14954] transition-colors border border-gray-200 hover:border-[#c14954]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden min-h-0">
        <div className="overflow-auto h-full">
          <table className="w-full text-xs" style={{ fontFamily: "'Inter', sans-serif", borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "#3E4B8E" }}>
                {cols.map(c => (
                  <th key={c} className="px-3 py-2.5 text-left font-semibold text-white whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>
                    {c}
                  </th>
                ))}
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 1} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Không tìm thấy sinh viên phù hợp.
                  </td>
                </tr>
              ) : filtered.map((s, i) => (
                <tr
                  key={s.mssv}
                  className="group hover:brightness-95 transition-all"
                  style={{ background: i % 2 === 0 ? "#fff" : "#f5f7ff" }}
                >
                  <td className="px-3 py-2.5 font-medium text-gray-800">{s.hoTen}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-600">{s.mssv}</td>
                  <td className="px-3 py-2.5 text-gray-500">{s.email}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.gioiTinh}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.khoa}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.bacDT}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.nganh}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.loaiDT}</td>
                  <td className="px-3 py-2.5 text-gray-600">{s.chuyenNganh}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#eef2ff]" title="Chỉnh sửa">
                      <Pencil className="w-3.5 h-3.5" style={{ color: "#3E4B8E" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2 flex-shrink-0">
        Hiển thị {filtered.length} / {ADMIN_STUDENTS.length} sinh viên
      </p>
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

function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<AdminSection>("students");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  function handleLogout() {
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
    setTimeout(() => {
      setShowLogoutSuccess(false);
      onLogout();
    }, 1600);
  }

  const sectionLabel: Record<AdminSection, string> = {
    students:      "Quản lý sinh viên",
    academic:      "Quản lý học tập",
    survey:        "Khảo sát",
    schedule:      "Lịch học / thi",
    tuition:       "Học phí",
    notifications: "Thông báo",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f1f4fc" }}>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(193,73,84,0.1)" }}>
              <LogOut className="w-7 h-7" style={{ color: "#c14954" }} />
            </div>
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</h3>
            <p className="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn đăng xuất không?</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hủy</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#c14954", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
      {showLogoutSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-full max-w-xs flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất thành công!</h3>
            <p className="text-sm text-gray-400">Đang chuyển về trang đăng nhập...</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-xl"
        style={{ width: sidebarOpen ? 220 : 56, background: "#3E4B8E" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0" style={{ justifyContent: sidebarOpen ? "flex-start" : "center" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-white text-sm leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CampUS Admin</div>
              <div className="text-white/40 text-[10px] leading-tight">HCMUS</div>
            </div>
          )}
        </div>

        <div className="mx-3 h-px bg-white/10 flex-shrink-0" />

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
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
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? "#f1999d" : "inherit" }} />
                {sidebarOpen && <span className="flex-1 text-left text-[13px] whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mx-3 h-px bg-white/10 flex-shrink-0" />

        {/* Admin user footer */}
        <div className="p-3 flex items-center gap-3 flex-shrink-0" style={{ justifyContent: sidebarOpen ? "flex-start" : "center" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: "#c14954", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            AD
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Administrator</div>
              <div className="text-xs text-white/40 truncate">admin@hcmus.edu.vn</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            {sidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {sectionLabel[section]}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ background: "#c14954", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              AD
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#c14954]"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden p-6 flex flex-col min-h-0">
          {section === "students" && <StudentManagement />}
          {section !== "students" && (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  {(() => { const Icon = ADMIN_NAV.find(n => n.id === section)!.icon; return <Icon className="w-7 h-7 text-gray-300" />; })()}
                </div>
                <p className="text-sm font-medium text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {sectionLabel[section]}
                </p>
                <p className="text-xs text-gray-300 mt-1">Nội dung sẽ được cập nhật sau.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (role: "admin" | "student") => void }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundImage: `url(${hcmusBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />

      {showPicker && <AccountPickerModal onLogin={onLogin} />}

      <div className="relative z-10 bg-white shadow-2xl px-10 py-10 flex flex-col items-center w-full max-w-sm rounded-[10px]" style={{ minHeight: 400 }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2"
          style={{ borderColor: "#3E4B8E", background: "#eef2ff" }}
        >
          <GraduationCap className="w-9 h-9" style={{ color: "#3E4B8E" }} />
        </div>

        <h1 className="text-2xl font-bold mb-1 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#3E4B8E" }}>
          CampUS
        </h1>
        <p className="text-xs text-gray-400 mb-6 tracking-widest font-medium">ĐĂNG NHẬP</p>

        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-gray-50 transition-colors"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1e293b" }}
        >
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Đăng nhập với Microsoft
        </button>

        <p className="text-gray-400 text-center mt-5 leading-relaxed text-[10px]">
          Vui lòng sử dụng email chính thức nhà trường đã cung cấp<br />
          <span className="font-medium">(@student.hcmus.edu.vn)</span>
        </p>

        <p className="text-[9px] text-gray-300 text-center mt-6 tracking-wide">©GROUP 3 - AMONG US</p>
      </div>
    </div>
  );
}

// ─── Logout Confirm Modal ─────────────────────────────────────────────────────
function LogoutConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(193,73,84,0.1)" }}>
          <LogOut className="w-7 h-7" style={{ color: "var(--accent)" }} />
        </div>
        <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</h3>
        <p className="text-sm text-muted-foreground mb-6">Bạn có chắc chắn muốn đăng xuất không?</p>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hủy</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Success Popup ─────────────────────────────────────────────────────
function LogoutSuccess() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card rounded-2xl shadow-2xl px-8 py-7 w-full max-w-xs flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="font-bold text-base mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Đăng xuất thành công!</h3>
        <p className="text-sm text-muted-foreground">Đang chuyển về trang đăng nhập...</p>
      </div>
    </div>
  );
}

type NavSection = "profile" | "academic" | "survey" | "schedule" | "tuition" | "notifications";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "profile",       label: "Hồ sơ cá nhân", icon: User },
  { id: "academic",      label: "Học tập",        icon: BookOpen },
  { id: "survey",        label: "Khảo sát",       icon: ClipboardList, badge: 2 },
  { id: "schedule",      label: "Lịch học / thi", icon: CalendarDays },
  { id: "tuition",       label: "Học phí",        icon: CreditCard },
  { id: "notifications", label: "Thông báo",      icon: Bell, badge: 3 },
];

const SECTION_TITLES: Record<NavSection, string> = {
  profile:       "Hồ sơ cá nhân",
  academic:      "Học tập",
  survey:        "Khảo sát",
  schedule:      "Lịch học / thi",
  tuition:       "Học phí",
  notifications: "Thông báo",
};

// ─── Family popup ─────────────────────────────────────────────────────────────
function FamilyModal({ member, onClose }: { member: FamilyMember; onClose: () => void }) {
  const rows: { label: string; value: string; required?: boolean }[] = [
    { label: "Họ và Tên",           value: member.name,        required: true },
    { label: "Năm Sinh",            value: member.dob,         required: true },
    { label: "Quan Hệ",             value: member.rel,         required: true },
    { label: "Nghề Nghiệp",         value: member.job,         required: true },
    { label: "Nơi Làm Việc",        value: member.workplace,   required: true },
    { label: "Dân Tộc",             value: member.ethnic,      required: true },
    { label: "Tôn Giáo",            value: member.religion,    required: true },
    { label: "Quốc Tịch",           value: member.nationality, required: true },
    { label: "Tỉnh / Thành",        value: member.province,    required: true },
    { label: "Phường / Xã",         value: member.ward,        required: true },
    { label: "Hộ Khẩu Thường Trú",  value: member.address,     required: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" style={{ background: "var(--primary)" }}>
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Chi tiết thành viên gia đình</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <p className="text-xs mb-4" style={{ color: "var(--accent)" }}>* Trường bắt buộc điền</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {rows.map(r => (
              <div key={r.label} className={r.label === "Hộ Khẩu Thường Trú" ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {r.label} {r.required && <span style={{ color: "var(--accent)" }}>*</span>}
                </label>
                <div className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground bg-background" style={{ minHeight: "36px", fontSize: "12px" }}>
                  {r.value || <span className="text-muted-foreground">{`Nhập ${r.label.toLowerCase()}...`}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Family Tab ───────────────────────────────────────────────────────────────
function FamilyTab() {
  const [selected, setSelected] = useState<FamilyMember | null>(null);

  return (
    <>
      <div className="p-5" style={{ fontSize: "11.5px" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--secondary)" }}>
                {["Họ tên", "Ngày sinh", "Quan hệ", "Nghề nghiệp", "Nơi làm việc", "SĐT", "Mail"].map(col => (
                  <th key={col} className="border border-border px-3 py-2 text-left font-semibold" style={{ fontSize: "11.5px", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAMILY_DATA.map((row, i) => (
                <tr key={i} className="hover:bg-secondary/60 transition-colors cursor-pointer" onClick={() => setSelected(row)}>
                  <td className="border border-border px-3 py-2.5 font-medium text-foreground">{row.name}</td>
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
      </div>
      {selected && <FamilyModal member={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ─── Field helper ────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium text-foreground">{value || "—"}</div>
    </div>
  );
}

// ─── Tuition Section ─────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("vi-VN");
}

function TuitionSection() {
  const semesters = TUITION_DATA.map(d => d.nhHk);
  const [selected, setSelected] = useState(semesters[0]);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const semester = TUITION_DATA.find(d => d.nhHk === selected)!;
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
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tra Cứu Học Phí</h1>

      <div className="bg-card rounded-xl border border-border px-5 py-4 flex items-center gap-4">
        <span className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NH/HK:</span>
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-secondary/50 transition-colors"
            style={{ border: "1px solid #c7d0e8", fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 120 }}
          >
            <span className="flex-1 text-left">{selected}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" style={{ transform: dropOpen ? "rotate(-90deg)" : "rotate(90deg)" }} />
          </button>
          {dropOpen && (
            <div className="absolute left-0 top-full mt-1 bg-card rounded-xl shadow-xl overflow-hidden z-20" style={{ border: "1px solid #c7d0e8", minWidth: 140 }}>
              {semesters.map(s => (
                <button
                  key={s}
                  onClick={() => { setSelected(s); setDropOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: selected === s ? 600 : 400, color: selected === s ? "#3E4B8E" : "var(--foreground)", background: selected === s ? "#EEF2FF" : undefined }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
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
                <tr key={row.stt} style={{ background: i % 2 === 0 ? "#fff" : "#EEF2FF" }} className="hover:brightness-95 transition-all">
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
                  <td className={cellCls + " font-semibold"} style={{ color: "#3E4B8E" }}>{fmt(row.hocPhiThucDong)}</td>
                  <td className={cellCls}>{row.chiPhi}</td>
                  <td className={cellCls}>{row.ghiChu || "—"}</td>
                </tr>
              ))}
              <tr className="font-bold" style={{ background: "#dde4f5", borderTop: "2px solid #c7d0e8" }}>
                <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng Cộng:</td>
                <td className={cellCls + " font-bold"}>{totalTC.toFixed(1)}</td>
                <td className={cellCls + " font-bold"}>{totalTiet}</td>
                <td className={cellCls + " font-bold"}>{totalTcHp.toFixed(2)}</td>
                <td className={cellCls + " font-bold"}>{fmt(totalHocPhi)}</td>
                <td className={cellCls + " font-bold"}>{totalGiam}</td>
                <td className={cellCls + " font-bold"}>{totalHoTro}</td>
                <td className={cellCls + " font-bold"} style={{ color: "#3E4B8E" }}>{fmt(totalThucDong)}</td>
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
          <span className="text-base font-bold" style={{ color: "#3E4B8E", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{fmt(totalThucDong)}</span>
        </div>
        <p className="text-xs text-muted-foreground pr-1">Ngày cập nhật: {semester.ngayCapNhat}</p>
      </div>
    </div>
  );
}

// ─── Progress Tab data ────────────────────────────────────────────────────────
const CREDIT_GROUPS_DATA = [
  { code: "LL_CT",    name: "Lý luận chính trị - Pháp luật",           req: 14, done: 14 },
  { code: "XH_TC",    name: "Khoa học xã hội - Kinh tế - Kỹ năng",     req: 2,  done: 0  },
  { code: "TN_BB",    name: "Toán - KHTN - Công nghệ - MT (BB)",        req: 26, done: 20 },
  { code: "TN_TC1",   name: "Toán - KHTN - Công nghệ - MT (TC1)",       req: 4,  done: 4  },
  { code: "TN_TC2",   name: "Toán - KHTN - Công nghệ - MT (TC2)",       req: 8,  done: 0  },
  { code: "TH_BB",    name: "Tin học cơ sở",                            req: 4,  done: 4  },
  { code: "GD_TC",    name: "Giáo dục thể chất",                        req: 4,  done: 4  },
  { code: "GD_QP",    name: "Giáo dục quốc phòng – an ninh",            req: 4,  done: 4  },
  { code: "CN_CS",    name: "Kiến thức cơ sở ngành",                    req: 38, done: 18 },
  { code: "CN_TN_TC", name: "Kiến thức tốt nghiệp TC",                  req: 4,  done: 0  },
  { code: "CN_NG",    name: "Kiến thức bắt buộc ngành (N1)",            req: 16, done: 5  },
  { code: "CN_TC",    name: "Kiến thức tự chọn ngành (M1)",             req: 8,  done: 0  },
  { code: "CN_TD",    name: "Kiến thức tự chọn tự do",                  req: 0,  done: 0  },
  { code: "CN_TN_BB", name: "Kiến thức tốt nghiệp BB",                  req: 6,  done: 0  },
];

const RADAR_AXES = [
  { subject: "Toán học",   score: 7.5, fullMark: 10 },
  { subject: "Lập trình",  score: 8.2, fullMark: 10 },
  { subject: "Hệ thống",   score: 6.8, fullMark: 10 },
  { subject: "Trí tuệ NT", score: 7.0, fullMark: 10 },
  { subject: "Mạng & CSDL",score: 6.5, fullMark: 10 },
  { subject: "Phần mềm",   score: 7.8, fullMark: 10 },
];

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
function minScoreForGpa(gpa: number) {
  if (gpa >= 4.0) return 8.5;
  if (gpa >= 3.7) return 8.0;
  if (gpa >= 3.5) return 7.5;
  if (gpa >= 3.0) return 7.0;
  if (gpa >= 2.5) return 6.5;
  if (gpa >= 2.0) return 5.5;
  if (gpa >= 1.5) return 5.0;
  return 4.0;
}

function ProgressSection() {
  const totalReq  = CREDIT_GROUPS_DATA.reduce((s, g) => s + g.req, 0);
  const totalDone = CREDIT_GROUPS_DATA.reduce((s, g) => s + g.done, 0);
  const totalDebt = 5;
  const totalLeft = totalReq - totalDone - totalDebt;

  const PIE_DATA = [
    { name: "Hoàn thành", value: totalDone, color: "#3E4B8E" },
    { name: "Còn thiếu",  value: totalLeft, color: "#c7d0e8" },
    { name: "Đang nợ",    value: totalDebt, color: "#c14954" },
  ];

  // Grade Predictor state
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
  const [gkScore,   setGkScore]   = useState("");
  const [ckScore,   setCkScore]   = useState("");
  const [gkWeight,  setGkWeight]  = useState(30);
  const [targetGpa, setTargetGpa] = useState(3.0);

  // Derived (validated)
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

  const ckWeight   = 100 - gkWeight;
  const gkNum      = parseFloat(gkScore) || 0;
  const ckNum      = parseFloat(ckScore) || 0;
  const hasAny     = gkScore !== "" || ckScore !== "";
  const totalScore = hasAny ? (gkNum * gkWeight + ckNum * ckWeight) / 100 : null;
  const gpaEst     = totalScore !== null ? gpaFromScore(totalScore) : null;
  const targetMin  = minScoreForGpa(targetGpa);
  const ckNeeded   = gkScore !== "" && ckWeight > 0 ? (targetMin * 100 - gkNum * gkWeight) / ckWeight : null;
  const feasible   = ckNeeded !== null && ckNeeded <= 10;

  const selectCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3E4B8E] bg-white";
  const inputCls  = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#3E4B8E]";

  return (
    <div className="flex gap-5">
      {/* ── Left: Credit summary ── */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Thông tin chung */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 text-xs font-bold text-white text-center" style={{ background: "#3E4B8E", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                <tr key={label} style={{ background: i % 2 === 0 ? "#fff" : "#f5f7ff" }}>
                  <td className="px-3 py-2 text-gray-500 border-b border-gray-100 leading-tight">{label}</td>
                  <td className="px-3 py-2 border-b border-gray-100 text-right font-medium leading-tight"
                    style={{ color: label === "Tổng TC tích lũy" ? "#3E4B8E" : label === "Đủ ĐK tốt nghiệp" ? "#c14954" : "#1e293b", fontWeight: label === "Tổng TC tích lũy" ? 700 : 500 }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nhóm học phần */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 text-xs font-bold text-white text-center" style={{ background: "#3E4B8E", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Nhóm học phần
          </div>
          <div className="divide-y divide-gray-100">
            {CREDIT_GROUPS_DATA.filter(g => g.req > 0).map((g, i) => {
              const pct = (g.done / g.req) * 100;
              const done = g.done >= g.req;
              return (
                <div key={g.code} className="px-3 py-2.5" style={{ background: i % 2 === 0 ? "#fff" : "#f5f7ff" }}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{g.code}</span>
                    <span className="text-[10px] font-bold" style={{ color: done ? "#22c55e" : "#3E4B8E" }}>{g.done}/{g.req}</span>
                  </div>
                  <div className="text-[11px] text-gray-700 mb-1.5 leading-tight">{g.name}</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#e8ecf8" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done ? "#22c55e" : "#3E4B8E", transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Charts + Grade Predictor ── */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Donut chart — custom SVG */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#3E4B8E" }}>Tiến độ tín chỉ</h3>
            <p className="text-xs text-gray-400 mb-3">Hoàn thành / Còn thiếu / Đang nợ</p>
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
                <div className="flex flex-col items-center">
                  <div className="relative" style={{ width: 180, height: 180 }}>
                    <svg width="180" height="180" viewBox="0 0 180 180">
                      {slices.map((s, i) => (
                        <path key={`donut-${i}`} d={s.path} fill={s.color} />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold" style={{ color: "#3E4B8E", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalDone}</span>
                      <span className="text-xs text-gray-400">/{totalReq} TC</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-1">
                    {PIE_DATA.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-[11px] text-gray-500">{d.name}</span>
                        <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Radar chart — custom SVG */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#3E4B8E" }}>Chỉ số phù hợp chuyên ngành</h3>
            <p className="text-xs text-gray-400 mb-3">Dựa trên điểm các nhóm môn học</p>
            {(() => {
              const cx = 110, cy = 105, r = 75;
              const n = RADAR_AXES.length;
              const angles = RADAR_AXES.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);
              const levels = [0.25, 0.5, 0.75, 1.0];
              const gridPts = (lvl: number) =>
                RADAR_AXES.map((_, i) => `${cx + r * lvl * Math.cos(angles[i])},${cy + r * lvl * Math.sin(angles[i])}`).join(" ");
              const scorePts = RADAR_AXES.map((d, i) => {
                const ratio = d.score / d.fullMark;
                return `${cx + r * ratio * Math.cos(angles[i])},${cy + r * ratio * Math.sin(angles[i])}`;
              }).join(" ");
              const dotPts = RADAR_AXES.map((d, i) => {
                const ratio = d.score / d.fullMark;
                return { x: cx + r * ratio * Math.cos(angles[i]), y: cy + r * ratio * Math.sin(angles[i]), score: d.score };
              });
              const labelR = r + 22;
              return (
                <svg width="220" height="210" viewBox="0 0 220 210" style={{ display: "block", margin: "0 auto" }}>
                  {levels.map((lvl, i) => (
                    <polygon key={`grid-lvl-${i}`} points={gridPts(lvl)} fill="none" stroke="#e8ecf8" strokeWidth="1" />
                  ))}
                  {RADAR_AXES.map((_, i) => (
                    <line key={`axis-${i}`}
                      x1={cx} y1={cy}
                      x2={cx + r * Math.cos(angles[i])} y2={cy + r * Math.sin(angles[i])}
                      stroke="#e8ecf8" strokeWidth="1" />
                  ))}
                  <polygon points={scorePts} fill="#3E4B8E" fillOpacity="0.22" stroke="#3E4B8E" strokeWidth="2" />
                  {dotPts.map((pt, i) => (
                    <circle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#3E4B8E" />
                  ))}
                  {RADAR_AXES.map((d, i) => {
                    const lx = cx + labelR * Math.cos(angles[i]);
                    const ly = cy + labelR * Math.sin(angles[i]);
                    return (
                      <text key={`lbl-${i}`} x={lx} y={ly}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="9.5" fill="#64748b" fontFamily="Inter, sans-serif">
                        {d.subject}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Grade Predictor */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#3E4B8E" }}>
            <BarChart2 className="w-4 h-4 text-white/70" />
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Grade Predictor</h3>
          </div>

          <div className="p-5 flex gap-8">
            {/* Left: dropdowns */}
            <div className="w-56 flex-shrink-0 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Năm học</label>
                <select value={selYear} onChange={e => { setSelYear(e.target.value); const s = Array.from(new Set(COURSE_DATA.filter(c => c.namHoc === e.target.value).map(c => c.hocKy))).sort(); setSelSem(s[0]); }} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", color: "#1e293b" }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Học kỳ</label>
                <select value={validSem} onChange={e => setSelSem(Number(e.target.value))} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", color: "#1e293b" }}>
                  {semsForYear.map(s => <option key={s} value={s}>Học kỳ {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Môn học</label>
                <select value={validCourse} onChange={e => setSelCourse(e.target.value)} className={selectCls} style={{ fontFamily: "'Inter', sans-serif", color: "#1e293b" }}>
                  {coursesInSem.map(c => <option key={c.maMon} value={c.maMon}>{c.tenMon || c.maMon}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mục tiêu GPA</label>
                <div className="flex gap-1">
                  {[2.0, 2.5, 3.0, 3.5, 4.0].map(g => (
                    <button key={g} onClick={() => setTargetGpa(g)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: targetGpa === g ? "#3E4B8E" : "#f1f4fc", color: targetGpa === g ? "#fff" : "#64748b", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: inputs + results */}
            <div className="flex-1 space-y-4">
              {/* Score inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Điểm GK <span className="font-normal text-gray-400">(30%)</span>
                  </label>
                  <input type="number" min="0" max="10" step="0.1" value={gkScore} onChange={e => setGkScore(e.target.value)} placeholder="0 – 10" className={inputCls} style={{ fontFamily: "'Inter', sans-serif" }} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Điểm CK <span className="font-normal text-gray-400">(70%)</span>
                  </label>
                  <input type="number" min="0" max="10" step="0.1" value={ckScore} onChange={e => setCkScore(e.target.value)} placeholder="0 – 10" className={inputCls} style={{ fontFamily: "'Inter', sans-serif" }} />
                </div>
              </div>

              {/* Results row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4 text-center" style={{ background: "#f0f3ff" }}>
                  <div className="text-[11px] text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Điểm Tổng Kết</div>
                  <div className="text-3xl font-bold" style={{ color: "#3E4B8E", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {totalScore !== null ? totalScore.toFixed(2) : "—"}
                  </div>
                  <div className="text-xs text-gray-400">/10</div>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: "#f0f3ff" }}>
                  <div className="text-[11px] text-gray-500 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>GPA ước tính</div>
                  <div className="text-3xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: gpaEst === null ? "#3E4B8E" : gpaEst >= 3.0 ? "#22c55e" : gpaEst >= 2.0 ? "#f59e0b" : "#c14954" }}>
                    {gpaEst !== null ? gpaEst.toFixed(1) : "—"}
                  </div>
                  <div className="text-xs text-gray-400">/4.0</div>
                </div>
              </div>

              {/* Prediction */}
              <div className="rounded-xl p-4" style={{ background: ckNeeded !== null && !feasible ? "#fff5f5" : "#f0f3ff", border: `1px dashed ${ckNeeded !== null && !feasible ? "#fca5a5" : "#c7d0e8"}` }}>
                <p className="text-[11px] font-semibold text-gray-600 mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Cần điểm CK bao nhiêu để đạt GPA {targetGpa.toFixed(1)}?
                </p>
                {gkScore === "" ? (
                  <p className="text-xs text-gray-400">Nhập điểm GK để xem dự đoán.</p>
                ) : feasible ? (
                  <p className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1e293b" }}>
                    Cần ít nhất{" "}
                    <span className="font-bold text-base" style={{ color: "#3E4B8E" }}>{Math.max(0, ckNeeded!).toFixed(1)}</span>
                    {" "}/10 để đạt tổng kết {targetMin.toFixed(1)} (GPA {targetGpa.toFixed(1)})
                  </p>
                ) : (
                  <p className="text-sm font-semibold" style={{ color: "#c14954", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Không thể đạt GPA {targetGpa.toFixed(1)} với điểm GK hiện tại. Hãy điều chỉnh mục tiêu.
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
function AcademicSection({ subTab, setSubTab }: { subTab: "summary" | "progress"; setSubTab: (t: "summary" | "progress") => void }) {
  const [filterYear, setFilterYear] = useState("Tất cả");
  const [filterTerm, setFilterTerm] = useState("Tất cả");
  const [yearOpen, setYearOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearOpen(false);
      if (termRef.current && !termRef.current.contains(e.target as Node)) setTermOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
      <div className="flex gap-1 border-b border-border">
        {(["summary", "progress"] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className="px-5 py-2.5 text-sm font-semibold transition-colors relative"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: subTab === t ? "#3E4B8E" : "#64748B", background: "none" }}
          >
            {t === "summary" ? "Tổng kết" : "Tiến độ học tập"}
            {subTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#3E4B8E", marginBottom: -1 }} />}
          </button>
        ))}
      </div>

      {subTab === "summary" && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative" ref={yearRef}>
              <button
                onClick={() => { setYearOpen(o => !o); setTermOpen(false); }}
                className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
                style={{ border: "1px solid #c7d0e8", fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 160 }}
              >
                <span className="flex-1 text-left">{filterYear === "Tất cả" ? "Tất cả năm học" : `Năm học ${filterYear}`}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" style={{ transform: yearOpen ? "rotate(-90deg)" : "rotate(90deg)" }} />
              </button>
              {yearOpen && (
                <div className="absolute left-0 top-full mt-1 bg-card rounded-xl shadow-xl overflow-hidden z-20" style={{ border: "1px solid #c7d0e8", minWidth: 200 }}>
                  {years.map(y => (
                    <button key={y} onClick={() => { setFilterYear(y); setFilterTerm("Tất cả"); setYearOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: filterYear === y ? 600 : 400, color: filterYear === y ? "var(--primary)" : "var(--foreground)", background: filterYear === y ? "var(--secondary)" : undefined }}>
                      {y === "Tất cả" ? "Tất cả năm học" : `Năm học ${y}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={termRef}>
              <button
                onClick={() => { setTermOpen(o => !o); setYearOpen(false); }}
                className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
                style={{ border: "1px solid #c7d0e8", fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 160 }}
              >
                <span className="flex-1 text-left">{filterTerm === "Tất cả" ? "Tất cả học kỳ" : `Học kỳ ${filterTerm}`}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" style={{ transform: termOpen ? "rotate(-90deg)" : "rotate(90deg)" }} />
              </button>
              {termOpen && (
                <div className="absolute left-0 top-full mt-1 bg-card rounded-xl shadow-xl overflow-hidden z-20" style={{ border: "1px solid #c7d0e8", minWidth: 200 }}>
                  {terms.map(t => (
                    <button key={t} onClick={() => { setFilterTerm(t); setTermOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: filterTerm === t ? 600 : 400, color: filterTerm === t ? "var(--primary)" : "var(--foreground)", background: filterTerm === t ? "var(--secondary)" : undefined }}>
                      {t === "Tất cả" ? "Tất cả học kỳ" : `Học kỳ ${t}`}
                    </button>
                  ))}
                </div>
              )}
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
                    <th key={c.label} className={`px-2 py-2.5 font-semibold text-white whitespace-nowrap ${c.cls}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.stt} style={{ background: i % 2 === 0 ? "#fff" : "#EEF2FF" }} className="hover:brightness-95 transition-all">
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

// ─── Profile Section ─────────────────────────────────────────────────────────
function ProfileSection() {
  const [innerTab, setInnerTab] = useState<"personal" | "family">("personal");

  const tabs = [
    { id: "personal", label: "Thông tin cá nhân" },
    { id: "family",   label: "Thông tin gia đình" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border" style={{ background: "#663e1f" }}>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin chung</h2>
        </div>
        <div className="p-5 flex gap-6">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 text-2xl font-bold" style={{ borderColor: "var(--primary)", background: "rgba(37,52,79,0.08)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              NV
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{STUDENT_PROFILE.fullName}</div>
              <div className="text-xs text-muted-foreground">{STUDENT_PROFILE.role}</div>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: "var(--accent)" }}>{STUDENT_PROFILE.status}</span>
            </div>
          </div>
          <div className="w-px bg-border flex-shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-4">
            <Field label="MSSV"                 value={STUDENT_PROFILE.mssv} />
            <Field label="Ngày sinh"            value={STUDENT_PROFILE.dob} />
            <Field label="Nơi sinh"             value={STUDENT_PROFILE.placeOfBirth} />
            <Field label="Giới tính"            value={STUDENT_PROFILE.gender} />
            <Field label="Khóa"                 value={STUDENT_PROFILE.course} />
            <Field label="Bậc đào tạo"          value={STUDENT_PROFILE.level} />
            <Field label="Ngành"                value={STUDENT_PROFILE.major} />
            <Field label="Loại hình đào tạo"    value={STUDENT_PROFILE.trainingType} />
            <Field label="Chuyên ngành"         value={STUDENT_PROFILE.specialization} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setInnerTab(t.id)}
              className="px-6 py-3 text-sm font-medium transition-colors relative"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: innerTab === t.id ? "var(--primary)" : "var(--muted-foreground)", fontWeight: innerTab === t.id ? 600 : 400 }}
            >
              {t.label}
              {innerTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: "var(--primary)" }} />}
            </button>
          ))}
        </div>

        {innerTab === "personal" && (
          <div className="p-5 space-y-6 [&_.text-sm]:text-[11.5px] [&_.text-xs]:text-[10px]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CCCD / Giấy tờ tùy thân</h3>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <Field label="Số CCCD"    value={STUDENT_PROFILE.cccd} />
                <Field label="Ngày cấp"  value={STUDENT_PROFILE.issuedDate} />
                <Field label="Nơi cấp"   value={STUDENT_PROFILE.issuedPlace} />
                <Field label="Quốc tịch" value={STUDENT_PROFILE.nationality} />
                <Field label="Dân tộc"   value={STUDENT_PROFILE.ethnic} />
                <Field label="Tôn giáo"  value={STUDENT_PROFILE.religion} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Địa chỉ</h3>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <Field label="Địa chỉ thường trú" value={STUDENT_PROFILE.permanentAddress} />
                <Field label="Địa chỉ hiện nay"   value={STUDENT_PROFILE.currentAddress} />
                <Field label="Địa chỉ liên lạc"   value={STUDENT_PROFILE.contactAddress} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin liên hệ</h3>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <Field label="Điện thoại"       value={STUDENT_PROFILE.phone} />
                <Field label="Email cá nhân"    value={STUDENT_PROFILE.personalEmail} />
                <Field label="Email chính thức" value={STUDENT_PROFILE.officialEmail} />
                <Field label="Ngày vào trường"  value={STUDENT_PROFILE.enrolledDate} />
                <Field label="Người cố vấn"     value={STUDENT_PROFILE.advisor} />
                <Field label="SĐT người cố vấn" value={STUDENT_PROFILE.advisorPhone} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5 border-b border-border" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông tin ngân hàng</h3>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <Field label="Số thẻ ngân hàng"   value={STUDENT_PROFILE.bankNumber} />
                <Field label="Ngân hàng liên kết"  value={STUDENT_PROFILE.bank} />
                <Field label="Chi nhánh"           value={STUDENT_PROFILE.bankBranch} />
              </div>
            </div>
          </div>
        )}

        {innerTab === "family" && <FamilyTab />}
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "admin">("student");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("profile");
  const [academicSubTab, setAcademicSubTab] = useState<"summary" | "progress">("summary");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;
  if (userRole === "admin") return <AdminApp onLogout={() => setIsLoggedIn(false)} />;

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {showLogoutConfirm && (
        <LogoutConfirm onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutConfirm(false)} />
      )}
      {showLogoutSuccess && <LogoutSuccess />}

      {/* ── Sidebar ── */}
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: sidebarOpen ? 192 : 52, background: "var(--primary)" }}
      >
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
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative"
                style={{ background: active ? "rgba(255,255,255,0.15)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.8)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: active ? 600 : 500, justifyContent: sidebarOpen ? "flex-start" : "center" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.95)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; } }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? "#f1999d" : "inherit" }} />
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
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(193,73,84,0.12)", border: "2px solid rgba(193,73,84,0.3)" }}>
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
        <header className="flex-shrink-0 bg-card border-b border-border px-5 py-3 flex items-center gap-3 relative z-40">
          <button onClick={() => setSidebarOpen(s => !s)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {sidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
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
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); }} className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: "9px" }}>{unread}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-sm" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông báo</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-secondary/30" : ""}`}>
                        <div className="flex items-start gap-2 mb-1">
                          {!n.read && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent)" }} />}
                          <p className={`text-xs leading-snug flex-1 ${!n.read ? "font-semibold text-foreground" : "text-foreground"}`}>{n.title}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1 pl-4">
                          <span className="text-xs text-muted-foreground">{n.time}</span>
                          <button onClick={() => { setSelectedNotif(n); setActiveSection("notifications"); setNotifOpen(false); }} className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>Chi tiết</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border">
                    <button onClick={() => { setActiveSection("notifications"); setNotifOpen(false); setSelectedNotif(null); }} className="w-full py-3 text-sm font-semibold hover:bg-secondary/50 transition-colors" style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tất cả</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={avatarRef}>
              <button onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: "rgba(193,73,84,0.12)", color: "var(--accent)", border: "2px solid rgba(193,73,84,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "12px" }}>
                NV
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 50 }}>
                  <div className="px-4 py-4 flex items-center gap-3 border-b border-border">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base" style={{ background: "rgba(193,73,84,0.12)", color: "var(--accent)", border: "2px solid rgba(193,73,84,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NV</div>
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

        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {activeSection === "profile" && <ProfileSection />}
          {activeSection === "academic" && <AcademicSection subTab={academicSubTab} setSubTab={setAcademicSubTab} />}
          {activeSection === "tuition" && <TuitionSection />}
          {activeSection === "notifications" && (
            <div className="max-w-3xl mx-auto space-y-4">
              {selectedNotif ? (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center gap-3" style={{ background: "var(--primary)" }}>
                    <button onClick={() => setSelectedNotif(null)} className="text-white/70 hover:text-white"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                    <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Chi tiết thông báo</h2>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedNotif.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{selectedNotif.time}</p>
                    <p className="text-sm leading-relaxed text-foreground">{selectedNotif.body}</p>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thông báo</h1>
                  <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} onClick={() => setSelectedNotif(n)} className={`px-5 py-4 cursor-pointer hover:bg-secondary/40 transition-colors flex items-start gap-3 ${!n.read ? "bg-secondary/20" : ""}`}>
                        {!n.read && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent)" }} />}
                        <div className={`flex-1 min-w-0 ${n.read ? "pl-5" : ""}`}>
                          <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} text-foreground`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

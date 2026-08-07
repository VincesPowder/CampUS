// ─── Types ────────────────────────────────────────────────────────────────────

export type FamilyMember = {
  name: string;
  dob: string;
  rel: string;
  job: string;
  workplace: string;
  phone: string;
  email: string;
  ethnic: string;
  religion: string;
  nationality: string;
  province: string;
  ward: string;
  address: string;
};

export type StudentProfile = {
  mssv: string;
  fullName: string;
  dob: string;
  placeOfBirth: string;
  gender: string;
  course: string;
  level: string;
  major: string;
  trainingType: string;
  specialization: string;
  status: string;
  role: string;
  // Personal info
  cccd: string;
  issuedDate: string;
  issuedPlace: string;
  nationality: string;
  ethnic: string;
  religion: string;
  permanentAddress: string;
  currentAddress: string;
  contactAddress: string;
  phone: string;
  personalEmail: string;
  officialEmail: string;
  enrolledDate: string;
  joinUnionDate: string;
  joinPartyDate: string;
  advisor: string;
  advisorPhone: string;
  advisorEmail: string;
  advisorRelation: string;
  bankNumber: string;
  bank: string;
  bankBranch: string;
};

// ─── Student profile ──────────────────────────────────────────────────────────

export const STUDENT_PROFILE: StudentProfile = {
  mssv:             "24127001",
  fullName:         "Nguyễn Văn An",
  dob:              "15/03/2006",
  placeOfBirth:     "TP. Hồ Chí Minh",
  gender:           "Nam",
  course:           "K24",
  level:            "Đại học",
  major:            "Khoa học Máy tính",
  trainingType:     "Chính quy",
  specialization:   "—",
  status:           "Đang học",
  role:             "Sinh viên",
  // Personal
  cccd:             "079203012345",
  issuedDate:       "20/08/2024",
  issuedPlace:      "Cục CS QLHC về TTXH",
  nationality:      "Việt Nam",
  ethnic:           "Kinh",
  religion:         "Không",
  permanentAddress: "123 Nguyễn Trãi, Q.1, TP.HCM",
  currentAddress:   "456 Lê Văn Sỹ, Q.3, TP.HCM",
  contactAddress:   "456 Lê Văn Sỹ, Q.3, TP.HCM",
  phone:            "0901 234 567",
  personalEmail:    "nguyenvanan@gmail.com",
  officialEmail:    "21127001@student.hcmus.edu.vn",
  enrolledDate:     "01/09/2024",
  joinUnionDate:    "15/03/2022",
  joinPartyDate:    "—",
  advisor:          "TS. Trần Văn Bình",
  advisorPhone:     "0912 345 678",
  advisorEmail:     "tvbinh@hcmus.edu.vn",
  advisorRelation:  "Giảng viên cố vấn",
  bankNumber:       "9704 1234 5678 9012",
  bank:             "Vietcombank",
  bankBranch:       "TP. Hồ Chí Minh",
};

// ─── Family data ──────────────────────────────────────────────────────────────

export const FAMILY_DATA: FamilyMember[] = [
  {
    name: "Nguyễn Văn Bình", dob: "1970", rel: "Cha",
    job: "Kỹ sư xây dựng", workplace: "Công ty XD ABC",
    phone: "0908 111 222", email: "binh@gmail.com",
    ethnic: "Kinh", religion: "Không", nationality: "Việt Nam",
    province: "TP. Hồ Chí Minh", ward: "Phường 5",
    address: "123 Nguyễn Trãi, Q.1, TP.HCM",
  },
  {
    name: "Trần Thị Lan", dob: "1973", rel: "Mẹ",
    job: "Giáo viên", workplace: "Trường THPT Lê Quý Đôn",
    phone: "0908 333 444", email: "lan@gmail.com",
    ethnic: "Kinh", religion: "Phật giáo", nationality: "Việt Nam",
    province: "TP. Hồ Chí Minh", ward: "Phường 5",
    address: "123 Nguyễn Trãi, Q.1, TP.HCM",
  },
  {
    name: "", dob: "", rel: "", job: "", workplace: "",
    phone: "", email: "", ethnic: "", religion: "",
    nationality: "", province: "", ward: "", address: "",
  },
];

// ─── Academic / Courses ───────────────────────────────────────────────────────

export type CourseRecord = {
  stt: number;
  namHoc: string;
  hocKy: number;
  maMon: string;
  tenMon: string;
  soTC: number;
  lop: string;
  loaiDiem: string;
  diem10: number | null;
  diemGK: number | null;
  diemCK: number | null;
  chuongTrinh: string;
  he: string;
};

export const COURSE_DATA: CourseRecord[] = [
  { stt:1,  namHoc:"24-25", hocKy:1, maMon:"CSC00004",  tenMon:"Nhập môn Công nghệ Thông tin",          soTC:4, lop:"24C07",     loaiDiem:"",   diem10:8.9, diemGK:null, diemCK:7.8, chuongTrinh:"DH", he:"DKD" },
  { stt:2,  namHoc:"24-25", hocKy:1, maMon:"CSC10012",  tenMon:"Cơ sở lập trình",                       soTC:4, lop:"24C07",     loaiDiem:"",   diem10:6.0, diemGK:null, diemCK:7.3, chuongTrinh:"DH", he:"DKD" },
  { stt:3,  namHoc:"24-25", hocKy:1, maMon:"CSC10121",  tenMon:"Kỹ năng mềm",                           soTC:3, lop:"24C07",     loaiDiem:"",   diem10:8.7, diemGK:null, diemCK:8.7, chuongTrinh:"DH", he:"DKD" },
  { stt:4,  namHoc:"24-25", hocKy:1, maMon:"MTH00009",  tenMon:"Toán rời rạc",                          soTC:4, lop:"24C05",     loaiDiem:"",   diem10:9.6, diemGK:null, diemCK:9.5, chuongTrinh:"DH", he:"DKD" },
  { stt:5,  namHoc:"24-25", hocKy:2, maMon:"CSC10004",  tenMon:"Cấu trúc dữ liệu và giải thuật",        soTC:4, lop:"24C07",     loaiDiem:"",   diem10:8.1, diemGK:null, diemCK:5.5, chuongTrinh:"DH", he:"DKD" },
  { stt:6,  namHoc:"24-25", hocKy:2, maMon:"PHY00005",  tenMon:"Vật lý đại cương 1",                    soTC:4, lop:"24C05",     loaiDiem:"",   diem10:9.0, diemGK:null, diemCK:9.0, chuongTrinh:"DH", he:"DKD" },
  { stt:7,  namHoc:"24-25", hocKy:2, maMon:"BAA00004",  tenMon:"Pháp luật đại cương",                   soTC:3, lop:"24C04",     loaiDiem:"",   diem10:8.0, diemGK:null, diemCK:6.0, chuongTrinh:"DH", he:"DKD" },
  { stt:8,  namHoc:"24-25", hocKy:2, maMon:"MTH00058",  tenMon:"Toán học tổ hợp",                       soTC:4, lop:"24C05",     loaiDiem:"",   diem10:9.1, diemGK:null, diemCK:9.0, chuongTrinh:"DH", he:"DKD" },
  { stt:9,  namHoc:"24-25", hocKy:3, maMon:"MTH00005",  tenMon:"Vi tích phân 1",                        soTC:4, lop:"24C05",     loaiDiem:"",   diem10:8.2, diemGK:null, diemCK:5.5, chuongTrinh:"DH", he:"DKD" },
  { stt:10, namHoc:"24-25", hocKy:3, maMon:"MTH00008",  tenMon:"Đại số tuyến tính",                     soTC:4, lop:"24C05",     loaiDiem:"",   diem10:7.6, diemGK:null, diemCK:6.8, chuongTrinh:"DH", he:"DKD" },
  { stt:11, namHoc:"24-25", hocKy:3, maMon:"CSC10003",  tenMon:"Phương pháp lập trình hướng đối tượng", soTC:4, lop:"24C07",     loaiDiem:"",   diem10:8.8, diemGK:null, diemCK:6.3, chuongTrinh:"DH", he:"DKD" },
  { stt:12, namHoc:"24-25", hocKy:3, maMon:"CSC10008",  tenMon:"Mạng máy tính",                         soTC:4, lop:"24C07",     loaiDiem:"",   diem10:8.7, diemGK:null, diemCK:6.2, chuongTrinh:"DH", he:"DKD" },
  { stt:13, namHoc:"25-26", hocKy:1, maMon:"BAA00005",  tenMon:"",                                      soTC:0, lop:"24C05",     loaiDiem:"",   diem10:9.1, diemGK:null, diemCK:8.5, chuongTrinh:"DH", he:"DKD" },
  { stt:14, namHoc:"25-26", hocKy:1, maMon:"CSC10014",  tenMon:"",                                      soTC:0, lop:"24C07",     loaiDiem:"",   diem10:9.9, diemGK:null, diemCK:9.8, chuongTrinh:"DH", he:"DKD" },
  { stt:15, namHoc:"25-26", hocKy:1, maMon:"MTH00006",  tenMon:"",                                      soTC:0, lop:"24C05",     loaiDiem:"",   diem10:9.3, diemGK:null, diemCK:8.3, chuongTrinh:"DH", he:"DKD" },
  { stt:16, namHoc:"25-26", hocKy:1, maMon:"CSC10012",  tenMon:"",                                      soTC:0, lop:"25C10",     loaiDiem:"CT", diem10:9.5, diemGK:null, diemCK:7.1, chuongTrinh:"DH", he:"DKD" },
  { stt:17, namHoc:"25-26", hocKy:1, maMon:"BAA00030",  tenMon:"",                                      soTC:0, lop:"24CTT_DKD", loaiDiem:"",   diem10:8.3, diemGK:null, diemCK:null, chuongTrinh:"DH", he:"DKD" },
];

// ─── Admin Student List ───────────────────────────────────────────────────────

export type AdminStudent = {
  mssv: string;
  hoTen: string;
  email: string;
  gioiTinh: string;
  khoa: string;
  bacDT: string;
  nganh: string;
  loaiDT: string;
  chuyenNganh: string;
};

export const ADMIN_STUDENTS: AdminStudent[] = [
  { mssv:"24127001", hoTen:"Nguyễn Văn An",    email:"24127001@student.hcmus.edu.vn", gioiTinh:"Nam", khoa:"K24", bacDT:"Đại học", nganh:"Khoa học Máy tính",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"24127002", hoTen:"Trần Thị Bích",     email:"24127002@student.hcmus.edu.vn", gioiTinh:"Nữ",  khoa:"K24", bacDT:"Đại học", nganh:"Khoa học Máy tính",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"24127003", hoTen:"Lê Minh Cường",     email:"24127003@student.hcmus.edu.vn", gioiTinh:"Nam", khoa:"K24", bacDT:"Đại học", nganh:"Hệ thống Thông tin",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"23127045", hoTen:"Phạm Thị Dung",     email:"23127045@student.hcmus.edu.vn", gioiTinh:"Nữ",  khoa:"K23", bacDT:"Đại học", nganh:"Khoa học Máy tính",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"23127089", hoTen:"Hoàng Văn Em",      email:"23127089@student.hcmus.edu.vn", gioiTinh:"Nam", khoa:"K23", bacDT:"Đại học", nganh:"Mạng máy tính",           loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"22127011", hoTen:"Ngô Thị Phương",    email:"22127011@student.hcmus.edu.vn", gioiTinh:"Nữ",  khoa:"K22", bacDT:"Đại học", nganh:"Khoa học Máy tính",      loaiDT:"Chính quy", chuyenNganh:"Trí tuệ nhân tạo" },
  { mssv:"22127034", hoTen:"Vũ Đức Giang",      email:"22127034@student.hcmus.edu.vn", gioiTinh:"Nam", khoa:"K22", bacDT:"Đại học", nganh:"Công nghệ Phần mềm",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"24127050", hoTen:"Đinh Thị Hoa",      email:"24127050@student.hcmus.edu.vn", gioiTinh:"Nữ",  khoa:"K24", bacDT:"Đại học", nganh:"Hệ thống Thông tin",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"23127120", hoTen:"Bùi Văn Inh",       email:"23127120@student.hcmus.edu.vn", gioiTinh:"Nam", khoa:"K23", bacDT:"Đại học", nganh:"An toàn Thông tin",       loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"22127067", hoTen:"Đặng Thị Kim",      email:"22127067@student.hcmus.edu.vn", gioiTinh:"Nữ",  khoa:"K22", bacDT:"Đại học", nganh:"Khoa học Máy tính",      loaiDT:"CLC",       chuyenNganh:"Khoa học dữ liệu" },
  { mssv:"21127008", hoTen:"Lý Minh Long",      email:"21127008@student.hcmus.edu.vn", gioiTinh:"Nam", khoa:"K21", bacDT:"Đại học", nganh:"Công nghệ Phần mềm",      loaiDT:"Chính quy", chuyenNganh:"—" },
  { mssv:"24127088", hoTen:"Mai Thị Ngọc",      email:"24127088@student.hcmus.edu.vn", gioiTinh:"Nữ",  khoa:"K24", bacDT:"Đại học", nganh:"Khoa học Máy tính",      loaiDT:"CLC",       chuyenNganh:"—" },
];

// ─── Tuition ─────────────────────────────────────────────────────────────────

export type TuitionRecord = {
  stt: number;
  nhHk: string;
  maMon: string;
  lop: string;
  tenMon: string;
  soTC: number;
  soTiet: number;
  soTcHocPhi: number;
  hocPhi: number;
  giam: number;
  hoTro: number;
  hocPhiThucDong: number;
  chiPhi: number;
  ghiChu: string;
};

export type TuitionSemester = {
  nhHk: string;
  rows: TuitionRecord[];
  ngayCapNhat: string;
};

export const TUITION_DATA: TuitionSemester[] = [
  {
    nhHk: "25-26/3",
    ngayCapNhat: "03/07/2026 15:25",
    rows: [
      { stt:1, nhHk:"25-26/3", maMon:"CSC10006", lop:"24C07", tenMon:"Cơ sở dữ liệu",                           soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
      { stt:2, nhHk:"25-26/3", maMon:"BAA00012", lop:"24C04", tenMon:"Kinh tế chính trị Mác-Lênin",             soTC:2.0, soTiet:30, soTcHocPhi:2.00, hocPhi:896000,  giam:0, hoTro:0, hocPhiThucDong:896000,  chiPhi:0, ghiChu:"" },
      { stt:3, nhHk:"25-26/3", maMon:"CSC10002", lop:"24C07", tenMon:"Nhập môn công nghệ phần mềm",             soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
      { stt:4, nhHk:"25-26/3", maMon:"BAA00022", lop:"24C07", tenMon:"Thể dục 2",                               soTC:2.0, soTiet:45, soTcHocPhi:3.00, hocPhi:1344000, giam:0, hoTro:0, hocPhiThucDong:1344000, chiPhi:0, ghiChu:"" },
      { stt:5, nhHk:"25-26/3", maMon:"MTH00057", lop:"24C05", tenMon:"Toán ứng dụng và thống kê cho CNTT",     soTC:4.0, soTiet:75, soTcHocPhi:5.75, hocPhi:5462500, giam:0, hoTro:0, hocPhiThucDong:5462500, chiPhi:0, ghiChu:"" },
    ],
  },
  {
    nhHk: "24-25/2",
    ngayCapNhat: "01/03/2025 08:00",
    rows: [
      { stt:1, nhHk:"24-25/2", maMon:"CSC10004", lop:"24C07", tenMon:"Cấu trúc dữ liệu và giải thuật",          soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
      { stt:2, nhHk:"24-25/2", maMon:"PHY00005", lop:"24C05", tenMon:"Vật lý đại cương 1",                      soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
      { stt:3, nhHk:"24-25/2", maMon:"BAA00004", lop:"24C04", tenMon:"Pháp luật đại cương",                     soTC:3.0, soTiet:45, soTcHocPhi:3.00, hocPhi:1344000, giam:0, hoTro:0, hocPhiThucDong:1344000, chiPhi:0, ghiChu:"" },
      { stt:4, nhHk:"24-25/2", maMon:"MTH00058", lop:"24C05", tenMon:"Toán học tổ hợp",                        soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
    ],
  },
  {
    nhHk: "24-25/1",
    ngayCapNhat: "01/09/2024 08:00",
    rows: [
      { stt:1, nhHk:"24-25/1", maMon:"CSC00004", lop:"24C07", tenMon:"Nhập môn Công nghệ Thông tin",            soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
      { stt:2, nhHk:"24-25/1", maMon:"CSC10012", lop:"24C07", tenMon:"Cơ sở lập trình",                        soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
      { stt:3, nhHk:"24-25/1", maMon:"CSC10121", lop:"24C07", tenMon:"Kỹ năng mềm",                            soTC:3.0, soTiet:45, soTcHocPhi:3.00, hocPhi:1344000, giam:0, hoTro:0, hocPhiThucDong:1344000, chiPhi:0, ghiChu:"" },
      { stt:4, nhHk:"24-25/1", maMon:"MTH00009", lop:"24C05", tenMon:"Toán rời rạc",                           soTC:4.0, soTiet:75, soTcHocPhi:7.25, hocPhi:6887500, giam:0, hoTro:0, hocPhiThucDong:6887500, chiPhi:0, ghiChu:"" },
    ],
  },
];

// ─── Accounts ────────────────────────────────────────────────────────────────

export type Account = {
  username: string;
  label: string;
  email: string;
  initials: string;
  pass: string;
  role: "admin" | "student";
};

export const ACCOUNTS: Account[] = [
  { username: "admin",   label: "Quản trị viên", email: "admin@hcmus.edu.vn",            initials: "AD", pass: "abc", role: "admin" },
  { username: "student", label: "Sinh viên",      email: "24127001@student.hcmus.edu.vn", initials: "NV", pass: "123", role: "student" },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export type Notification = {
  id: number;
  title: string;
  body: string;
  time: string;
  read: boolean;
  khoa: string;   // e.g. "Khoa CNTT", "Khoa Toán - Tin học", "" if N/A
  phong: string;  // e.g. "Phòng Đào tạo", "Ban Giám hiệu", "" if N/A
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Đăng ký học phần HK1/2025-2026",
    body: "Sinh viên vui lòng đăng ký học phần học kỳ 1 năm học 2025-2026 từ ngày 10/07 đến 20/07/2025 trên hệ thống. Lưu ý kiểm tra điều kiện tiên quyết trước khi đăng ký.",
    time: "1 giờ 45 phút trước",
    read: false,
    khoa: "",
    phong: "Phòng Đào tạo",
  },
  {
    id: 2,
    title: "Lịch thi cuối kỳ HK2/2024-2025 đã cập nhật",
    body: "Phòng Đào tạo thông báo lịch thi cuối kỳ HK2/2024-2025 đã được cập nhật. Một số môn có thay đổi phòng thi, sinh viên kiểm tra lại trên cổng thông tin.",
    time: "1 ngày 1 giờ trước",
    read: false,
    khoa: "",
    phong: "Phòng Đào tạo",
  },
  {
    id: 3,
    title: "Nộp bài tập lớn môn Cơ sở dữ liệu",
    body: "Bạn đã nộp bài tập lớn môn Cơ sở dữ liệu - Assignment 3 thành công lúc 23:00 ngày 07/07/2025.",
    time: "2 ngày 22 giờ trước",
    read: false,
    khoa: "Khoa CNTT",
    phong: "",
  },
  {
    id: 4,
    title: "Học bổng KKHT HK2/2024-2025",
    body: "Danh sách sinh viên nhận học bổng Khuyến khích Học tập HK2/2024-2025 đã được công bố. Sinh viên có thể kiểm tra kết quả tại Phòng Công tác sinh viên.",
    time: "3 ngày 1 giờ trước",
    read: true,
    khoa: "",
    phong: "Phòng Công tác SV",
  },
  {
    id: 5,
    title: "Khảo sát giảng dạy cuối kỳ",
    body: "Nhà trường kính mời sinh viên hoàn thành phiếu khảo sát giảng dạy cuối kỳ HK2/2024-2025 trước ngày 15/07/2025. Ý kiến của bạn giúp nâng cao chất lượng đào tạo.",
    time: "9 ngày 22 giờ trước",
    read: true,
    khoa: "",
    phong: "Ban Giám hiệu",
  },
  {
    id: 6,
    title: "Thực tập doanh nghiệp HK1/2025-2026",
    body: "Khoa CNTT thông báo danh sách doanh nghiệp nhận sinh viên thực tập HK1/2025-2026 đã được cập nhật. Sinh viên đủ điều kiện đăng ký trước ngày 25/07/2025.",
    time: "5 ngày 3 giờ trước",
    read: true,
    khoa: "Khoa CNTT",
    phong: "",
  },
  {
    id: 7,
    title: "Gia hạn nộp học phí HK1/2025-2026",
    body: "Phòng Kế hoạch – Tài chính thông báo hạn nộp học phí HK1/2025-2026 được gia hạn đến 05/08/2025. Sinh viên chưa nộp vui lòng hoàn thành trước hạn để tránh bị khoá tài khoản.",
    time: "6 ngày 12 giờ trước",
    read: true,
    khoa: "",
    phong: "Phòng Tài chính",
  },
  {
    id: 8,
    title: "Thông báo nghỉ lễ 27/07",
    body: "Nhà trường thông báo lịch nghỉ lễ ngày Thương binh Liệt sĩ 27/07/2025. Toàn bộ hoạt động học tập và hành chính sẽ nghỉ 01 ngày.",
    time: "7 ngày trước",
    read: true,
    khoa: "",
    phong: "Ban Giám hiệu",
  },
  {
    id: 9,
    title: "Lịch seminar nghiên cứu khoa học T8/2025",
    body: "Khoa Toán – Tin học tổ chức chuỗi seminar nghiên cứu khoa học tháng 8/2025. Sinh viên quan tâm đăng ký tham dự qua form online trước ngày 28/07.",
    time: "8 ngày trước",
    read: true,
    khoa: "Khoa Toán – Tin học",
    phong: "",
  },
  {
    id: 10,
    title: "Cập nhật quy chế đánh giá học phần 2025",
    body: "Phòng Khảo thí & ĐBCL thông báo quy chế đánh giá học phần năm 2025 đã được cập nhật. Sinh viên vui lòng đọc kỹ trước khi bắt đầu học kỳ mới.",
    time: "10 ngày trước",
    read: true,
    khoa: "",
    phong: "Phòng Khảo thí & ĐBCL",
  },
];

// ─── Admin Survey Data ────────────────────────────────────────────────────────

export const KHOA_LIST = ["Khoa CNTT", "Khoa Toán – Tin", "Khoa Vật lý", "Khoa Hóa học", "Khoa Sinh học", "Khoa Môi trường"];

export type QuestionType = "radio" | "checkbox" | "text" | "rating";

export type SurveyQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  required: boolean;
};

export type AdminSurveyItem = {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  status: "draft" | "open" | "closed";
  openFrom: string;
  openTo: string;
  targetKhoa: string[];
  responses: number;
  createdAt: string;
};

export const MOCK_ADMIN_SURVEYS: AdminSurveyItem[] = [
  {
    id: "sv1",
    title: "Khảo sát chất lượng giảng dạy HK1 2025-2026",
    description: "Đánh giá chất lượng giảng dạy và học tập trong học kỳ 1 năm học 2025-2026.",
    questions: [
      { id: "q1", type: "rating",   text: "Bạn đánh giá chất lượng giảng dạy của giảng viên như thế nào?", options: [], required: true },
      { id: "q2", type: "radio",    text: "Hình thức học nào bạn thấy hiệu quả nhất?", options: ["Trực tiếp", "Trực tuyến", "Kết hợp"], required: true },
      { id: "q3", type: "checkbox", text: "Những yếu tố nào ảnh hưởng đến việc học của bạn?", options: ["Tài liệu học tập", "Phương pháp giảng dạy", "Cơ sở vật chất", "Thời gian biểu"], required: false },
      { id: "q4", type: "text",     text: "Góp ý thêm cho nhà trường (nếu có):", options: [], required: false },
    ],
    status: "open",
    openFrom: "2026-07-13",
    openTo: "2026-08-09",
    targetKhoa: ["Khoa CNTT", "Khoa Toán – Tin"],
    responses: 142,
    createdAt: "2026-07-10",
  },
  {
    id: "sv2",
    title: "Khảo sát cơ sở vật chất và dịch vụ sinh viên",
    description: "Đánh giá mức độ hài lòng với cơ sở vật chất, thư viện, căng tin và các dịch vụ hỗ trợ sinh viên.",
    questions: [
      { id: "q1", type: "rating",   text: "Bạn hài lòng với cơ sở vật chất của trường ở mức nào?", options: [], required: true },
      { id: "q2", type: "checkbox", text: "Bạn thường sử dụng dịch vụ nào của trường?", options: ["Thư viện", "Căng tin", "Phòng máy tính", "Phòng tập thể thao", "Y tế học đường"], required: false },
      { id: "q3", type: "radio",    text: "Bạn đánh giá chất lượng thư viện như thế nào?", options: ["Rất tốt", "Tốt", "Trung bình", "Cần cải thiện"], required: true },
      { id: "q4", type: "text",     text: "Bạn muốn trường cải thiện điều gì nhất?", options: [], required: false },
    ],
    status: "closed",
    openFrom: "2026-06-01",
    openTo: "2026-06-30",
    targetKhoa: KHOA_LIST,
    responses: 387,
    createdAt: "2026-05-28",
  },
  {
    id: "sv3",
    title: "Khảo sát nhu cầu học bổng và hỗ trợ tài chính",
    description: "Thu thập thông tin về nhu cầu học bổng và các hỗ trợ tài chính cho sinh viên.",
    questions: [
      { id: "q1", type: "radio",  text: "Bạn có đang nhận học bổng không?", options: ["Có", "Không", "Đã nộp đơn, chờ xét duyệt"], required: true },
      { id: "q2", type: "rating", text: "Mức độ khó khăn tài chính của bạn?", options: [], required: true },
      { id: "q3", type: "text",   text: "Bạn cần hỗ trợ gì từ nhà trường?", options: [], required: false },
    ],
    status: "draft",
    openFrom: "",
    openTo: "",
    targetKhoa: [],
    responses: 0,
    createdAt: "2026-07-20",
  },
];

export const MOCK_RESULTS: Record<string, { question: SurveyQuestion; data: { label: string; count: number; color: string }[] }[]> = {
  sv1: [
    {
      question: { id: "q1", type: "rating", text: "Bạn đánh giá chất lượng giảng dạy của giảng viên như thế nào?", options: [], required: true },
      data: [
        { label: "1 sao", count: 3,  color: "#ef4444" },
        { label: "2 sao", count: 8,  color: "#f97316" },
        { label: "3 sao", count: 21, color: "#eab308" },
        { label: "4 sao", count: 58, color: "#22c55e" },
        { label: "5 sao", count: 52, color: "#3E4B8E" },
      ],
    },
    {
      question: { id: "q2", type: "radio", text: "Hình thức học nào bạn thấy hiệu quả nhất?", options: ["Trực tiếp", "Trực tuyến", "Kết hợp"], required: true },
      data: [
        { label: "Trực tiếp",  count: 84, color: "#3E4B8E" },
        { label: "Trực tuyến", count: 23, color: "#c14954" },
        { label: "Kết hợp",    count: 35, color: "#6366f1" },
      ],
    },
    {
      question: { id: "q3", type: "checkbox", text: "Những yếu tố nào ảnh hưởng đến việc học của bạn?", options: ["Tài liệu học tập", "Phương pháp giảng dạy", "Cơ sở vật chất", "Thời gian biểu"], required: false },
      data: [
        { label: "Tài liệu học tập",      count: 98,  color: "#3E4B8E" },
        { label: "Phương pháp giảng dạy", count: 115, color: "#c14954" },
        { label: "Cơ sở vật chất",        count: 67,  color: "#6366f1" },
        { label: "Thời gian biểu",        count: 80,  color: "#06b6d4" },
      ],
    },
  ],
  sv2: [
    {
      question: { id: "q1", type: "rating", text: "Bạn hài lòng với cơ sở vật chất của trường ở mức nào?", options: [], required: true },
      data: [
        { label: "1 sao", count: 12,  color: "#ef4444" },
        { label: "2 sao", count: 28,  color: "#f97316" },
        { label: "3 sao", count: 97,  color: "#eab308" },
        { label: "4 sao", count: 145, color: "#22c55e" },
        { label: "5 sao", count: 105, color: "#3E4B8E" },
      ],
    },
    {
      question: { id: "q2", type: "checkbox", text: "Bạn thường sử dụng dịch vụ nào của trường?", options: [], required: false },
      data: [
        { label: "Thư viện",           count: 289, color: "#3E4B8E" },
        { label: "Căng tin",           count: 334, color: "#c14954" },
        { label: "Phòng máy tính",     count: 201, color: "#6366f1" },
        { label: "Phòng tập thể thao", count: 98,  color: "#06b6d4" },
        { label: "Y tế học đường",     count: 45,  color: "#22c55e" },
      ],
    },
    {
      question: { id: "q3", type: "radio", text: "Bạn đánh giá chất lượng thư viện như thế nào?", options: [], required: true },
      data: [
        { label: "Rất tốt",       count: 89,  color: "#3E4B8E" },
        { label: "Tốt",           count: 178, color: "#6366f1" },
        { label: "Trung bình",    count: 95,  color: "#eab308" },
        { label: "Cần cải thiện", count: 25,  color: "#ef4444" },
      ],
    },
  ],
};

// ─── Admin Academic / Grade Data ──────────────────────────────────────────────

export type GradeStatus = "pending" | "uploaded" | "locked";

export type AdminCourseItem = {
  id: string; maMon: string; tenMon: string; lop: string; soTC: number;
  giangVien: string; emailGV: string; soSV: number; khoa: string;
  status: GradeStatus; namHoc: string; hocKy: number; ngayNopDiem?: string;
};

export type StudentGradeRow = {
  mssv: string; hoTen: string;
  diemCC: number | null; diemGK: number | null; diemCK: number | null;
  diemTK: number | null; ghiChu: string;
};

export const ACADEMIC_COURSES: AdminCourseItem[] = [
  { id:"c1",  namHoc:"25-26", hocKy:3, maMon:"CSC10006", tenMon:"Cơ sở dữ liệu",                 lop:"24C07", soTC:4, giangVien:"TS. Võ Thị Minh Hằng",  emailGV:"vtmhang@fit.hcmus.edu.vn", soSV:45,  khoa:"CNTT",           status:"uploaded", ngayNopDiem:"20/07/2026" },
  { id:"c2",  namHoc:"25-26", hocKy:3, maMon:"BAA00012", tenMon:"Kinh tế CT Mác-Lênin",           lop:"24C04", soTC:2, giangVien:"TS. Nguyễn Thị Lan",    emailGV:"ntlan@hcmus.edu.vn",       soSV:120, khoa:"Đại cương",      status:"pending" },
  { id:"c3",  namHoc:"25-26", hocKy:3, maMon:"CSC10002", tenMon:"Nhập môn Công nghệ Phần mềm",    lop:"24C07", soTC:4, giangVien:"TS. Nguyễn Vũ",         emailGV:"nvu@fit.hcmus.edu.vn",     soSV:48,  khoa:"CNTT",           status:"locked",   ngayNopDiem:"15/07/2026" },
  { id:"c4",  namHoc:"25-26", hocKy:3, maMon:"BAA00022", tenMon:"Thể dục 2",                      lop:"24C07", soTC:2, giangVien:"GV. Đặng Thế Quang",    emailGV:"dtquang@hcmus.edu.vn",     soSV:48,  khoa:"Đại cương",      status:"pending" },
  { id:"c5",  namHoc:"25-26", hocKy:3, maMon:"MTH00057", tenMon:"Toán ứng dụng & Thống kê CNTT", lop:"24C05", soTC:4, giangVien:"TS. Võ Quang Hoàng",    emailGV:"vqhoang@fit.hcmus.edu.vn", soSV:90,  khoa:"Toán - Tin học", status:"uploaded", ngayNopDiem:"18/07/2026" },
  { id:"c6",  namHoc:"24-25", hocKy:2, maMon:"CSC10004", tenMon:"Cấu trúc dữ liệu & Giải thuật", lop:"24C07", soTC:4, giangVien:"PGS.TS. Lê Hoài Bắc",  emailGV:"lhbac@fit.hcmus.edu.vn",  soSV:45,  khoa:"CNTT",           status:"locked",   ngayNopDiem:"10/03/2025" },
  { id:"c7",  namHoc:"24-25", hocKy:2, maMon:"PHY00005", tenMon:"Vật lý đại cương 1",            lop:"24C05", soTC:4, giangVien:"TS. Phạm Văn Đức",      emailGV:"pvduc@hcmus.edu.vn",       soSV:90,  khoa:"Vật lý - VLKT",  status:"locked",   ngayNopDiem:"12/03/2025" },
  { id:"c8",  namHoc:"24-25", hocKy:2, maMon:"MTH00058", tenMon:"Toán học tổ hợp",               lop:"24C05", soTC:4, giangVien:"TS. Nguyễn Trọng Tiến", emailGV:"nttien@fit.hcmus.edu.vn",  soSV:85,  khoa:"Toán - Tin học", status:"locked",   ngayNopDiem:"11/03/2025" },
  { id:"c9",  namHoc:"24-25", hocKy:1, maMon:"CSC00004", tenMon:"Nhập môn Công nghệ Thông tin",  lop:"24C07", soTC:4, giangVien:"TS. Trần Minh Triết",   emailGV:"tmtriet@fit.hcmus.edu.vn", soSV:48,  khoa:"CNTT",           status:"locked",   ngayNopDiem:"15/09/2024" },
  { id:"c10", namHoc:"24-25", hocKy:1, maMon:"CSC10012", tenMon:"Cơ sở lập trình",               lop:"24C07", soTC:4, giangVien:"TS. Dương Tuấn Anh",    emailGV:"dtanh@fit.hcmus.edu.vn",   soSV:48,  khoa:"CNTT",           status:"locked",   ngayNopDiem:"14/09/2024" },
];

export function makeMockGrades(courseId: string): StudentGradeRow[] {
  const students = [
    { mssv:"24127001", hoTen:"Nguyễn Văn An" },    { mssv:"24127002", hoTen:"Trần Thị Bích" },
    { mssv:"24127003", hoTen:"Lê Minh Cường" },     { mssv:"24127050", hoTen:"Đinh Thị Hoa" },
    { mssv:"24127088", hoTen:"Mai Thị Ngọc" },      { mssv:"23127045", hoTen:"Phạm Thị Dung" },
    { mssv:"23127089", hoTen:"Hoàng Văn Em" },      { mssv:"23127120", hoTen:"Bùi Văn Phúc" },
    { mssv:"22127011", hoTen:"Ngô Thị Phương" },    { mssv:"22127034", hoTen:"Vũ Đức Giang" },
    { mssv:"22127067", hoTen:"Đặng Thị Kim Anh" },  { mssv:"21127008", hoTen:"Lý Minh Long" },
  ];
  const seed = courseId.charCodeAt(courseId.length - 1);
  return students.map((s, i) => {
    const pick = (offset: number) => {
      const v = ((seed * 31 + i * 17 + offset) % 61 + 40) / 10;
      return Math.round(Math.min(10, Math.max(3.5, v)) * 10) / 10;
    };
    const cc = pick(0); const gk = pick(5); const ck = pick(9);
    const tk = Math.round((cc * 0.1 + gk * 0.3 + ck * 0.6) * 10) / 10;
    return { ...s, diemCC: cc, diemGK: gk, diemCK: ck, diemTK: tk, ghiChu: "" };
  });
}

// ─── Progress / Credit Group Data ────────────────────────────────────────────

export const CREDIT_GROUPS_DATA = [
  { code: "LL_CT",    name: "Lý luận chính trị - Pháp luật",          req: 14, done: 14 },
  { code: "XH_TC",    name: "Khoa học xã hội - Kinh tế - Kỹ năng",    req: 2,  done: 0  },
  { code: "TN_BB",    name: "Toán - KHTN - Công nghệ - MT (BB)",       req: 26, done: 20 },
  { code: "TN_TC1",   name: "Toán - KHTN - Công nghệ - MT (TC1)",      req: 4,  done: 4  },
  { code: "TN_TC2",   name: "Toán - KHTN - Công nghệ - MT (TC2)",      req: 8,  done: 0  },
  { code: "TH_BB",    name: "Tin học cơ sở",                           req: 4,  done: 4  },
  { code: "GD_TC",    name: "Giáo dục thể chất",                       req: 4,  done: 4  },
  { code: "GD_QP",    name: "Giáo dục quốc phòng – an ninh",           req: 4,  done: 4  },
  { code: "CN_CS",    name: "Kiến thức cơ sở ngành",                   req: 38, done: 18 },
  { code: "CN_TN_TC", name: "Kiến thức tốt nghiệp TC",                 req: 4,  done: 0  },
  { code: "CN_NG",    name: "Kiến thức bắt buộc ngành (N1)",           req: 16, done: 5  },
  { code: "CN_TC",    name: "Kiến thức tự chọn ngành (M1)",            req: 8,  done: 0  },
  { code: "CN_TD",    name: "Kiến thức tự chọn tự do",                 req: 0,  done: 0  },
  { code: "CN_TN_BB", name: "Kiến thức tốt nghiệp BB",                 req: 6,  done: 0  },
];

export const RADAR_AXES = [
  { subject: "Toán học",    score: 7.5, fullMark: 10 },
  { subject: "Lập trình",   score: 8.2, fullMark: 10 },
  { subject: "Hệ thống",    score: 6.8, fullMark: 10 },
  { subject: "Trí tuệ NT",  score: 7.0, fullMark: 10 },
  { subject: "Mạng & CSDL", score: 6.5, fullMark: 10 },
  { subject: "Phần mềm",    score: 7.8, fullMark: 10 },
];

// ─── Student Surveys ──────────────────────────────────────────────────────────

export type Survey = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  courses: { id: string; code: string; name: string }[];
};

export const AVAILABLE_SURVEYS: Survey[] = [
  {
    id: "sv_gd_2526",
    title: "Khảo sát về hoạt động giảng dạy trong năm học 2025–2026",
    description: "Nhằm nâng cao chất lượng giảng dạy, học tập và hỗ trợ sinh viên, nhà trường thực hiện khảo sát ý kiến phản hồi về hoạt động giảng dạy trong năm học 2025–2026. Chúng tôi trân trọng sự tham gia của anh/chị và cam kết sử dụng kết quả một cách khách quan, có trách nhiệm.",
    deadline: "31/07/2026",
    courses: [
      { id: "24C07_TD",   code: "24C07", name: "Thể dục 2" },
      { id: "24C04_KT",   code: "24C04", name: "Kinh tế chính trị Mác – Lênin" },
      { id: "24C07_PM",   code: "24C07", name: "Nhập môn công nghệ phần mềm" },
      { id: "24C04_TK",   code: "24C04", name: "Toán ứng dụng và thống kê cho Công nghệ thông tin" },
      { id: "24C05_CSDL", code: "24C05", name: "Cơ sở dữ liệu" },
      { id: "24C06_MMT",  code: "24C06", name: "Mạng máy tính" },
    ],
  },
  {
    id: "sv_csvc_2526",
    title: "Khảo sát mức độ hài lòng về cơ sở vật chất năm học 2025–2026",
    description: "Khảo sát này thu thập ý kiến sinh viên về chất lượng phòng học, thư viện, phòng thực hành và các tiện ích phục vụ học tập tại trường nhằm cải thiện môi trường học tập.",
    deadline: "15/08/2026",
    courses: [
      { id: "csvc_ph",  code: "—", name: "Phòng học & giảng đường" },
      { id: "csvc_tv",  code: "—", name: "Thư viện & tài liệu" },
      { id: "csvc_lab", code: "—", name: "Phòng thực hành & máy tính" },
      { id: "csvc_wf",  code: "—", name: "Wifi & hạ tầng mạng" },
    ],
  },
];

// ─── AI Chatbot data ──────────────────────────────────────────────────────────

export const BOT_GREET_TEXT = "Xin chào! Tôi là **HCMUS AI** — trợ lý học vụ của bạn.\nTôi có thể giúp tra cứu lịch học, điểm số, học phí và các thắc mắc học vụ. Bạn cần hỗ trợ gì?";

export const CHAT_SUGGESTIONS = [
  "Lịch học hôm nay?",
  "Học phí còn bao nhiêu?",
  "Khi nào đăng ký môn?",
  "Cách xem điểm thi?",
];

export function mockReply(q: string): string {
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
    return "Không có gì, rất vui được hỗ trợ bạn! Nếu còn câu hỏi nào khác, tôi luôn ở đây. Chúc bạn học tốt!";
  return "Tôi ghi nhận câu hỏi của bạn. Để được hỗ trợ chi tiết hơn, bạn có thể:\n• Đến **Phòng Đào tạo** (B001, Cơ sở 1)\n• Email: **daotao@hcmus.edu.vn**\n• Hotline: **(028) 3835 4266**\n\nTôi có thể giúp gì thêm không?";
}

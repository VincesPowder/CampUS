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
  advisor: string;
  advisorPhone: string;
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
  advisor:          "TS. Trần Văn Bình",
  advisorPhone:     "0912 345 678",
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

// ─── Notifications ────────────────────────────────────────────────────────────

export type Notification = {
  id: number;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Đăng ký học phần HK1/2025-2026",
    body: "Sinh viên vui lòng đăng ký học phần học kỳ 1 năm học 2025-2026 từ ngày 10/07 đến 20/07/2025 trên hệ thống. Lưu ý kiểm tra điều kiện tiên quyết trước khi đăng ký.",
    time: "1 giờ 45 phút trước",
    read: false,
  },
  {
    id: 2,
    title: "Lịch thi cuối kỳ HK2/2024-2025 đã cập nhật",
    body: "Phòng Đào tạo thông báo lịch thi cuối kỳ HK2/2024-2025 đã được cập nhật. Một số môn có thay đổi phòng thi, sinh viên kiểm tra lại trên cổng thông tin.",
    time: "1 ngày 1 giờ trước",
    read: false,
  },
  {
    id: 3,
    title: "Nộp bài tập lớn môn Cơ sở dữ liệu",
    body: "Bạn đã nộp bài tập lớn môn Cơ sở dữ liệu - Assignment 3 thành công lúc 23:00 ngày 07/07/2025.",
    time: "2 ngày 22 giờ trước",
    read: false,
  },
  {
    id: 4,
    title: "Học bổng KKHT HK2/2024-2025",
    body: "Danh sách sinh viên nhận học bổng Khuyến khích Học tập HK2/2024-2025 đã được công bố. Sinh viên có thể kiểm tra kết quả tại Phòng Công tác sinh viên.",
    time: "3 ngày 1 giờ trước",
    read: true,
  },
  {
    id: 5,
    title: "Khảo sát giảng dạy cuối kỳ",
    body: "Nhà trường kính mời sinh viên hoàn thành phiếu khảo sát giảng dạy cuối kỳ HK2/2024-2025 trước ngày 15/07/2025. Ý kiến của bạn giúp nâng cao chất lượng đào tạo.",
    time: "9 ngày 22 giờ trước",
    read: true,
  },
];

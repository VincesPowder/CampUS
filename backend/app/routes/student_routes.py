from flask import Blueprint, jsonify, request
from app.models.student import SinhVien, DotCapNhatHoSo, NguoiThan
from app.models.tuition import HocPhi, LopHocPhan
from app.models.notification import SvThongBao, ThongBao
from app import db
from datetime import datetime

student_bp = Blueprint('student', __name__)

def format_date(date_val):
    """Hàm helper để định dạng ngày an toàn, chống sập server khi SQLite trả về chuỗi"""
    if not date_val:
        return None
    if hasattr(date_val, 'strftime'):
        return date_val.strftime('%Y-%m-%d')
    return str(date_val)

def check_update_eligibility():
    """Kiểm tra xem hệ thống có đang mở đợt cập nhật hồ sơ không"""
    now = datetime.now()
    active_period = DotCapNhatHoSo.query.filter(
        DotCapNhatHoSo.trangthai_mo == 1,
        DotCapNhatHoSo.thoigian_batdau <= now,
        DotCapNhatHoSo.thoigian_ketthuc >= now
    ).first()
    return active_period is not None

@student_bp.route('/<mssv>', methods=['GET'])
def get_profile(mssv):
    """UC 2.5: Lấy thông vị cá nhân và học vụ"""
    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404
    
    can_update = check_update_eligibility()
    faculty_name = student.nganh.khoa.tenkhoa if student.nganh and student.nganh.khoa else None
    major_name = student.nganh.tennganh if student.nganh else None
    
    family_data = []
    for nt in student.nguoithan_list:
        family_data.append({
            'id': nt.mant,
            'name': nt.hoten,
            'dob': str(nt.namsinh) if nt.namsinh else "—",
            'rel': nt.quanhe,
            'job': nt.nghenghiep,
            'workplace': nt.noilamviec,
            'phone': nt.sdt,
            'email': nt.mail,
            'ethnic': nt.dantoc,
            'religion': nt.tongiao,
            'nationality': nt.quoctich,
            'province': nt.tinhthanh,
            'ward': nt.phuongxa,
            'address': nt.hkthuongtru
        })
        
    profile_data = {
        'mssv': student.mssv,
        'fullName': student.hoten,
        'dob': format_date(student.ngaysinh),
        'placeOfBirth': student.noisinh,
        'gender': student.gioitinh,
        'cccd': student.cccd,
        'issuedDate': format_date(student.ngaycap),
        'issuedPlace': student.noicap,
        'nationality': student.quoctich,
        'ethnic': student.dantoc,
        'religion': student.tongiao,
        'permanentAddress': student.dcthuongtru,
        'currentAddress': student.dchiennay,
        
        # --- CÁC TRƯỜNG ĐÃ ĐƯỢC MAP KHỚP VỚI FRONTEND ---
        'contactAddress': student.dclienlac,
        'phone': student.dienthoai,
        'personalEmail': student.mailcanhan,
        'officialEmail': student.mailtruong,
        'joinUnionDate': format_date(student.ngayvaodoan),
        'joinPartyDate': format_date(student.ngayvaodang),
        
        'advisor': student.nguoilienlac,
        'advisorPhone': student.sdtlienlac,
        'advisorEmail': student.maillienlac,
        'advisorRelation': student.quanhe_nll,
        
        'bankNumber': student.sothenh,
        'bank': student.tennh,
        'bankBranch': None, # DB ko có chi nhánh nên trả về None để UI làm mờ
        'enrolledDate': None,
        # ------------------------------------------------
        
        'course': student.nienkhoa,
        'level': student.bacdaotao,
        'trainingType': student.loaidaotao,
        'major': major_name,
        'faculty': faculty_name,
        'status': student.loaisv,
        'avatar': student.avatar,
        'canUpdate': can_update,
        'family': family_data
    }

    return jsonify(profile_data), 200

@student_bp.route('/<mssv>/update', methods=['PUT'])
def update_profile(mssv):
    """UC 2.6: Cập nhật thông tin hồ sơ cá nhân"""
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404

    data = request.json
    
    if 'currentAddress' in data:
        student.dchiennay = data['currentAddress']
    if 'phone' in data:
        student.dienthoai = data['phone']
    if 'personalEmail' in data:
        student.mailcanhan = data['personalEmail']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công'}), 200

@student_bp.route('/<mssv>/family/<mant>', methods=['PUT'])
def update_family(mssv, mant):
    """Cập nhật thông tin liên lạc của người thân"""
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    nt = NguoiThan.query.filter_by(mssv=mssv, mant=mant).first()
    if not nt:
        return jsonify({'error': 'Không tìm thấy dữ liệu người thân'}), 404

    data = request.json
    
    if 'phone' in data: nt.sdt = data['phone']
    if 'email' in data: nt.mail = data['email']
    if 'job' in data: nt.nghenghiep = data['job']
    if 'workplace' in data: nt.noilamviec = data['workplace']
    if 'address' in data: nt.hkthuongtru = data['address']
    if 'province' in data: nt.tinhthanh = data['province']
    if 'ward' in data: nt.phuongxa = data['ward']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thành công'}), 200

@student_bp.route('/<mssv>/tuition', methods=['GET'])
def get_tuition(mssv):
    """Lấy danh sách học phí của một sinh viên"""
    hocphi_list = db.session.query(HocPhi, LopHocPhan).join(
        LopHocPhan, HocPhi.malhp == LopHocPhan.malhp
    ).filter(HocPhi.mssv == mssv).all()

    result = []
    for hp, lhp in hocphi_list:
        result.append({
            'malhp': hp.malhp,
            'tenlop': lhp.tenlop,
            'sotchp': hp.sotchp,
            'hocphi_goc': float(hp.hocphi_goc) if hp.hocphi_goc else 0,
            'thucdong': float(hp.thucdong) if hp.thucdong else 0,
            'trangthai_thanhtoan': hp.trangthai_thanhtoan,
            'ngaythanhtoan': hp.ngaythanhtoan.strftime('%d/%m/%Y') if hp.ngaythanhtoan else None
        })
    return jsonify({'status': 'success', 'data': result}), 200

@student_bp.route('/<mssv>/notifications', methods=['GET'])
def get_notifications(mssv):
    """Lấy danh sách thông báo của sinh viên"""
    notifications = db.session.query(SvThongBao, ThongBao).join(
        ThongBao, SvThongBao.matb == ThongBao.matb
    ).filter(SvThongBao.mssv == mssv).order_by(ThongBao.ngaydang.desc()).all()

    result = []
    for sv_tb, tb in notifications:
        result.append({
            'matb': tb.matb,
            'tieude': tb.tieude,
            'noidung': tb.noidung,
            'ngaydang': tb.ngaydang.strftime('%d/%m/%Y %H:%M') if tb.ngaydang else None,
            'trangthai_doc': sv_tb.trangthai_doc,
            'thoigian_doc': sv_tb.thoigian_doc.strftime('%d/%m/%Y %H:%M') if sv_tb.thoigian_doc else None
        })
    return jsonify({'status': 'success', 'data': result}), 200

@student_bp.route('/<mssv>/notifications/<matb>/read', methods=['POST'])
def mark_notification_read(mssv, matb):
    """Đánh dấu một thông báo cụ thể là đã đọc"""
    sv_tb = db.session.query(SvThongBao).filter_by(mssv=mssv, matb=matb).first()
    
    if not sv_tb:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy thông báo'}), 404
    
    # Cập nhật trạng thái đọc và thời gian đọc theo database[cite: 2]
    sv_tb.trangthai_doc = 1
    sv_tb.thoigian_doc = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'Đã cập nhật trạng thái đọc',
        'thoigian_doc': sv_tb.thoigian_doc.strftime('%d/%m/%Y %H:%M')
    }), 200


@student_bp.route('/<mssv>/notifications/read-all', methods=['POST'])
def mark_all_notifications_read(mssv):
    """Đánh dấu tất cả thông báo của sinh viên là đã đọc"""
    # Lấy các thông báo chưa đọc (trangthai_doc == 0)[cite: 2]
    unread_notifications = db.session.query(SvThongBao).filter_by(mssv=mssv, trangthai_doc=0).all()
    
    if not unread_notifications:
        return jsonify({'status': 'success', 'message': 'Không có thông báo nào chưa đọc'}), 200

    now = datetime.utcnow()
    for sv_tb in unread_notifications:
        sv_tb.trangthai_doc = 1
        sv_tb.thoigian_doc = now
        
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Đã đánh dấu đọc tất cả thông báo'}), 200


# ---------------------------------------------------------
# API HỌC PHÍ
# ---------------------------------------------------------

@student_bp.route('/<mssv>/tuition/<malhp>/pay', methods=['POST'])
def pay_tuition(mssv, malhp):
    """Mô phỏng tính năng thanh toán học phí cho một lớp học phần"""
    hocphi = db.session.query(HocPhi).filter_by(mssv=mssv, malhp=malhp).first()
    
    if not hocphi:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy thông tin học phí'}), 404
        
    if hocphi.trangthai_thanhtoan == 'Đã thanh toán':
        return jsonify({'status': 'error', 'message': 'Học phí này đã được thanh toán rồi'}), 400
    
    # Cập nhật trạng thái và ngày thanh toán[cite: 2]
    hocphi.trangthai_thanhtoan = 'Đã thanh toán'
    hocphi.ngaythanhtoan = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'Thanh toán học phí thành công',
        'data': {
            'malhp': hocphi.malhp,
            'trangthai_thanhtoan': hocphi.trangthai_thanhtoan,
            'ngaythanhtoan': hocphi.ngaythanhtoan.strftime('%d/%m/%Y %H:%M')
        }
    }), 200
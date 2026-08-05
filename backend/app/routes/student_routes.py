from flask import Blueprint, jsonify, request
from app.models.student import SinhVien, DotCapNhatHoSo
from app import db
from datetime import datetime

profile_bp = Blueprint('profile_routes', __name__)

def check_update_eligibility():
    """Kiểm tra xem hệ thống có đang mở đợt cập nhật hồ sơ không"""
    now = datetime.now()
    active_period = DotCapNhatHoSo.query.filter(
        DotCapNhatHoSo.trangthai_mo == 1,
        DotCapNhatHoSo.thoigian_batdau <= now,
        DotCapNhatHoSo.thoigian_ketthuc >= now
    ).first()
    return active_period is not None

@profile_bp.route('/api/profile/<mssv>', methods=['GET'])
def get_profile(mssv):
    """UC 2.5: Lấy thông tin cá nhân và học vụ"""
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
        'dob': student.ngaysinh.strftime('%Y-%m-%d') if student.ngaysinh else None,
        'placeOfBirth': student.noisinh,
        'gender': student.gioitinh,
        'cccd': student.cccd,
        'issuedDate': student.ngaycap.strftime('%Y-%m-%d') if student.ngaycap else None,
        'issuedPlace': student.noicap,
        'nationality': student.quoctich,
        'ethnic': student.dantoc,
        'religion': student.tongiao,
        'permanentAddress': student.dcthuongtru,
        'currentAddress': student.dchiennay,
        'phone': student.dienthoai,
        'personalEmail': student.mailcanhan,
        'officialEmail': student.mailtruong,
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

@profile_bp.route('/api/profile/<mssv>/update', methods=['PUT'])
def update_profile(mssv):
    """UC 2.6: Cập nhật thông tin hồ sơ cá nhân"""
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404

    data = request.json
    
    # Chỉ cho phép cập nhật các trường liên lạc theo đặc tả UC 2.6
    if 'currentAddress' in data:
        student.dchiennay = data['currentAddress']
    if 'phone' in data:
        student.dienthoai = data['phone']
    if 'personalEmail' in data:
        student.mailcanhan = data['personalEmail']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công'}), 200

@profile_bp.route('/api/profile/<mssv>/family/<mant>', methods=['PUT'])
def update_family(mssv, mant):
    """Cập nhật thông tin liên lạc của người thân"""
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    nt = NguoiThan.query.filter_by(mssv=mssv, mant=mant).first()
    if not nt:
        return jsonify({'error': 'Không tìm thấy dữ liệu người thân'}), 404

    data = request.json
    
    # Cập nhật các trường được phép chỉnh sửa
    if 'phone' in data: nt.sdt = data['phone']
    if 'email' in data: nt.mail = data['email']
    if 'job' in data: nt.nghenghiep = data['job']
    if 'workplace' in data: nt.noilamviec = data['workplace']
    if 'address' in data: nt.hkthuongtru = data['address']
    if 'province' in data: nt.tinhthanh = data['province']
    if 'ward' in data: nt.phuongxa = data['ward']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thành công'}), 200
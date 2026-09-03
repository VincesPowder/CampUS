import pytest
from app import db
from app.models.student import SinhVien, Khoa, Nganh, NguoiThan

def test_admin_api_search_students(app, client):
    """
    [TC_2.18_01_BE]: Xác minh API backend hỗ trợ search sinh viên qua query parameter.
    """
    with app.app_context():
        # Dọn dẹp rác
        SinhVien.query.filter(SinhVien.mssv.in_(['888111', '888222'])).delete()
        
        # SỬA Ở ĐÂY: Tạo Khoa & Ngành giả lập vì API dùng lệnh .join(Nganh).join(Khoa)
        if not db.session.get(Khoa, 'MAGIC_KHOA'):
            db.session.add(Khoa(makhoa='MAGIC_KHOA', tenkhoa='Khoa Pháp Thuật'))
        if not db.session.get(Nganh, 'MAGIC_NGANH'):
            db.session.add(Nganh(manganh='MAGIC_NGANH', tennganh='Phù Thủy Học', makhoa='MAGIC_KHOA'))
        db.session.commit()

        # SỬA Ở ĐÂY: Bơm 2 sinh viên nháp, NHỚ GẮN MÃ NGÀNH
        sv1 = SinhVien(mssv='888111', hoten='Harry Potter', mailtruong='hp@student.hcmus.edu.vn', manganh='MAGIC_NGANH')
        sv2 = SinhVien(mssv='888222', hoten='Ron Weasley', mailtruong='rw@student.hcmus.edu.vn', manganh='MAGIC_NGANH')
        db.session.add_all([sv1, sv2])
        db.session.commit()

        # Gọi API với search params (Ví dụ: tìm Potter)
        res = client.get('/api/admin/students?search=Potter')
        assert res.status_code == 200
        
        data = res.json['data']
        assert len(data) == 1
        assert data[0]['mssv'] == '888111'
        assert data[0]['hoTen'] == 'Harry Potter'

def test_admin_api_get_student_detail(app, client):
    """
    [TC_2.18_04_BE]: Xác minh API trả về chi tiết 1 sinh viên kèm mảng thông tin gia đình cho Modal.
    """
    with app.app_context():
        # Dọn dẹp
        NguoiThan.query.filter_by(mssv='888111').delete()
        SinhVien.query.filter_by(mssv='888111').delete()
        
        # Đảm bảo Khoa & Ngành tồn tại
        if not db.session.get(Khoa, 'MAGIC_KHOA'):
            db.session.add(Khoa(makhoa='MAGIC_KHOA', tenkhoa='Khoa Pháp Thuật'))
        if not db.session.get(Nganh, 'MAGIC_NGANH'):
            db.session.add(Nganh(manganh='MAGIC_NGANH', tennganh='Phù Thủy Học', makhoa='MAGIC_KHOA'))
        db.session.commit()

        # Bơm sinh viên (có mã ngành) + Người thân
        sv = SinhVien(mssv='888111', hoten='Harry Potter', manganh='MAGIC_NGANH')
        nt = NguoiThan(mant='NT_888111_1', mssv='888111', hoten='James Potter', quanhe='Cha')
        db.session.add_all([sv, nt])
        db.session.commit()

        # Lấy chi tiết
        res = client.get('/api/admin/students/888111')
        assert res.status_code == 200
        
        data = res.json['data']
        assert data['mssv'] == '888111'
        assert data['hoTen'] == 'Harry Potter'
        
        # Xác minh mảng Family được đính kèm thành công
        family = data['family']
        assert len(family) == 1
        assert family[0]['name'] == 'James Potter'
        assert family[0]['rel'] == 'Cha'
import { NextResponse } from 'next/server';
import { readUsersFromExcel, deleteUserInExcel } from '@/lib/excel';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');

  try {
    const allUsers = await readUsersFromExcel();
    
    // Chỉ lấy học sinh
    let students = allUsers.filter(u => u.Role === 'student');
    
    // Nếu truyền lên room, lọc theo room
    if (room) {
      students = students.filter(u => u.Room === room);
    }
    
    // Trả về dữ liệu an toàn, KHÔNG trả về password
    const safeData = students.map(u => ({
      username: u.Username,
      fullName: u.FullName || '',
      role: u.Role,
      room: u.Room || '',
      createdAt: u.CreatedAt
    }));
    
    return NextResponse.json(safeData);
  } catch (error) {
    console.error('Lỗi API lấy danh sách học sinh:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { username } = await request.json();
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Thiếu tên đăng nhập cần xóa.' }, { status: 400 });
    }

    const success = await deleteUserInExcel(username.trim());
    if (!success) {
      return NextResponse.json({ error: 'Không tìm thấy học sinh hoặc lỗi xóa.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi API xóa học sinh:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server.' }, { status: 500 });
  }
}

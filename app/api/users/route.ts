import { NextResponse } from 'next/server';
import { readUsersFromExcel, deleteUserInExcel, updateUserRoomInExcel } from '@/lib/excel';
import * as fs from 'fs';
import * as path from 'path';

// Helper để đọc danh sách lớp học nhằm kiểm tra hợp lệ
async function readClasses() {
  const localFilePath = path.join(process.cwd(), 'classes.json');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    if (!fs.existsSync(localFilePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
    } catch {
      return [];
    }
  }
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  const BLOB_URL = `https://${storeId}.public.blob.vercel-storage.com/classes.json`;
  try {
    const res = await fetch(BLOB_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');

  try {
    const allUsers = await readUsersFromExcel();
    
    // Chỉ lấy học sinh
    let students = allUsers.filter(u => u.Role === 'student');
    
    // Nếu truyền lên room, lọc học sinh có chứa room đó
    if (room) {
      students = students.filter(u => {
        const userRooms = String(u.Room || '').split(',').map(r => r.trim());
        return userRooms.includes(room);
      });
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

export async function PUT(request: Request) {
  try {
    const { username, room, mode } = await request.json();
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Thiếu tên đăng nhập.' }, { status: 400 });
    }

    const targetRoom = room ? room.trim().toUpperCase() : '';
    const updateMode: 'add' | 'remove' | 'set' = mode || 'add';

    if (targetRoom && updateMode !== 'remove') {
      // Xác thực mã lớp học có tồn tại trên hệ thống
      const classes = await readClasses();
      const classExists = classes.some((c: { code: string }) => c.code === targetRoom);
      if (!classExists) {
        return NextResponse.json(
          { error: 'Mã lớp học không tồn tại. Vui lòng kiểm tra lại.' },
          { status: 400 }
        );
      }
    }

    const success = await updateUserRoomInExcel(username.trim(), targetRoom, updateMode);
    if (!success) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng hoặc lỗi cập nhật.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi API cập nhật lớp học:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server.' }, { status: 500 });
  }
}

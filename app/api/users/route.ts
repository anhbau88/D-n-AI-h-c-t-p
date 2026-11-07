import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { readUsersFromExcel, deleteUserInExcel, updateUserRoomInExcel, mapExcelUserToSafeUser } from '@/lib/excel';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

async function readClasses() {
  const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'classes.json') : 'classes.json';
  
  if (fs.existsSync(localFilePath)) {
    try {
      const localData = fs.readFileSync(localFilePath, 'utf-8');
      const classes = JSON.parse(localData);
      if (Array.isArray(classes) && classes.length > 0) {
        return classes;
      }
    } catch (err) {
      console.error('Lỗi đọc file classes.json local:', err);
    }
  }

  if (db) {
    try {
      const snapshot = await db.collection('classes').get();
      return snapshot.docs.map(doc => doc.data());
    } catch (err) {
      console.error('Lỗi đọc classes từ Firebase:', err);
    }
  }

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');

  try {
    const allUsers = await readUsersFromExcel();
    let students = allUsers.filter(u => u.Role === 'student');
    
    if (room) {
      students = students.filter(u => {
        const userRooms = String(u.Room || '').split(',').map(r => r.trim());
        return userRooms.includes(room);
      });
    }
    
    // Trả về dữ liệu an toàn kèm XP, Streak và Gói cước để phục vụ Bảng xếp hạng (Leaderboard)
    const safeData = students.map(u => {
      const mapped = mapExcelUserToSafeUser(u);
      return {
        username: mapped.username,
        fullName: mapped.fullName || '',
        email: mapped.email || '',
        role: mapped.role,
        room: mapped.room || '',
        plan: mapped.plan || 'free',
        xp: mapped.xp || 0,
        streak: mapped.streak || 1,
        createdAt: mapped.createdAt || u.CreatedAt,
      };
    });
    
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

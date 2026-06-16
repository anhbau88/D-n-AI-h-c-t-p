// app/api/classes/route.ts
// API quản lý danh sách lớp học hỗ trợ Firebase Firestore (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'classes.json') : 'classes.json';

interface ClassItem {
  code: string;
  name: string;
  teacherUsername: string;
  createdAt: string;
}

const SEED_CLASSES: ClassItem[] = [];

export async function GET() {
  // 1. Ưu tiên truy vấn Firebase Firestore trước nếu có cấu hình db
  if (db) {
    try {
      const snapshot = await db.collection('classes').get();
      if (!snapshot.empty) {
        const classes = snapshot.docs.map(doc => doc.data() as ClassItem);
        return NextResponse.json(classes);
      }
    } catch (error) {
      console.error('Error fetching classes from Firebase, falling back to local cache:', error);
    }
  }

  // 2. Fallback: Đọc file local khi Firebase chưa được cấu hình hoặc lỗi kết nối
  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const classes = JSON.parse(data);
      if (Array.isArray(classes)) {
        return NextResponse.json(classes);
      }
    } catch (error) {
      console.error('Error reading local classes cache:', error);
    }
  }

  // Fallback: Tạo file local rỗng nếu chưa tồn tại
  try {
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, JSON.stringify(SEED_CLASSES, null, 2), 'utf-8');
    return NextResponse.json(SEED_CLASSES);
  } catch (error) {
    console.error('Error seeding local classes:', error);
    return NextResponse.json(SEED_CLASSES);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, teacherUsername } = await request.json();
    if (!name || !name.trim() || !teacherUsername) {
      return NextResponse.json({ error: 'Thiếu tên lớp hoặc giáo viên.' }, { status: 400 });
    }

    // Load existing classes
    let currentClasses: ClassItem[] = [];

    if (!db) {
      if (fs.existsSync(localFilePath)) {
        currentClasses = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      } else {
        currentClasses = [...SEED_CLASSES];
      }
    } else {
      try {
        const snapshot = await db.collection('classes').get();
        currentClasses = snapshot.docs.map(doc => doc.data() as ClassItem);
      } catch {
        if (fs.existsSync(localFilePath)) {
          currentClasses = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
        }
      }
    }

    // Generate unique class code: C + 5 random alphanumeric uppercase
    let code = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Tránh O, 0, I, 1 dễ nhầm lẫn
    let isUnique = false;
    while (!isUnique) {
      code = 'C';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      isUnique = !currentClasses.some((c: { code: string }) => c.code === code);
    }

    const newClass = {
      code,
      name: name.trim(),
      teacherUsername,
      createdAt: new Date().toISOString()
    };

    currentClasses.push(newClass);

    if (db) {
      try {
        await db.collection('classes').doc(code).set(newClass);
      } catch (error) {
        console.error('Error saving class to Firebase:', error);
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
      }
    }

    // Write locally as well for fast local caching
    try {
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localFilePath, JSON.stringify(currentClasses, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing local classes cache:', err);
    }

    return NextResponse.json(newClass);
  } catch (error) {
    console.error('Error saving class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { code, teacherUsername } = await request.json();
    if (!code || !teacherUsername) {
      return NextResponse.json({ error: 'Thiếu mã lớp hoặc giáo viên.' }, { status: 400 });
    }

    // 1. Nếu chạy Firebase, thực hiện xóa trên Firestore
    if (db) {
      try {
        const docRef = db.collection('classes').doc(code);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const classData = docSnap.data();
          if (classData?.teacherUsername !== teacherUsername) {
            return NextResponse.json({ error: 'Bạn không có quyền xóa lớp học này.' }, { status: 403 });
          }
          
          const batch = db.batch();
          batch.delete(docRef);

          // Xóa các bài tập liên đới
          const asmSnap = await db.collection('assignments').where('roomId', '==', code).get();
          asmSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Xóa các kết quả lịch sử
          const histSnap = await db.collection('history').where('roomId', '==', code).get();
          histSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();
        }
      } catch (error) {
        console.error('Error deleting class from Firebase:', error);
      }
    }

    // 2. Cập nhật các file local (fallback file JSON)
    const assignmentsFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'assignments.json') : 'assignments.json';
    const historyFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'history.json') : 'history.json';

    // Xóa lớp khỏi classes.json
    let classesList: ClassItem[] = [];
    if (fs.existsSync(localFilePath)) {
      try {
        classesList = JSON.parse(fs.readFileSync(localFilePath, 'utf-8')) as ClassItem[];
        const targetClass = classesList.find(c => c.code === code);
        if (targetClass && targetClass.teacherUsername !== teacherUsername) {
          return NextResponse.json({ error: 'Bạn không có quyền xóa lớp học này.' }, { status: 403 });
        }
        classesList = classesList.filter(c => c.code !== code);
        fs.writeFileSync(localFilePath, JSON.stringify(classesList, null, 2), 'utf-8');
      } catch (error) {
        console.error('Error modifying local classes file:', error);
      }
    }

    // Xóa bài tập khỏi assignments.json
    if (fs.existsSync(assignmentsFilePath)) {
      try {
        let assignments = JSON.parse(fs.readFileSync(assignmentsFilePath, 'utf-8'));
        if (Array.isArray(assignments)) {
          assignments = assignments.filter((a: any) => a.roomId !== code);
          fs.writeFileSync(assignmentsFilePath, JSON.stringify(assignments, null, 2), 'utf-8');
        }
      } catch (error) {
        console.error('Error modifying local assignments file:', error);
      }
    }

    // Xóa lịch sử khỏi history.json
    if (fs.existsSync(historyFilePath)) {
      try {
        let history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
        if (Array.isArray(history)) {
          history = history.filter((h: any) => h.roomId !== code);
          fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
        }
      } catch (error) {
        console.error('Error modifying local history file:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting class API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi server khi xóa lớp học.' },
      { status: 500 }
    );
  }
}

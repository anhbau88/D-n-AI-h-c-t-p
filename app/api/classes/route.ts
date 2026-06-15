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
  // Ưu tiên đọc file local trước để tránh trễ
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

  // Firebase Firestore
  if (db) {
    try {
      const snapshot = await db.collection('classes').get();
      if (snapshot.empty) return NextResponse.json(SEED_CLASSES);
      const classes = snapshot.docs.map(doc => doc.data() as ClassItem);
      return NextResponse.json(classes);
    } catch (error) {
      console.error('Error fetching classes from Firebase:', error);
    }
  }

  // Fallback: Seed local file
  try {
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

// app/api/db/route.ts
// API đồng bộ bài tập và dữ liệu qua Firebase Firestore (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'assignments.json') : 'assignments.json';

export async function GET() {
  // Ưu tiên đọc file local trước
  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const assignments = JSON.parse(data);
      if (Array.isArray(assignments)) {
        return NextResponse.json(assignments, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      }
    } catch (error) {
      console.error('Error reading local assignments cache:', error);
    }
  }

  // Firebase Firestore
  if (db) {
    try {
      const snapshot = await db.collection('assignments').get();
      const assignments = snapshot.docs.map(doc => doc.data());
      return NextResponse.json(assignments, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    } catch (error) {
      console.error('Error fetching assignments from Firebase:', error);
    }
  }

  return NextResponse.json([], {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const assignments = await request.json();

    if (!db) {
      // Fallback: Ghi dữ liệu vào file local assignments.json khi chạy offline/local
      try {
        fs.writeFileSync(localFilePath, JSON.stringify(assignments, null, 2), 'utf-8');
        return NextResponse.json({ success: true }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      } catch (error) {
        console.error('Error writing local assignments:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to save local assignments' },
          { status: 500 }
        );
      }
    }

    // Chạy chính thức: Ghi lên Firebase Firestore (lưu từng doc riêng lẻ để tránh vượt 1MB)
    try {
      const snapshot = await db.collection('assignments').get();
      const existingIds = snapshot.docs.map(doc => doc.id);
      const newIds = assignments.map((a: any) => a.id);

      const batch = db.batch();

      // Xóa các bài tập cũ không còn trong danh sách mới
      for (const id of existingIds) {
        if (!newIds.includes(id)) {
          batch.delete(db.collection('assignments').doc(id));
        }
      }

      // Ghi đè hoặc thêm các bài tập mới
      for (const asm of assignments) {
        if (asm.id) {
          batch.set(db.collection('assignments').doc(asm.id), asm);
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error saving assignments to Firebase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save assignments';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Write locally as well for fast local caching
    try {
      fs.writeFileSync(localFilePath, JSON.stringify(assignments, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing local assignments cache:', err);
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error saving assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save assignments';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

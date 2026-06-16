// app/api/history/route.ts
// API đồng bộ lịch sử bài thi của học sinh qua Firebase Firestore (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import * as fs from 'fs';
import * as path from 'path';
import { QuizHistoryItem } from '@/types';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'history.json') : 'history.json';

// Hàm đọc lịch sử từ file local hoặc Firebase Firestore
async function getHistoryList(username?: string | null, roomId?: string | null): Promise<QuizHistoryItem[]> {
  // 1. Firebase Firestore (Nếu có cấu hình db)
  if (db) {
    try {
      let query: any = db.collection('history');
      if (username) {
        query = query.where('username', '==', username);
      }
      if (roomId) {
        query = query.where('roomId', '==', roomId);
      }
      const snapshot = await query.get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc: any) => doc.data() as QuizHistoryItem);
      }
    } catch (error) {
      console.error('Error fetching history from Firebase, falling back to local cache:', error);
    }
  }

  // 2. Fallback: Đọc file local
  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const list = JSON.parse(data) as QuizHistoryItem[];
      
      // Áp dụng bộ lọc cho cache local tương tự Firestore
      let filteredList = list;
      if (username) {
        filteredList = filteredList.filter(item => item.username === username);
      }
      if (roomId) {
        filteredList = filteredList.filter(item => item.roomId === roomId);
      }
      return filteredList;
    } catch (error) {
      console.error('Lỗi đọc local history cache:', error);
    }
  }

  return [];
}

// Hàm ghi lịch sử xuống file local và Firebase Firestore
async function saveHistoryItem(newItem: QuizHistoryItem): Promise<boolean> {
  // Ghi xuống local làm cache trước
  try {
    let currentHistory: QuizHistoryItem[] = [];
    if (fs.existsSync(localFilePath)) {
      try {
        const data = fs.readFileSync(localFilePath, 'utf-8');
        currentHistory = JSON.parse(data);
      } catch (err) {
        console.error('Lỗi đọc local history cache khi lưu:', err);
      }
    }
    // Nếu local file không tồn tại hoặc rỗng, mới fetch từ Firebase
    if (currentHistory.length === 0 && db) {
      try {
        const snapshot = await db.collection('history').get();
        currentHistory = snapshot.docs.map((doc: any) => doc.data() as QuizHistoryItem);
      } catch (err) {
        console.error('Error fetching all history from Firebase for local sync:', err);
      }
    }

    const updatedHistory = [...currentHistory, newItem];
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, JSON.stringify(updatedHistory, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local history cache:', error);
  }

  // Firebase Firestore
  if (db) {
    try {
      await db.collection('history').add(newItem);
      return true;
    } catch (error) {
      console.error('Error saving history to Firebase:', error);
      return false;
    }
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const roomId = searchParams.get('roomId');

    const history = await getHistoryList(username, roomId);
    return NextResponse.json(history, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err) {
    console.error('Lỗi API lấy lịch sử bài thi:', err);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newItem = await request.json();

    // Validate newItem
    if (!newItem.assignmentId || !newItem.roomId || !newItem.scale10Score) {
      return NextResponse.json(
        { error: 'Dữ liệu lịch sử không hợp lệ.' },
        { status: 400 }
      );
    }

    // Đọc lịch sử hiện tại
    const currentHistory = await getHistoryList();

    // Kiểm tra xem học sinh này đã nộp bài kiểm tra này chưa để tránh gửi trùng lặp tuyệt đối
    const isDuplicate = currentHistory.some(
      (item) =>
        item.assignmentId === newItem.assignmentId &&
        item.username === newItem.username &&
        item.submittedAt === newItem.submittedAt
    );

    if (isDuplicate) {
      return NextResponse.json(currentHistory, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    // Thêm lịch sử mới
    const success = await saveHistoryItem(newItem);
    if (!success) {
      throw new Error('Không thể lưu lịch sử bài thi.');
    }

    const updatedHistory = [...currentHistory, newItem];

    return NextResponse.json(updatedHistory, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Lỗi khi nộp lịch sử bài thi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi máy chủ khi nộp điểm.' },
      { status: 500 }
    );
  }
}

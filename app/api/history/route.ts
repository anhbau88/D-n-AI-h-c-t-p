// app/api/history/route.ts
// API đồng bộ lịch sử bài thi của học sinh qua Firebase Firestore (hỗ trợ Giáo viên duyệt/sửa điểm & cộng XP học sinh)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import * as fs from 'fs';
import * as path from 'path';
import { QuizHistoryItem } from '@/types';
import { awardUserXpAndStreak } from '@/lib/excel';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'history.json') : 'history.json';

async function getHistoryList(username?: string | null, roomId?: string | null): Promise<QuizHistoryItem[]> {
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
        return snapshot.docs.map((doc: any) => ({
          ...(doc.data() as QuizHistoryItem),
          id: doc.id,
        }));
      }
    } catch (error) {
      console.error('Error fetching history from Firebase, falling back to local cache:', error);
    }
  }

  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const list = JSON.parse(data) as QuizHistoryItem[];
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

async function saveHistoryItem(newItem: QuizHistoryItem): Promise<boolean> {
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

    if (!newItem.assignmentId || !newItem.roomId || !newItem.scale10Score) {
      return NextResponse.json(
        { error: 'Dữ liệu lịch sử không hợp lệ.' },
        { status: 400 }
      );
    }

    const currentHistory = await getHistoryList();

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

    const success = await saveHistoryItem(newItem);
    if (!success) {
      throw new Error('Không thể lưu lịch sử bài thi.');
    }

    // Cộng điểm kinh nghiệm XP cho học sinh khi hoàn thành bài kiểm tra
    if (newItem.username) {
      const numericScore = parseFloat(newItem.scale10Score) || 5;
      const earnedXp = Math.max(15, Math.round(numericScore * 5));
      awardUserXpAndStreak(newItem.username, earnedXp).catch(() => {});
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

/**
 * PUT /api/history: Cho phép Giáo viên chỉnh sửa điểm số (Override AI Score) và ghi nhận xét của Giáo viên
 */
export async function PUT(request: NextRequest) {
  try {
    const { assignmentId, username, submittedAt, newScale10Score, teacherComment } = await request.json();

    if (!assignmentId || !username) {
      return NextResponse.json({ error: 'Thiếu thông tin bài làm cần cập nhật.' }, { status: 400 });
    }

    const numericScore = Math.min(10, Math.max(0, parseFloat(newScale10Score)));
    const formattedScale10 = !isNaN(numericScore) ? numericScore.toFixed(1) : undefined;

    if (db) {
      try {
        const snap = await db
          .collection('history')
          .where('assignmentId', '==', assignmentId)
          .where('username', '==', username)
          .get();

        const batch = db.batch();
        snap.docs.forEach(doc => {
          const data = doc.data() as QuizHistoryItem;
          if (!submittedAt || data.submittedAt === submittedAt) {
            const updates: Partial<QuizHistoryItem> = {
              status: 'graded',
            };
            if (formattedScale10 !== undefined) {
              updates.scale10Score = formattedScale10;
              updates.teacherScoreOverride = numericScore;
            }
            if (teacherComment !== undefined) {
              updates.teacherComment = teacherComment;
            }
            batch.update(doc.ref, updates);
          }
        });
        await batch.commit();
      } catch (err) {
        console.error('Lỗi cập nhật điểm giáo viên trên Firebase:', err);
      }
    }

    // Cập nhật cache local
    if (fs.existsSync(localFilePath)) {
      try {
        const list = JSON.parse(fs.readFileSync(localFilePath, 'utf-8')) as QuizHistoryItem[];
        const updatedList = list.map(item => {
          if (
            item.assignmentId === assignmentId &&
            item.username === username &&
            (!submittedAt || item.submittedAt === submittedAt)
          ) {
            return {
              ...item,
              scale10Score: formattedScale10 !== undefined ? formattedScale10 : item.scale10Score,
              teacherScoreOverride: !isNaN(numericScore) ? numericScore : item.teacherScoreOverride,
              teacherComment: teacherComment !== undefined ? teacherComment : item.teacherComment,
              status: 'graded' as const,
            };
          }
          return item;
        });
        fs.writeFileSync(localFilePath, JSON.stringify(updatedList, null, 2), 'utf-8');
      } catch (err) {
        console.error('Lỗi cập nhật local history khi sửa điểm:', err);
      }
    }

    const refreshed = await getHistoryList();
    return NextResponse.json({ success: true, history: refreshed });
  } catch (err) {
    console.error('Lỗi PUT /api/history:', err);
    return NextResponse.json({ error: 'Không thể cập nhật điểm số.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { assignmentId } = await request.json();
    if (!assignmentId) {
      return NextResponse.json({ error: 'Thiếu mã bài tập.' }, { status: 400 });
    }

    if (db) {
      try {
        const snap = await db.collection('history').where('assignmentId', '==', assignmentId).get();
        const batch = db.batch();
        snap.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (error) {
        console.error('Error deleting history by assignmentId from Firebase:', error);
      }
    }

    if (fs.existsSync(localFilePath)) {
      try {
        const data = fs.readFileSync(localFilePath, 'utf-8');
        let list = JSON.parse(data) as QuizHistoryItem[];
        list = list.filter(item => item.assignmentId !== assignmentId);
        fs.writeFileSync(localFilePath, JSON.stringify(list, null, 2), 'utf-8');
      } catch (error) {
        console.error('Error deleting local history by assignmentId:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi xóa lịch sử bài thi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi server khi xóa lịch sử điểm số.' },
      { status: 500 }
    );
  }
}

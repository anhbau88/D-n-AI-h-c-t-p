// app/api/history/route.ts
// API đồng bộ lịch sử bài thi của học sinh qua Vercel Blob (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';
import { QuizHistoryItem } from '@/types';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'history.json') : 'history.json';

const getBlobUrls = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  return {
    BLOB_URL: `https://${storeId}.public.blob.vercel-storage.com/history.json`,
    API_URL: 'https://blob.vercel-storage.com/history.json'
  };
};

// Hàm đọc lịch sử từ file local hoặc Vercel Blob
async function getHistoryList(token?: string): Promise<QuizHistoryItem[]> {
  // Ưu tiên đọc file local trước để tránh trễ đồng bộ CDN / cache của Vercel Blob
  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Lỗi đọc local history cache:', error);
    }
  }

  if (!token) {
    return [];
  }

  try {
    const res = await get('history.json', { token, access: 'public' });
    if (!res || !res.stream) {
      return [];
    }
    const chunks = [];
    for await (const chunk of res.stream as any) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch (error) {
    console.error('Error fetching history from Vercel Blob:', error);
    return [];
  }
}

// Hàm ghi lịch sử xuống file local hoặc Vercel Blob
async function saveHistoryList(history: QuizHistoryItem[], token?: string): Promise<boolean> {
  // Ghi xuống local làm cache trước
  try {
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local history cache:', error);
  }

  if (!token) {
    return true;
  }

  const { API_URL } = getBlobUrls();
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': '1',
        'x-add-random-suffix': 'false',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(history),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Vercel Blob write error: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving history to Vercel Blob:', error);
    return false;
  }
}

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const history = await getHistoryList(token);
  return NextResponse.json(history, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const newItem = await request.json();
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // Validate newItem
    if (!newItem.assignmentId || !newItem.roomId || !newItem.scale10Score) {
      return NextResponse.json(
        { error: 'Dữ liệu lịch sử không hợp lệ.' },
        { status: 400 }
      );
    }

    // Đọc lịch sử hiện tại
    const currentHistory = await getHistoryList(token);

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
    const updatedHistory = [...currentHistory, newItem];

    // Lưu lại
    const success = await saveHistoryList(updatedHistory, token);
    if (!success) {
      throw new Error('Không thể lưu lịch sử bài thi.');
    }

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

// app/api/classes/route.ts
// API quản lý danh sách lớp học hỗ trợ Vercel Blob (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'classes.json') : 'classes.json';

const getBlobUrls = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  return {
    BLOB_URL: `https://${storeId}.public.blob.vercel-storage.com/classes.json`,
    API_URL: 'https://blob.vercel-storage.com/classes.json'
  };
};

interface ClassItem {
  code: string;
  name: string;
  teacherUsername: string;
  createdAt: string;
}

const SEED_CLASSES: ClassItem[] = [];

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  // Ưu tiên đọc file local trước để tránh trễ đồng bộ CDN / cache của Vercel Blob
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

  if (!token) {
    try {
      fs.writeFileSync(localFilePath, JSON.stringify(SEED_CLASSES, null, 2), 'utf-8');
      return NextResponse.json(SEED_CLASSES);
    } catch (error) {
      console.error('Error seeding local classes:', error);
      return NextResponse.json(SEED_CLASSES);
    }
  }

  // Chạy chính thức: Lấy từ Vercel Blob
  try {
    const { BLOB_URL } = getBlobUrls();
    const fetchRes = await fetch(`${BLOB_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (fetchRes.ok) {
      const classes = await fetchRes.json();
      return NextResponse.json(classes);
    } else if (fetchRes.status === 404) {
      return NextResponse.json(SEED_CLASSES);
    }
  } catch (error) {
    console.error('Error fetching classes via HTTP fetch:', error);
  }

  // Fallback: Lấy từ Vercel Blob SDK
  try {
    const res = await get('classes.json', { token, access: 'public' });
    if (!res || !res.stream) {
      // Seed Vercel Blob
      const { API_URL } = getBlobUrls();
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'x-api-version': '1',
          'x-add-random-suffix': 'false',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(SEED_CLASSES),
      });
      return NextResponse.json(SEED_CLASSES);
    }
    const chunks = [];
    for await (const chunk of res.stream as any) {
      chunks.push(chunk);
    }
    const classes = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes via SDK:', error);
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
    let currentClasses = [];
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      if (fs.existsSync(localFilePath)) {
        currentClasses = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      } else {
        currentClasses = [...SEED_CLASSES];
      }
    } else {
      try {
        const res = await get('classes.json', { token, access: 'public' });
        if (res && res.stream) {
          const chunks = [];
          for await (const chunk of res.stream as any) {
            chunks.push(chunk);
          }
          currentClasses = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        }
      } catch {}
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

    if (!token) {
      fs.writeFileSync(localFilePath, JSON.stringify(currentClasses, null, 2), 'utf-8');
    } else {
      const { API_URL } = getBlobUrls();
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'x-api-version': '1',
          'x-add-random-suffix': 'false',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentClasses),
      });
      // Write locally as well for fast local caching
      try {
        fs.writeFileSync(localFilePath, JSON.stringify(currentClasses, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error writing local classes cache:', err);
      }
    }

    return NextResponse.json(newClass);
  } catch (error) {
    console.error('Error saving class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

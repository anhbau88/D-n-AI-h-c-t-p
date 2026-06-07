// app/api/db/route.ts
// API đồng bộ bài tập và dữ liệu qua Vercel Blob (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'assignments.json') : 'assignments.json';

const getBlobUrls = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  return {
    BLOB_URL: `https://${storeId}.public.blob.vercel-storage.com/assignments.json`,
    API_URL: 'https://blob.vercel-storage.com/assignments.json'
  };
};

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  // Ưu tiên đọc file local trước để tránh trễ đồng bộ CDN / cache của Vercel Blob
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

  if (!token) {
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }

  // Chạy chính thức: Lấy từ Vercel Blob
  try {
    const { BLOB_URL } = getBlobUrls();
    const fetchRes = await fetch(`${BLOB_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (fetchRes.ok) {
      const assignments = await fetchRes.json();
      return NextResponse.json(assignments, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    } else if (fetchRes.status === 404) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching assignments via HTTP fetch:', error);
  }

  // Fallback: Lấy từ Vercel Blob SDK
  try {
    const res = await get('assignments.json', { token, access: 'public' });
    if (!res || !res.stream) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }
    const chunks = [];
    for await (const chunk of res.stream as any) {
      chunks.push(chunk);
    }
    const assignments = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    return NextResponse.json(assignments, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching assignments via SDK:', error);
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignments = await request.json();
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
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

    // Chạy chính thức: Ghi lên Vercel Blob
    const { API_URL } = getBlobUrls();
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': '1',
        'x-add-random-suffix': 'false',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignments),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Vercel Blob write error: ${errorText}`);
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

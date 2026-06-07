// app/api/documents/route.ts
// API đồng bộ danh sách tài liệu công cộng qua Vercel Blob (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { del, get } from '@vercel/blob';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'documents.json') : 'documents.json';

const getBlobUrls = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  return {
    BLOB_URL: `https://${storeId}.public.blob.vercel-storage.com/documents.json`,
    API_URL: 'https://blob.vercel-storage.com/documents.json'
  };
};

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  // Ưu tiên đọc file local trước để tránh trễ đồng bộ CDN / cache của Vercel Blob
  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const documents = JSON.parse(data);
      if (Array.isArray(documents)) {
        return NextResponse.json(documents, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      }
    } catch (error) {
      console.error('Error reading local documents cache:', error);
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
    const res = await get('documents.json', { token, access: 'public' });
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
    const documents = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    return NextResponse.json(documents, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const documents = await request.json();
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      // Fallback: Ghi dữ liệu vào file local documents.json khi chạy offline/local
      try {
        fs.writeFileSync(localFilePath, JSON.stringify(documents, null, 2), 'utf-8');
        return NextResponse.json({ success: true }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      } catch (error) {
        console.error('Error writing local documents:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to save local documents' },
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
      body: JSON.stringify(documents),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Vercel Blob write error: ${errorText}`);
    }

    // Write locally as well for fast local caching
    try {
      fs.writeFileSync(localFilePath, JSON.stringify(documents, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing local documents cache:', err);
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error saving documents to Vercel Blob:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save documents';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();
    if (pdfUrl) {
      if (pdfUrl.startsWith('/uploads/')) {
        // Xóa file local cục bộ
        const filename = decodeURIComponent(pdfUrl.replace('/uploads/', ''));
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Đã xóa file local:', filePath);
        }
      } else {
        // Xóa Vercel Blob
        await del(pdfUrl);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

// app/api/upload/route.ts
// API xử lý upload file PDF/Word và đọc nội dung text

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf';
import mammoth from 'mammoth';
import { callGeminiMultimodal } from '@/lib/gemini';
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Lấy FormData từ request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const forceOCR = formData.get('forceOCR') === 'true';

    // Kiểm tra file có tồn tại không
    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy file. Vui lòng chọn file PDF, Word hoặc Hình ảnh.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isPDF = file.type === 'application/pdf' || fileName.endsWith('.pdf');
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');
    const isImage = file.type.startsWith('image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');

    // Kiểm tra định dạng file
    if (!isPDF && !isWord && !isImage) {
      return NextResponse.json(
        { error: 'File không đúng định dạng. Vui lòng chọn file PDF, Word (.docx) hoặc Hình ảnh (.png, .jpg, .jpeg, .webp).' },
        { status: 400 }
      );
    }

    // Kiểm tra dung lượng (tối đa 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File quá lớn. Vui lòng chọn file dưới 50MB.' },
        { status: 400 }
      );
    }

    // Đọc file thành Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = '';
    let pages = 1;
    let isScannedPDF = false;

    if (isPDF) {
      if (forceOCR) {
        isScannedPDF = true;
      } else {
        try {
          // Dùng pdf-parse đọc text
          const pdfResult = await extractTextFromPDF(buffer);
          text = pdfResult.text;
          pages = pdfResult.pages;
          // Nếu độ dài text quá ngắn, có khả năng đây là PDF scan (chỉ toàn hình ảnh)
          if (!text || text.trim().length < 150) {
            isScannedPDF = true;
          }
        } catch (err) {
          console.error('Lỗi khi phân tích văn bản PDF bằng pdf-parse, chuyển sang Multimodal OCR:', err);
          isScannedPDF = true;
        }
      }
    } else if (isWord) {
      // Dùng mammoth đọc text từ Word docx
      const wordResult = await mammoth.extractRawText({ buffer });
      text = wordResult.value;
      // Ước lượng số trang từ số ký tự (3000 ký tự ~ 1 trang)
      pages = Math.max(1, Math.ceil(text.trim().length / 3000));
    }

    // Xử lý Multimodal cho hình ảnh hoặc PDF scan
    if (isImage || isScannedPDF) {
      let mimeType = file.type;
      if (isScannedPDF) {
        mimeType = 'application/pdf';
      } else if (!mimeType || mimeType === 'application/octet-stream' || !mimeType.startsWith('image/')) {
        if (fileName.endsWith('.png')) mimeType = 'image/png';
        else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg'; // fallback for jpg/jpeg and others
      }
      
      const prompt = `Hãy đọc hiểu và trích xuất toàn bộ nội dung văn bản trong tài liệu này (đây là ${isScannedPDF ? 'tệp PDF scan' : 'hình ảnh/bài làm'}).
Ghi lại nội dung văn bản một cách cực kỳ chi tiết và chính xác, giữ nguyên cấu trúc tiêu đề, đoạn văn và các phần nếu có.
Nếu có sơ đồ, bảng biểu hoặc công thức học tập (toán, lý, hóa), hãy chuyển đổi thành dạng văn bản mô tả hoặc định dạng Markdown toán học thích hợp.
Chỉ trả về phần nội dung văn bản đã được trích xuất hoàn chỉnh, không thêm bất kỳ nhận xét, lời bình luận hay phần giới thiệu nào khác.`;

      // Gọi Gemini Multimodal
      const extractedText = await callGeminiMultimodal(buffer, mimeType, prompt);
      text = extractedText;

      if (isImage) {
        pages = 1;
      }
    }

    // Kiểm tra nội dung đọc được
    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: 'Không đọc được nội dung từ file này. File có thể trống hoặc không chứa văn bản/hình ảnh có thể nhận diện.' },
        { status: 400 }
      );
    }

    // Upload file gốc lên Vercel Blob (Hỗ trợ PDF, Word, Image) để preview (hoặc local fallback)
    let pdfUrl = undefined;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        const blob = await put(file.name, file, { access: 'public' });
        pdfUrl = blob.url;
      } catch (err) {
        console.error('Lỗi khi upload file lên Vercel Blob:', err);
      }
    } else {
      // Local fallback: Lưu vào public/uploads
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, file.name);
        fs.writeFileSync(filePath, buffer);
        pdfUrl = `/uploads/${encodeURIComponent(file.name)}`;
        console.log('Saved file locally to:', filePath);
      } catch (err) {
        console.error('Lỗi khi lưu file upload local:', err);
      }
    }

    // Trả kết quả thành công
    return NextResponse.json({
      success: true,
      text: text.trim(),
      pages,
      fileName: file.name,
      fileSize: file.size,
      textLength: text.trim().length,
      pdfUrl,
    });
  } catch (error) {
    console.error('Lỗi xử lý upload:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xử lý file. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

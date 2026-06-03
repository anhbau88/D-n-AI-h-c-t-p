// lib/docx-reader.ts
// Hàm đọc text từ file Word (.docx) sử dụng mammoth

import mammoth from 'mammoth';

/**
 * Đọc nội dung text từ buffer của file Word (.docx)
 * @param buffer - Buffer của file Word
 * @returns Object chứa text và số trang ước tính
 */
export async function extractTextFromDOCX(buffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    
    // Ước lượng số trang từ số ký tự (khoảng 3000 ký tự ~ 1 trang)
    const pages = Math.max(1, Math.ceil(text.length / 3000));
    
    return {
      text,
      pages,
    };
  } catch (error) {
    console.error('Lỗi đọc Word DOCX:', error);
    throw new Error('Không thể đọc file Word (.docx). Vui lòng kiểm tra file.');
  }
}

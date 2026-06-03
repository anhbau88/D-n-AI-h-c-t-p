// lib/file-reader.ts
// Bộ đọc và phân loại tài liệu PDF/Word hỗ trợ Next.js Backend

import { extractTextFromPDF } from './pdf-reader';
import { extractTextFromDOCX } from './docx-reader';

export interface DocumentReadResult {
  text: string;
  pages: number;
  fileName: string;
  fileSize: number;
  sourceFileType: 'pdf' | 'docx';
}

/**
 * Tự động nhận diện định dạng file (PDF/Word) và trích xuất text
 * @param buffer - Buffer của file tải lên
 * @param fileName - Tên file gốc
 * @param mimeType - Kiểu MIME của file
 * @returns Trả về kết quả đọc tài liệu dạng plain text và thông tin bổ sung
 */
export async function readDocumentFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<DocumentReadResult> {
  const nameLower = fileName.toLowerCase();
  const isPDF = mimeType === 'application/pdf' || nameLower.endsWith('.pdf');
  const isWord = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || nameLower.endsWith('.docx');

  if (!isPDF && !isWord) {
    throw new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận file .pdf hoặc .docx');
  }

  if (isPDF) {
    const result = await extractTextFromPDF(buffer);
    return {
      text: result.text,
      pages: result.pages,
      fileName,
      fileSize: buffer.length,
      sourceFileType: 'pdf',
    };
  } else {
    const result = await extractTextFromDOCX(buffer);
    return {
      text: result.text,
      pages: result.pages,
      fileName,
      fileSize: buffer.length,
      sourceFileType: 'docx',
    };
  }
}

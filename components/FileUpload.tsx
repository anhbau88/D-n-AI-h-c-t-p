// components/FileUpload.tsx
// Component upload file PDF/Word với drag & drop, hỗ trợ tính mã hash và kiểm tra trùng lặp tài liệu

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { FileInfo, DocumentItem, UserRole } from '@/types';
import { generateFileHash } from '@/lib/file-hash';

interface FileUploadProps {
  onUploadSuccess: (text: string, fileInfo: FileInfo, hash: string) => void;
  onExistingDocumentFound: (doc: DocumentItem, newName?: string) => void;
  onError: (message: string) => void;
  isDisabled?: boolean;
  currentRole: UserRole;
  existingDocuments: DocumentItem[];
  language?: 'vi' | 'en';
}

export default function FileUpload({
  onUploadSuccess,
  onExistingDocumentFound,
  onError,
  isDisabled,
  currentRole,
  existingDocuments = [],
  language = 'vi'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [lectureName, setLectureName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi kéo file vào vùng upload
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Xử lý khi thả file
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const isStudent = currentRole === 'student';
    if (!lectureName.trim()) {
      onError(
        language === 'vi' 
          ? (isStudent ? 'Vui lòng nhập tên tài liệu trước khi tải file lên.' : 'Vui lòng nhập tên bài giảng trước khi tải file lên.') 
          : (isStudent ? 'Please enter a document name before uploading.' : 'Please enter a lecture name before uploading.')
      );
      document.getElementById('lectureNameInput')?.focus();
      return;
    }
    
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // Xử lý khi chọn file từ input
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  // Hàm upload file lên API và tính mã hash
  const uploadFile = async (file: File) => {
    // Validate định dạng (chấp nhận PDF, Word .docx và Hình ảnh)
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!isPDF && !isWord && !isImage) {
      onError(
        language === 'vi'
          ? 'Vui lòng chọn file PDF, Word (.docx) hoặc Hình ảnh (.png, .jpg, .jpeg, .webp).'
          : 'Please select PDF, Word (.docx) or Image (.png, .jpg, .jpeg, .webp).'
      );
      return;
    }

    // Validate dung lượng (50MB)
    if (file.size > 50 * 1024 * 1024) {
      onError(
        language === 'vi'
          ? 'File quá lớn. Vui lòng chọn file dưới 50MB.'
          : 'File too large. Please select a file under 50MB.'
      );
      return;
    }

    setIsUploading(true);

    try {
      // Đổi tên file theo Tên bài giảng do người dùng nhập (giữ nguyên phần mở rộng)
      const lastDotIndex = file.name.lastIndexOf('.');
      const extension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';
      const cleanLectureName = lectureName.trim();
      const renamedFile = new File([file], cleanLectureName + extension, { type: file.type });

      // 1. Tạo mã hash SHA-256 từ file gốc
      const hash = await generateFileHash(renamedFile);

      // 2. Kiểm tra tài liệu đã tồn tại trong thư viện công cộng chưa (dựa trên mã hash)
      const existingDoc = existingDocuments.find(d => d.hash === hash) || null;
      if (existingDoc) {
        onExistingDocumentFound(existingDoc, renamedFile.name);
        setLectureName('');
        setIsUploading(false);
        return;
      }

      // 3. Nếu chưa có, tiến hành upload lên API để trích xuất text (luôn bật OCR ngầm)
      const formData = new FormData();
      formData.append('file', renamedFile);
      formData.append('forceOCR', 'true');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === 'vi' ? 'Upload thất bại' : 'Upload failed'));
      }

      // Lưu thông tin file
      const info: FileInfo = {
        fileName: data.fileName,
        fileSize: data.fileSize,
        pages: data.pages,
        textLength: data.textLength,
        pdfUrl: data.pdfUrl,
      };

      setFileInfo(info);

      // Đồng bộ tạm vào localStorage để tương thích cấu trúc cũ
      localStorage.setItem('pdfText', data.text);
      localStorage.setItem('fileInfo', JSON.stringify(info));

      // Callback thành công kèm mã hash
      onUploadSuccess(data.text, info, hash);
      setLectureName(''); // Làm trống ô nhập tên sau khi tải lên thành công
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (language === 'vi' ? 'Upload thất bại' : 'Upload failed');
      onError(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Format dung lượng file
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-5 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        📄 {language === 'vi' 
          ? (currentRole === 'student' ? 'Tải lên tài liệu học tập' : 'Tải lên tài liệu giảng dạy') 
          : (currentRole === 'student' ? 'Upload Study Materials' : 'Upload Teaching Materials')}
      </h3>

      {/* Ô nhập Tên tài liệu / bài giảng bắt buộc */}
      <div className="mb-4">
        <label htmlFor="lectureNameInput" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
          📝 {language === 'vi' 
            ? (currentRole === 'student' ? 'Tên tài liệu (bắt buộc)' : 'Tên bài giảng (bắt buộc)') 
            : (currentRole === 'student' ? 'Document Name (required)' : 'Lecture Name (required)')}
        </label>
        <input
          type="text"
          id="lectureNameInput"
          value={lectureName}
          onChange={(e) => setLectureName(e.target.value)}
          placeholder={language === 'vi' 
            ? (currentRole === 'student' ? 'Nhập tên tài liệu cho tệp này...' : 'Nhập tên bài giảng cho tài liệu này...') 
            : (currentRole === 'student' ? 'Enter document name for this file...' : 'Enter lecture name for this document...')}
          disabled={isUploading || isDisabled}
          className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
        />
      </div>

      {/* Vùng kéo thả */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 scale-[1.02]'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
          }
          ${isUploading || isDisabled ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!lectureName.trim()) {
            const isStudent = currentRole === 'student';
            onError(
              language === 'vi' 
                ? (isStudent ? 'Vui lòng nhập tên tài liệu trước khi chọn file.' : 'Vui lòng nhập tên bài giảng trước khi chọn file.') 
                : (isStudent ? 'Please enter a document name before selecting a file.' : 'Please enter a lecture name before selecting a file.')
            );
            document.getElementById('lectureNameInput')?.focus();
            return;
          }
          inputRef.current?.click();
        }}
      >
        {isUploading ? (
          <div className="py-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm font-medium">
              {language === 'vi' ? 'Đang phân tích tài liệu (OCR)...' : 'Analyzing document (OCR)...'}
            </p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-bold text-sm">
              {language === 'vi' ? 'Kéo thả file PDF, Word hoặc Hình ảnh vào đây' : 'Drag & drop PDF, Word or Image file here'}
            </p>
            <p className="text-gray-400 text-xs mt-1 font-semibold">
              {language === 'vi' ? 'hoặc click để chọn file (tối đa 50MB)' : 'or click to browse file (max 50MB)'}
            </p>
          </>
        )}

        {/* Input file ẩn */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Thông tin file đã upload */}
      {fileInfo && (
        <div className="mt-3 p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
          <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {language === 'vi' ? 'Tài liệu đã được mở!' : 'Document opened successfully!'}
          </p>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 space-y-0.5 font-semibold">
            <p className="truncate">📄 {fileInfo.fileName}</p>
            <p>📊 {fileInfo.pages} {language === 'vi' ? 'trang' : 'pages'} · {formatSize(fileInfo.fileSize)} · {fileInfo.textLength.toLocaleString()} {language === 'vi' ? 'ký tự' : 'characters'}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// components/DocumentLibrary.tsx
// Component thư viện tài liệu của từng vai trò (Học sinh/Giáo viên)

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, FileText } from 'lucide-react';
import { DocumentItem, UserRole } from '@/types';

interface DocumentLibraryProps {
  documents: DocumentItem[];
  activeDocId: string | null;
  onSelectDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  currentRole: UserRole;
}

export default function DocumentLibrary({
  documents,
  activeDocId,
  onSelectDocument,
  onDeleteDocument,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentRole
}: DocumentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');

  // Format dung lượng file
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format ngày tải lên
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lọc tài liệu theo bộ lọc tìm kiếm và vai trò sở hữu
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === 'all') {
      return matchesSearch;
    }
    return matchesSearch && (doc.ownerType === roleFilter || doc.role === roleFilter);
  });

  return (
    <Card className="p-5 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col h-[520px]">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        📚 Thư viện tài liệu
      </h3>

      {/* Ô tìm kiếm */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm tài liệu đã lưu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Bộ lọc vai trò (hiển thị cho cả giáo viên và học sinh) */}
      <div className="flex gap-1 mb-3 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setRoleFilter('all')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            roleFilter === 'all'
              ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('teacher')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            roleFilter === 'teacher'
              ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Bài giảng (GV)
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('student')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            roleFilter === 'student'
              ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Tài liệu (HS)
        </button>
      </div>

      {/* Danh sách các tài liệu */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs">
            {documents.length === 0 ? 'Thư viện chưa có tài liệu nào.' : 'Không tìm thấy tài liệu phù hợp.'}
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`
                  p-3 rounded-xl border transition-all duration-200 group cursor-pointer
                  ${isActive
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate hover:text-blue-500 transition-all ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                        <span>{formatSize(doc.fileSize)}</span>
                        <span>·</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {doc.summary ? (
                          <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                            Tóm tắt
                          </span>
                        ) : null}
                        {doc.quiz && doc.quiz.length > 0 ? (
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                            Trắc nghiệm
                          </span>
                        ) : null}
                        {doc.essay ? (
                          <span className="text-[9px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-medium">
                            Tự luận
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    className="h-7 w-7 text-gray-400 hover:text-red-500 rounded-lg shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100 transition-all"
                    title="Xóa tài liệu khỏi thư viện"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

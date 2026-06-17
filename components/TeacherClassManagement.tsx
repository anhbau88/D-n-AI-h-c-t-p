// components/TeacherClassManagement.tsx
// Hợp phần quản lý danh sách học sinh tham gia lớp học dành cho Giáo viên

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Trash2, AlertCircle, Info, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Student {
  username: string;
  fullName: string;
  role: string;
  room: string;
  createdAt: string;
}

interface TeacherClassManagementProps {
  user: { username: string; role: 'teacher' | 'student'; room?: string };
  language: 'vi' | 'en';
  classList: Array<{ code: string; name: string; teacherUsername: string }>;
  onRemoveStudent: (studentUsername: string, classCode: string) => Promise<boolean>;
  onDeleteClass: (classCode: string) => Promise<boolean>;
  onError: (msg: string, isError?: boolean) => void;
}

export default function TeacherClassManagement({
  user,
  language,
  classList,
  onRemoveStudent,
  onDeleteClass,
  onError
}: TeacherClassManagementProps) {
  const myClasses = classList.filter(c => c.teacherUsername === user.username);
  const classCodesStr = myClasses.map(c => c.code).join(',');
  
  const [prevClassCodesStr, setPrevClassCodesStr] = useState(classCodesStr);
  const [selectedClassCode, setSelectedClassCode] = useState<string>(() => {
    return myClasses.length > 0 ? myClasses[0].code : '';
  });

  if (classCodesStr !== prevClassCodesStr) {
    setPrevClassCodesStr(classCodesStr);
    if (myClasses.length > 0 && (!selectedClassCode || !myClasses.some(c => c.code === selectedClassCode))) {
      setSelectedClassCode(myClasses[0].code);
    }
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classError, setClassError] = useState<string>('');

  // Tải danh sách học sinh tham gia lớp
  const fetchStudents = useCallback(async (classCode: string) => {
    if (!classCode) return;
    await Promise.resolve();
    setLoading(true);
    setClassError('');
    try {
      const res = await fetch(`/api/users?room=${encodeURIComponent(classCode)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'vi' ? 'Không thể tải danh sách học sinh.' : 'Failed to fetch students.'));
      }
      setStudents(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : (language === 'vi' ? 'Không thể tải danh sách học sinh.' : 'Failed to fetch students.');
      setClassError(errMsg);
      onError(errMsg, true);
    } finally {
      setLoading(false);
    }
  }, [language, onError]);

  // Tải lại khi thay đổi lớp học được chọn
  useEffect(() => {
    if (selectedClassCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStudents(selectedClassCode);
    } else {
      setStudents([]);
    }
  }, [selectedClassCode, fetchStudents]);

  // Xử lý xóa học sinh ra khỏi lớp
  const handleRemove = async (student: Student) => {
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc chắn muốn xóa học sinh "${student.fullName || student.username}" ra khỏi lớp học này? Học sinh sẽ không thể làm bài kiểm tra của lớp trừ khi nhập lại mã.`
      : `Are you sure you want to remove student "${student.fullName || student.username}" from this class? The student will not be able to take class exams unless they enter the class code again.`;

    if (!confirm(confirmMsg)) return;

    try {
      const success = await onRemoveStudent(student.username, selectedClassCode);
      if (success) {
        // Cập nhật state cục bộ để loại bỏ học sinh
        setStudents(prev => prev.filter(s => s.username !== student.username));
        const successMsg = language === 'vi'
          ? `Đã xóa học sinh ${student.username} khỏi lớp thành công.`
          : `Removed student ${student.username} from class successfully.`;
        onError(successMsg, false);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi xóa học sinh khỏi lớp.';
      onError(errMsg, true);
    }
  };
  
  // Xử lý xóa lớp học
  const handleDelete = async () => {
    if (!selectedClassCode || !selectedClass) return;
    
    const confirmMsg1 = language === 'vi'
      ? `Bạn có chắc chắn muốn xóa toàn bộ lớp học "${selectedClass.name}" này? Hành động này sẽ xóa vĩnh viễn danh sách học sinh, bài tập đã giao và lịch sử điểm số liên quan.`
      : `Are you sure you want to delete the entire class "${selectedClass.name}"? This action will permanently delete student lists, assigned exams, and related score histories.`;

    const confirmMsg2 = language === 'vi'
      ? `CẢNH BÁO: Thao tác này KHÔNG THỂ HOÀN TÁC. Bạn vẫn chắc chắn muốn xóa chứ?`
      : `WARNING: This action CANNOT BE UNDONE. Are you absolutely sure you want to delete this class?`;

    if (!confirm(confirmMsg1)) return;
    if (!confirm(confirmMsg2)) return;

    try {
      const success = await onDeleteClass(selectedClassCode);
      if (success) {
        const successMsg = language === 'vi'
          ? `Đã xóa lớp học "${selectedClass.name}" thành công.`
          : `Class "${selectedClass.name}" deleted successfully.`;
        onError(successMsg, false);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi khi xóa lớp học.';
      onError(errMsg, true);
    }
  };

  // Lọc học sinh theo từ khóa tìm kiếm
  const filteredStudents = students.filter(s =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClass = myClasses.find(c => c.code === selectedClassCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <Users className="w-8 h-8 text-primary shrink-0" />
            {language === 'vi' ? 'Quản lý học sinh trong lớp' : 'Class Student Management'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 font-semibold">
            {language === 'vi' ? 'Xem danh sách thành viên và quản lý tham gia lớp học của học sinh' : 'View members list and manage student class participation'}
          </p>
        </div>

        {selectedClassCode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStudents(selectedClassCode)}
            disabled={loading}
            className="rounded-xl text-xs h-9 border-primary/45 text-primary flex items-center gap-1.5 font-bold shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {language === 'vi' ? 'Tải lại' : 'Refresh'}
          </Button>
        )}
      </div>

      {myClasses.length === 0 ? (
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-linear-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h4 className="text-base font-bold text-foreground">
            {language === 'vi' ? 'Bạn chưa tạo lớp học nào' : 'You have not created any classes'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-md">
            {language === 'vi'
              ? 'Vui lòng quay lại màn hình Trang chủ (Dashboard) để tạo lớp học mới và nhận mã lớp chia sẻ cho học sinh.'
              : 'Please return to the Dashboard to create a new class and receive the code to share with students.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cột trái: Chọn lớp học */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg backdrop-blur-sm space-y-3">
              <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                {language === 'vi' ? 'Chọn lớp học quản lý' : 'Select Class to Manage'}
              </label>
              
              <div className="space-y-1.5 max-h-100 overflow-y-auto pr-1">
                {myClasses.map((cls) => {
                  const isActive = cls.code === selectedClassCode;
                  return (
                    <button
                      key={cls.code}
                      onClick={() => setSelectedClassCode(cls.code)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                        isActive
                          ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                          : 'bg-transparent border-gray-150 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 text-foreground'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{cls.name}</p>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Mã: {cls.code}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Cột phải: Danh sách học sinh */}
          <div className="lg:col-span-3 space-y-4">
            {selectedClass && (
              <Card className="p-5 bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg backdrop-blur-sm space-y-4">
                {/* Thông tin lớp hiện tại */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selectedClass.name}</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {language === 'vi' ? 'Mã lớp chia sẻ: ' : 'Class code for sharing: '}
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded ml-1 font-mono text-sm">{selectedClass.code}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      {language === 'vi' ? `Tổng số: ${students.length} học sinh` : `Total: ${students.length} students`}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-500/15 hover:border-red-500/30 rounded-xl h-8 px-2.5 text-[11px] font-bold gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {language === 'vi' ? 'Xóa lớp học' : 'Delete Class'}
                    </Button>
                  </div>
                </div>

                {classError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {classError}
                  </div>
                )}

                {/* Thanh tìm kiếm */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={language === 'vi' ? 'Tìm kiếm học sinh theo họ tên hoặc username...' : 'Search student by name or username...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-850/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all font-semibold"
                  />
                </div>

                {/* Bảng danh sách */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-900/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/80 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-5 py-3.5">{language === 'vi' ? 'Họ và tên' : 'Full Name'}</th>
                          <th className="px-5 py-3.5">{language === 'vi' ? 'Tên đăng nhập' : 'Username'}</th>
                          <th className="px-5 py-3.5">{language === 'vi' ? 'Ngày tham gia' : 'Date Joined'}</th>
                          <th className="px-5 py-3.5 text-right">{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-gray-800/80">
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-gray-400 font-semibold">
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                                {language === 'vi' ? 'Đang tải danh sách học sinh...' : 'Loading students list...'}
                              </div>
                            </td>
                          </tr>
                        ) : filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-gray-400 font-semibold">
                              <Info className="w-5 h-5 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                              {students.length === 0
                                ? (language === 'vi' ? 'Lớp học hiện tại chưa có học sinh nào tham gia.' : 'No students have joined this class yet.')
                                : (language === 'vi' ? 'Không tìm thấy học sinh phù hợp.' : 'No matching students found.')}
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student) => (
                            <tr key={student.username} className="hover:bg-gray-100/40 dark:hover:bg-gray-800/20 transition-colors font-semibold text-foreground">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {(student.fullName || student.username).charAt(0)}
                                  </span>
                                  <span className="truncate max-w-37.5 sm:max-w-none">{student.fullName || '(Chưa cập nhật)'}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-[11px] text-gray-600 dark:text-gray-350">{student.username}</td>
                              <td className="px-5 py-3.5 text-gray-400">
                                {student.createdAt ? new Date(student.createdAt).toLocaleDateString('vi-VN') : '---'}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(student)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl h-8 px-2.5 text-[11px] font-bold gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {language === 'vi' ? 'Xóa khỏi lớp' : 'Remove'}
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

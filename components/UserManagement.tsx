import React, { useState, useEffect } from 'react';
import { X, Trash2, Search, Users, AlertCircle } from 'lucide-react';

interface Student {
  username: string;
  fullName: string;
  role: string;
  room: string;
  createdAt: string;
}

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  room: string;
}

export default function UserManagement({ isOpen, onClose, room }: UserManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && room) {
      fetchStudents();
    }
  }, [isOpen, room]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users?room=${encodeURIComponent(room)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải danh sách học sinh');
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học sinh "${username}" khỏi hệ thống? Toàn bộ điểm số sẽ bị mồ côi. Dữ liệu không thể khôi phục.`)) {
      return;
    }
    
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa học sinh');
      
      // Xóa thành công, cập nhật state
      setStudents(prev => prev.filter(s => s.username !== username));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quản lý Học sinh</h2>
              <p className="text-sm text-gray-500">Lớp {room}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo username hoặc họ tên thật..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Không tìm thấy học sinh nào.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{student.username}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{student.fullName || '(Chưa cập nhật)'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(student.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(student.username)}
                          title="Xóa tài khoản"
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

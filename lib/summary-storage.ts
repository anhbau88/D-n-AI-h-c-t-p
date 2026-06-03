// lib/summary-storage.ts
// Quản lý lưu trữ/CRUD bản tóm tắt (SavedSummary) trong localStorage của trình duyệt

import { SavedSummary, UserRole } from '@/types';

const STORAGE_KEY = 'ai_study_summaries';

/**
 * Kiểm tra xem code đang chạy ở phía client hay server
 */
const isClient = () => typeof window !== 'undefined';

/**
 * Lấy toàn bộ danh sách bản tóm tắt đã lưu
 */
export function getSummaries(): SavedSummary[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSummary[];
  } catch (error) {
    console.error('Lỗi đọc dữ liệu tóm tắt từ localStorage:', error);
    return [];
  }
}

/**
 * Lấy danh sách bản tóm tắt theo vai trò (Học sinh / Giáo viên)
 */
export function getSummariesByRole(role: UserRole): SavedSummary[] {
  const all = getSummaries();
  return all.filter((s) => s.role === role);
}

/**
 * Lấy danh sách danh mục đã có của vai trò tương ứng
 */
export function getCategories(role: UserRole): string[] {
  const summaries = getSummariesByRole(role);
  const categories = summaries.map((s) => s.category).filter(Boolean);
  // Trả về mảng danh mục duy nhất (unique)
  return Array.from(new Set(categories));
}

/**
 * Lưu mới hoặc cập nhật một bản tóm tắt
 */
export function saveSummary(summary: SavedSummary): void {
  if (!isClient()) return;
  try {
    const all = getSummaries();
    const index = all.findIndex((s) => s.id === summary.id);

    if (index !== -1) {
      all[index] = {
        ...summary,
        updatedAt: new Date().toISOString(),
      };
    } else {
      all.push(summary);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Lỗi khi ghi dữ liệu tóm tắt:', error);
  }
}

/**
 * Cập nhật một số thông tin (Partial) của bản tóm tắt
 */
export function updateSummary(id: string, updates: Partial<SavedSummary>): void {
  if (!isClient()) return;
  try {
    const all = getSummaries();
    const index = all.findIndex((s) => s.id === id);

    if (index !== -1) {
      all[index] = {
        ...all[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  } catch (error) {
    console.error('Lỗi cập nhật dữ liệu tóm tắt:', error);
  }
}

/**
 * Xóa một bản tóm tắt theo ID
 */
export function deleteSummary(id: string): void {
  if (!isClient()) return;
  try {
    const all = getSummaries();
    const filtered = all.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Lỗi xóa dữ liệu tóm tắt:', error);
  }
}

/**
 * Lấy chi tiết một bản tóm tắt theo ID
 */
export function getSummary(id: string): SavedSummary | undefined {
  const all = getSummaries();
  return all.find((s) => s.id === id);
}

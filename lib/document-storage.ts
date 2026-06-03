// lib/document-storage.ts
// Lớp quản lý cơ sở dữ liệu IndexedDB của trình duyệt để lưu tài liệu (DocumentItem)

import { DocumentItem, UserRole } from '@/types';

const DB_NAME = 'AIDocumentDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

/**
 * Khởi tạo hoặc mở kết nối đến IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB không hoạt động trên môi trường Server Side Rendering (SSR)'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Tạo object store 'documents' sử dụng trường 'id' làm khóa chính
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export const documentStorage = {
  /**
   * Thêm một tài liệu mới vào cơ sở dữ liệu
   */
  async addDocument(doc: DocumentItem): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Lấy danh sách tài liệu tương ứng với vai trò của người dùng
   */
  async getDocumentsByRole(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    role: UserRole
  ): Promise<DocumentItem[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const allDocs = request.result as DocumentItem[];
          resolve(allDocs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Lỗi khi truy cập IndexedDB:', e);
      return [];
    }
  },

  /**
   * Lấy toàn bộ tài liệu trong hệ thống (phục vụ bộ lọc thư viện của Giáo viên)
   */
  async getAllDocuments(): Promise<DocumentItem[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as DocumentItem[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Lỗi khi truy cập IndexedDB:', e);
      return [];
    }
  },

  /**
   * Lấy chi tiết tài liệu theo ID
   */
  async getDocumentById(id: string): Promise<DocumentItem | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Kiểm tra xem tài liệu đã tồn tại chưa dựa trên mã hash và vai trò
   */
  async getDocumentByHash(hash: string, role: UserRole): Promise<DocumentItem | null> {
    const docs = await this.getDocumentsByRole(role);
    return docs.find(d => d.hash === hash) || null;
  },

  /**
   * Cập nhật thông tin/trạng thái tài liệu theo ID
   */
  async updateDocument(id: string, updates: Partial<DocumentItem>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const doc = getRequest.result;
        if (!doc) {
          reject(new Error(`Không tìm thấy tài liệu có ID là ${id} để cập nhật.`));
          return;
        }
        const updatedDoc = {
          ...doc,
          ...updates,
          lastOpenedAt: new Date().toISOString()
        };
        const putRequest = store.put(updatedDoc);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  /**
   * Xóa tài liệu khỏi cơ sở dữ liệu
   */
  async deleteDocument(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Xóa sạch toàn bộ tài liệu thuộc về vai trò đó
   */
  async clearDocumentsByRole(role: UserRole): Promise<void> {
    const db = await openDB();
    const docs = await this.getDocumentsByRole(role);
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await Promise.all(docs.map(doc => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(doc.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }));
  }
};

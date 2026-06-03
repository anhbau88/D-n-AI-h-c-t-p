import fs from 'fs';
import path from 'path';

export interface LocalUser {
  id: string;
  username: string;
  password?: string;
  role: 'teacher' | 'student';
  room?: string;
}

const USERS_FILE_PATH = path.join(process.cwd(), 'users.json');

/**
 * Read the users from users.json. If it does not exist, initialize it with mock users.
 */
export function getLocalUsers(): LocalUser[] {
  const defaultMockUsers: LocalUser[] = [
    { id: 'gv1', username: 'giao-vien-1', password: '123', role: 'teacher', room: '64CTT1' },
    { id: 'hs1', username: 'hoc-sinh-1', password: '123', role: 'student', room: '64CTT1' }
  ];

  if (!fs.existsSync(USERS_FILE_PATH)) {
    try {
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(defaultMockUsers, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing default users file:', e);
    }
    return defaultMockUsers;
  }

  try {
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading users file:', e);
    return defaultMockUsers;
  }
}

/**
 * Save users to users.json
 */
export function saveLocalUsers(users: LocalUser[]): boolean {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing users file:', e);
    return false;
  }
}

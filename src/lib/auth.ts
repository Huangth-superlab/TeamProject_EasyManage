import { cookies } from 'next/headers';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  personnel_id: number | null;
}

// 简单的密码哈希（生产环境应使用 bcrypt）
export function hashPassword(password: string): string {
  // 使用简单的 Base64 编码（实际项目中应使用 bcrypt 或类似库）
  return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// 创建会话数据
export function createSessionData(
  userId: number, 
  username: string, 
  role: string, 
  personnelId: number | null,
  sessionVersion: number = 0
): string {
  return JSON.stringify({ 
    userId, 
    username, 
    role, 
    personnelId, 
    sessionVersion
  });
}

// 获取当前用户
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  
  if (!session) return null;
  
  try {
    const data = JSON.parse(session.value);
    // 兼容两种格式：userId 和 id
    const user: SessionUser = {
      id: data.userId || data.id,
      username: data.username,
      role: data.role,
      personnel_id: data.personnelId || data.personnel_id,
    };
    
    // 检查 session 版本（用于密码修改后强制重新登录）
    const client = getSupabaseClient();
    const { data: userData } = await client
      .from('users')
      .select('session_version')
      .eq('id', user.id)
      .single();
    
    if (userData) {
      const dbSessionVersion = userData.session_version || 0;
      const sessionVersion = data.sessionVersion || 0;
      
      // 如果数据库中的版本号大于 session 中的版本号，说明密码已被修改
      if (dbSessionVersion > sessionVersion) {
        return null; // 需要重新登录
      }
    }
    
    return user;
  } catch {
    return null;
  }
}

// 清除会话
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// 验证用户登录
export async function validateLogin(username: string, password: string) {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return { success: false, error: '用户名或密码错误' };
  }
  
  if (!verifyPassword(password, data.password)) {
    return { success: false, error: '用户名或密码错误' };
  }
  
  // 更新最后登录时间
  await client
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.id);
  
  return { 
    success: true, 
    user: {
      id: data.id,
      username: data.username,
      role: data.role,
      personnel_id: data.personnel_id,
      session_version: data.session_version || 0,
    }
  };
}

// 检查是否为管理员
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === '系统管理员';
}

// 导出 logOperation
export { logOperation } from './operation-log';
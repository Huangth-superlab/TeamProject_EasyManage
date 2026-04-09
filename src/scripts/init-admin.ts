import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword } from '@/lib/auth';

export async function initializeDefaultAdmin() {
  const client = getSupabaseClient();

  // 检查是否已存在 admin 用户
  const { data: existingUser } = await client
    .from('users')
    .select('id')
    .eq('username', 'admin')
    .single();

  if (existingUser) {
    console.log('Admin user already exists');
    return;
  }

  // 创建默认管理员
  const hashedPassword = hashPassword('admin123');
  
  const { data, error } = await client
    .from('users')
    .insert({
      username: 'admin',
      password: hashedPassword,
      role: '系统管理员',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create admin user:', error);
  } else {
    console.log('Admin user created successfully:', { username: 'admin', password: 'admin123' });
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDefaultAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

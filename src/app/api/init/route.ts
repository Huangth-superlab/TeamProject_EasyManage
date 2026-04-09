import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    const client = getSupabaseClient();

    // 检查是否已存在 admin 用户
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: '管理员已存在' 
      });
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
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '管理员创建成功',
      data: { username: 'admin', password: 'admin123' }
    });
  } catch (error) {
    console.error('Init admin error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '初始化失败' 
    }, { status: 500 });
  }
}

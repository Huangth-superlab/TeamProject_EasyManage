import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 修改用户密码（仅管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 });
    }
    
    const { id } = await params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ success: false, error: '无效的ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const { newPassword } = body;
    
    // 校验密码
    if (!newPassword) {
      return NextResponse.json({ success: false, error: '请输入新密码' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: '密码长度至少6位' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 获取用户信息
    const { data: userData } = await client
      .from('users')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (!userData) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }
    
    // 更新密码和增加 session_version
    const hashedPassword = hashPassword(newPassword);
    
    // 获取当前的 session_version 并增加
    const currentVersion = userData.session_version || 0;
    const newVersion = currentVersion + 1;
    
    const { error } = await client
      .from('users')
      .update({ 
        password: hashedPassword,
        session_version: newVersion,
      })
      .eq('id', idNum);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: currentUser.id,
      userName: currentUser.username,
      module: '用户管理',
      operationType: '修改密码',
      targetName: userData.username,
      detail: JSON.stringify({ userId: idNum }),
    });
    
    return NextResponse.json({ success: true, message: '密码修改成功，该用户需要重新登录' });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ success: false, error: '修改密码失败' }, { status: 500 });
  }
}

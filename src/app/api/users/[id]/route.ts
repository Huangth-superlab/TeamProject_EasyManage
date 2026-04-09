import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 获取用户详情（仅管理员）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
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
    
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }
    
    // 获取关联的人员信息
    let personnelName = null;
    if (data.personnel_id) {
      const { data: person } = await client
        .from('personnel')
        .select('name')
        .eq('id', data.personnel_id)
        .single();
      personnelName = person?.name;
    }
    
    // 不返回密码
    const result = { ...data, password: undefined, personnel_name: personnelName };
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ success: false, error: '获取用户详情失败' }, { status: 500 });
  }
}

// 删除用户（仅管理员，不能删除自己，不能删除admin用户）
export async function DELETE(
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
    
    // 不能删除自己
    if (userData.id === currentUser.id) {
      return NextResponse.json({ success: false, error: '不能删除当前登录用户' }, { status: 400 });
    }
    
    // 不能删除admin用户
    if (userData.username === 'admin') {
      return NextResponse.json({ success: false, error: '不能删除admin用户' }, { status: 400 });
    }
    
    // 删除用户（关联人员不影响删除，自动清理脏数据）
    const { error } = await client
      .from('users')
      .delete()
      .eq('id', idNum);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: currentUser.id,
      userName: currentUser.username,
      module: '用户管理',
      operationType: '删除',
      targetName: userData.username,
      detail: JSON.stringify({ 
        deletedUserId: userData.id, 
        deletedUsername: userData.username, 
        deletedRole: userData.role,
        hadPersonnelId: userData.personnel_id 
      }),
    });
    
    return NextResponse.json({ success: true, message: '用户删除成功' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: '删除用户失败' }, { status: 500 });
  }
}

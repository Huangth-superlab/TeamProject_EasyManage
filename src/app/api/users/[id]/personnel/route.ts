import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 修改用户关联人员（仅管理员）
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
    const { personnel_id } = body;
    
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
    
    // 验证人员是否存在
    if (personnel_id) {
      const { data: person } = await client
        .from('personnel')
        .select('id, name')
        .eq('id', personnel_id)
        .single();
      
      if (!person) {
        return NextResponse.json({ success: false, error: '所选人员不存在' }, { status: 400 });
      }
    }
    
    const oldPersonnelId = userData.personnel_id;
    
    // 更新关联人员
    const { error } = await client
      .from('users')
      .update({ personnel_id: personnel_id || null })
      .eq('id', idNum);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 获取人员名称用于日志
    let oldPersonnelName = null;
    let newPersonnelName = null;
    
    if (oldPersonnelId) {
      const { data: oldPerson } = await client
        .from('personnel')
        .select('name')
        .eq('id', oldPersonnelId)
        .single();
      oldPersonnelName = oldPerson?.name;
    }
    
    if (personnel_id) {
      const { data: newPerson } = await client
        .from('personnel')
        .select('name')
        .eq('id', personnel_id)
        .single();
      newPersonnelName = newPerson?.name;
    }
    
    // 记录操作日志
    await logOperation({
      userId: currentUser.id,
      userName: currentUser.username,
      module: '用户管理',
      operationType: '修改关联人员',
      targetName: userData.username,
      detail: JSON.stringify({ 
        before: oldPersonnelName, 
        after: newPersonnelName 
      }),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update personnel error:', error);
    return NextResponse.json({ success: false, error: '修改关联人员失败' }, { status: 500 });
  }
}

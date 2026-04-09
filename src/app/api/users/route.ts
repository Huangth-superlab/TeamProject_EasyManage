import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 获取用户列表（仅管理员）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 });
    }
    
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const username = searchParams.get('username');
    const role = searchParams.get('role');
    
    let query = client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (username) {
      query = query.ilike('username', `%${username}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 获取关联的人员信息
    const personnelIds = data?.filter(u => u.personnel_id).map(u => u.personnel_id) || [];
    let personnelMap: Record<number, { name: string }> = {};
    
    if (personnelIds.length > 0) {
      const { data: persons } = await client
        .from('personnel')
        .select('id, name')
        .in('id', personnelIds);
      
      persons?.forEach(p => {
        personnelMap[p.id] = { name: p.name };
      });
    }
    
    const result = data?.map(u => ({
      ...u,
      password: undefined, // 不返回密码
      personnel_name: u.personnel_id ? personnelMap[u.personnel_id]?.name : null,
    }));
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ success: false, error: '获取用户列表失败' }, { status: 500 });
  }
}

// 新增用户（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: '权限不足' }, { status: 403 });
    }
    
    const body = await request.json();
    const { username, password, personnel_id, role } = body;
    
    // 校验必填字段
    if (!username || !password) {
      return NextResponse.json({ success: false, error: '用户名和密码为必填项' }, { status: 400 });
    }
    
    // 校验用户名长度
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ success: false, error: '用户名长度应为3-50个字符' }, { status: 400 });
    }
    
    // 校验密码长度
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: '密码长度至少6位' }, { status: 400 });
    }
    
    const validRoles = ['普通用户', '系统管理员'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: '无效的用户角色' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 检查用户名是否已存在
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    
    if (existingUser) {
      return NextResponse.json({ success: false, error: '用户名已存在' }, { status: 400 });
    }
    
    // 验证人员是否存在
    if (personnel_id) {
      const { data: person } = await client
        .from('personnel')
        .select('id')
        .eq('id', personnel_id)
        .single();
      
      if (!person) {
        return NextResponse.json({ success: false, error: '所选人员不存在' }, { status: 400 });
      }
    }
    
    const hashedPassword = hashPassword(password);
    
    const { data, error } = await client
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        personnel_id: personnel_id || null,
        role: role || '普通用户',
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: user.id,
      userName: user.username,
      module: '用户管理',
      operationType: '新增',
      targetName: username,
      detail: JSON.stringify({ id: data.id, username, role }),
    });
    
    // 不返回密码
    const result = { ...data, password: undefined };
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, error: '新增用户失败' }, { status: 500 });
  }
}

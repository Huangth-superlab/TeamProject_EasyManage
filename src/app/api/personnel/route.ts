import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 获取人员列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const personnelType = searchParams.get('personnelType');
    const name = searchParams.get('name');
    
    let query = client
      .from('personnel')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (personnelType) {
      query = query.eq('personnel_type', personnelType);
    }
    
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 获取项目名称
    const projectIds = data?.filter(p => p.project_id).map(p => p.project_id) || [];
    let projectMap: Record<number, string> = {};
    
    if (projectIds.length > 0) {
      const { data: projects } = await client
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
      
      projects?.forEach(p => {
        projectMap[p.id] = p.name;
      });
    }
    
    const result = data?.map(p => ({
      ...p,
      project_name: p.project_id ? projectMap[p.project_id] : null,
    }));
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Get personnel error:', error);
    return NextResponse.json({ success: false, error: '获取人员列表失败' }, { status: 500 });
  }
}

// 新增人员
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, personnel_type, project_id, unit_name, position, phone } = body;
    
    // 校验必填字段
    if (!name || !personnel_type) {
      return NextResponse.json({ success: false, error: '姓名和人员类型为必填项' }, { status: 400 });
    }
    
    // 校验姓名长度
    if (name.length < 1 || name.length > 50) {
      return NextResponse.json({ success: false, error: '姓名长度应为1-50个字符' }, { status: 400 });
    }
    
    // 校验人员类型
    const validTypes = ['部门成员', '公司销售', '外部厂商', '业主单位', '合作伙伴', '其他'];
    if (!validTypes.includes(personnel_type)) {
      return NextResponse.json({ success: false, error: '无效的人员类型' }, { status: 400 });
    }
    
    // 校验电话格式
    if (phone && !/^1[3-9]\d{9}$|^\d{3,4}-?\d{7,8}$/.test(phone)) {
      return NextResponse.json({ success: false, error: '请输入有效的联系电话' }, { status: 400 });
    }
    
    // 处理字段逻辑：部门成员和公司销售时，所属项目和单位名称置空
    let finalProjectId = project_id;
    let finalUnitName = unit_name;
    
    if (personnel_type === '部门成员' || personnel_type === '公司销售') {
      finalProjectId = null;
      finalUnitName = null;
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('personnel')
      .insert({
        name,
        personnel_type,
        project_id: finalProjectId,
        unit_name: finalUnitName,
        position,
        phone,
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
      module: '人员管理',
      operationType: '新增',
      targetName: name,
      detail: JSON.stringify(data),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Create personnel error:', error);
    return NextResponse.json({ success: false, error: '新增人员失败' }, { status: 500 });
  }
}
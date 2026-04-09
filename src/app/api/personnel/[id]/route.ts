import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser, logOperation } from '@/lib/auth';

// 获取单个人员
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const client = getSupabaseClient();
    const { id } = await params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ success: false, error: '无效的ID' }, { status: 400 });
    }
    
    const { data, error } = await client
      .from('personnel')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ success: false, error: '人员不存在' }, { status: 404 });
    }
    
    // 获取项目名称
    let projectName = null;
    if (data.project_id) {
      const { data: project } = await client
        .from('projects')
        .select('name')
        .eq('id', data.project_id)
        .single();
      
      projectName = project?.name || null;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { ...data, project_name: projectName } 
    });
  } catch (error) {
    console.error('Get personnel error:', error);
    return NextResponse.json({ success: false, error: '获取人员信息失败' }, { status: 500 });
  }
}

// 更新人员
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id } = await params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ success: false, error: '无效的ID' }, { status: 400 });
    }
    
    const { name, personnel_type, project_id, unit_name, position, phone } = body;
    
    // 校验必填字段
    if (!name || !personnel_type) {
      return NextResponse.json({ success: false, error: '姓名和人员类型为必填项' }, { status: 400 });
    }
    
    // 校验姓名长度
    if (name.length < 1 || name.length > 50) {
      return NextResponse.json({ success: false, error: '姓名长度应为1-50个字符' }, { status: 400 });
    }
    
    // 校验电话格式
    if (phone && !/^1[3-9]\d{9}$|^\d{3,4}-?\d{7,8}$/.test(phone)) {
      return NextResponse.json({ success: false, error: '请输入有效的联系电话' }, { status: 400 });
    }
    
    // 处理字段逻辑
    let finalProjectId = project_id;
    let finalUnitName = unit_name;
    
    if (personnel_type === '部门成员' || personnel_type === '公司销售') {
      finalProjectId = null;
      finalUnitName = null;
    }
    
    const client = getSupabaseClient();
    
    // 先获取旧数据
    const { data: oldData } = await client
      .from('personnel')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (!oldData) {
      return NextResponse.json({ success: false, error: '人员不存在' }, { status: 404 });
    }
    
    const { data, error } = await client
      .from('personnel')
      .update({
        name,
        personnel_type,
        project_id: finalProjectId,
        unit_name: finalUnitName,
        position,
        phone,
      })
      .eq('id', idNum)
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
      operationType: '修改',
      targetName: name,
      detail: JSON.stringify({ before: oldData, after: data }),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update personnel error:', error);
    return NextResponse.json({ success: false, error: '更新人员失败' }, { status: 500 });
  }
}

// 删除人员
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const { id } = await params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({ success: false, error: '无效的ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 先获取人员信息
    const { data: personnel } = await client
      .from('personnel')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (!personnel) {
      return NextResponse.json({ success: false, error: '人员不存在' }, { status: 404 });
    }
    
    // 检查是否被项目引用为责任人
    const { data: projectResponsible } = await client
      .from('projects')
      .select('id, name')
      .eq('responsible_person_id', idNum);
    
    // 检查是否被项目进展引用
    const { data: progressResponsible } = await client
      .from('project_progress')
      .select('project_id, responsible_person_ids')
      .not('responsible_person_ids', 'is', null);
    
    // 检查是否被待办事项引用
    const { data: todoResponsible } = await client
      .from('todo_items')
      .select('project_id, responsible_person_ids')
      .not('responsible_person_ids', 'is', null);
    
    // 检查关联的项目
    const referencedProjects = new Set<number>();
    
    projectResponsible?.forEach(p => referencedProjects.add(p.id));
    
    progressResponsible?.forEach(p => {
      if (p.responsible_person_ids && p.responsible_person_ids.includes(idNum)) {
        referencedProjects.add(p.project_id);
      }
    });
    
    todoResponsible?.forEach(t => {
      if (t.responsible_person_ids && t.responsible_person_ids.includes(idNum)) {
        referencedProjects.add(t.project_id);
      }
    });
    
    if (referencedProjects.size > 0) {
      // 获取项目名称
      const { data: projects } = await client
        .from('projects')
        .select('id, name')
        .in('id', Array.from(referencedProjects));
      
      const projectNames = projects?.map(p => p.name).join('、') || '';
      
      return NextResponse.json({ 
        success: false, 
        error: `该人员已被项目[${projectNames}]引用，无法删除。请先解除其在项目中的关联关系。` 
      }, { status: 400 });
    }
    
    // 删除人员
    const { error } = await client
      .from('personnel')
      .delete()
      .eq('id', idNum);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: user.id,
      userName: user.username,
      module: '人员管理',
      operationType: '删除',
      targetName: personnel.name,
      detail: JSON.stringify({ deleted: personnel }),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete personnel error:', error);
    return NextResponse.json({ success: false, error: '删除人员失败' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 获取项目详情
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
    
    // 获取项目信息
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 });
    }
    
    // 获取责任人信息
    const { data: responsiblePerson } = await client
      .from('personnel')
      .select('id, name')
      .eq('id', project.responsible_person_id)
      .single();

    // 获取项目进展
    const { data: progress } = await client
      .from('project_progress')
      .select('*')
      .eq('project_id', idNum)
      .order('event_date', { ascending: false });

    // 获取进展的责任人信息
    const progressPersonIds = new Set<number>();
    progress?.forEach((p: any) => {
      p.responsible_person_ids?.forEach((pid: number) => progressPersonIds.add(pid));
    });
    
    let progressPersonMap: Record<number, { id: number; name: string }> = {};
    if (progressPersonIds.size > 0) {
      const { data: progressPersons } = await client
        .from('personnel')
        .select('id, name')
        .in('id', Array.from(progressPersonIds));
      
      progressPersons?.forEach(p => {
        progressPersonMap[p.id] = { id: p.id, name: p.name };
      });
    }
    
    const progressWithPersons = progress?.map((p: any) => ({
      ...p,
      responsible_persons: p.responsible_person_ids?.map((pid: number) => progressPersonMap[pid]).filter(Boolean) || [],
    }));

    // 获取待办事项
    const { data: todos } = await client
      .from('todo_items')
      .select('*')
      .eq('project_id', idNum)
      .order('event_date', { ascending: false });

    // 获取待办的责任人信息
    const todoPersonIds = new Set<number>();
    todos?.forEach((t: any) => {
      t.responsible_person_ids?.forEach((pid: number) => todoPersonIds.add(pid));
    });
    
    let todoPersonMap: Record<number, { id: number; name: string }> = {};
    if (todoPersonIds.size > 0) {
      const { data: todoPersons } = await client
        .from('personnel')
        .select('id, name')
        .in('id', Array.from(todoPersonIds));
      
      todoPersons?.forEach(p => {
        todoPersonMap[p.id] = { id: p.id, name: p.name };
      });
    }
    
    const todosWithPersons = todos?.map((t: any) => ({
      ...t,
      responsible_persons: t.responsible_person_ids?.map((pid: number) => todoPersonMap[pid]).filter(Boolean) || [],
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...project,
        responsible_person_name: responsiblePerson?.name || null,
        progress: progressWithPersons || [],
        todos: todosWithPersons || [],
      } 
    });
  } catch (error) {
    console.error('Get project detail error:', error);
    return NextResponse.json({ success: false, error: '获取项目详情失败' }, { status: 500 });
  }
}

// 更新项目
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
    
    const { 
      name, 
      content, 
      source, 
      responsible_person_id, 
      owner_unit_name, 
      owner_unit_type, 
      stage 
    } = body;
    
    // 校验必填字段
    if (!name || !content || !source || !responsible_person_id || !stage) {
      return NextResponse.json({ success: false, error: '请填写所有必填项' }, { status: 400 });
    }
    
    // 校验字段长度
    if (name.length < 1 || name.length > 100) {
      return NextResponse.json({ success: false, error: '项目名称长度应为1-100个字符' }, { status: 400 });
    }
    
    if (content.length > 500) {
      return NextResponse.json({ success: false, error: '项目内容不能超过500字' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 先获取旧数据
    const { data: oldData } = await client
      .from('projects')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (!oldData) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 });
    }
    
    const { data, error } = await client
      .from('projects')
      .update({
        name,
        content,
        source,
        responsible_person_id,
        owner_unit_name,
        owner_unit_type,
        stage,
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
      module: '项目管理',
      operationType: '修改',
      targetName: name,
      detail: JSON.stringify({ before: oldData, after: data }),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ success: false, error: '更新项目失败' }, { status: 500 });
  }
}

// 删除项目
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
    
    // 先获取项目信息
    const { data: project } = await client
      .from('projects')
      .select('*')
      .eq('id', idNum)
      .single();
    
    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 });
    }
    
    // 检查是否有关联的进展或待办
    const { count: progressCount } = await client
      .from('project_progress')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', idNum);
    
    const { count: todoCount } = await client
      .from('todo_items')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', idNum);
    
    if ((progressCount || 0) > 0 || (todoCount || 0) > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该项目下仍有进展或待办事项，请先删除所有关联内容后再删除项目。' 
      }, { status: 400 });
    }
    
    // 检查是否被人员引用
    const { count: personnelCount } = await client
      .from('personnel')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', idNum);
    
    if ((personnelCount || 0) > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该项目已被人员信息引用，无法删除。' 
      }, { status: 400 });
    }
    
    // 删除项目
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', idNum);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: user.id,
      userName: user.username,
      module: '项目管理',
      operationType: '删除',
      targetName: project.name,
      detail: JSON.stringify({ deleted: project }),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ success: false, error: '删除项目失败' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 新增待办事项
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const { id: projectId } = await params;
    const project_id = parseInt(projectId);
    
    const body = await request.json();
    const { event_date, deadline, content, responsible_person_ids, status } = body;
    
    // 校验必填字段
    if (!event_date || !deadline || !content) {
      return NextResponse.json({ success: false, error: '请填写事件时间、截止时间和待办事项' }, { status: 400 });
    }
    
    // 校验字段长度
    if (content.length > 200) {
      return NextResponse.json({ success: false, error: '待办事项内容不能超过200字' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 验证项目是否存在
    const { data: project } = await client
      .from('projects')
      .select('name')
      .eq('id', project_id)
      .single();
    
    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 400 });
    }
    
    // 验证责任人是否存在（如果提供了责任人）
    if (responsible_person_ids && responsible_person_ids.length > 0) {
      const { data: persons } = await client
        .from('personnel')
        .select('id, name')
        .in('id', responsible_person_ids);
      
      if (!persons || persons.length !== responsible_person_ids.length) {
        return NextResponse.json({ success: false, error: '部分责任人不存在' }, { status: 400 });
      }
    }
    
    const { data, error } = await client
      .from('todo_items')
      .insert({
        project_id,
        event_date,
        deadline,
        content,
        responsible_person_ids: responsible_person_ids || [],
        status: status || '未完成',
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
      module: '待办事项',
      operationType: '新增',
      targetName: `${project.name} - ${content.substring(0, 30)}`,
      detail: JSON.stringify(data),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ success: false, error: '新增待办事项失败' }, { status: 500 });
  }
}

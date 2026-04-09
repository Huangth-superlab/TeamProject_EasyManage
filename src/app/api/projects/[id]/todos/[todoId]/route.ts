import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 更新待办事项
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; todoId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, todoId } = await params;
    const projectId = parseInt(id);
    const todoIdNum = parseInt(todoId);
    
    const { event_date, deadline, content, responsible_person_ids, status } = body;
    
    // 校验必填字段
    if (!event_date || !deadline || !content) {
      return NextResponse.json({ success: false, error: '请填写事件时间、截止时间和待办事项' }, { status: 400 });
    }
    
    if (content.length > 200) {
      return NextResponse.json({ success: false, error: '待办事项内容不能超过200字' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 先获取旧数据
    const { data: oldData } = await client
      .from('todo_items')
      .select('*')
      .eq('id', todoIdNum)
      .eq('project_id', projectId)
      .single();
    
    if (!oldData) {
      return NextResponse.json({ success: false, error: '待办事项不存在' }, { status: 404 });
    }
    
    const { data, error } = await client
      .from('todo_items')
      .update({
        event_date,
        deadline,
        content,
        responsible_person_ids: responsible_person_ids || [],
        status: status || oldData.status,
      })
      .eq('id', todoIdNum)
      .eq('project_id', projectId)
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
      operationType: '修改',
      targetName: content.substring(0, 30),
      detail: JSON.stringify({ before: oldData, after: data }),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ success: false, error: '更新待办事项失败' }, { status: 500 });
  }
}

// 删除待办事项
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; todoId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const { id, todoId } = await params;
    const projectId = parseInt(id);
    const todoIdNum = parseInt(todoId);
    
    const client = getSupabaseClient();
    
    // 先获取待办信息
    const { data: todo } = await client
      .from('todo_items')
      .select('*')
      .eq('id', todoIdNum)
      .eq('project_id', projectId)
      .single();
    
    if (!todo) {
      return NextResponse.json({ success: false, error: '待办事项不存在' }, { status: 404 });
    }
    
    const { error } = await client
      .from('todo_items')
      .delete()
      .eq('id', todoIdNum)
      .eq('project_id', projectId);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: user.id,
      userName: user.username,
      module: '待办事项',
      operationType: '删除',
      targetName: todo.content.substring(0, 30),
      detail: JSON.stringify({ deleted: todo }),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ success: false, error: '删除待办事项失败' }, { status: 500 });
  }
}

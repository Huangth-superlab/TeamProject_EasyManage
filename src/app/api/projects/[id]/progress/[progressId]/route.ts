import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 更新项目进展
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; progressId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, progressId } = await params;
    const projectId = parseInt(id);
    const progressIdNum = parseInt(progressId);
    
    const { event_date, content, responsible_person_ids } = body;
    
    // 校验必填字段
    if (!event_date || !content) {
      return NextResponse.json({ success: false, error: '请填写事件时间和进展内容' }, { status: 400 });
    }
    
    if (content.length > 200) {
      return NextResponse.json({ success: false, error: '项目进展内容不能超过200字' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 先获取旧数据
    const { data: oldData } = await client
      .from('project_progress')
      .select('*')
      .eq('id', progressIdNum)
      .eq('project_id', projectId)
      .single();
    
    if (!oldData) {
      return NextResponse.json({ success: false, error: '项目进展不存在' }, { status: 404 });
    }
    
    const { data, error } = await client
      .from('project_progress')
      .update({
        event_date,
        content,
        responsible_person_ids: responsible_person_ids || [],
      })
      .eq('id', progressIdNum)
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
      module: '项目进展',
      operationType: '修改',
      targetName: content.substring(0, 30),
      detail: JSON.stringify({ before: oldData, after: data }),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ success: false, error: '更新项目进展失败' }, { status: 500 });
  }
}

// 删除项目进展
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; progressId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const { id, progressId } = await params;
    const projectId = parseInt(id);
    const progressIdNum = parseInt(progressId);
    
    const client = getSupabaseClient();
    
    // 先获取进展信息
    const { data: progress } = await client
      .from('project_progress')
      .select('*')
      .eq('id', progressIdNum)
      .eq('project_id', projectId)
      .single();
    
    if (!progress) {
      return NextResponse.json({ success: false, error: '项目进展不存在' }, { status: 404 });
    }
    
    const { error } = await client
      .from('project_progress')
      .delete()
      .eq('id', progressIdNum)
      .eq('project_id', projectId);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 记录操作日志
    await logOperation({
      userId: user.id,
      userName: user.username,
      module: '项目进展',
      operationType: '删除',
      targetName: progress.content.substring(0, 30),
      detail: JSON.stringify({ deleted: progress }),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete progress error:', error);
    return NextResponse.json({ success: false, error: '删除项目进展失败' }, { status: 500 });
  }
}

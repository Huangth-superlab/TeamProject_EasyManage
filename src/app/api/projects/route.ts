import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { logOperation } from '@/lib/operation-log';

// 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const name = searchParams.get('name');
    const ownerUnitName = searchParams.get('ownerUnitName');
    const source = searchParams.get('source');
    const ownerUnitType = searchParams.get('ownerUnitType');
    const stage = searchParams.get('stage');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = client
      .from('projects')
      .select('*');
    
    // 模糊搜索
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    
    if (ownerUnitName) {
      query = query.ilike('owner_unit_name', `%${ownerUnitName}%`);
    }
    
    // 精确筛选
    if (source) {
      query = query.eq('source', source);
    }
    
    if (ownerUnitType) {
      query = query.eq('owner_unit_type', ownerUnitType);
    }
    
    if (stage) {
      query = query.eq('stage', stage);
    }
    
    // 日期范围筛选
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // 排序
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 获取责任人信息
    const personIds = data?.map(p => p.responsible_person_id) || [];
    let personMap: Record<number, string> = {};
    
    if (personIds.length > 0) {
      const { data: persons } = await client
        .from('personnel')
        .select('id, name')
        .in('id', personIds);
      
      persons?.forEach(p => {
        personMap[p.id] = p.name;
      });
    }
    
    const result = data?.map(p => ({
      ...p,
      responsible_person_name: personMap[p.responsible_person_id] || null,
    }));
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ success: false, error: '获取项目列表失败' }, { status: 500 });
  }
}

// 新增项目
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    const body = await request.json();
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
    
    if (owner_unit_name && (owner_unit_name.length < 0 || owner_unit_name.length > 100)) {
      return NextResponse.json({ success: false, error: '业主单位名称长度不能超过100个字符' }, { status: 400 });
    }
    
    const validSources = ['销售导入', '部门对接', '其他'];
    if (!validSources.includes(source)) {
      return NextResponse.json({ success: false, error: '无效的项目来源' }, { status: 400 });
    }
    
    const validStages = ['商机', '启动阶段', '立项阶段', '实施阶段', '验收阶段', '已结束'];
    if (!validStages.includes(stage)) {
      return NextResponse.json({ success: false, error: '无效的项目阶段' }, { status: 400 });
    }
    
    if (owner_unit_type) {
      const validOwnerTypes = ['党政机关', '事业单位', '央国企', '私营企业', '其他'];
      if (!validOwnerTypes.includes(owner_unit_type)) {
        return NextResponse.json({ success: false, error: '无效的业主单位属性' }, { status: 400 });
      }
    }
    
    // 验证责任人是否存在
    const client = getSupabaseClient();
    const { data: person } = await client
      .from('personnel')
      .select('id')
      .eq('id', responsible_person_id)
      .single();
    
    if (!person) {
      return NextResponse.json({ success: false, error: '所选责任人不存在' }, { status: 400 });
    }
    
    const { data, error } = await client
      .from('projects')
      .insert({
        name,
        content,
        source,
        responsible_person_id,
        owner_unit_name,
        owner_unit_type,
        stage,
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
      module: '项目管理',
      operationType: '新增',
      targetName: name,
      detail: JSON.stringify(data),
    });
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ success: false, error: '新增项目失败' }, { status: 500 });
  }
}
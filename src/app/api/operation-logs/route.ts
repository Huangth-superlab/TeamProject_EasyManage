import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser, isAdmin, hashPassword, logOperation } from '@/lib/auth';

// 获取操作日志（仅管理员）
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
    
    const userName = searchParams.get('userName');
    const module = searchParams.get('module');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = client
      .from('operation_logs')
      .select('*')
      .order('operation_time', { ascending: false });
    
    if (userName) {
      query = query.ilike('user_name', `%${userName}%`);
    }
    
    if (module) {
      query = query.eq('module', module);
    }
    
    if (startDate) {
      query = query.gte('operation_time', startDate);
    }
    
    if (endDate) {
      // 将结束日期转换为当天的 23:59:59，以包含当天的所有记录
      const endDateTime = `${endDate}T23:59:59`;
      query = query.lte('operation_time', endDateTime);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get operation logs error:', error);
    return NextResponse.json({ success: false, error: '获取操作日志失败' }, { status: 500 });
  }
}

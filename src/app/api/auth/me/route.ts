import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
  
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}

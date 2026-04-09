import { NextRequest, NextResponse } from 'next/server';
import { validateLogin, createSessionData } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const result = await validateLogin(username, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // 创建会话数据
    const sessionData = createSessionData(
      result.user!.id,
      result.user!.username,
      result.user!.role,
      result.user!.personnel_id,
      result.user!.session_version
    );

    // 创建响应并设置Cookie
    const response = NextResponse.json({
      success: true,
      data: result.user
    });

    // 设置Cookie
    response.cookies.set('session', sessionData, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}

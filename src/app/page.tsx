'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  username: string;
  role: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUser(result.data);
      } else {
        router.push('/login');
      }
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">项目管理系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                欢迎, {user.username} ({user.role})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 人员管理 */}
          <Link href="/personnel">
            <Card
              title="人员管理"
              description="管理项目参与人员信息"
              icon="👥"
              color="blue"
            />
          </Link>

          {/* 项目管理 */}
          <Link href="/projects">
            <Card
              title="项目管理"
              description="管理项目信息、进展和待办"
              icon="📊"
              color="green"
            />
          </Link>

          {/* 用户管理 - 仅管理员 */}
          {user.role === '系统管理员' && (
            <Link href="/users">
              <Card
                title="用户管理"
                description="管理系统用户和权限"
                icon="👤"
                color="purple"
              />
            </Link>
          )}

          {/* 操作日志 - 仅管理员 */}
          {user.role === '系统管理员' && (
            <Link href="/operation-logs">
              <Card
                title="操作日志"
                description="查看系统操作记录"
                icon="📝"
                color="orange"
              />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ title, description, icon, color }: { title: string; description: string; icon: string; color: string }) {
  const colorClasses = {
    blue: 'hover:border-blue-500 hover:bg-blue-50',
    green: 'hover:border-green-500 hover:bg-green-50',
    purple: 'hover:border-purple-500 hover:bg-purple-50',
    orange: 'hover:border-orange-500 hover:bg-orange-50',
  };

  return (
    <div className={`p-6 bg-white rounded-lg border-2 border-gray-200 shadow-sm cursor-pointer transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OperationLog {
  id: number;
  user_id: number;
  user_name: string;
  operation_time: string;
  ip_address: string | null;
  module: string;
  operation_type: string;
  target_name: string;
  detail: string | null;
}

// 获取默认日期范围（一周内）
const getDefaultDateRange = () => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  return {
    startDate: weekAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
};

export default function OperationLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 用于Select的"全部"选项值
  const ALL_OPTION = '__all__';

  // 设置默认时间范围为一周内
  const defaultRange = getDefaultDateRange();
  const [filters, setFilters] = useState({
    userName: '',
    module: ALL_OPTION,
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
  });

  const MODULES = ['人员管理', '项目管理', '项目进展', '待办事项', '用户管理'];

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    loadLogs();
  }, []); // 初始加载

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      if (result.success && result.data.role !== '系统管理员') {
        alert('权限不足');
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // 将 ALL_OPTION 过滤掉，不添加到查询参数
        if (value && value !== ALL_OPTION) params.append(key, value);
      });

      const response = await fetch(`/api/operation-logs?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
      } else {
        console.error('Load logs error:', result.error);
        setLogs([]);
      }
    } catch (error) {
      console.error('Load logs error:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadLogs();
  };

  const handleReset = () => {
    const defaultRange = getDefaultDateRange();
    setFilters({
      userName: '',
      module: ALL_OPTION,
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
    });
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case '新增':
        return 'bg-green-100 text-green-800';
      case '修改':
        return 'bg-blue-100 text-blue-800';
      case '删除':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← 返回
              </Button>
            </Link>
            <h1 className="text-xl font-bold">操作日志</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索筛选 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[60px]">用户名：</span>
              <Input
                placeholder="请输入"
                value={filters.userName}
                onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[60px]">操作模块：</span>
              <Select value={filters.module} onValueChange={(value) => setFilters({ ...filters, module: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>全部</SelectItem>
                  {MODULES.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[60px]">开始日期：</span>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[60px]">结束日期：</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSearch}>搜索</Button>
            <Button variant="outline" onClick={handleReset}>重置</Button>
          </div>
        </div>

        {/* 日志列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作时间</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>模块</TableHead>
                <TableHead>操作类型</TableHead>
                <TableHead>操作对象</TableHead>
                <TableHead>详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.operation_time).toLocaleString()}</TableCell>
                    <TableCell>{log.user_name}</TableCell>
                    <TableCell>{log.ip_address || '-'}</TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getOperationTypeColor(log.operation_type)}`}>
                        {log.operation_type}
                      </span>
                    </TableCell>
                    <TableCell>{log.target_name}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-500">
                      {log.detail || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}

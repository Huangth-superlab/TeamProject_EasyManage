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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ChevronDown, Search, X } from 'lucide-react';

interface User {
  id: number;
  username: string;
  personnel_id: number | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  personnel_name?: string | null;
}

interface Personnel {
  id: number;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [personnelDialogOpen, setPersonnelDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 用于Select的"全部"选项值和"不关联"选项值
  const ALL_OPTION = '__all__';
  const NONE_OPTION = '__none__';

  const [searchUsername, setSearchUsername] = useState('');
  const [searchRole, setSearchRole] = useState(ALL_OPTION);

  // 新增用户表单数据
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    personnel_id: '',
    role: '普通用户',
  });

  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState({
    userId: 0,
    username: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 修改关联人员表单
  const [personnelForm, setPersonnelForm] = useState({
    userId: 0,
    username: '',
    personnel_id: '',
  });

  useEffect(() => {
    checkAdmin();
    loadUsers();
    loadPersonnel();
  }, []);

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

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchUsername) params.append('username', searchUsername);
      // 将 ALL_OPTION 过滤掉，不添加到查询参数
      if (searchRole && searchRole !== ALL_OPTION) params.append('role', searchRole);

      const response = await fetch(`/api/users?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonnel = async () => {
    try {
      const response = await fetch('/api/personnel');
      const result = await response.json();
      if (result.success) {
        setPersonnel(result.data);
      }
    } catch (error) {
      console.error('Load personnel error:', error);
    }
  };

  const handleSearch = () => {
    loadUsers();
  };

  const handleAdd = () => {
    setFormData({
      username: '',
      password: '',
      personnel_id: '',
      role: '普通用户',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.username || !formData.password) {
      alert('请填写用户名和密码');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          personnel_id: formData.personnel_id ? parseInt(formData.personnel_id) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDialogOpen(false);
        loadUsers();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败');
    } finally {
      setTimeout(() => setSubmitting(false), 1000);
    }
  };

  // 打开修改密码对话框
  const handleOpenPasswordDialog = (user: User) => {
    setPasswordForm({
      userId: user.id,
      username: user.username,
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordDialogOpen(true);
  };

  // 提交修改密码
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.newPassword) {
      alert('请输入新密码');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/users/${passwordForm.userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setPasswordDialogOpen(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败');
    } finally {
      setTimeout(() => setSubmitting(false), 1000);
    }
  };

  // 打开修改关联人员对话框
  const handleOpenPersonnelDialog = (user: User) => {
    setPersonnelForm({
      userId: user.id,
      username: user.username,
      personnel_id: user.personnel_id ? user.personnel_id.toString() : NONE_OPTION,
    });
    setPersonnelDialogOpen(true);
  };

  // 提交修改关联人员
  const handleSubmitPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/users/${personnelForm.userId}/personnel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personnel_id: personnelForm.personnel_id && personnelForm.personnel_id !== NONE_OPTION 
            ? parseInt(personnelForm.personnel_id) 
            : null 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPersonnelDialogOpen(false);
        loadUsers();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败');
    } finally {
      setTimeout(() => setSubmitting(false), 1000);
    }
  };

  // 删除用户
  const handleDeleteUser = async (user: User) => {
    // 不能删除admin用户
    if (user.username === 'admin') {
      alert('不能删除admin用户');
      return;
    }

    if (!confirm(`确定要删除用户 "${user.username}" 吗？\n\n注意：删除后不可恢复。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || '用户删除成功');
        loadUsers();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  if (loading) return <div className="p-8">加载中...</div>;

  // 单选人员选择器组件
  const PersonnelSelector = ({ 
    selectedId, 
    onSelect,
  }: { 
    selectedId: string;
    onSelect: (personId: string) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    
    const filtered = personnel.filter(p => 
      p.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    const selectedPerson = selectedId && selectedId !== NONE_OPTION 
      ? personnel.find(p => p.id.toString() === selectedId) 
      : null;
    
    return (
      <div className="space-y-2">
        <Label>关联人员</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="min-h-[38px] p-2 border rounded-md cursor-pointer hover:border-gray-400 flex items-center justify-between">
              {selectedPerson ? (
                <span>{selectedPerson.name}</span>
              ) : (
                <span className="text-gray-400 text-sm">点击选择关联人员（可选）</span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索人员..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              {/* 不关联选项 */}
              <div 
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => {
                  onSelect(NONE_OPTION);
                  setOpen(false);
                }}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${!selectedPerson ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {!selectedPerson && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-500">不关联</span>
              </div>
              {/* 人员列表 */}
              {filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-4">无匹配人员</div>
              ) : (
                filtered.map((person) => (
                  <div 
                    key={person.id} 
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => {
                      onSelect(person.id.toString());
                      setOpen(false);
                    }}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedPerson?.id === person.id ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {selectedPerson?.id === person.id && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{person.name}</span>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← 返回
                </Button>
              </Link>
              <h1 className="text-xl font-bold">用户管理</h1>
            </div>
            <Button onClick={handleAdd}>新增用户</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索筛选 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-4">
            <Input
              placeholder="搜索用户名"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
            <Select value={searchRole} onValueChange={setSearchRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="用户角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>全部</SelectItem>
                <SelectItem value="普通用户">普通用户</SelectItem>
                <SelectItem value="系统管理员">系统管理员</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>关联人员</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.personnel_name || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${user.role === '系统管理员' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                        {user.is_active ? '正常' : '禁用'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenPersonnelDialog(user)}
                        >
                          关联人员
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenPasswordDialog(user)}
                        >
                          修改密码
                        </Button>
                        {user.username !== 'admin' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* 新增用户对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
            <DialogDescription>
              请填写用户信息，带 * 号为必填项
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                用户名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                密码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personnel_id">关联人员</Label>
              <Select value={formData.personnel_id} onValueChange={(value) => setFormData({ ...formData, personnel_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择关联人员（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                角色 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="普通用户">普通用户</SelectItem>
                  <SelectItem value="系统管理员">系统管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              正在修改用户 <strong>{passwordForm.username}</strong> 的密码
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                新密码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="请输入新密码（至少6位）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                确认密码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
              />
            </div>

            <p className="text-sm text-orange-600">
              ⚠️ 修改密码后，该用户需要重新登录
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '确认修改'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 修改关联人员对话框 */}
      <Dialog open={personnelDialogOpen} onOpenChange={setPersonnelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改关联人员</DialogTitle>
            <DialogDescription>
              正在修改用户 <strong>{personnelForm.username}</strong> 的关联人员
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPersonnel} className="space-y-4">
            <PersonnelSelector
              selectedId={personnelForm.personnel_id}
              onSelect={(value) => setPersonnelForm({ ...personnelForm, personnel_id: value })}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPersonnelDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '确认修改'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

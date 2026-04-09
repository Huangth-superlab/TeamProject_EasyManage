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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Personnel {
  id: number;
  name: string;
  personnel_type: string;
  project_id: number | null;
  unit_name: string | null;
  position: string | null;
  phone: string | null;
  project_name?: string | null;
}

interface Project {
  id: number;
  name: string;
}

export default function PersonnelPage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 用于Select的"全部"选项值
  const ALL_OPTION = '__all__';

  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState(ALL_OPTION);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    personnel_type: '',
    project_id: '',
    unit_name: '',
    position: '',
    phone: '',
  });

  const PERSONNEL_TYPES = ['部门成员', '公司销售', '外部厂商', '业主单位', '合作伙伴', '其他'];

  useEffect(() => {
    loadPersonnel();
    loadProjects();
  }, []);

  const loadPersonnel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      // 将 ALL_OPTION 过滤掉，不添加到查询参数
      if (searchType && searchType !== ALL_OPTION) params.append('personnelType', searchType);

      const response = await fetch(`/api/personnel?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setPersonnel(result.data);
      }
    } catch (error) {
      console.error('Load personnel error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Load projects error:', error);
    }
  };

  const handleSearch = () => {
    loadPersonnel();
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      personnel_type: '',
      project_id: '',
      unit_name: '',
      position: '',
      phone: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (person: Personnel) => {
    setEditingId(person.id);
    setFormData({
      name: person.name,
      personnel_type: person.personnel_type,
      project_id: person.project_id?.toString() || '',
      unit_name: person.unit_name || '',
      position: person.position || '',
      phone: person.phone || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该人员吗？')) return;

    try {
      const response = await fetch(`/api/personnel/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        loadPersonnel();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.name || !formData.personnel_type) {
      alert('请填写姓名和人员类型');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/personnel/${editingId}` : '/api/personnel';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          project_id: formData.project_id ? parseInt(formData.project_id) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDialogOpen(false);
        loadPersonnel();
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

  const handleTypeChange = (value: string) => {
    setFormData({
      ...formData,
      personnel_type: value,
      project_id: '',
      unit_name: '',
    });
  };

  const isExternal = formData.personnel_type === '部门成员' || formData.personnel_type === '公司销售';

  if (loading) return <div className="p-8">加载中...</div>;

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
              <h1 className="text-xl font-bold">人员管理</h1>
            </div>
            <Button onClick={handleAdd}>新增人员</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索筛选 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索姓名"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="人员类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>全部</SelectItem>
                {PERSONNEL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </div>

        {/* 人员列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>人员类型</TableHead>
                <TableHead>所属项目</TableHead>
                <TableHead>单位名称</TableHead>
                <TableHead>职务</TableHead>
                <TableHead>电话号码</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.personnel_type}</TableCell>
                    <TableCell>{person.project_name || '-'}</TableCell>
                    <TableCell>{person.unit_name || '-'}</TableCell>
                    <TableCell>{person.position || '-'}</TableCell>
                    <TableCell>{person.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(person)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(person.id)}>
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑人员' : '新增人员'}</DialogTitle>
            <DialogDescription>
              请填写人员信息，带 * 号为必填项
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personnel_type">
                人员类型 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.personnel_type} onValueChange={handleTypeChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="请选择人员类型" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONNEL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isExternal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project_id">所属项目</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择所属项目" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_name">单位名称</Label>
                  <Input
                    id="unit_name"
                    value={formData.unit_name}
                    onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="position">职务</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">电话号码</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入有效的手机号或固话"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : (editingId ? '保存' : '新增')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

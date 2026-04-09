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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Project {
  id: number;
  name: string;
  content: string;
  source: string;
  responsible_person_id: number;
  owner_unit_name: string | null;
  owner_unit_type: string | null;
  stage: string;
  created_at: string;
  updated_at: string;
  responsible_person_name?: string;
}

interface Personnel {
  id: number;
  name: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 用于Select的"全部"选项值
  const ALL_OPTION = '__all__';

  // 搜索条件
  const [filters, setFilters] = useState({
    name: '',
    ownerUnitName: '',
    source: ALL_OPTION,
    ownerUnitType: ALL_OPTION,
    stage: ALL_OPTION,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    source: '',
    responsible_person_id: '',
    owner_unit_name: '',
    owner_unit_type: '',
    stage: '',
  });

  const PROJECT_SOURCES = ['销售导入', '部门对接', '其他'];
  const OWNER_UNIT_TYPES = ['党政机关', '事业单位', '央国企', '私营企业', '其他'];
  const PROJECT_STAGES = ['商机', '启动阶段', '立项阶段', '实施阶段', '验收阶段', '已结束'];

  useEffect(() => {
    loadProjects();
    loadPersonnel();
  }, []);

  const loadProjects = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // 将 ALL_OPTION 转换为空字符串
        if (value && value !== ALL_OPTION) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/projects?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Load projects error:', error);
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
    loadProjects();
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      content: '',
      source: '',
      responsible_person_id: '',
      owner_unit_name: '',
      owner_unit_type: '',
      stage: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      content: project.content,
      source: project.source,
      responsible_person_id: project.responsible_person_id.toString(),
      owner_unit_name: project.owner_unit_name || '',
      owner_unit_type: project.owner_unit_type || '',
      stage: project.stage,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该项目吗？\n注意：如果该项目下有进展或待办事项，将无法删除。')) return;

    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        loadProjects();
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
    if (!formData.name || !formData.content || !formData.source || !formData.stage) {
      alert('请填写项目名称、项目内容、项目来源和项目阶段');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          responsible_person_id: formData.responsible_person_id ? parseInt(formData.responsible_person_id) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDialogOpen(false);
        loadProjects();
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
              <h1 className="text-xl font-bold">项目管理</h1>
            </div>
            <Button onClick={handleAdd}>新增项目</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索筛选 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[70px]">项目名称：</span>
              <Input
                placeholder="请输入"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[90px]">业主单位名称：</span>
              <Input
                placeholder="请输入"
                value={filters.ownerUnitName}
                onChange={(e) => setFilters({ ...filters, ownerUnitName: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[70px]">项目来源：</span>
              <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>全部</SelectItem>
                  {PROJECT_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[85px]">业主单位属性：</span>
              <Select value={filters.ownerUnitType} onValueChange={(value) => setFilters({ ...filters, ownerUnitType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>全部</SelectItem>
                  {OWNER_UNIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[70px]">当前阶段：</span>
              <Select value={filters.stage} onValueChange={(value) => setFilters({ ...filters, stage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>全部</SelectItem>
                  {PROJECT_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[70px]">排序方式：</span>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">创建时间</SelectItem>
                  <SelectItem value="updated_at">更新时间</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap min-w-[70px]">排序顺序：</span>
              <Select value={filters.sortOrder} onValueChange={(value) => setFilters({ ...filters, sortOrder: value })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序（最新优先）</SelectItem>
                  <SelectItem value="asc">升序（最早优先）</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>搜索</Button>
            </div>
          </div>
        </div>

        {/* 项目列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>项目来源</TableHead>
                <TableHead>责任人</TableHead>
                <TableHead>业主单位</TableHead>
                <TableHead>业主单位属性</TableHead>
                <TableHead>项目阶段</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>{project.source}</TableCell>
                    <TableCell>{project.responsible_person_name || '-'}</TableCell>
                    <TableCell>{project.owner_unit_name || '-'}</TableCell>
                    <TableCell>{project.owner_unit_type || '-'}</TableCell>
                    <TableCell>{project.stage}</TableCell>
                    <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(project.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
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
            <DialogTitle>{editingId ? '编辑项目' : '新增项目'}</DialogTitle>
            <DialogDescription>
              请填写项目信息，带 * 号为必填项
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                项目名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                项目内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">
                  项目来源 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">
                  项目阶段 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_person_id">
                责任人 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.responsible_person_id} onValueChange={(value) => setFormData({ ...formData, responsible_person_id: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="请选择责任人" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_unit_name">业主单位名称</Label>
                <Input
                  id="owner_unit_name"
                  value={formData.owner_unit_name}
                  onChange={(e) => setFormData({ ...formData, owner_unit_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_unit_type">业主单位属性</Label>
                <Select value={formData.owner_unit_type} onValueChange={(value) => setFormData({ ...formData, owner_unit_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNER_UNIT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

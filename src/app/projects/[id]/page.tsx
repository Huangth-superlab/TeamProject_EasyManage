'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown, Search } from 'lucide-react';

interface ProjectDetail {
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
  progress: ProgressWithPersons[];
  todos: TodoWithPersons[];
}

interface ProgressWithPersons {
  id: number;
  project_id: number;
  event_date: string;
  content: string;
  responsible_person_ids: number[];
  created_at: string;
  updated_at: string;
  responsible_persons?: { id: number; name: string }[];
}

interface TodoWithPersons {
  id: number;
  project_id: number;
  event_date: string;
  deadline: string;
  content: string;
  responsible_person_ids: number[];
  status: string;
  created_at: string;
  updated_at: string;
  responsible_persons?: { id: number; name: string }[];
}

interface Personnel {
  id: number;
  name: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [editingProgress, setEditingProgress] = useState<ProgressWithPersons | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoWithPersons | null>(null);
  
  // 防抖状态
  const [submitting, setSubmitting] = useState(false);

  // 进展表单
  const [progressForm, setProgressForm] = useState({
    event_date: new Date().toISOString().split('T')[0],
    content: '',
    responsible_person_ids: [] as number[],
  });

  // 待办表单
  const [todoForm, setTodoForm] = useState({
    event_date: new Date().toISOString().split('T')[0],
    deadline: '',
    content: '',
    responsible_person_ids: [] as number[],
    status: '未完成',
  });

  useEffect(() => {
    loadProject();
    loadPersonnel();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const result = await response.json();
      if (result.success) {
        setProject(result.data);
      } else {
        alert(result.error);
        router.push('/projects');
      }
    } catch (error) {
      console.error('Load project error:', error);
      alert('加载失败');
      router.push('/projects');
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

  const handleAddProgress = () => {
    setEditingProgress(null);
    setProgressForm({
      event_date: new Date().toISOString().split('T')[0],
      content: '',
      responsible_person_ids: [],
    });
    setProgressDialogOpen(true);
  };

  const handleEditProgress = (progress: ProgressWithPersons) => {
    setEditingProgress(progress);
    setProgressForm({
      event_date: progress.event_date,
      content: progress.content,
      responsible_person_ids: progress.responsible_person_ids,
    });
    setProgressDialogOpen(true);
  };

  const handleDeleteProgress = async (progressId: number) => {
    if (!confirm('确定要删除该进展吗？')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/progress/${progressId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        loadProject();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();

    // 手动验证
    if (!progressForm.event_date || !progressForm.content) {
      alert('请填写事件时间和进展内容');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const url = editingProgress 
        ? `/api/projects/${projectId}/progress/${editingProgress.id}`
        : `/api/projects/${projectId}/progress`;
      const method = editingProgress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressForm),
      });

      const result = await response.json();

      if (result.success) {
        setProgressDialogOpen(false);
        loadProject();
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

  const handleAddTodo = () => {
    setEditingTodo(null);
    setTodoForm({
      event_date: new Date().toISOString().split('T')[0],
      deadline: '',
      content: '',
      responsible_person_ids: [],
      status: '未完成',
    });
    setTodoDialogOpen(true);
  };

  const handleEditTodo = (todo: TodoWithPersons) => {
    setEditingTodo(todo);
    setTodoForm({
      event_date: todo.event_date,
      deadline: todo.deadline,
      content: todo.content,
      responsible_person_ids: todo.responsible_person_ids,
      status: todo.status,
    });
    setTodoDialogOpen(true);
  };

  const handleDeleteTodo = async (todoId: number) => {
    if (!confirm('确定要删除该待办吗？')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/todos/${todoId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        loadProject();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  const handleSubmitTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    // 手动验证
    if (!todoForm.event_date || !todoForm.deadline || !todoForm.content) {
      alert('请填写事件时间、截止时间和待办事项');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const url = editingTodo 
        ? `/api/projects/${projectId}/todos/${editingTodo.id}`
        : `/api/projects/${projectId}/todos`;
      const method = editingTodo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoForm),
      });

      const result = await response.json();

      if (result.success) {
        setTodoDialogOpen(false);
        loadProject();
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

  const toggleTodoStatus = async (todo: TodoWithPersons) => {
    const newStatus = todo.status === '未完成' ? '已完成' : '未完成';

    try {
      const response = await fetch(`/api/projects/${projectId}/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_date: todo.event_date,
          deadline: todo.deadline,
          content: todo.content,
          responsible_person_ids: todo.responsible_person_ids,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        loadProject();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      alert('操作失败');
    }
  };

  // 检查是否逾期
  const isOverdue = (deadline: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  // 合并并排序进展和待办
  const timeline = project 
    ? [...project.progress.map(p => ({ ...p, type: 'progress' as const })),
        ...project.todos.map(t => ({ ...t, type: 'todo' as const }))]
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    : [];

  if (loading) return <div className="p-8">加载中...</div>;

  if (!project) return <div className="p-8">项目不存在</div>;

  // 人员选择器组件
  const PersonSelector = ({ 
    selectedIds, 
    onToggle,
  }: { 
    selectedIds: number[]; 
    onToggle: (personId: number) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    
    const filtered = personnel.filter(p => 
      p.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    return (
      <div className="space-y-2">
        <Label>责任人（多选）</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="min-h-[38px] p-2 border rounded-md cursor-pointer hover:border-gray-400 flex items-center flex-wrap gap-1">
              {selectedIds.length === 0 ? (
                <span className="text-gray-400 text-sm">点击选择责任人</span>
              ) : (
                selectedIds.map(id => {
                  const person = personnel.find(p => p.id === id);
                  return person ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {person.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(id);
                        }}
                      />
                    </Badge>
                  ) : null;
                })
              )}
              <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
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
              {filtered.length === 0 ? (
                <div className="text-center text-gray-500 py-4">无匹配人员</div>
              ) : (
                filtered.map((person) => (
                  <div 
                    key={person.id} 
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => onToggle(person.id)}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedIds.includes(person.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {selectedIds.includes(person.id) && (
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
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  ← 返回
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.stage} · {project.source}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 项目信息 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">项目信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">项目内容：</span>
              <p className="mt-1">{project.content}</p>
            </div>
            <div>
              <span className="text-gray-600">责任人：</span>
              <p className="mt-1">{project.responsible_person_name || '-'}</p>
            </div>
            {project.owner_unit_name && (
              <div>
                <span className="text-gray-600">业主单位：</span>
                <p className="mt-1">{project.owner_unit_name} {project.owner_unit_type ? `(${project.owner_unit_type})` : ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mb-6">
          <Button onClick={handleAddProgress}>添加进展</Button>
          <Button onClick={handleAddTodo} variant="destructive">添加待办</Button>
        </div>

        {/* 时间轴 */}
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
              暂无进展和待办事项
            </div>
          ) : (
            timeline.map((item, index) => (
              item.type === 'progress' ? (
                <div key={`progress-${item.id}`} className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold">{item.event_date}</span>
                        <span className="text-sm text-gray-600">
                          责任人：{item.responsible_persons?.map(p => p.name).join('、') || '-'}
                        </span>
                      </div>
                      <p className="text-gray-900">{item.content}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProgress(item)}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProgress(item.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={`todo-${item.id}`} className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${item.status === '已完成' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <Badge 
                          variant={item.status === '已完成' ? 'default' : 'destructive'}
                          className="cursor-pointer"
                          onClick={() => toggleTodoStatus(item)}
                        >
                          {item.status}
                        </Badge>
                        <span className="font-semibold">{item.event_date}</span>
                        {item.deadline && (
                          <>
                            <span className="text-sm text-gray-600">
                              截止：{item.deadline}
                            </span>
                            {item.status !== '已完成' && isOverdue(item.deadline) && (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                逾期
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-gray-900">
                        {item.content}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        责任人：{item.responsible_persons?.map(p => p.name).join('、') || '-'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditTodo(item)}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTodo(item.id)}>
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              )
            ))
          )}
        </div>
      </main>

      {/* 进展对话框 */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingProgress ? '编辑进展' : '添加进展'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitProgress} className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="progress-event-date">事件时间 <span className="text-red-500">*</span></Label>
              <Input
                id="progress-event-date"
                type="date"
                value={progressForm.event_date}
                onChange={(e) => setProgressForm({ ...progressForm, event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress-content">进展内容 <span className="text-red-500">*</span></Label>
              <Textarea
                id="progress-content"
                value={progressForm.content}
                onChange={(e) => setProgressForm({ ...progressForm, content: e.target.value })}
                className="max-h-48"
              />
            </div>
            <PersonSelector
              selectedIds={progressForm.responsible_person_ids}
              onToggle={(id) => {
                const currentIds = progressForm.responsible_person_ids;
                if (currentIds.includes(id)) {
                  setProgressForm({
                    ...progressForm,
                    responsible_person_ids: currentIds.filter(i => i !== id),
                  });
                } else {
                  setProgressForm({
                    ...progressForm,
                    responsible_person_ids: [...currentIds, id],
                  });
                }
              }}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProgressDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 待办对话框 */}
      <Dialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTodo ? '编辑待办' : '添加待办'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTodo} className="space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="todo-event-date">事件时间 <span className="text-red-500">*</span></Label>
                <Input
                  id="todo-event-date"
                  type="date"
                  value={todoForm.event_date}
                  onChange={(e) => setTodoForm({ ...todoForm, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-deadline">截止时间 <span className="text-red-500">*</span></Label>
                <Input
                  id="todo-deadline"
                  type="date"
                  value={todoForm.deadline}
                  onChange={(e) => setTodoForm({ ...todoForm, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="todo-content">待办事项 <span className="text-red-500">*</span></Label>
              <Textarea
                id="todo-content"
                value={todoForm.content}
                onChange={(e) => setTodoForm({ ...todoForm, content: e.target.value })}
                className="max-h-48"
              />
            </div>
            <PersonSelector
              selectedIds={todoForm.responsible_person_ids}
              onToggle={(id) => {
                const currentIds = todoForm.responsible_person_ids;
                if (currentIds.includes(id)) {
                  setTodoForm({
                    ...todoForm,
                    responsible_person_ids: currentIds.filter(i => i !== id),
                  });
                } else {
                  setTodoForm({
                    ...todoForm,
                    responsible_person_ids: [...currentIds, id],
                  });
                }
              }}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTodoDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 枚举类型定义
export const PERSONNEL_TYPES = ['部门成员', '公司销售', '外部厂商', '业主单位', '合作伙伴', '其他'] as const;
export type PersonnelType = typeof PERSONNEL_TYPES[number];

export const PROJECT_SOURCES = ['销售导入', '部门对接', '其他'] as const;
export type ProjectSource = typeof PROJECT_SOURCES[number];

export const OWNER_UNIT_TYPES = ['党政机关', '事业单位', '央国企', '私营企业', '其他'] as const;
export type OwnerUnitType = typeof OWNER_UNIT_TYPES[number];

export const PROJECT_STAGES = ['商机', '启动阶段', '立项阶段', '实施阶段', '验收阶段', '已结束'] as const;
export type ProjectStage = typeof PROJECT_STAGES[number];

export const TODO_STATUS = ['未完成', '已完成'] as const;
export type TodoStatus = typeof TODO_STATUS[number];

export const USER_ROLES = ['普通用户', '系统管理员'] as const;
export type UserRole = typeof USER_ROLES[number];

export const OPERATION_MODULES = ['人员管理', '项目管理', '项目进展', '待办事项', '用户管理'] as const;
export type OperationModule = typeof OPERATION_MODULES[number];

export const OPERATION_TYPES = ['新增', '修改', '删除'] as const;
export type OperationType = typeof OPERATION_TYPES[number];

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 带关联信息的人员
export interface PersonnelWithProject {
  id: number;
  name: string;
  personnel_type: string;
  project_id: number | null;
  unit_name: string | null;
  position: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string | null;
}

// 带关联信息的项目
export interface ProjectWithDetails {
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

// 项目进展带责任人信息
export interface ProgressWithPersons {
  id: number;
  project_id: number;
  event_date: string;
  content: string;
  responsible_person_ids: number[];
  created_at: string;
  updated_at: string;
  responsible_persons?: { id: number; name: string }[];
}

// 待办事项带责任人信息
export interface TodoWithPersons {
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

// 项目详情页数据
export interface ProjectDetailData extends ProjectWithDetails {
  progress: ProgressWithPersons[];
  todos: TodoWithPersons[];
}
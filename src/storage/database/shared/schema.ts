import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  serial,
  date,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ============ 系统表（保留不动）============
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ============ 人员管理表 ============
export const personnel = pgTable(
  "personnel",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    personnelType: varchar("personnel_type", { length: 20 }).notNull(), // 部门成员, 公司销售, 外部厂商, 业主单位, 合作伙伴, 其他
    projectId: integer("project_id"), // 所属项目ID（可为空）
    unitName: varchar("unit_name", { length: 100 }), // 单位名称
    position: varchar("position", { length: 100 }), // 职务
    phone: varchar("phone", { length: 20 }), // 电话号码
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("personnel_name_idx").on(table.name),
    index("personnel_type_idx").on(table.personnelType),
    index("personnel_project_id_idx").on(table.projectId),
  ]
);

// ============ 项目主信息表 ============
export const projects = pgTable(
  "projects",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    content: text("content").notNull(),
    source: varchar("source", { length: 20 }).notNull(), // 销售导入, 部门对接, 其他
    responsiblePersonId: integer("responsible_person_id").notNull(), // 责任人ID
    ownerUnitName: varchar("owner_unit_name", { length: 100 }), // 业主单位名称
    ownerUnitType: varchar("owner_unit_type", { length: 20 }), // 党政机关, 事业单位, 央国企, 私营企业, 其他
    stage: varchar("stage", { length: 20 }).notNull(), // 商机, 启动阶段, 立项阶段, 实施阶段, 验收阶段, 已结束
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("projects_name_idx").on(table.name),
    index("projects_source_idx").on(table.source),
    index("projects_stage_idx").on(table.stage),
    index("projects_owner_unit_type_idx").on(table.ownerUnitType),
    index("projects_responsible_person_id_idx").on(table.responsiblePersonId),
    index("projects_created_at_idx").on(table.createdAt),
    index("projects_updated_at_idx").on(table.updatedAt),
  ]
);

// ============ 项目进展表 ============
export const projectProgress = pgTable(
  "project_progress",
  {
    id: serial().primaryKey(),
    projectId: integer("project_id").notNull(),
    eventDate: date("event_date").notNull(), // 事件时间
    content: text("content").notNull(), // 项目进展内容
    responsiblePersonIds: jsonb("responsible_person_ids").notNull().$type<number[]>(), // 责任人ID列表（多选）
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("project_progress_project_id_idx").on(table.projectId),
    index("project_progress_event_date_idx").on(table.eventDate),
  ]
);

// ============ 待办事项表 ============
export const todoItems = pgTable(
  "todo_items",
  {
    id: serial().primaryKey(),
    projectId: integer("project_id").notNull(),
    eventDate: date("event_date").notNull(), // 事件时间
    deadline: date("deadline").notNull(), // 截止时间
    content: text("content").notNull(), // 待办事项内容
    responsiblePersonIds: jsonb("responsible_person_ids").notNull().$type<number[]>(), // 责任人ID列表（多选）
    status: varchar("status", { length: 10 }).notNull().default("未完成"), // 已完成, 未完成
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("todo_items_project_id_idx").on(table.projectId),
    index("todo_items_event_date_idx").on(table.eventDate),
    index("todo_items_status_idx").on(table.status),
  ]
);

// ============ 用户表 ============
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(), // 存储加密后的密码
    personnelId: integer("personnel_id"), // 关联人员ID
    role: varchar("role", { length: 20 }).notNull().default("普通用户"), // 普通用户, 系统管理员
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_personnel_id_idx").on(table.personnelId),
  ]
);

// ============ 操作日志表 ============
export const operationLogs = pgTable(
  "operation_logs",
  {
    id: serial().primaryKey(),
    userId: integer("user_id").notNull(),
    userName: varchar("user_name", { length: 50 }).notNull(),
    operationTime: timestamp("operation_time", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    module: varchar("module", { length: 50 }).notNull(), // 人员管理, 项目管理, 项目进展, 待办事项, 用户管理
    operationType: varchar("operation_type", { length: 10 }).notNull(), // 新增, 修改, 删除
    targetName: varchar("target_name", { length: 100 }).notNull(), // 操作对象名称
    detail: text("detail"), // 操作详情（JSON格式存储变化前后数据）
  },
  (table) => [
    index("operation_logs_user_id_idx").on(table.userId),
    index("operation_logs_module_idx").on(table.module),
    index("operation_logs_operation_time_idx").on(table.operationTime),
  ]
);

// ============ Zod Schemas ============
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// 人员
export const insertPersonnelSchema = createCoercedInsertSchema(personnel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updatePersonnelSchema = insertPersonnelSchema.partial();

// 项目
export const insertProjectSchema = createCoercedInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProjectSchema = insertProjectSchema.partial();

// 项目进展
export const insertProjectProgressSchema = createCoercedInsertSchema(projectProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProjectProgressSchema = insertProjectProgressSchema.partial();

// 待办事项
export const insertTodoItemSchema = createCoercedInsertSchema(todoItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateTodoItemSchema = insertTodoItemSchema.partial();

// 用户
export const insertUserSchema = createCoercedInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateUserSchema = insertUserSchema.partial();

// 操作日志
export const insertOperationLogSchema = createCoercedInsertSchema(operationLogs).omit({
  id: true,
});

// ============ TypeScript Types ============
export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;
export type UpdatePersonnel = z.infer<typeof updatePersonnelSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type ProjectProgress = typeof projectProgress.$inferSelect;
export type InsertProjectProgress = z.infer<typeof insertProjectProgressSchema>;
export type UpdateProjectProgress = z.infer<typeof updateProjectProgressSchema>;

export type TodoItem = typeof todoItems.$inferSelect;
export type InsertTodoItem = z.infer<typeof insertTodoItemSchema>;
export type UpdateTodoItem = z.infer<typeof updateTodoItemSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = z.infer<typeof insertOperationLogSchema>;
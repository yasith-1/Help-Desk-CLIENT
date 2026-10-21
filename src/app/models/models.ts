// Backend DTOs වලට match වෙන TypeScript interfaces + constants

export const STATUSES = ['Open', 'InProgress', 'OnHold', 'Resolved', 'Closed', 'Reopened'] as const;
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

export type TicketStatus = typeof STATUSES[number];
export type TicketPriority = typeof PRIORITIES[number];
export type Role = string;   // custom roles support — role name එකක් (string)

// ---- Roles & permissions (RBAC) ----
export interface RoleDef {
  id: number; name: string; description: string; isSystem: boolean;
  permissions: string[]; userCount: number;
}
export interface PermissionItem { key: string; label: string; group: string; }
export interface CreateRoleRequest { name: string; description: string; permissions: string[]; }

// ---- Auth ----
export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest { fullName: string; email: string; username: string; password: string; }
export interface AuthResponse {
  token: string; userId: number; fullName: string; username: string; role: Role;
  permissions: string[]; expiresAt: string;
}

// ---- Tickets ----
export interface TicketListItem {
  id: number; ticketNumber: string; title: string;
  status: TicketStatus; priority: TicketPriority;
  categoryName: string; createdByName: string; assignedToName: string | null;
  createdAt: string; dueAt: string; isOverdue: boolean;
}
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; }

export interface Comment {
  id: number; authorId: number; authorName: string; authorRole: string;
  body: string; isInternal: boolean; createdAt: string;
}
export interface History { actorName: string; action: string; createdAt: string; }

export interface TicketDetail {
  id: number; ticketNumber: string; title: string; description: string;
  status: TicketStatus; priority: TicketPriority;
  categoryId: number; categoryName: string;
  createdById: number; createdByName: string;
  assignedToId: number | null; assignedToName: string | null;
  createdAt: string; updatedAt: string; dueAt: string;
  resolvedAt: string | null; closedAt: string | null; isOverdue: boolean;
  comments: Comment[]; history: History[];
}

export interface CreateTicketRequest {
  title: string; description: string; categoryId: number; priority?: TicketPriority;
}
export interface UpdateTicketRequest {
  title: string; description: string; categoryId: number; priority: TicketPriority;
}

// ---- Categories ----
export interface Category {
  id: number; name: string; description: string; defaultPriority: TicketPriority;
  slaHours: number; ticketCount: number;
}
export interface CategoryRequest {
  name: string; description: string; defaultPriority: TicketPriority; slaHours: number;
}

// ---- Users ----
export interface User {
  id: number; fullName: string; email: string; username: string; role: Role;
  isActive: boolean; createdAt: string;
}
export interface AgentOption { id: number; fullName: string; role: Role; }
export interface CreateUserRequest {
  fullName: string; email: string; username: string; password: string; role: Role;
}

// ---- Dashboard ----
export interface CountByLabel { label: string; count: number; }
export interface DashboardStats {
  total: number; open: number; inProgress: number; resolved: number;
  overdue: number; unassigned: number; resolvedToday: number; myOpen: number;
  avgResolutionHours: number;
  trend: CountByLabel[];
  byStatus: CountByLabel[]; byPriority: CountByLabel[]; byCategory: CountByLabel[];
  recent: TicketListItem[];
}

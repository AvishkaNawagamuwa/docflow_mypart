import { AppRole } from '@/contexts/AuthContext';

// ═══════════════════════════════════════════
// Dashboard Builder Data Models
// ═══════════════════════════════════════════

export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetCategory = 'task' | 'document' | 'sla' | 'analytics' | 'notification' | 'custom';
export type DataScope = 'current_user' | 'role' | 'department' | 'company';
export type DashboardStatus = 'active' | 'draft' | 'disabled';

export interface WidgetDefinition {
  type: string;
  label: string;
  category: WidgetCategory;
  icon: string; // lucide icon name
  description: string;
  defaultSize: WidgetSize;
  allowedScopes: DataScope[];
}

export interface WidgetConfig {
  id: string;
  widgetType: string;
  title: string;
  posX: number;
  posY: number;
  width: number; // grid cols (1-12)
  height: number; // grid rows
  dataScope: DataScope;
  filters: {
    dateRange?: 'today' | 'week' | 'month' | 'all';
    status?: string[];
    workflowType?: string[];
  };
  refreshInterval: number; // seconds, 0 = manual
  visibilityConditions: {
    roles?: AppRole[];
    featureFlag?: string;
  };
  enabled: boolean;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  status: DashboardStatus;
  assignedRoles: AppRole[];
  isDefault: boolean;
  widgets: WidgetConfig[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface RoleDashboardMapping {
  role: AppRole;
  dashboardId: string;
  isDefault: boolean;
}

// ═══════════════════════════════════════════
// Widget Library
// ═══════════════════════════════════════════

export const WIDGET_LIBRARY: WidgetDefinition[] = [
  // Task Widgets
  { type: 'my_pending_tasks', label: 'My Pending Tasks', category: 'task', icon: 'ClipboardList', description: 'Tasks awaiting action from the current user', defaultSize: 'medium', allowedScopes: ['current_user'] },
  { type: 'approvals_waiting', label: 'Approvals Waiting', category: 'task', icon: 'CheckSquare', description: 'Approvals assigned to the user', defaultSize: 'medium', allowedScopes: ['current_user', 'role'] },
  { type: 'overdue_tasks', label: 'Overdue Tasks', category: 'task', icon: 'AlertTriangle', description: 'Tasks past their SLA deadline', defaultSize: 'small', allowedScopes: ['current_user', 'role', 'department', 'company'] },
  { type: 'revision_required', label: 'Revision Required', category: 'task', icon: 'RotateCcw', description: 'Documents sent back for revision', defaultSize: 'small', allowedScopes: ['current_user', 'role'] },
  { type: 'completed_today', label: 'Completed Today', category: 'task', icon: 'CheckCircle', description: 'Tasks completed today', defaultSize: 'small', allowedScopes: ['current_user', 'role', 'department', 'company'] },

  // Document Widgets
  { type: 'my_documents', label: 'My Documents', category: 'document', icon: 'FileText', description: 'Documents owned by the current user', defaultSize: 'medium', allowedScopes: ['current_user'] },
  { type: 'documents_by_status', label: 'Documents by Status', category: 'document', icon: 'PieChart', description: 'Chart showing document status distribution', defaultSize: 'medium', allowedScopes: ['current_user', 'role', 'department', 'company'] },
  { type: 'recently_uploaded', label: 'Recently Uploaded', category: 'document', icon: 'Upload', description: 'Latest uploaded documents', defaultSize: 'medium', allowedScopes: ['current_user', 'department', 'company'] },
  { type: 'unclassified_documents', label: 'Unclassified Documents', category: 'document', icon: 'HelpCircle', description: 'Documents not yet assigned a type', defaultSize: 'small', allowedScopes: ['department', 'company'] },

  // SLA Widgets
  { type: 'sla_breaches', label: 'SLA Breaches', category: 'sla', icon: 'ShieldAlert', description: 'Tasks that have breached SLA', defaultSize: 'small', allowedScopes: ['current_user', 'role', 'department', 'company'] },
  { type: 'due_today', label: 'Due Today', category: 'sla', icon: 'Calendar', description: 'Tasks due today', defaultSize: 'small', allowedScopes: ['current_user', 'role', 'department'] },
  { type: 'due_this_week', label: 'Due This Week', category: 'sla', icon: 'CalendarDays', description: 'Tasks due this week', defaultSize: 'small', allowedScopes: ['current_user', 'role', 'department'] },
  { type: 'avg_completion_time', label: 'Average Completion Time', category: 'sla', icon: 'Timer', description: 'Average time to complete tasks', defaultSize: 'small', allowedScopes: ['role', 'department', 'company'] },

  // Analytics Widgets
  { type: 'workflow_instances_running', label: 'Workflow Instances Running', category: 'analytics', icon: 'Activity', description: 'Count of active workflow instances', defaultSize: 'small', allowedScopes: ['department', 'company'] },
  { type: 'completed_vs_rejected', label: 'Completed vs Rejected', category: 'analytics', icon: 'BarChart3', description: 'Chart comparing completed vs rejected', defaultSize: 'medium', allowedScopes: ['department', 'company'] },
  { type: 'bottleneck_steps', label: 'Bottleneck Steps', category: 'analytics', icon: 'Gauge', description: 'Steps with highest average processing time', defaultSize: 'medium', allowedScopes: ['department', 'company'] },
  { type: 'aging_documents', label: 'Aging Documents', category: 'analytics', icon: 'Clock', description: 'Documents stuck for extended periods', defaultSize: 'medium', allowedScopes: ['department', 'company'] },
  { type: 'user_performance', label: 'User Performance', category: 'analytics', icon: 'Users', description: 'Performance metrics by user', defaultSize: 'large', allowedScopes: ['department', 'company'] },
  { type: 'department_performance', label: 'Department Performance', category: 'analytics', icon: 'Building2', description: 'Performance metrics by department', defaultSize: 'large', allowedScopes: ['company'] },

  // Notification Widget
  { type: 'recent_notifications', label: 'Recent Notifications', category: 'notification', icon: 'Bell', description: 'Latest notifications for the user', defaultSize: 'medium', allowedScopes: ['current_user'] },

  // Custom Widgets
  { type: 'custom_kpi', label: 'Custom KPI Counter', category: 'custom', icon: 'Hash', description: 'Configurable KPI counter with custom label', defaultSize: 'small', allowedScopes: ['current_user', 'role', 'department', 'company'] },
  { type: 'custom_chart', label: 'Custom Chart', category: 'custom', icon: 'LineChart', description: 'Configurable chart with custom data source', defaultSize: 'medium', allowedScopes: ['role', 'department', 'company'] },
];

// ═══════════════════════════════════════════
// Default Dashboard Templates
// ═══════════════════════════════════════════

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

export const mockDashboardTemplates: DashboardTemplate[] = [
  {
    id: 'dt-1',
    name: 'Staff Dashboard',
    description: 'Default dashboard for staff and initiators',
    status: 'active',
    assignedRoles: ['staff'],
    isDefault: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
    createdBy: 'John Smith',
    widgets: [
      { id: 'w-1', widgetType: 'my_pending_tasks', title: 'My Pending Tasks', posX: 0, posY: 0, width: 6, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-2', widgetType: 'due_today', title: 'Due Today', posX: 6, posY: 0, width: 3, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-3', widgetType: 'overdue_tasks', title: 'Overdue', posX: 9, posY: 0, width: 3, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-4', widgetType: 'my_documents', title: 'My Documents', posX: 0, posY: 2, width: 6, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-5', widgetType: 'recent_notifications', title: 'Notifications', posX: 6, posY: 1, width: 6, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-6', widgetType: 'completed_today', title: 'Completed Today', posX: 6, posY: 3, width: 3, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
    ],
  },
  {
    id: 'dt-2',
    name: 'Approver Dashboard',
    description: 'Default dashboard for approvers',
    status: 'active',
    assignedRoles: ['approver'],
    isDefault: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
    createdBy: 'John Smith',
    widgets: [
      { id: 'w-10', widgetType: 'approvals_waiting', title: 'Approvals Waiting', posX: 0, posY: 0, width: 8, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-11', widgetType: 'overdue_tasks', title: 'Overdue Approvals', posX: 8, posY: 0, width: 4, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-12', widgetType: 'revision_required', title: 'Sent Back', posX: 8, posY: 1, width: 4, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-13', widgetType: 'recent_notifications', title: 'Notifications', posX: 0, posY: 2, width: 6, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-14', widgetType: 'completed_today', title: 'Completed Today', posX: 6, posY: 2, width: 3, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-15', widgetType: 'sla_breaches', title: 'SLA Breaches', posX: 9, posY: 2, width: 3, height: 1, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
    ],
  },
  {
    id: 'dt-3',
    name: 'Supervisor Monitoring',
    description: 'Analytics dashboard for supervisors and managers',
    status: 'active',
    assignedRoles: ['supervisor'],
    isDefault: true,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(1),
    createdBy: 'John Smith',
    widgets: [
      { id: 'w-20', widgetType: 'workflow_instances_running', title: 'Running Instances', posX: 0, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-21', widgetType: 'completed_today', title: 'Completed Today', posX: 3, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-22', widgetType: 'sla_breaches', title: 'SLA Breaches', posX: 6, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-23', widgetType: 'avg_completion_time', title: 'Avg Time', posX: 9, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-24', widgetType: 'bottleneck_steps', title: 'Bottleneck Steps', posX: 0, posY: 1, width: 6, height: 2, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-25', widgetType: 'user_performance', title: 'User Performance', posX: 6, posY: 1, width: 6, height: 2, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-26', widgetType: 'aging_documents', title: 'Aging Documents', posX: 0, posY: 3, width: 6, height: 2, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-27', widgetType: 'completed_vs_rejected', title: 'Completed vs Rejected', posX: 6, posY: 3, width: 6, height: 2, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
    ],
  },
  {
    id: 'dt-4',
    name: 'Admin Dashboard',
    description: 'System configuration and overview for admins',
    status: 'active',
    assignedRoles: ['admin'],
    isDefault: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(0),
    createdBy: 'John Smith',
    widgets: [
      { id: 'w-30', widgetType: 'workflow_instances_running', title: 'Active Instances', posX: 0, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-31', widgetType: 'overdue_tasks', title: 'Overdue Tasks', posX: 3, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-32', widgetType: 'sla_breaches', title: 'SLA Breaches', posX: 6, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-33', widgetType: 'completed_today', title: 'Completed', posX: 9, posY: 0, width: 3, height: 1, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-34', widgetType: 'bottleneck_steps', title: 'Bottleneck Analysis', posX: 0, posY: 1, width: 6, height: 2, dataScope: 'company', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-35', widgetType: 'recent_notifications', title: 'System Notifications', posX: 6, posY: 1, width: 6, height: 2, dataScope: 'company', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
    ],
  },
  {
    id: 'dt-5',
    name: 'External Portal',
    description: 'Dashboard for external parties / suppliers',
    status: 'active',
    assignedRoles: ['external'],
    isDefault: true,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(3),
    createdBy: 'John Smith',
    widgets: [
      { id: 'w-40', widgetType: 'my_documents', title: 'My Submissions', posX: 0, posY: 0, width: 12, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 60, visibilityConditions: {}, enabled: true },
      { id: 'w-41', widgetType: 'recent_notifications', title: 'Updates', posX: 0, posY: 2, width: 6, height: 2, dataScope: 'current_user', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
    ],
  },
  {
    id: 'dt-6',
    name: 'Operations Overview',
    description: 'Draft dashboard for operations team',
    status: 'draft',
    assignedRoles: [],
    isDefault: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    createdBy: 'John Smith',
    widgets: [
      { id: 'w-50', widgetType: 'workflow_instances_running', title: 'Active Workflows', posX: 0, posY: 0, width: 4, height: 1, dataScope: 'department', filters: {}, refreshInterval: 30, visibilityConditions: {}, enabled: true },
      { id: 'w-51', widgetType: 'documents_by_status', title: 'Documents by Status', posX: 4, posY: 0, width: 4, height: 2, dataScope: 'department', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
      { id: 'w-52', widgetType: 'aging_documents', title: 'Aging Documents', posX: 8, posY: 0, width: 4, height: 2, dataScope: 'department', filters: {}, refreshInterval: 120, visibilityConditions: {}, enabled: true },
    ],
  },
];

// Category metadata
export const WIDGET_CATEGORIES: { key: WidgetCategory; label: string; icon: string }[] = [
  { key: 'task', label: 'Task Widgets', icon: 'ClipboardList' },
  { key: 'document', label: 'Document Widgets', icon: 'FileText' },
  { key: 'sla', label: 'SLA Widgets', icon: 'ShieldAlert' },
  { key: 'analytics', label: 'Analytics Widgets', icon: 'BarChart3' },
  { key: 'notification', label: 'Notification', icon: 'Bell' },
  { key: 'custom', label: 'Custom Widgets', icon: 'Puzzle' },
];

export const SIZE_PRESETS: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 3, height: 1 },
  medium: { width: 6, height: 2 },
  large: { width: 12, height: 2 },
};

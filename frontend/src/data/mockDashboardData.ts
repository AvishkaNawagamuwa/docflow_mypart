// ═══════════════════════════════════════════
// Mock data for role-based dashboards
// ═══════════════════════════════════════════

export interface DashboardTask {
  id: string;
  documentName: string;
  documentType: string;
  workflowStep: string;
  assignedUser: string;
  assignedRole: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'rejected' | 'sent-back';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueTime: Date;
  slaHours: number;
  instanceId: string;
  comments?: string;
}

export interface DashboardDocument {
  id: string;
  name: string;
  type: string;
  owner: string;
  status: 'draft' | 'in-workflow' | 'completed' | 'rejected';
  currentStep: string;
  uploadedAt: Date;
}

export interface DashboardNotification {
  id: string;
  userId: string;
  message: string;
  type: 'assignment' | 'sla-reminder' | 'sla-breach' | 'completion' | 'rejection' | 'send-back';
  read: boolean;
  createdAt: Date;
  documentId?: string;
}

export interface AuditEvent {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  documentId: string;
  documentName: string;
  details?: string;
}

// ───── Helper ─────
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600000);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

// ───── TASKS ─────
export const mockTasks: DashboardTask[] = [
  { id: 't-1', documentName: 'PO-2024-0125.pdf', documentType: 'Purchase Order', workflowStep: 'Manager Approval', assignedUser: 'u-2', assignedRole: 'approver', status: 'pending', priority: 'high', dueTime: hoursFromNow(4), slaHours: 24, instanceId: 'inst-1' },
  { id: 't-2', documentName: 'INV-ACME-2024-002.pdf', documentType: 'Invoice', workflowStep: 'Finance Review', assignedUser: 'u-2', assignedRole: 'approver', status: 'pending', priority: 'critical', dueTime: hoursFromNow(1), slaHours: 8, instanceId: 'inst-2' },
  { id: 't-3', documentName: 'PO-2024-0126.pdf', documentType: 'Purchase Order', workflowStep: 'CFO Approval', assignedUser: 'u-3', assignedRole: 'supervisor', status: 'overdue', priority: 'critical', dueTime: hoursAgo(5), slaHours: 48, instanceId: 'inst-3' },
  { id: 't-4', documentName: 'CONTRACT-2024-008.pdf', documentType: 'Contract', workflowStep: 'Legal Review', assignedUser: 'u-1', assignedRole: 'staff', status: 'in-progress', priority: 'medium', dueTime: hoursFromNow(12), slaHours: 24, instanceId: 'inst-4' },
  { id: 't-5', documentName: 'EXP-2024-045.pdf', documentType: 'Expense Report', workflowStep: 'Initial Submission', assignedUser: 'u-1', assignedRole: 'staff', status: 'pending', priority: 'low', dueTime: hoursFromNow(48), slaHours: 72, instanceId: 'inst-5' },
  { id: 't-6', documentName: 'GRN-2024-0089.pdf', documentType: 'GRN', workflowStep: 'Verification', assignedUser: 'u-2', assignedRole: 'approver', status: 'sent-back', priority: 'medium', dueTime: hoursFromNow(6), slaHours: 24, instanceId: 'inst-6' },
  { id: 't-7', documentName: 'PO-2024-0130.pdf', documentType: 'Purchase Order', workflowStep: 'Dept. Approval', assignedUser: 'u-2', assignedRole: 'approver', status: 'pending', priority: 'high', dueTime: hoursFromNow(2), slaHours: 16, instanceId: 'inst-7' },
  { id: 't-8', documentName: 'INV-BETA-2024-011.pdf', documentType: 'Invoice', workflowStep: 'Payment Auth', assignedUser: 'u-3', assignedRole: 'supervisor', status: 'pending', priority: 'medium', dueTime: hoursFromNow(20), slaHours: 48, instanceId: 'inst-8' },
  { id: 't-9', documentName: 'LEAVE-2024-102.pdf', documentType: 'Leave Request', workflowStep: 'HR Review', assignedUser: 'u-1', assignedRole: 'staff', status: 'completed', priority: 'low', dueTime: hoursAgo(2), slaHours: 24, instanceId: 'inst-9' },
  { id: 't-10', documentName: 'TRAVEL-2024-055.pdf', documentType: 'Travel Request', workflowStep: 'Manager Approval', assignedUser: 'u-2', assignedRole: 'approver', status: 'overdue', priority: 'high', dueTime: hoursAgo(3), slaHours: 12, instanceId: 'inst-10' },
];

// ───── DOCUMENTS ─────
export const mockDashboardDocuments: DashboardDocument[] = [
  { id: 'd-1', name: 'PO-2024-0125.pdf', type: 'Purchase Order', owner: 'u-1', status: 'in-workflow', currentStep: 'Manager Approval', uploadedAt: daysAgo(2) },
  { id: 'd-2', name: 'INV-ACME-2024-002.pdf', type: 'Invoice', owner: 'u-1', status: 'in-workflow', currentStep: 'Finance Review', uploadedAt: daysAgo(1) },
  { id: 'd-3', name: 'CONTRACT-2024-008.pdf', type: 'Contract', owner: 'u-1', status: 'in-workflow', currentStep: 'Legal Review', uploadedAt: daysAgo(3) },
  { id: 'd-4', name: 'EXP-2024-045.pdf', type: 'Expense Report', owner: 'u-1', status: 'draft', currentStep: 'Initial Submission', uploadedAt: daysAgo(0) },
  { id: 'd-5', name: 'GRN-2024-0089.pdf', type: 'GRN', owner: 'u-1', status: 'in-workflow', currentStep: 'Verification', uploadedAt: daysAgo(4) },
  { id: 'd-6', name: 'PO-2024-0130.pdf', type: 'Purchase Order', owner: 'u-2', status: 'in-workflow', currentStep: 'Dept. Approval', uploadedAt: daysAgo(1) },
  { id: 'd-7', name: 'INV-BETA-2024-011.pdf', type: 'Invoice', owner: 'u-3', status: 'completed', currentStep: 'Done', uploadedAt: daysAgo(7) },
  { id: 'd-8', name: 'LEAVE-2024-102.pdf', type: 'Leave Request', owner: 'u-1', status: 'completed', currentStep: 'Done', uploadedAt: daysAgo(5) },
];

// ───── NOTIFICATIONS ─────
export const mockNotifications: DashboardNotification[] = [
  { id: 'n-1', userId: 'u-1', message: 'New task assigned: PO-2024-0125 needs your review', type: 'assignment', read: false, createdAt: hoursAgo(1) },
  { id: 'n-2', userId: 'u-1', message: 'SLA Warning: CONTRACT-2024-008 due in 12 hours', type: 'sla-reminder', read: false, createdAt: hoursAgo(2) },
  { id: 'n-3', userId: 'u-2', message: 'Approval needed: INV-ACME-2024-002 is critical priority', type: 'assignment', read: false, createdAt: hoursAgo(0.5) },
  { id: 'n-4', userId: 'u-2', message: 'SLA Breach: TRAVEL-2024-055 is overdue', type: 'sla-breach', read: false, createdAt: hoursAgo(3) },
  { id: 'n-5', userId: 'u-2', message: 'Document sent back for revision: GRN-2024-0089', type: 'send-back', read: true, createdAt: hoursAgo(6) },
  { id: 'n-6', userId: 'u-3', message: 'PO-2024-0126 has breached SLA - escalated to you', type: 'sla-breach', read: false, createdAt: hoursAgo(5) },
  { id: 'n-7', userId: 'u-1', message: 'LEAVE-2024-102 workflow completed successfully', type: 'completion', read: true, createdAt: daysAgo(1) },
  { id: 'n-8', userId: 'u-4', message: 'New workflow template "Contract Review v2" created', type: 'completion', read: false, createdAt: hoursAgo(4) },
];

// ───── AUDIT EVENTS ─────
export const mockAuditEvents: AuditEvent[] = [
  { id: 'a-1', user: 'Alice Cooper', action: 'Uploaded document', timestamp: hoursAgo(2), documentId: 'd-1', documentName: 'PO-2024-0125.pdf' },
  { id: 'a-2', user: 'System', action: 'Workflow started', timestamp: hoursAgo(2), documentId: 'd-1', documentName: 'PO-2024-0125.pdf' },
  { id: 'a-3', user: 'Sarah Johnson', action: 'Approved', timestamp: hoursAgo(1), documentId: 'd-6', documentName: 'PO-2024-0130.pdf', details: 'Approved - within budget' },
  { id: 'a-4', user: 'Robert Chen', action: 'Viewed document', timestamp: hoursAgo(0.5), documentId: 'd-3', documentName: 'CONTRACT-2024-008.pdf' },
  { id: 'a-5', user: 'Legal Team', action: 'Rejected', timestamp: hoursAgo(4), documentId: 'd-3', documentName: 'CONTRACT-2024-008.pdf', details: 'Missing signatures on page 3' },
  { id: 'a-6', user: 'Mike Wilson', action: 'Sent back for revision', timestamp: hoursAgo(6), documentId: 'd-5', documentName: 'GRN-2024-0089.pdf', details: 'Quantity mismatch' },
  { id: 'a-7', user: 'System', action: 'SLA Breach triggered', timestamp: hoursAgo(5), documentId: 'd-3', documentName: 'PO-2024-0126.pdf' },
  { id: 'a-8', user: 'Alice Cooper', action: 'Completed task', timestamp: daysAgo(1), documentId: 'd-8', documentName: 'LEAVE-2024-102.pdf' },
];

// ───── PERFORMANCE (for supervisor) ─────
export interface UserPerformance {
  userId: string;
  userName: string;
  tasksCompleted: number;
  avgCompletionHours: number;
  slaBreaches: number;
  onTimeRate: number;
}

export const mockUserPerformance: UserPerformance[] = [
  { userId: 'u-1', userName: 'Alice Cooper', tasksCompleted: 34, avgCompletionHours: 6.2, slaBreaches: 1, onTimeRate: 97 },
  { userId: 'u-2', userName: 'Sarah Johnson', tasksCompleted: 52, avgCompletionHours: 4.8, slaBreaches: 3, onTimeRate: 94 },
  { userId: 'u-3', userName: 'Robert Chen', tasksCompleted: 18, avgCompletionHours: 12.1, slaBreaches: 2, onTimeRate: 89 },
  { userId: 'u-4', userName: 'John Smith', tasksCompleted: 8, avgCompletionHours: 2.5, slaBreaches: 0, onTimeRate: 100 },
  { userId: 'u-5', userName: 'Mike Wilson', tasksCompleted: 45, avgCompletionHours: 5.5, slaBreaches: 4, onTimeRate: 91 },
  { userId: 'u-6', userName: 'Carol Davis', tasksCompleted: 29, avgCompletionHours: 8.3, slaBreaches: 2, onTimeRate: 93 },
];

export interface BottleneckStep {
  stepName: string;
  avgHours: number;
  taskCount: number;
  slaBreachRate: number;
}

export const mockBottlenecks: BottleneckStep[] = [
  { stepName: 'CFO Approval', avgHours: 36.5, taskCount: 12, slaBreachRate: 25 },
  { stepName: 'Legal Review', avgHours: 28.2, taskCount: 8, slaBreachRate: 18 },
  { stepName: 'Finance Review', avgHours: 14.8, taskCount: 22, slaBreachRate: 9 },
  { stepName: 'Manager Approval', avgHours: 8.4, taskCount: 35, slaBreachRate: 5 },
  { stepName: 'Initial Submission', avgHours: 3.2, taskCount: 48, slaBreachRate: 2 },
];

export type WorkflowStatus = 'draft' | 'active' | 'archived' | 'disabled';

export type NodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'decision'
  | 'merge'
  | 'parallel-split'
  | 'parallel-join'
  | 'sub-workflow'
  | 'timer'
  | 'escalation'
  | 'notification';

export type TaskType = 'approval' | 'review' | 'upload' | 'metadata-edit';

export type AssignmentRule = 'single' | 'all' | 'first-response';

export type ConnectionType = 'approve' | 'reject' | 'revision' | 'parallel' | 'default' | 'timeout' | 'escalate';

export type TriggerType = 'onedrive' | 'manual' | 'api';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  documentCategory: string;
  documentType: string;
  status: WorkflowStatus;
  version: number;
  lastUpdated: Date;
  trigger: TriggerType;
  triggerPath?: string;
  allowedFileTypes: string[];
  nodes: WorkflowNode[];
  createdBy: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  config: NodeConfig;
  connections: NodeConnection[];
}

export interface NodeConnection {
  id: string;
  targetNodeId: string;
  type: ConnectionType;
  label?: string;
  condition?: string;
}

export interface NodeConfig {
  // Task configuration
  taskType?: TaskType;
  taskDepartment?: string;
  assignTo?: 'role' | 'user' | 'group';
  assigneeId?: string;
  assignmentRule?: AssignmentRule;
  allowedActions?: string[];
  allowRejection?: boolean;
  allowRevision?: boolean;
  commentMandatory?: boolean;
  delegationAllowed?: boolean;

  // SLA & Timeout
  slaHours?: number;
  reminderHours?: number;
  escalationTarget?: string;
  timeoutAction?: 'escalate' | 'auto-approve' | 'auto-reject';
  escalateOnTimeout?: boolean;

  // Decision configuration
  routingRules?: RoutingRule[];
  decisionRules?: DecisionRule[];
  branches?: DecisionBranch[];
  conditionBuilder?: string;

  // Parallel configuration
  parallelType?: 'split' | 'join';
  waitForAll?: boolean;
  minBranchesToComplete?: number;

  // Merge configuration
  mergeOnAny?: boolean;

  // Sub-workflow configuration
  subWorkflowId?: string;
  inheritContext?: boolean;

  // Timer configuration
  timerDuration?: number;
  timerUnit?: 'minutes' | 'hours' | 'days';
  timerAction?: 'continue' | 'escalate' | 'notify';

  // Start node trigger configuration
  triggerMethods?: TriggerType[];
  triggerPath?: string;
  triggerDepartment?: string;
  triggerRoleId?: string;
  triggerRoleName?: string;
  triggerEndpoint?: string;
  triggerCsvPath?: string;

  // Escalation configuration
  escalationType?: 'immediate' | 'scheduled';
  escalationChain?: string[];
  notifyOnEscalation?: boolean;

  escalationRoleId?: string;
  escalationDepartment?: string;
  escalationDelayMinutes?: number;

  // Notification configuration
  notificationType?: 'email' | 'sms' | 'in-app' | 'all';
  notificationTemplate?: string;
  recipients?: string[];
  notificationTriggerEvent?: string;

  // End configuration
  endType?: 'completed' | 'rejected' | 'cancelled';
  finalActions?: string[];

  // Advanced
  retryCount?: number;
  customMetadata?: string;
}

export interface WorkflowExportNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  position: { x: number; y: number };
  config: NodeConfig;
  assignedRoleId?: string;
}

export interface WorkflowExportConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: ConnectionType;
  label?: string;
  condition?: string;
  isDefault?: boolean;
  priority?: number;
  meta?: Record<string, unknown>;
}

export interface WorkflowExportJson {
  workflowId: string;
  version: number;
  name: string;
  exportedAt: string;
  nodes: WorkflowExportNode[];
  connections: WorkflowExportConnection[];
}

export interface WorkflowTransition {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
  condition?: string;
  isDefault?: boolean;
  priority?: number;
  meta?: Record<string, unknown>;
}

export interface WorkflowCondition {
  transitionId: string;
  sourceNodeId: string;
  label: string;
  expression: string;
}

export interface WorkflowSlaRule {
  nodeId: string;
  hours: number;
  timeoutAction?: NodeConfig['timeoutAction'];
  escalateOnTimeout: boolean;
}

export interface WorkflowApprovalRule {
  nodeId: string;
  rule: AssignmentRule;
  allowRejection: boolean;
  allowRevision: boolean;
  firstResponseWins: boolean;
}

export interface WorkflowEscalationRule {
  nodeId: string;
  escalationRoleId?: string;
  delayMinutes?: number;
}

export interface WorkflowDefinition {
  workflowId: string;
  version: number;
  name: string;
  nodes: WorkflowExportNode[];
  connections?: WorkflowExportConnection[];
  transitions: WorkflowTransition[];
  conditions: WorkflowCondition[];
  sla: WorkflowSlaRule[];
  approvalRules: WorkflowApprovalRule[];
  escalationRules: WorkflowEscalationRule[];
}

export interface DecisionBranch {
  id: string;
  label: string;
  condition?: string;
  priority: number;
}

export interface RoutingRule {
  action: string;
  targetNodeId: string;
}

export interface DecisionRule {
  field: string;
  operator: '=' | '>' | '<' | 'contains' | '!=' | '>=' | '<=';
  value: string | number;
  targetNodeId: string;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  documentName: string;
  documentType: string;
  status: string;
  currentStep: string;
  currentAssignee: string;
  startedAt: Date;
  slaDeadline?: Date;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: Date;
  comment?: string;
  attachments?: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface WorkflowFormData {
  name: string;
  description: string;
  documentCategory: string;
  documentType: string;
  trigger: TriggerType[];
  triggerPath: string;
  allowedFileTypes: string[];
  initiatorRoles: string[];
  approverRoles: string[];
  viewerRoles: string[];
  defaultOwner: string;
  allowOverride: boolean;
  statuses: WorkflowStatusItem[];
  finalStatuses: string[];
}

export interface WorkflowStatusItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

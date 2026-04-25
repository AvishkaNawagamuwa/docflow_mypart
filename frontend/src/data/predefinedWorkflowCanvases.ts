import { MarkerType } from 'reactflow';

import { connectionStroke } from '@/components/builder/activity/colors';
import type { ActivityEdgeModel, ActivityNode } from '@/components/builder/activity/types';
import type { NodeType } from '@/types/workflow';

const slaDaysToHours = (days: number) => days * 24;

const nodeSize = (type: NodeType): { width: number; height: number } => {
  switch (type) {
    case 'start':
      return { width: 70, height: 70 };
    case 'end':
      return { width: 78, height: 78 };
    case 'decision':
      return { width: 160, height: 160 };
    case 'merge':
      return { width: 150, height: 150 };
    case 'parallel-split':
    case 'parallel-join':
      return { width: 90, height: 90 };
    case 'timer':
      return { width: 240, height: 60 };
    case 'escalation':
      return { width: 250, height: 70 };
    case 'notification':
      return { width: 200, height: 90 };
    case 'sub-workflow':
      return { width: 250, height: 80 };
    case 'task':
    default:
      return { width: 260, height: 120 };
  }
};

const makeNode = (args: {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  description?: string;
  assignedRoleId?: string;
  config?: ActivityNode['data']['config'];
}): ActivityNode => {
  const { id, type, name, x, y, description, assignedRoleId, config } = args;
  const size = nodeSize(type);

  return {
    id,
    type,
    position: { x, y },
    data: {
      name,
      description,
      assignedRoleId,
      config: {
        ...(config ?? {}),
        // keep a reasonable default for tasks
        ...(type === 'task'
          ? {
              assignmentRule: config?.assignmentRule ?? 'single',
              allowRejection: config?.allowRejection ?? true,
              allowRevision: config?.allowRevision ?? false,
            }
          : {}),
      },
    },
    style: { width: size.width, height: size.height },
  };
};

const makeEdge = (args: {
  id: string;
  source: string;
  target: string;
  connectionType?: ActivityEdgeModel['data']['connectionType'];
  label?: string;
  condition?: string;
  isDefault?: boolean;
  priority?: number;
  dashed?: boolean;
}): ActivityEdgeModel => {
  const { id, source, target, connectionType = 'default', label, condition, isDefault, priority, dashed } = args;
  const stroke = connectionStroke(connectionType);

  return {
    id,
    type: 'activity',
    source,
    target,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: stroke,
      width: 18,
      height: 18,
    },
    data: {
      connectionType,
      label,
      condition,
      isDefault,
      priority,
      style: {
        dashed: !!dashed,
      },
    },
  };
};

export type PredefinedWorkflowCanvas = {
  nodes: ActivityNode[];
  edges: ActivityEdgeModel[];
};

export const getPredefinedWorkflowCanvas = (workflowId: string): PredefinedWorkflowCanvas | null => {
  const SLA_DAYS = 5;
  const SLA_HOURS = slaDaysToHours(SLA_DAYS);

  switch (workflowId) {
    // wf-1: Procurement PO Approval
    case 'wf-1': {
      const nodes: ActivityNode[] = [
        makeNode({ id: 'start', type: 'start', name: 'Start', x: 420, y: 40, config: {} }),
        makeNode({
          id: 'pr_creation',
          type: 'task',
          name: 'PR Creation',
          x: 320,
          y: 170,
          assignedRoleId: 'role-emp',
          config: {
            taskType: 'metadata-edit',
            assigneeId: 'role-emp',
            assignmentRule: 'single',
            allowRejection: false,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'hod_approval',
          type: 'task',
          name: 'HOD Approval',
          x: 320,
          y: 340,
          assignedRoleId: 'role-hod',
          config: {
            taskType: 'approval',
            assigneeId: 'role-hod',
            assignmentRule: 'single',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'decision_approved',
          type: 'decision',
          name: 'Approved?',
          x: 370,
          y: 520,
          config: {},
        }),
        makeNode({
          id: 'procurement_review',
          type: 'task',
          name: 'Procurement Review',
          x: 320,
          y: 710,
          assignedRoleId: 'role-3',
          config: {
            taskType: 'review',
            assigneeId: 'role-3',
            assignmentRule: 'single',
            allowRejection: true,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'finance_approval',
          type: 'task',
          name: 'Finance Approval',
          x: 320,
          y: 880,
          assignedRoleId: 'role-fin',
          config: {
            taskType: 'approval',
            assigneeId: 'role-fin',
            assignmentRule: 'single',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'send_po',
          type: 'notification',
          name: 'Notification (Send PO)',
          x: 350,
          y: 1050,
          description: 'Send PO to vendor and notify stakeholders',
          config: {
            notificationType: 'email',
            notificationTemplate: 'PO_ISSUED',
            recipients: ['vendor', 'procurement', 'finance'],
          },
        }),
        makeNode({
          id: 'end_approved',
          type: 'end',
          name: 'End (Approved)',
          x: 420,
          y: 1200,
          config: { endType: 'completed' },
        }),
        makeNode({
          id: 'end_rejected',
          type: 'end',
          name: 'End (Rejected)',
          x: 740,
          y: 580,
          config: { endType: 'rejected' },
        }),
      ];

      const edges: ActivityEdgeModel[] = [
        makeEdge({ id: 'e_start_pr', source: 'start', target: 'pr_creation', connectionType: 'default', label: 'Next' }),
        makeEdge({ id: 'e_pr_hod', source: 'pr_creation', target: 'hod_approval', connectionType: 'default', label: 'Next' }),
        makeEdge({ id: 'e_hod_dec', source: 'hod_approval', target: 'decision_approved', connectionType: 'default', label: 'Next' }),
        makeEdge({
          id: 'e_dec_approve',
          source: 'decision_approved',
          target: 'procurement_review',
          connectionType: 'approve',
          label: 'Approve',
          condition: "hodApproval == 'APPROVED'",
          priority: 1,
          dashed: true,
        }),
        makeEdge({
          id: 'e_dec_reject_default',
          source: 'decision_approved',
          target: 'end_rejected',
          connectionType: 'reject',
          label: 'Reject',
          isDefault: true,
          priority: 999,
        }),
        makeEdge({
          id: 'e_proc_fin',
          source: 'procurement_review',
          target: 'finance_approval',
          connectionType: 'default',
          label: 'Next',
        }),
        makeEdge({
          id: 'e_fin_send',
          source: 'finance_approval',
          target: 'send_po',
          connectionType: 'approve',
          label: 'Approve',
        }),
        makeEdge({ id: 'e_send_end', source: 'send_po', target: 'end_approved', connectionType: 'default', label: 'Next' }),
      ];

      return { nodes, edges };
    }

    // wf-2: Invoice Processing
    case 'wf-2': {
      const nodes: ActivityNode[] = [
        makeNode({ id: 'start', type: 'start', name: 'Start', x: 420, y: 40, config: {} }),
        makeNode({
          id: 'invoice_received',
          type: 'task',
          name: 'Invoice Received',
          x: 320,
          y: 170,
          assignedRoleId: 'role-emp',
          config: {
            taskType: 'upload',
            assigneeId: 'role-emp',
            allowRejection: false,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'invoice_verification',
          type: 'task',
          name: 'Verification (Match PO/GRN)',
          x: 320,
          y: 340,
          assignedRoleId: 'role-fin',
          config: {
            taskType: 'review',
            assigneeId: 'role-fin',
            allowRejection: true,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({ id: 'decision_verified', type: 'decision', name: 'Verified?', x: 370, y: 520, config: {} }),
        makeNode({
          id: 'finance_approval',
          type: 'task',
          name: 'Finance Approval',
          x: 320,
          y: 710,
          assignedRoleId: 'role-2',
          config: {
            taskType: 'approval',
            assigneeId: 'role-2',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'notify_payment',
          type: 'notification',
          name: 'Notification (AP / Payment Queue)',
          x: 340,
          y: 880,
          config: {
            notificationType: 'in-app',
            notificationTemplate: 'INVOICE_APPROVED',
            recipients: ['finance', 'ap-team'],
          },
        }),
        makeNode({ id: 'end_paid', type: 'end', name: 'End (Approved)', x: 420, y: 1030, config: { endType: 'completed' } }),
        makeNode({ id: 'end_rejected', type: 'end', name: 'End (Rejected)', x: 740, y: 580, config: { endType: 'rejected' } }),
      ];

      const edges: ActivityEdgeModel[] = [
        makeEdge({ id: 'e_start_received', source: 'start', target: 'invoice_received', label: 'Next' }),
        makeEdge({ id: 'e_received_verify', source: 'invoice_received', target: 'invoice_verification', label: 'Next' }),
        makeEdge({ id: 'e_verify_dec', source: 'invoice_verification', target: 'decision_verified', label: 'Next' }),
        makeEdge({
          id: 'e_dec_ok',
          source: 'decision_verified',
          target: 'finance_approval',
          connectionType: 'approve',
          label: 'Approve',
          condition: "verificationStatus == 'OK'",
          priority: 1,
          dashed: true,
        }),
        makeEdge({
          id: 'e_dec_reject_default',
          source: 'decision_verified',
          target: 'end_rejected',
          connectionType: 'reject',
          label: 'Reject',
          isDefault: true,
          priority: 999,
        }),
        makeEdge({ id: 'e_fin_notify', source: 'finance_approval', target: 'notify_payment', connectionType: 'approve', label: 'Approve' }),
        makeEdge({ id: 'e_notify_end', source: 'notify_payment', target: 'end_paid', label: 'Next' }),
      ];

      return { nodes, edges };
    }

    // wf-3: Contract Review
    case 'wf-3': {
      const nodes: ActivityNode[] = [
        makeNode({ id: 'start', type: 'start', name: 'Start', x: 420, y: 40, config: {} }),
        makeNode({
          id: 'submit_contract',
          type: 'task',
          name: 'Submit Contract',
          x: 320,
          y: 170,
          assignedRoleId: 'role-emp',
          config: {
            taskType: 'upload',
            assigneeId: 'role-emp',
            allowRejection: false,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'legal_review',
          type: 'task',
          name: 'Legal Review',
          x: 320,
          y: 340,
          assignedRoleId: 'role-6',
          config: {
            taskType: 'review',
            assigneeId: 'role-6',
            allowRejection: true,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({ id: 'decision_legal', type: 'decision', name: 'Legally OK?', x: 370, y: 520, config: {} }),
        makeNode({
          id: 'manager_approval',
          type: 'task',
          name: 'Manager Approval',
          x: 320,
          y: 710,
          assignedRoleId: 'role-1',
          config: {
            taskType: 'approval',
            assigneeId: 'role-1',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({ id: 'end_approved', type: 'end', name: 'End (Approved)', x: 420, y: 880, config: { endType: 'completed' } }),
        makeNode({ id: 'end_rejected', type: 'end', name: 'End (Rejected)', x: 740, y: 580, config: { endType: 'rejected' } }),
      ];

      const edges: ActivityEdgeModel[] = [
        makeEdge({ id: 'e_start_submit', source: 'start', target: 'submit_contract', label: 'Next' }),
        makeEdge({ id: 'e_submit_legal', source: 'submit_contract', target: 'legal_review', label: 'Next' }),
        makeEdge({ id: 'e_legal_dec', source: 'legal_review', target: 'decision_legal', label: 'Next' }),
        makeEdge({
          id: 'e_dec_ok',
          source: 'decision_legal',
          target: 'manager_approval',
          connectionType: 'approve',
          label: 'Approve',
          condition: 'legalApproved == true',
          priority: 1,
          dashed: true,
        }),
        makeEdge({
          id: 'e_dec_reject_default',
          source: 'decision_legal',
          target: 'end_rejected',
          connectionType: 'reject',
          label: 'Reject',
          isDefault: true,
          priority: 999,
        }),
        makeEdge({ id: 'e_mgr_end', source: 'manager_approval', target: 'end_approved', connectionType: 'approve', label: 'Approve' }),
      ];

      return { nodes, edges };
    }

    // wf-4: Expense Reimbursement
    case 'wf-4': {
      const nodes: ActivityNode[] = [
        makeNode({ id: 'start', type: 'start', name: 'Start', x: 420, y: 40, config: {} }),
        makeNode({
          id: 'submit_expense',
          type: 'task',
          name: 'Submit Expense Report',
          x: 320,
          y: 170,
          assignedRoleId: 'role-emp',
          config: {
            taskType: 'upload',
            assigneeId: 'role-emp',
            allowRejection: false,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'manager_approval',
          type: 'task',
          name: 'Manager Approval',
          x: 320,
          y: 340,
          assignedRoleId: 'role-mgr',
          config: {
            taskType: 'approval',
            assigneeId: 'role-mgr',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({ id: 'decision_mgr', type: 'decision', name: 'Approved?', x: 370, y: 520, config: {} }),
        makeNode({
          id: 'finance_approval',
          type: 'task',
          name: 'Finance Approval',
          x: 320,
          y: 710,
          assignedRoleId: 'role-fin',
          config: {
            taskType: 'approval',
            assigneeId: 'role-fin',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'notify_employee',
          type: 'notification',
          name: 'Notification (Reimbursement Scheduled)',
          x: 330,
          y: 880,
          config: {
            notificationType: 'email',
            notificationTemplate: 'EXPENSE_APPROVED',
            recipients: ['employee'],
          },
        }),
        makeNode({ id: 'end_approved', type: 'end', name: 'End (Completed)', x: 420, y: 1030, config: { endType: 'completed' } }),
        makeNode({ id: 'end_rejected', type: 'end', name: 'End (Rejected)', x: 740, y: 580, config: { endType: 'rejected' } }),
      ];

      const edges: ActivityEdgeModel[] = [
        makeEdge({ id: 'e_start_submit', source: 'start', target: 'submit_expense', label: 'Next' }),
        makeEdge({ id: 'e_submit_mgr', source: 'submit_expense', target: 'manager_approval', label: 'Next' }),
        makeEdge({ id: 'e_mgr_dec', source: 'manager_approval', target: 'decision_mgr', label: 'Next' }),
        makeEdge({
          id: 'e_dec_ok',
          source: 'decision_mgr',
          target: 'finance_approval',
          connectionType: 'approve',
          label: 'Approve',
          condition: 'managerApproved == true',
          priority: 1,
          dashed: true,
        }),
        makeEdge({
          id: 'e_dec_reject_default',
          source: 'decision_mgr',
          target: 'end_rejected',
          connectionType: 'reject',
          label: 'Reject',
          isDefault: true,
          priority: 999,
        }),
        makeEdge({ id: 'e_fin_notify', source: 'finance_approval', target: 'notify_employee', connectionType: 'approve', label: 'Approve' }),
        makeEdge({ id: 'e_notify_end', source: 'notify_employee', target: 'end_approved', label: 'Next' }),
      ];

      return { nodes, edges };
    }

    // wf-5: GRN Verification
    case 'wf-5': {
      const nodes: ActivityNode[] = [
        makeNode({ id: 'start', type: 'start', name: 'Start', x: 420, y: 40, config: {} }),
        makeNode({
          id: 'goods_received',
          type: 'task',
          name: 'Goods Received',
          x: 320,
          y: 170,
          assignedRoleId: 'role-warehouse',
          config: {
            taskType: 'metadata-edit',
            assigneeId: 'role-warehouse',
            allowRejection: false,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'warehouse_verification',
          type: 'task',
          name: 'Warehouse Verification',
          x: 320,
          y: 340,
          assignedRoleId: 'role-warehouse',
          config: {
            taskType: 'review',
            assigneeId: 'role-warehouse',
            allowRejection: true,
            allowRevision: true,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({
          id: 'quality_inspection',
          type: 'task',
          name: 'Quality Inspection',
          x: 320,
          y: 510,
          assignedRoleId: 'role-quality',
          config: {
            taskType: 'review',
            assigneeId: 'role-quality',
            allowRejection: true,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({ id: 'decision_accept', type: 'decision', name: 'Accept Goods?', x: 370, y: 690, config: {} }),
        makeNode({
          id: 'inventory_update',
          type: 'task',
          name: 'Inventory Update',
          x: 320,
          y: 880,
          assignedRoleId: 'role-sys',
          config: {
            taskType: 'metadata-edit',
            assigneeId: 'role-sys',
            allowRejection: false,
            allowRevision: false,
            slaHours: SLA_HOURS,
          },
        }),
        makeNode({ id: 'end_accepted', type: 'end', name: 'End (Accepted)', x: 420, y: 1030, config: { endType: 'completed' } }),
        makeNode({ id: 'end_rejected', type: 'end', name: 'End (Rejected)', x: 740, y: 750, config: { endType: 'rejected' } }),
      ];

      const edges: ActivityEdgeModel[] = [
        makeEdge({ id: 'e_start_goods', source: 'start', target: 'goods_received', label: 'Next' }),
        makeEdge({ id: 'e_goods_wh', source: 'goods_received', target: 'warehouse_verification', label: 'Next' }),
        makeEdge({ id: 'e_wh_qc', source: 'warehouse_verification', target: 'quality_inspection', label: 'Next' }),
        makeEdge({ id: 'e_qc_dec', source: 'quality_inspection', target: 'decision_accept', label: 'Next' }),
        makeEdge({
          id: 'e_dec_accept',
          source: 'decision_accept',
          target: 'inventory_update',
          connectionType: 'approve',
          label: 'Accept',
          condition: 'qcResult == "PASS"',
          priority: 1,
          dashed: true,
        }),
        makeEdge({
          id: 'e_dec_reject_default',
          source: 'decision_accept',
          target: 'end_rejected',
          connectionType: 'reject',
          label: 'Reject',
          isDefault: true,
          priority: 999,
        }),
        makeEdge({ id: 'e_inv_end', source: 'inventory_update', target: 'end_accepted', label: 'Next' }),
      ];

      return { nodes, edges };
    }

    default:
      return null;
  }
};

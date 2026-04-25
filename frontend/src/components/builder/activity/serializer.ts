import type { WorkflowDefinition, WorkflowExportJson } from '@/types/workflow';
import type { ActivityEdgeModel, ActivityNode } from './types';

const parseMeta = (json?: string): Record<string, unknown> | undefined => {
  if (!json || !json.trim()) return undefined;
  const parsed = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Execution metadata must be a JSON object');
  }
  return parsed as Record<string, unknown>;
};

export const buildWorkflowExport = (args: {
  workflowId: string;
  name: string;
  version: number;
  nodes: ActivityNode[];
  edges: ActivityEdgeModel[];
}): WorkflowExportJson => {
  const { workflowId, name, version, nodes, edges } = args;

  return {
    workflowId,
    version,
    name,
    exportedAt: new Date().toISOString(),
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      name: n.data.name,
      description: n.data.description,
      position: n.position,
      config: n.data.config,
      assignedRoleId: n.data.assignedRoleId,
    })),
    connections: edges.map((e) => ({
      id: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      type: e.data?.connectionType ?? 'default',
      label: e.data?.label,
      condition: e.data?.condition,
      isDefault: e.data?.isDefault,
      priority: e.data?.priority,
      meta: parseMeta(e.data?.executionMetaJson),
    })),
  };
};

export const buildWorkflowDefinition = (args: {
  workflowId: string;
  name: string;
  version: number;
  nodes: ActivityNode[];
  edges: ActivityEdgeModel[];
}): WorkflowDefinition => {
  const { workflowId, name, version, nodes, edges } = args;

  const transitions = edges.map((e) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    type: e.data?.connectionType ?? 'default',
    label: e.data?.label,
    condition: e.data?.condition,
    isDefault: e.data?.isDefault,
    priority: e.data?.priority,
    meta: parseMeta(e.data?.executionMetaJson),
  }));

  const connections = edges.map((e) => ({
    id: e.id,
    sourceNodeId: e.source,
    targetNodeId: e.target,
    type: e.data?.connectionType ?? 'default',
    label: e.data?.label,
    condition: e.data?.condition,
    isDefault: e.data?.isDefault,
    priority: e.data?.priority,
    meta: parseMeta(e.data?.executionMetaJson),
  }));

  const conditions = edges
    .filter((e) => (e.data?.condition?.trim() || e.data?.label?.trim()) && e.source)
    .map((e) => ({
      transitionId: e.id,
      sourceNodeId: e.source,
      expression: e.data?.condition || '',
      label: e.data?.label || '',
    }));

  const sla = nodes
    .filter((n) => typeof n.data.config.slaHours === 'number')
    .map((n) => ({
      nodeId: n.id,
      hours: n.data.config.slaHours as number,
      timeoutAction: n.data.config.timeoutAction,
      escalateOnTimeout: !!n.data.config.escalateOnTimeout,
    }));

  const approvalRules = nodes
    .filter((n) => n.type === 'task')
    .map((n) => ({
      nodeId: n.id,
      rule: n.data.config.assignmentRule ?? 'single',
      allowRejection: !!n.data.config.allowRejection,
      allowRevision: !!n.data.config.allowRevision,
      firstResponseWins: n.data.config.assignmentRule === 'first-response',
    }));

  const escalationRules = nodes
    .filter((n) => n.type === 'escalation' || !!n.data.config.escalationTarget)
    .map((n) => ({
      nodeId: n.id,
      escalationRoleId: n.data.config.escalationRoleId || n.data.config.escalationTarget,
      delayMinutes: n.data.config.escalationDelayMinutes,
    }));

  return {
    workflowId,
    version,
    name,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      name: n.data.name,
      description: n.data.description,
      position: n.position,
      config: n.data.config,
      assignedRoleId: n.data.assignedRoleId,
    })),
    connections,
    transitions,
    conditions,
    sla,
    approvalRules,
    escalationRules,
  };
};

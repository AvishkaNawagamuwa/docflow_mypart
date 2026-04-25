import type { Node as RFNode, Edge as RFEdge } from 'reactflow';
import type { NodeType } from '@/types/workflow';
import type { ActivityEdgeData, ActivityNodeData } from './types';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

const isStart = (n: RFNode<ActivityNodeData>) => n.type === 'start';
const isEnd = (n: RFNode<ActivityNodeData>) => n.type === 'end';

const buildAdj = (edges: RFEdge<ActivityEdgeData>[]) => {
  const out = new Map<string, string[]>();
  const inc = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!out.has(e.source)) out.set(e.source, []);
    out.get(e.source)!.push(e.target);
    if (!inc.has(e.target)) inc.set(e.target, []);
    inc.get(e.target)!.push(e.source);
  });
  return { out, inc };
};

const reachableFrom = (startId: string, out: Map<string, string[]>) => {
  const seen = new Set<string>();
  const q: string[] = [startId];
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    (out.get(id) ?? []).forEach((t) => {
      if (!seen.has(t)) q.push(t);
    });
  }
  return seen;
};

const canReachEnd = (nodeId: string, endIds: Set<string>, out: Map<string, string[]>) => {
  const seen = new Set<string>();
  const q: string[] = [nodeId];
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (endIds.has(id)) return true;
    (out.get(id) ?? []).forEach((t) => {
      if (!seen.has(t)) q.push(t);
    });
  }
  return false;
};

const detectCycles = (nodes: RFNode<ActivityNodeData>[], edges: RFEdge<ActivityEdgeData>[]) => {
  const out = buildAdj(edges).out;
  const ids = new Set(nodes.map((n) => n.id));

  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycles: string[][] = [];

  const dfs = (id: string, path: string[]) => {
    if (stack.has(id)) {
      const idx = path.indexOf(id);
      if (idx >= 0) cycles.push(path.slice(idx));
      return;
    }
    if (visited.has(id)) return;

    visited.add(id);
    stack.add(id);
    const nexts = (out.get(id) ?? []).filter((n) => ids.has(n));
    nexts.forEach((n) => dfs(n, [...path, n]));
    stack.delete(id);
  };

  nodes.forEach((n) => dfs(n.id, [n.id]));
  return cycles;
};

export const validateWorkflow = (args: {
  nodes: RFNode<ActivityNodeData>[];
  edges: RFEdge<ActivityEdgeData>[];
}): ValidationIssue[] => {
  const { nodes, edges } = args;
  const issues: ValidationIssue[] = [];

  const startNodes = nodes.filter(isStart);
  const endNodes = nodes.filter(isEnd);

  if (startNodes.length !== 1) {
    issues.push({
      severity: 'error',
      message: startNodes.length === 0 ? 'Exactly 1 Start node is required' : 'Only 1 Start node is allowed',
      nodeId: startNodes[0]?.id,
    });
  }

  if (endNodes.length < 1) {
    issues.push({ severity: 'error', message: 'At least 1 End node is required' });
  }

  const { out, inc } = buildAdj(edges);

  // Start constraints
  if (startNodes[0]) {
    const startId = startNodes[0].id;
    const incoming = inc.get(startId)?.length ?? 0;
    const outgoing = out.get(startId)?.length ?? 0;
    if (incoming > 0) issues.push({ severity: 'error', message: 'Start node cannot have incoming transitions', nodeId: startId });
    if (outgoing !== 1) issues.push({ severity: 'error', message: 'Start node must have exactly 1 outgoing transition', nodeId: startId });
  }

  // End constraints
  endNodes.forEach((n) => {
    const outgoing = out.get(n.id)?.length ?? 0;
    if (outgoing > 0) issues.push({ severity: 'error', message: `End node "${n.data.name}" cannot have outgoing transitions`, nodeId: n.id });
  });

  // Orphans (no in and no out) excluding start/end
  nodes.forEach((n) => {
    if (n.type === 'start' || n.type === 'end') return;
    const incoming = inc.get(n.id)?.length ?? 0;
    const outgoing = out.get(n.id)?.length ?? 0;
    if (incoming === 0 && outgoing === 0) {
      issues.push({ severity: 'error', message: `Node "${n.data.name}" is orphaned (no transitions)`, nodeId: n.id });
    }
  });

  // Reachability
  if (startNodes[0]) {
    const reach = reachableFrom(startNodes[0].id, out);
    nodes.forEach((n) => {
      if (!reach.has(n.id)) issues.push({ severity: 'error', message: `Node "${n.data.name}" is unreachable from Start`, nodeId: n.id });
    });
  }

  // Termination (all branches must be able to reach an End)
  const endIds = new Set(endNodes.map((n) => n.id));
  nodes.forEach((n) => {
    if (n.type === 'end') return;
    const outgoing = out.get(n.id)?.length ?? 0;
    if (outgoing === 0) {
      issues.push({ severity: 'error', message: `Node "${n.data.name}" does not transition to any next state`, nodeId: n.id });
      return;
    }

    if (endIds.size && !canReachEnd(n.id, endIds, out)) {
      issues.push({ severity: 'error', message: `Branch from "${n.data.name}" never terminates in an End node`, nodeId: n.id });
    }
  });

  // Decision must have >=2 branches and branch labels
  nodes
    .filter((n) => n.type === 'decision')
    .forEach((n) => {
      const outgoing = out.get(n.id)?.length ?? 0;
      if (outgoing < 2) issues.push({ severity: 'error', message: `Decision "${n.data.name}" must have ≥2 branches`, nodeId: n.id });

      const outgoingEdges = edges.filter((e) => e.source === n.id);

      const defaults = outgoingEdges.filter((e) => !!e.data?.isDefault);
      if (defaults.length !== 1) {
        issues.push({
          severity: 'error',
          message:
            defaults.length === 0
              ? `Decision "${n.data.name}" must have exactly 1 Default branch`
              : `Decision "${n.data.name}" has multiple Default branches`,
          nodeId: n.id,
        });
      }

      const seenConditions = new Map<string, string>();
      const seenPriorities = new Map<number, string>();

      outgoingEdges.forEach((e) => {
        const isDefault = !!e.data?.isDefault;
        const label = (e.data?.label ?? '').trim();
        const cond = (e.data?.condition ?? '').trim();

        if (!isDefault && !cond) {
          issues.push({
            severity: 'error',
            message: `Decision branch from "${n.data.name}" must have a condition (unless Default)`,
            edgeId: e.id,
            nodeId: n.id,
          });
        }

        if (!label && !cond && !isDefault) {
          issues.push({
            severity: 'warning',
            message: `Decision branch from "${n.data.name}" is missing a label`,
            edgeId: e.id,
            nodeId: n.id,
          });
        }

        if (!isDefault && cond) {
          const key = cond;
          if (seenConditions.has(key)) {
            issues.push({
              severity: 'error',
              message: `Decision "${n.data.name}" has duplicate condition: "${key}"`,
              edgeId: e.id,
              nodeId: n.id,
            });
          } else {
            seenConditions.set(key, e.id);
          }
        }

        if (typeof e.data?.priority === 'number') {
          const p = e.data.priority;
          if (seenPriorities.has(p)) {
            issues.push({
              severity: 'warning',
              message: `Decision "${n.data.name}" has duplicate priority ${p} (evaluation order may be ambiguous)`,
              edgeId: e.id,
              nodeId: n.id,
            });
          } else {
            seenPriorities.set(p, e.id);
          }
        }
      });
    });

  // Merge node: must have >=2 incoming and exactly 1 outgoing
  nodes
    .filter((n) => n.type === 'merge')
    .forEach((n) => {
      const incoming = inc.get(n.id)?.length ?? 0;
      const outgoing = out.get(n.id)?.length ?? 0;
      if (incoming < 2) {
        issues.push({ severity: 'error', message: `Merge "${n.data.name}" must have ≥2 incoming branches`, nodeId: n.id });
      }
      if (outgoing !== 1) {
        issues.push({ severity: 'error', message: `Merge "${n.data.name}" must have exactly 1 outgoing transition`, nodeId: n.id });
      }
    });

  // Task must have assigned role
  nodes
    .filter((n) => n.type === 'task')
    .forEach((n) => {
      const roleId = n.data.assignedRoleId || n.data.config.assigneeId;
      if (!roleId) issues.push({ severity: 'error', message: `Task "${n.data.name}" is missing Assigned Role`, nodeId: n.id });
    });

  // Transition source compatibility (engine semantics)
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
  edges.forEach((e) => {
    const source = nodeById.get(e.source);
    const type = e.data?.connectionType ?? 'default';
    if (!source) return;

    if ((type === 'approve' || type === 'reject' || type === 'revision') && source.type !== 'task') {
      issues.push({
        severity: 'error',
        message: `Only Task nodes can emit "${type}" transitions`,
        nodeId: source.id,
        edgeId: e.id,
      });
    }
    if (type === 'timeout' && source.type !== 'timer') {
      issues.push({
        severity: 'error',
        message: 'Only Timer nodes can emit "timeout" transitions',
        nodeId: source.id,
        edgeId: e.id,
      });
    }
    if (type === 'escalate' && source.type !== 'escalation') {
      issues.push({
        severity: 'error',
        message: 'Only Escalation nodes can emit "escalate" transitions',
        nodeId: source.id,
        edgeId: e.id,
      });
    }
  });

  // Parallel split must connect to a join downstream (simplified)
  const joinIds = new Set(nodes.filter((n) => n.type === 'parallel-join').map((n) => n.id));
  nodes
    .filter((n) => n.type === 'parallel-split')
    .forEach((split) => {
      // Outgoing edges must be of type "parallel"
      edges
        .filter((e) => e.source === split.id)
        .forEach((e) => {
          if ((e.data?.connectionType ?? 'default') !== 'parallel') {
            issues.push({
              severity: 'error',
              message: `Parallel Split "${split.data.name}" outgoing transitions must be type "parallel"`,
              nodeId: split.id,
              edgeId: e.id,
            });
          }
        });

      const reach = reachableFrom(split.id, out);
      const hasJoin = [...joinIds].some((jid) => reach.has(jid));
      if (!hasJoin) {
        issues.push({ severity: 'error', message: `Parallel Split "${split.data.name}" must connect to a Parallel Join`, nodeId: split.id });
      }
    });

  // Execution metadata JSON must parse (if provided)
  edges.forEach((e) => {
    const raw = e.data?.executionMetaJson;
    if (!raw || !raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        issues.push({ severity: 'error', message: 'Execution metadata must be a JSON object', edgeId: e.id, nodeId: e.source });
      }
    } catch {
      issues.push({ severity: 'error', message: 'Execution metadata is not valid JSON', edgeId: e.id, nodeId: e.source });
    }
  });

  // Infinite loops without condition (cycle check)
  const cycles = detectCycles(nodes, edges);
  cycles.forEach((cycle) => {
    // allow cycle only if there's a decision in the cycle with some condition on an outgoing edge
    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
    const hasConditionedDecision = cycle.some((id) => {
      const node = nodeById.get(id);
      if (node?.type !== 'decision') return false;
      return edges.some((e) => e.source === id && (e.data?.condition?.trim() || e.data?.label?.trim()));
    });

    if (!hasConditionedDecision) {
      const label = cycle.map((id) => nodeById.get(id)?.data.name || id).join(' → ');
      issues.push({ severity: 'error', message: `Infinite loop detected without decision condition: ${label}`, nodeId: cycle[0] });
    }
  });

  return issues;
};

export const nodeTypesInIssues = (issues: ValidationIssue[]) => {
  const ids = new Set<string>();
  issues.forEach((i) => {
    if (i.nodeId) ids.add(i.nodeId);
  });
  return ids;
};

export const defaultNameForType = (type: NodeType) => {
  const names: Record<NodeType, string> = {
    start: 'Start',
    end: 'End',
    task: 'New Task',
    decision: 'Decision',
    merge: 'Merge',
    'parallel-split': 'Parallel Split',
    'parallel-join': 'Parallel Join',
    'sub-workflow': 'Sub-Workflow',
    timer: 'Timer',
    escalation: 'Escalation',
    notification: 'Notification',
  };
  return names[type];
};

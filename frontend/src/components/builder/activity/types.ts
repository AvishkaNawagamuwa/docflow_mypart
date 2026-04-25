import type { Edge, Node } from 'reactflow';
import type { AssignmentRule, ConnectionType, NodeConfig, NodeType } from '@/types/workflow';

export type ActivityNodeType = NodeType;

export type ActivitySourceHandleId =
  | 'default'
  | 'approve'
  | 'reject'
  | 'revision'
  | 'parallel'
  | 'timeout'
  | 'escalate';

export interface ActivityNodeData {
  name: string;
  description?: string;
  assignedRoleId?: string;
  config: NodeConfig;
  ui?: {
    hasError?: boolean;
    errorMessages?: string[];
    simulateWaiting?: boolean;
  };
}

export interface ActivityEdgeData {
  connectionType: ConnectionType;
  label?: string;
  condition?: string;
  isDefault?: boolean;
  priority?: number;
  style?: {
    dashed?: boolean;
  };
  executionMetaJson?: string;
  routeOffset?: number;
}

export type ActivityNode = Omit<Node<ActivityNodeData>, 'type'> & { type: ActivityNodeType };
export type ActivityEdgeModel = Omit<Edge<ActivityEdgeData>, 'type'> & { type: 'activity' };

export const connectionTypeFromSourceHandle = (
  sourceHandleId?: string | null
): ConnectionType => {
  switch (sourceHandleId as ActivitySourceHandleId) {
    case 'approve':
      return 'approve';
    case 'reject':
      return 'reject';
    case 'revision':
      return 'revision';
    case 'parallel':
      return 'parallel';
    case 'timeout':
      return 'timeout';
    case 'escalate':
      return 'escalate';
    default:
      return 'default';
  }
};

export const approvalIconFromRule = (rule?: AssignmentRule) => {
  switch (rule) {
    case 'all':
      return 'all';
    case 'first-response':
      return 'first';
    case 'single':
    default:
      return 'single';
  }
};

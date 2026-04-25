import type { ConnectionType, NodeType } from '@/types/workflow';

export const connectionStroke = (type: ConnectionType): string => {
  switch (type) {
    case 'approve':
      return 'hsl(var(--success))';
    case 'reject':
      return 'hsl(var(--destructive))';
    case 'revision':
      return 'hsl(var(--warning))';
    case 'parallel':
      return 'hsl(var(--node-parallel))';
    case 'timeout':
      return 'hsl(var(--warning))';
    case 'escalate':
      return 'hsl(var(--destructive))';
    case 'default':
    default:
      return 'hsl(var(--canvas-connector))';
  }
};

export const nodeAccent = (type: NodeType): string => {
  switch (type) {
    case 'start':
      return 'hsl(var(--node-start))';
    case 'end':
      return 'hsl(var(--node-end))';
    case 'task':
      return 'hsl(var(--node-task))';
    case 'decision':
      return 'hsl(var(--node-decision))';
    case 'parallel-split':
    case 'parallel-join':
      return 'hsl(var(--node-parallel))';
    case 'timer':
      return 'hsl(var(--warning))';
    case 'escalation':
      return 'hsl(var(--destructive))';
    case 'notification':
      return 'hsl(var(--info))';
    case 'sub-workflow':
      return 'hsl(var(--primary))';
    default:
      return 'hsl(var(--primary))';
  }
};

export const connectionLabel = (type: ConnectionType): string => {
  switch (type) {
    case 'approve':
      return 'Approve';
    case 'reject':
      return 'Reject';
    case 'revision':
      return 'Revision';
    case 'parallel':
      return 'Parallel';
    case 'timeout':
      return 'Timeout';
    case 'escalate':
      return 'Escalate';
    default:
      return '';
  }
};

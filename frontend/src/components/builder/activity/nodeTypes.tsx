import { memo, useMemo } from 'react';
import { Handle, NodeResizer, Position, useStore, type NodeProps } from 'reactflow';
import {
  Play,
  Square,
  CheckCircle2,
  GitBranch,
  Split,
  GitMerge,
  Workflow as WorkflowIcon,
  Timer,
  AlertTriangle,
  Bell,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { mockRoles } from '@/data/mockData';
import type { ActivityNode, ActivityNodeData, ActivityNodeType } from './types';

const useCounts = (nodeId: string) => {
  const edges = useStore((s) => s.edges);
  return useMemo(() => {
    const outgoing = edges.filter((e) => e.source === nodeId).length;
    const incoming = edges.filter((e) => e.target === nodeId).length;
    return { outgoing, incoming };
  }, [edges, nodeId]);
};

const RoleName = ({ roleId }: { roleId?: string }) => {
  const role = roleId ? mockRoles.find((r) => r.id === roleId) : undefined;
  return <span className="text-xs text-muted-foreground truncate">{role?.name || (roleId ? 'Assigned' : 'Unassigned')}</span>;
};

const ApprovalIcon = ({ rule }: { rule?: ActivityNodeData['config']['assignmentRule'] }) => {
  if (rule === 'all') return <Users className="h-4 w-4" />;
  if (rule === 'first-response') return <Zap className="h-4 w-4" />;
  return <UserCheck className="h-4 w-4" />;
};

export const StartNode = memo(function StartNode({ selected, data }: NodeProps<ActivityNodeData>) {
  return (
    <div
      className={cn(
        'relative h-14 w-14 rounded-full',
        'bg-node-start text-white',
        selected && 'ring-4 ring-primary/20'
      )}
      style={{ boxShadow: selected ? '0 12px 26px hsl(var(--node-start) / 0.25)' : '0 10px 22px hsl(var(--node-start) / 0.18)' }}
      aria-label={data.name}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Play className="h-6 w-6 translate-x-[1px]" />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className={cn('h-3 w-3 border-2 border-card bg-node-start')}
      />
    </div>
  );
});

export const EndNode = memo(function EndNode({ selected, data }: NodeProps<ActivityNodeData>) {
  return (
    <div
      className={cn('relative h-16 w-16 rounded-full', selected && 'ring-4 ring-primary/20')}
      style={{ boxShadow: selected ? '0 12px 26px hsl(var(--node-end) / 0.25)' : '0 10px 22px hsl(var(--node-end) / 0.18)' }}
      aria-label={data.name}
    >
      <div className="absolute inset-0 rounded-full border-[3px]" style={{ borderColor: 'hsl(var(--node-end))' }} />
      <div className="absolute inset-[7px] rounded-full border-[3px]" style={{ borderColor: 'hsl(var(--node-end))' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Square className="h-5 w-5" style={{ color: 'hsl(var(--node-end))' }} />
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className={cn('h-3 w-3 border-2 border-card')}
        style={{ background: 'hsl(var(--node-end))' }}
      />
    </div>
  );
});

export const TaskNode = memo(function TaskNode({ id, selected, data }: NodeProps<ActivityNodeData>) {
  const { outgoing } = useCounts(id);
  const sla = data.config.slaHours;

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-visible rounded-2xl',
        'border-2 bg-gradient-to-br from-node-task/15 to-node-task/5',
        selected ? 'shadow-lg' : 'shadow-md',
        data.ui?.hasError && 'ring-2 ring-destructive/60'
      )}
      style={{ borderColor: 'hsl(var(--node-task))' }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={110}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />
      <div className="flex items-center gap-2 border-b border-border/60 bg-card/40 px-3 py-2">
        <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--node-task))' }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.name}</div>
          <RoleName roleId={data.assignedRoleId || data.config.assigneeId} />
        </div>
        {sla ? (
          <Badge variant="secondary" className="border" style={{ borderColor: 'hsl(var(--warning))' }}>
            SLA {sla}h
          </Badge>
        ) : null}
      </div>

      <div className="relative px-3 py-2">
        {data.description ? (
          <div className="line-clamp-2 text-xs text-muted-foreground">{data.description}</div>
        ) : (
          <div className="text-xs text-muted-foreground">Task step</div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md border bg-card/60 px-1.5 py-1 text-muted-foreground">
          <ApprovalIcon rule={data.config.assignmentRule} />
        </div>

        {outgoing > 1 ? (
          <div className="absolute bottom-2 left-2 text-[11px] text-muted-foreground">
            {outgoing} transitions
          </div>
        ) : null}
      </div>

      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--canvas-connector))' }} />

      {/* Single outgoing (like Notification) */}
      <Handle type="source" id="default" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--node-task))' }} />
    </div>
  );
});

export const DecisionNode = memo(function DecisionNode({ id, selected, data }: NodeProps<ActivityNodeData>) {
  const { outgoing } = useCounts(id);

  return (
    <div className={cn('relative h-full w-full', selected && 'drop-shadow-lg')}>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={120}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br from-node-decision/20 to-node-decision/10',
          'shadow-md',
          data.ui?.hasError && 'ring-2 ring-destructive/60'
        )}
        style={{
          clipPath: 'polygon(50% 0%, 98% 50%, 50% 98%, 2% 50%)',
          border: '2px solid hsl(var(--node-decision))',
          borderRadius: 18,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <GitBranch className="h-6 w-6" style={{ color: 'hsl(var(--node-decision))' }} />
        <div className="mt-2 max-w-[110px] truncate text-sm font-semibold text-foreground">{data.name}</div>
      </div>

      <div className="absolute right-1 top-1">
        <Badge variant="secondary" className="border" style={{ borderColor: 'hsl(var(--node-decision))' }}>
          {Math.max(0, outgoing)}
        </Badge>
      </div>

      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--canvas-connector))' }} />
      <Handle
        type="source"
        id="branch-left"
        position={Position.Bottom}
        className="h-3 w-3 border-2 border-card"
        style={{ left: '28%', background: 'hsl(var(--node-decision))' }}
      />
      <Handle
        type="source"
        id="default"
        position={Position.Bottom}
        className="h-3 w-3 border-2 border-card"
        style={{ left: '50%', background: 'hsl(var(--node-decision))' }}
      />
      <Handle
        type="source"
        id="branch-right"
        position={Position.Bottom}
        className="h-3 w-3 border-2 border-card"
        style={{ left: '72%', background: 'hsl(var(--node-decision))' }}
      />
    </div>
  );
});

export const MergeNode = memo(function MergeNode({ id, selected, data }: NodeProps<ActivityNodeData>) {
  const { incoming } = useCounts(id);

  return (
    <div className={cn('relative h-full w-full', selected && 'drop-shadow-lg')}>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={120}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />

      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br from-node-decision/10 to-node-decision/5',
          'shadow-md',
          data.ui?.hasError && 'ring-2 ring-destructive/60'
        )}
        style={{
          clipPath: 'polygon(50% 0%, 98% 50%, 50% 98%, 2% 50%)',
          border: '2px solid hsl(var(--node-decision))',
          borderRadius: 18,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <GitMerge className="h-6 w-6" style={{ color: 'hsl(var(--node-decision))' }} />
        <div className="mt-2 max-w-[110px] truncate text-sm font-semibold text-foreground">{data.name}</div>
      </div>

      <div className="absolute left-1 top-1">
        <Badge variant="secondary" className="border" style={{ borderColor: 'hsl(var(--node-decision))' }}>
          {Math.max(0, incoming)}
        </Badge>
      </div>

      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--canvas-connector))' }} />
      <Handle type="source" id="default" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--node-decision))' }} />
    </div>
  );
});

export const ParallelSplitNode = memo(function ParallelSplitNode({ id, selected, data }: NodeProps<ActivityNodeData>) {
  const { outgoing } = useCounts(id);
  return (
    <div
      className={cn(
        'relative h-full w-full rounded-full',
        'bg-gradient-to-br from-node-parallel/25 to-node-parallel/10',
        'border-2 shadow-md',
        selected && 'shadow-lg',
        data.ui?.hasError && 'ring-2 ring-destructive/60'
      )}
      style={{ borderColor: 'hsl(var(--node-parallel))' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Split className="h-6 w-6" style={{ color: 'hsl(var(--node-parallel))' }} />
      </div>
      <div className="absolute -right-2 -top-2">
        <Badge variant="secondary" className="border" style={{ borderColor: 'hsl(var(--node-parallel))' }}>
          {outgoing}
        </Badge>
      </div>
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--node-parallel))' }} />
      <Handle type="source" id="parallel" position={Position.Bottom} className={cn('h-3 w-3 border-2 border-card', selected && 'animate-pulse')} style={{ background: 'hsl(var(--node-parallel))' }} />
    </div>
  );
});

export const ParallelJoinNode = memo(function ParallelJoinNode({ selected, data }: NodeProps<ActivityNodeData>) {
  const waiting = data.ui?.simulateWaiting;
  return (
    <div
      className={cn(
        'relative h-full w-full rounded-full',
        'bg-gradient-to-br from-node-parallel/25 to-node-parallel/10',
        'border-2 shadow-md',
        selected && 'shadow-lg',
        waiting && 'ring-4 ring-node-parallel/25',
        data.ui?.hasError && 'ring-2 ring-destructive/60'
      )}
      style={{
        borderColor: 'hsl(var(--node-parallel))',
        boxShadow: waiting ? '0 0 18px hsl(var(--node-parallel) / 0.45)' : undefined,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <GitMerge className="h-6 w-6" style={{ color: 'hsl(var(--node-parallel))' }} />
      </div>
      <Handle type="target" position={Position.Top} className={cn('h-3 w-3 border-2 border-card', waiting && 'animate-pulse')} style={{ background: 'hsl(var(--node-parallel))' }} />
      <Handle type="source" id="default" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--node-parallel))' }} />
    </div>
  );
});

export const TimerNode = memo(function TimerNode({ selected, data }: NodeProps<ActivityNodeData>) {
  return (
    <div
      className={cn(
        'relative h-full w-full rounded-full border-2',
        'bg-gradient-to-br from-warning/25 to-warning/10',
        selected ? 'shadow-lg' : 'shadow-md',
        data.ui?.hasError && 'ring-2 ring-destructive/60'
      )}
      style={{ borderColor: 'hsl(var(--warning))' }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={54}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />
      <div className="flex items-center gap-2 px-3 py-2">
        <Timer className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.name}</div>
          <div className="text-xs text-muted-foreground">
            {data.config.timerDuration ? `${data.config.timerDuration} ${data.config.timerUnit ?? 'hours'}` : 'Duration not set'}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--warning))' }} />
      <Handle type="source" id="timeout" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--warning))' }} />
    </div>
  );
});

export const EscalationNode = memo(function EscalationNode({ selected, data }: NodeProps<ActivityNodeData>) {
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden',
        'rounded-xl border-2',
        'bg-gradient-to-br from-destructive/25 to-warning/10',
        selected ? 'shadow-lg' : 'shadow-md',
        data.ui?.hasError && 'ring-2 ring-destructive/60'
      )}
      style={{
        borderColor: 'hsl(var(--destructive))',
        clipPath: 'polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 4% 50%)',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={60}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />
      <div className="flex items-center gap-2 px-3 py-2">
        <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--destructive))' }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.name}</div>
          <div className="text-xs text-muted-foreground">Escalation rule</div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--destructive))' }} />
      <Handle type="source" id="escalate" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--destructive))' }} />
    </div>
  );
});

export const NotificationNode = memo(function NotificationNode({ selected, data }: NodeProps<ActivityNodeData>) {
  return (
    <div
      className={cn(
        'relative h-full w-full rounded-2xl border-2',
        'bg-gradient-to-br from-info/20 to-info/10',
        selected ? 'shadow-lg' : 'shadow-md',
        data.ui?.hasError && 'ring-2 ring-destructive/60'
      )}
      style={{ borderColor: 'hsl(var(--info))' }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={60}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />
      <div className="flex items-center gap-2 px-3 py-2">
        <Bell className="h-4 w-4" style={{ color: 'hsl(var(--info))' }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{data.name}</div>
          <div className="text-xs text-muted-foreground">{data.config.notificationType ?? 'email'} notification</div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--info))' }} />
      <Handle type="source" id="default" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--info))' }} />
    </div>
  );
});

export const SubWorkflowNode = memo(function SubWorkflowNode({ selected, data }: NodeProps<ActivityNodeData>) {
  return (
    <div className={cn('relative h-full w-full', selected ? 'shadow-lg' : 'shadow-md')}>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={70}
        handleClassName="!border-border !bg-card"
        lineClassName="!border-primary/40"
      />
      <div
        className={cn('absolute -left-1 -top-1 h-full w-full rounded-2xl border bg-card/30')}
        style={{ borderColor: 'hsl(var(--primary) / 0.35)' }}
      />
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2',
          'bg-gradient-to-br from-primary/15 to-primary/5',
          data.ui?.hasError && 'ring-2 ring-destructive/60'
        )}
        style={{ borderColor: 'hsl(var(--primary))' }}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <WorkflowIcon className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{data.name}</div>
            <div className="text-xs text-muted-foreground">Sub-workflow call</div>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--primary))' }} />
      <Handle type="source" id="default" position={Position.Bottom} className="h-3 w-3 border-2 border-card" style={{ background: 'hsl(var(--primary))' }} />
    </div>
  );
});

export const activityNodeTypes: Record<ActivityNodeType, React.ComponentType<NodeProps<ActivityNodeData>>> = {
  start: StartNode,
  end: EndNode,
  task: TaskNode,
  decision: DecisionNode,
  merge: MergeNode,
  'parallel-split': ParallelSplitNode,
  'parallel-join': ParallelJoinNode,
  'sub-workflow': SubWorkflowNode,
  timer: TimerNode,
  escalation: EscalationNode,
  notification: NotificationNode,
};

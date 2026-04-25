import { 
  Play, 
  Square, 
  CheckCircle, 
  GitBranch, 
  Layers,
  Clock,
  FileText,
  Upload,
  GitMerge,
  Workflow,
  AlertTriangle,
  Bell,
  Timer,
  Split
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeType } from '@/types/workflow';

interface NodePaletteItem {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'core' | 'advanced';
}

const paletteItems: NodePaletteItem[] = [
  // Core Nodes
  {
    type: 'start',
    label: 'Start',
    description: 'Workflow entry point',
    icon: Play,
    color: 'bg-node-start',
    category: 'core',
  },
  {
    type: 'task',
    label: 'Task Step',
    description: 'Approval, review, or data entry',
    icon: CheckCircle,
    color: 'bg-node-task',
    category: 'core',
  },
  {
    type: 'decision',
    label: 'Decision',
    description: 'Route based on conditions',
    icon: GitBranch,
    color: 'bg-node-decision',
    category: 'core',
  },
  {
    type: 'merge',
    label: 'Merge',
    description: 'Join decision branches',
    icon: GitMerge,
    color: 'bg-node-decision',
    category: 'core',
  },
  {
    type: 'parallel-split',
    label: 'Parallel Split',
    description: 'Execute branches simultaneously',
    icon: Split,
    color: 'bg-node-parallel',
    category: 'core',
  },
  {
    type: 'parallel-join',
    label: 'Parallel Join',
    description: 'Wait for parallel branches',
    icon: GitMerge,
    color: 'bg-node-parallel',
    category: 'core',
  },
  {
    type: 'end',
    label: 'End',
    description: 'Workflow completion',
    icon: Square,
    color: 'bg-node-end',
    category: 'core',
  },
  // Advanced Nodes
  {
    type: 'sub-workflow',
    label: 'Sub-Workflow',
    description: 'Call another workflow',
    icon: Workflow,
    color: 'bg-purple-500',
    category: 'advanced',
  },
  {
    type: 'timer',
    label: 'Timer / SLA',
    description: 'Delay or enforce deadline',
    icon: Timer,
    color: 'bg-amber-500',
    category: 'advanced',
  },
  {
    type: 'escalation',
    label: 'Escalation',
    description: 'Escalate to higher authority',
    icon: AlertTriangle,
    color: 'bg-red-500',
    category: 'advanced',
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send notifications',
    icon: Bell,
    color: 'bg-indigo-500',
    category: 'advanced',
  },
];

interface NodePaletteProps {
  onDragStart: (type: NodeType) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const coreNodes = paletteItems.filter(item => item.category === 'core');
  const advancedNodes = paletteItems.filter(item => item.category === 'advanced');

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Components</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag and drop to canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Core Nodes */}
        <div className="space-y-2">
          {coreNodes.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('nodeType', item.type);
                onDragStart(item.type);
              }}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border border-border cursor-grab",
                "hover:border-primary/50 hover:bg-muted/50 transition-all",
                "active:cursor-grabbing"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.color)}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Nodes */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Advanced Nodes
          </div>
          <div className="space-y-2">
            {advancedNodes.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('nodeType', item.type);
                  onDragStart(item.type);
                }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border border-border cursor-grab",
                  "hover:border-primary/50 hover:bg-muted/50 transition-all",
                  "active:cursor-grabbing"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.color)}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Connect nodes by dragging from output ports to input ports.
        </div>
      </div>
    </div>
  );
}

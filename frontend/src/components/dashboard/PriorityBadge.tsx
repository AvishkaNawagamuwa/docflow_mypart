import { cn } from '@/lib/utils';

const priorityStyles: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full capitalize', priorityStyles[priority] || priorityStyles.low)}>
      {priority}
    </span>
  );
}

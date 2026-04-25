import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-warning/10', text: 'text-warning' },
  'in-progress': { bg: 'bg-info/10', text: 'text-info' },
  completed: { bg: 'bg-success/10', text: 'text-success' },
  overdue: { bg: 'bg-destructive/10', text: 'text-destructive' },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive' },
  'sent-back': { bg: 'bg-warning/10', text: 'text-warning' },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
  'in-workflow': { bg: 'bg-primary/10', text: 'text-primary' },
  active: { bg: 'bg-success/10', text: 'text-success' },
  disabled: { bg: 'bg-muted', text: 'text-muted-foreground' },
  archived: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize', config.bg, config.text, className)}>
      {status.replace('-', ' ')}
    </span>
  );
}

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface SlaCountdownProps {
  deadline: Date;
  className?: string;
  compact?: boolean;
}

export function SlaCountdown({ deadline, className, compact }: SlaCountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const diff = deadline.getTime() - now.getTime();
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff / 3600000);
  const minutes = Math.floor((absDiff % 3600000) / 60000);

  const isDueSoon = !isOverdue && diff < 4 * 3600000;

  const label = isOverdue
    ? `${hours}h ${minutes}m overdue`
    : `${hours}h ${minutes}m remaining`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
        isOverdue && 'bg-destructive/10 text-destructive',
        isDueSoon && !isOverdue && 'bg-warning/10 text-warning',
        !isOverdue && !isDueSoon && 'bg-success/10 text-success',
        className
      )}
    >
      {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {compact ? `${hours}h` : label}
    </span>
  );
}

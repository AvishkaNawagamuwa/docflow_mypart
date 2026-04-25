import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineEvent } from '@/types/workflow';

interface InstanceTimelineProps {
  events: TimelineEvent[];
}

const actionIcons: Record<string, React.ElementType> = {
  'Workflow Started': ArrowRight,
  'Workflow Completed': CheckCircle,
  'Task Assigned': User,
  'Task Approved': CheckCircle,
  'Task Rejected': XCircle,
  'Document Submitted': FileText,
  'Auto-Assigned': ArrowRight,
  'Approved': CheckCircle,
  'Manager Approved': CheckCircle,
  'Rejected': XCircle,
  'Verification Completed': CheckCircle,
  'Invoice Uploaded': FileText,
  'Escalated to CFO': AlertTriangle,
  default: Clock,
};

const actionColors: Record<string, string> = {
  'Workflow Started': 'bg-primary text-primary-foreground',
  'Workflow Completed': 'bg-success text-success-foreground',
  'Task Assigned': 'bg-info text-info-foreground',
  'Task Approved': 'bg-success text-success-foreground',
  'Task Rejected': 'bg-destructive text-destructive-foreground',
  'Document Submitted': 'bg-primary text-primary-foreground',
  'Approved': 'bg-success text-success-foreground',
  'Manager Approved': 'bg-success text-success-foreground',
  'Verification Completed': 'bg-success text-success-foreground',
  'Rejected': 'bg-destructive text-destructive-foreground',
  'Escalated to CFO': 'bg-warning text-warning-foreground',
  default: 'bg-muted text-muted-foreground',
};

export function InstanceTimeline({ events }: InstanceTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = actionIcons[event.action] || actionIcons.default;
        const colorClass = actionColors[event.action] || actionColors.default;

        return (
          <div key={event.id} className="timeline-item">
            <div className={cn("timeline-dot", colorClass)}>
              <Icon className="w-3 h-3" />
            </div>

            <div className="pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{event.action}</span>
                <span className="text-xs text-muted-foreground">
                  {format(event.timestamp, 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                {event.actor}
              </div>

              {event.comment && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-foreground flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  {event.comment}
                </div>
              )}

              {event.attachments && event.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.attachments.map((file, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-xs text-muted-foreground"
                    >
                      <FileText className="w-3 h-3" />
                      {file}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

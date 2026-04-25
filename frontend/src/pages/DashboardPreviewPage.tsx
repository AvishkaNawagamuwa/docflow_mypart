import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PriorityBadge } from '@/components/dashboard/PriorityBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { DashboardTemplate, WidgetConfig, WIDGET_LIBRARY, mockDashboardTemplates } from '@/data/mockDashboardBuilder';
import { mockTasks, mockDashboardDocuments, mockNotifications, mockBottlenecks, mockUserPerformance } from '@/data/mockDashboardData';
import { ArrowLeft, ClipboardList, CheckSquare, AlertTriangle, RotateCcw, CheckCircle, FileText, PieChart, Upload, HelpCircle, ShieldAlert, Calendar, CalendarDays, Timer, Activity, BarChart3, Gauge, Clock, Users, Building2, Bell, Hash, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardList, CheckSquare, AlertTriangle, RotateCcw, CheckCircle,
  FileText, PieChart, Upload, HelpCircle, ShieldAlert, Calendar, CalendarDays,
  Timer, Activity, BarChart3, Gauge, Clock, Users, Building2, Bell, Hash, LineChart,
};

function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const def = WIDGET_LIBRARY.find((w) => w.type === widget.widgetType);
  const Icon = def ? ICON_MAP[def.icon] || HelpCircle : HelpCircle;

  // Mock data rendering per widget type
  switch (widget.widgetType) {
    case 'my_pending_tasks':
    case 'approvals_waiting': {
      const tasks = mockTasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').slice(0, 5);
      return (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{t.documentName}</p>
                <p className="text-[10px] text-muted-foreground">{t.workflowStep}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={t.priority} />
                <SlaCountdown deadline={t.dueTime} compact />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case 'overdue_tasks': {
      const count = mockTasks.filter((t) => t.status === 'overdue').length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-destructive">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">overdue tasks</p>
        </div>
      );
    }
    case 'revision_required': {
      const count = mockTasks.filter((t) => t.status === 'sent-back').length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-warning">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">revisions needed</p>
        </div>
      );
    }
    case 'completed_today': {
      const count = mockTasks.filter((t) => t.status === 'completed').length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-success">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">completed</p>
        </div>
      );
    }
    case 'my_documents': {
      const docs = mockDashboardDocuments.slice(0, 5);
      return (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div>
                <p className="text-xs font-medium text-foreground">{d.name}</p>
                <p className="text-[10px] text-muted-foreground">{d.type} • {d.currentStep}</p>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      );
    }
    case 'documents_by_status': {
      const statuses = ['draft', 'in-workflow', 'completed', 'rejected'];
      return (
        <div className="space-y-3">
          {statuses.map((s) => {
            const count = mockDashboardDocuments.filter((d) => d.status === s).length;
            const pct = Math.round((count / Math.max(mockDashboardDocuments.length, 1)) * 100);
            return (
              <div key={s} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs capitalize text-foreground">{s.replace('-', ' ')}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </div>
      );
    }
    case 'recently_uploaded': {
      const docs = [...mockDashboardDocuments].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()).slice(0, 4);
      return (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div>
                <p className="text-xs font-medium text-foreground">{d.name}</p>
                <p className="text-[10px] text-muted-foreground">{d.uploadedAt.toLocaleDateString()}</p>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      );
    }
    case 'sla_breaches': {
      const count = mockTasks.filter((t) => t.status === 'overdue').length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-destructive">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">SLA breaches</p>
        </div>
      );
    }
    case 'due_today': {
      const count = mockTasks.filter((t) => {
        const diff = t.dueTime.getTime() - Date.now();
        return diff > 0 && diff < 24 * 3600000;
      }).length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-warning">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">due today</p>
        </div>
      );
    }
    case 'due_this_week': {
      const count = mockTasks.filter((t) => {
        const diff = t.dueTime.getTime() - Date.now();
        return diff > 0 && diff < 7 * 24 * 3600000;
      }).length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-info">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">due this week</p>
        </div>
      );
    }
    case 'avg_completion_time': {
      const avg = mockUserPerformance.reduce((s, u) => s + u.avgCompletionHours, 0) / mockUserPerformance.length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-primary">{avg.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-1">avg completion</p>
        </div>
      );
    }
    case 'workflow_instances_running': {
      const running = mockTasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').length;
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-primary">{running}</p>
          <p className="text-xs text-muted-foreground mt-1">running</p>
        </div>
      );
    }
    case 'bottleneck_steps': {
      return (
        <div className="space-y-2">
          {mockBottlenecks.slice(0, 4).map((b) => (
            <div key={b.stepName} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div>
                <p className="text-xs font-medium text-foreground">{b.stepName}</p>
                <p className="text-[10px] text-muted-foreground">{b.taskCount} tasks • {b.slaBreachRate}% breach</p>
              </div>
              <span className="text-xs font-semibold text-warning">{b.avgHours.toFixed(0)}h avg</span>
            </div>
          ))}
        </div>
      );
    }
    case 'user_performance': {
      return (
        <div className="space-y-2">
          {mockUserPerformance.slice(0, 5).map((u) => (
            <div key={u.userId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div>
                <p className="text-xs font-medium text-foreground">{u.userName}</p>
                <p className="text-[10px] text-muted-foreground">{u.tasksCompleted} tasks • {u.avgCompletionHours}h avg</p>
              </div>
              <span className={cn('text-xs font-semibold', u.onTimeRate >= 95 ? 'text-success' : u.onTimeRate >= 90 ? 'text-warning' : 'text-destructive')}>{u.onTimeRate}%</span>
            </div>
          ))}
        </div>
      );
    }
    case 'recent_notifications': {
      const notifs = mockNotifications.filter((n) => !n.read).slice(0, 5);
      return (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} className="flex items-start gap-2 p-2 rounded-md bg-primary/5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-primary shrink-0" />
              <div>
                <p className="text-xs text-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{n.createdAt.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    case 'aging_documents': {
      const stuck = mockTasks.filter((t) => t.status === 'overdue' || t.status === 'pending');
      return (
        <div className="space-y-2">
          {stuck.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div>
                <p className="text-xs font-medium text-foreground">{t.documentName}</p>
                <p className="text-[10px] text-muted-foreground">{t.workflowStep}</p>
              </div>
              <SlaCountdown deadline={t.dueTime} compact />
            </div>
          ))}
        </div>
      );
    }
    case 'completed_vs_rejected': {
      const completed = mockTasks.filter((t) => t.status === 'completed').length;
      const rejected = mockTasks.filter((t) => t.status === 'rejected').length;
      const total = completed + rejected || 1;
      return (
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-foreground">Completed</span><span className="text-success font-medium">{completed}</span></div>
            <Progress value={(completed / total) * 100} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span className="text-foreground">Rejected</span><span className="text-destructive font-medium">{rejected}</span></div>
            <Progress value={(rejected / total) * 100} className="h-2" />
          </div>
        </div>
      );
    }
    case 'custom_kpi': {
      return (
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-3xl font-bold text-primary">42</p>
          <p className="text-xs text-muted-foreground mt-1">Custom KPI</p>
        </div>
      );
    }
    default:
      return (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Icon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs">{widget.title}</p>
        </div>
      );
  }
}

export default function DashboardPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const template = mockDashboardTemplates.find((t) => t.id === id) || mockDashboardTemplates[0];
  const enabledWidgets = template.widgets.filter((w) => w.enabled);

  return (
    <MainLayout title={`Preview: ${template.name}`} subtitle="Dynamic dashboard preview">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard-templates')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{template.name}</h2>
              <p className="text-xs text-muted-foreground">{template.description} • {enabledWidgets.length} widgets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {template.assignedRoles.map((r) => (
              <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
            ))}
            <Button variant="outline" onClick={() => navigate(`/dashboard-builder/${template.id}`)}>Edit</Button>
          </div>
        </div>

        {/* Render widgets in a responsive grid based on their configured width */}
        <div className="grid grid-cols-12 gap-4">
          {enabledWidgets.map((widget) => {
            const def = WIDGET_LIBRARY.find((w) => w.type === widget.widgetType);
            const Icon = def ? ICON_MAP[def.icon] || HelpCircle : HelpCircle;
            const colSpan = Math.min(12, Math.max(3, widget.width));
            return (
              <div key={widget.id} className={`col-span-12 md:col-span-${colSpan}`} style={{ gridColumn: `span ${colSpan}` }}>
                <Card className="enterprise-card h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-primary" />
                      {widget.title}
                      <Badge variant="outline" className="text-[10px] ml-auto py-0">{widget.dataScope.replace('_', ' ')}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WidgetRenderer widget={widget} />
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

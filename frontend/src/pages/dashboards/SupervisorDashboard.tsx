import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { mockTasks, mockUserPerformance, mockBottlenecks, mockAuditEvents } from '@/data/mockDashboardData';
import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Clock, BarChart3, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupervisorDashboard() {
  const { user } = useAuth();

  const allTasks = mockTasks;
  const running = allTasks.filter((t) => t.status === 'pending' || t.status === 'in-progress');
  const completedToday = allTasks.filter((t) => t.status === 'completed');
  const rejected = allTasks.filter((t) => t.status === 'rejected');
  const overdue = allTasks.filter((t) => t.status === 'overdue');
  const slaBreaches = overdue.length;

  const stuck = allTasks.filter((t) => {
    const age = (Date.now() - t.dueTime.getTime()) / 86400000;
    return t.status !== 'completed' && t.status !== 'rejected' && age > 0;
  });

  return (
    <MainLayout title="Management Dashboard" subtitle="Workflow system performance overview (read-only)">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Running Instances', value: running.length, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Completed Today', value: completedToday.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Rejected', value: rejected.length, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'SLA Breaches', value: slaBreaches, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'Avg Processing', value: '6.8h', icon: Clock, color: 'text-info', bg: 'bg-info/10' },
          ].map((s) => (
            <Card key={s.label} className="enterprise-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  </div>
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.bg)}>
                    <s.icon className={cn('w-5 h-5', s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bottleneck Steps */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Bottleneck Steps</CardTitle>
              <CardDescription>Steps with highest average processing time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBottlenecks.map((step) => (
                  <div key={step.stepName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{step.stepName}</span>
                      <span className="text-xs text-muted-foreground">{step.avgHours.toFixed(1)}h avg • {step.slaBreachRate}% breach</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={Math.min(step.avgHours / 40 * 100, 100)} className="flex-1" />
                      <span className={cn(
                        'text-xs font-medium w-12 text-right',
                        step.slaBreachRate > 20 ? 'text-destructive' : step.slaBreachRate > 10 ? 'text-warning' : 'text-success'
                      )}>
                        {step.taskCount} tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> SLA Compliance by User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUserPerformance.map((u) => (
                  <div key={u.userId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{u.userName}</span>
                      <span className="text-xs text-muted-foreground">{u.slaBreaches} breaches</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={u.onTimeRate} className="flex-1" />
                      <span className={cn(
                        'text-sm font-medium w-10 text-right',
                        u.onTimeRate >= 95 ? 'text-success' : u.onTimeRate >= 90 ? 'text-warning' : 'text-destructive'
                      )}>
                        {u.onTimeRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stuck Documents */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Stuck Documents</CardTitle>
            <CardDescription>Documents that have exceeded their SLA deadline</CardDescription>
          </CardHeader>
          <CardContent>
            {stuck.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success" />
                <p>No stuck documents. Great performance!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Document</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Current Step</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Assigned</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Overdue By</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stuck.map((task) => (
                      <tr key={task.id} className="border-b border-border/50 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                        <td className="py-3 px-2 font-medium text-foreground">{task.documentName}</td>
                        <td className="py-3 px-2 text-muted-foreground">{task.workflowStep}</td>
                        <td className="py-3 px-2 text-muted-foreground">{task.assignedUser}</td>
                        <td className="py-3 px-2"><SlaCountdown deadline={task.dueTime} /></td>
                        <td className="py-3 px-2"><StatusBadge status={task.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Performance */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tasks Completed</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Avg Time</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">SLA Breaches</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUserPerformance.map((u) => (
                    <tr key={u.userId} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-medium text-foreground">{u.userName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.tasksCompleted}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.avgCompletionHours.toFixed(1)}h</td>
                      <td className="py-3 px-2">
                        <span className={cn('font-medium', u.slaBreaches > 2 ? 'text-destructive' : u.slaBreaches > 0 ? 'text-warning' : 'text-success')}>
                          {u.slaBreaches}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={cn('font-medium', u.onTimeRate >= 95 ? 'text-success' : u.onTimeRate >= 90 ? 'text-warning' : 'text-destructive')}>
                          {u.onTimeRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Trail */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Recent Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAuditEvents.slice(0, 6).map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{evt.user}</span> — {evt.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{evt.documentName}{evt.details ? ` • ${evt.details}` : ''}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{evt.timestamp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

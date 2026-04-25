import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  Play,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { workflowApi, type ApiWorkflow, type ApiWorkflowInstance, type ApiTaskInstance } from '@/lib/workflowApi';

const statCardBase = 'enterprise-card';

const statusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'running':
      return 'success' as const;
    case 'draft':
    case 'pending':
      return 'warning' as const;
    case 'completed':
      return 'success' as const;
    case 'rejected':
    case 'failed':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<ApiWorkflow[]>([]);
  const [instances, setInstances] = useState<ApiWorkflowInstance[]>([]);
  const [tasks, setTasks] = useState<ApiTaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [manualWorkflowId, setManualWorkflowId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [payload, setPayload] = useState('{}');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [workflowData, instanceData, taskData] = await Promise.all([
          workflowApi.listWorkflows(),
          workflowApi.listWorkflowInstances(),
          workflowApi.listTaskInstances(),
        ]);
        setWorkflows(workflowData);
        setInstances(instanceData);
        setTasks(taskData);
        if (!manualWorkflowId) {
          const firstManual = workflowData.find((workflow) => workflow.trigger === 'manual' && !['archived', 'disabled'].includes(workflow.status));
          if (firstManual) {
            setManualWorkflowId(firstManual.uuid);
            setDocumentType(firstManual.documentType || 'Document');
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load workflow data';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [manualWorkflowId]);

  const manualWorkflows = useMemo(
    () => workflows.filter((workflow) => workflow.trigger === 'manual' && !['archived', 'disabled'].includes(workflow.status)),
    [workflows]
  );

  const activeWorkflows = workflows.filter((workflow) => workflow.status === 'active').length;
  const documentsInProgress = instances.filter((instance) => !['completed', 'rejected', 'failed'].includes(instance.status.toLowerCase())).length;
  const pendingApprovals = tasks.filter((task) => task.status.toLowerCase() === 'pending').length;
  const completedThisWeek = instances.filter((instance) => {
    if (!instance.completedAt) return false;
    const completed = new Date(instance.completedAt);
    const now = new Date();
    return now.getTime() - completed.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const recentActivity = useMemo(() => {
    return instances
      .flatMap((instance) =>
        instance.timeline.map((event) => ({
          ...event,
          workflowName: instance.workflowName,
          documentName: instance.documentName,
        }))
      )
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 5);
  }, [instances]);

  const workflowPerformance = useMemo(() => {
    return workflows.map((workflow) => {
      const relatedInstances = instances.filter((instance) => instance.workflowId === workflow.workflowId);
      const finishedInstances = relatedInstances.filter((instance) => instance.completedAt);
      const completion = relatedInstances.length === 0 ? 0 : Math.round((finishedInstances.length / relatedInstances.length) * 100);
      const averageHours =
        finishedInstances.length === 0
          ? null
          : finishedInstances.reduce((total, instance) => {
            const started = new Date(instance.startedAt).getTime();
            const completed = new Date(instance.completedAt as string).getTime();
            return total + (completed - started) / 3600000;
          }, 0) / finishedInstances.length;

      return {
        workflow,
        completion,
        avgTime: averageHours === null ? 'No completions yet' : `${(averageHours / 24).toFixed(1)} days`,
      };
    });
  }, [instances, workflows]);

  const openStartDialog = () => {
    const firstManual = manualWorkflows[0];
    setManualWorkflowId(firstManual ? firstManual.uuid : '');
    setDocumentName(firstManual?.documentType ? `${firstManual.documentType} #${Date.now().toString().slice(-4)}` : '');
    setDocumentType(firstManual?.documentType || '');
    setStartOpen(true);
  };

  const handleStartWorkflow = async () => {
    if (!manualWorkflowId) {
      toast.error('Select a manual workflow first');
      return;
    }

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = payload.trim() ? JSON.parse(payload) : {};
    } catch {
      toast.error('Payload must be valid JSON');
      return;
    }

    setStarting(true);
    try {
      await workflowApi.startWorkflow(manualWorkflowId, {
        documentName,
        documentType,
        payload: parsedPayload,
      });
      toast.success('Workflow started');
      setStartOpen(false);
      const [workflowData, instanceData, taskData] = await Promise.all([
        workflowApi.listWorkflows(),
        workflowApi.listWorkflowInstances(),
        workflowApi.listTaskInstances(),
      ]);
      setWorkflows(workflowData);
      setInstances(instanceData);
      setTasks(taskData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start workflow';
      toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <MainLayout
      title="Dashboard"
      subtitle="Overview of your document workflow system"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Live backend data from Django. Manual workflows can be started here.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/instances')}>
              <Activity className="w-4 h-4 mr-2" />View Progress
            </Button>
            <Button onClick={openStartDialog} disabled={manualWorkflows.length === 0}>
              <Play className="w-4 h-4 mr-2" />Start Workflow
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active Workflows', value: activeWorkflows, change: `${manualWorkflows.length} manual`, icon: GitBranch, color: 'text-primary', bgColor: 'bg-primary/10' },
            { label: 'Documents in Progress', value: documentsInProgress, change: 'Workflow instances running', icon: FileText, color: 'text-info', bgColor: 'bg-info/10' },
            { label: 'Pending Approvals', value: pendingApprovals, change: 'Task instances waiting', icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10' },
            { label: 'Completed This Week', value: completedThisWeek, change: 'Live from workflow history', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' },
          ].map((stat) => (
            <Card key={stat.label} className="enterprise-card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bgColor)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest workflow timeline events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-sm text-muted-foreground">No workflow activity yet.</div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.workflowName} • {activity.documentName} • {activity.actor}
                        </p>
                        {activity.comment && <p className="text-xs text-muted-foreground mt-1">{activity.comment}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{format(new Date(activity.timestamp), 'MMM dd, HH:mm')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Workflow Performance
              </CardTitle>
              <CardDescription>Completion rates and average durations from live instances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowPerformance.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No workflows available.</div>
                ) : (
                  workflowPerformance.map(({ workflow, completion, avgTime }) => (
                    <div key={workflow.workflowId} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground block truncate">{workflow.name}</span>
                          <span className="text-xs text-muted-foreground">{workflow.trigger === 'manual' ? 'Manual workflow' : workflow.trigger}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Avg: {avgTime}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={completion} className="flex-1" />
                        <span className={cn(
                          'text-sm font-medium w-10 text-right',
                          completion >= 90 ? 'text-success' : completion >= 75 ? 'text-warning' : 'text-destructive'
                        )}>
                          {completion}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common workflow actions backed by the backend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Start Manual Workflow', icon: Play, onClick: openStartDialog },
                { label: 'Upload Document', icon: FileText, path: '/documents' },
                { label: 'View Progress', icon: Clock, path: '/instances' },
                { label: 'Manage Roles', icon: Users, path: '/roles' },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={'onClick' in action ? action.onClick : () => navigate(action.path as string)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={startOpen} onOpenChange={setStartOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Manual Workflow</DialogTitle>
              <DialogDescription>Select a manual workflow and start it from the real backend.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Workflow</Label>
                <Select value={manualWorkflowId} onValueChange={(value) => {
                  setManualWorkflowId(value);
                  const selected = manualWorkflows.find((workflow) => workflow.uuid === value);
                  if (selected) {
                    setDocumentType(selected.documentType || '');
                    setDocumentName(selected.documentType ? `${selected.documentType} #${Date.now().toString().slice(-4)}` : '');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manual workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualWorkflows.map((workflow) => (
                      <SelectItem key={workflow.uuid} value={workflow.uuid}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="e.g. PO-2026-0001.pdf" />
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="e.g. Purchase Order" />
              </div>
              <div className="space-y-2">
                <Label>Payload JSON</Label>
                <Input value={payload} onChange={(event) => setPayload(event.target.value)} placeholder='{"amount": 1200}' />
                <p className="text-xs text-muted-foreground">Optional workflow payload. Leave as { } if not needed.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStartOpen(false)}>Cancel</Button>
              <Button onClick={handleStartWorkflow} disabled={starting || manualWorkflows.length === 0}>
                {starting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Start Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

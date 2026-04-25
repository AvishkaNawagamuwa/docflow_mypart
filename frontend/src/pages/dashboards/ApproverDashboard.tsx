import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { workflowApi, type ApiTaskInstance } from '@/lib/workflowApi';
import { toast } from 'sonner';

const actionLabel = { approve: 'Approve', reject: 'Reject' } as const;

type Action = keyof typeof actionLabel;

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'approved':
            return 'success' as const;
        case 'pending':
            return 'warning' as const;
        case 'rejected':
            return 'destructive' as const;
        default:
            return 'secondary' as const;
    }
};

export default function ApproverDashboard() {
    const [tasks, setTasks] = useState<ApiTaskInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionDialog, setActionDialog] = useState<{ open: boolean; task: ApiTaskInstance | null; action: Action }>({ open: false, task: null, action: 'approve' });
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await workflowApi.listTaskInstances();
            setTasks(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to load task queue';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const pending = useMemo(() => tasks.filter((task) => task.status.toLowerCase() === 'pending'), [tasks]);
    const completed = useMemo(() => tasks.filter((task) => task.status.toLowerCase() === 'completed' || task.status.toLowerCase() === 'approved'), [tasks]);
    const rejected = useMemo(() => tasks.filter((task) => task.status.toLowerCase() === 'rejected'), [tasks]);

    const openAction = (task: ApiTaskInstance, action: Action) => {
        setActionDialog({ open: true, task, action });
        setComment('');
    };

    const executeAction = async () => {
        if (!actionDialog.task) return;
        if (actionDialog.action === 'reject' && !comment.trim()) {
            toast.error('Comment is required for rejection');
            return;
        }

        setSubmitting(true);
        try {
            await workflowApi.submitTask(actionDialog.task.uuid, {
                action: actionDialog.action,
                comment,
                payload: {},
            });
            toast.success(`Task ${actionLabel[actionDialog.action].toLowerCase()}ed`);
            setActionDialog({ open: false, task: null, action: 'approve' });
            setComment('');
            await loadTasks();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to submit task';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout title="Approvals" subtitle="Approve or reject tasks from the live backend">
            <div className="space-y-6 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Pending Approvals', value: pending.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
                        { label: 'Rejected', value: rejected.length, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
                        { label: 'Total Tasks', value: tasks.length, icon: RotateCcw, color: 'text-primary', bg: 'bg-primary/10' },
                    ].map((stat) => (
                        <Card key={stat.label} className="enterprise-card-hover">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                                    </div>
                                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.bg)}>
                                        <stat.icon className={cn('w-5 h-5', stat.color)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="enterprise-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Pending Approvals</CardTitle>
                        <CardDescription>Tasks waiting for your decision in the workflow engine</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading tasks...
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success" />
                                <p>All caught up. No pending approvals.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Document</th>
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Workflow</th>
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Step</th>
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Assigned Role</th>
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map((task) => (
                                            <tr key={task.uuid} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-2">
                                                    <p className="font-medium text-foreground">{task.documentName}</p>
                                                    <p className="text-xs text-muted-foreground">{task.documentType}</p>
                                                </td>
                                                <td className="py-3 px-2 text-muted-foreground">{task.workflowName}</td>
                                                <td className="py-3 px-2 text-muted-foreground">{task.currentStep}</td>
                                                <td className="py-3 px-2 text-muted-foreground">{task.assignedRole || 'Unassigned'}</td>
                                                <td className="py-3 px-2">
                                                    <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="sm" variant="ghost" className="h-7 text-success hover:text-success" onClick={() => openAction(task, 'approve')} title="Approve">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => openAction(task, 'reject')} title="Reject">
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{actionDialog.action === 'approve' ? 'Approve Task' : 'Reject Task'}</DialogTitle>
                            <DialogDescription>
                                {actionDialog.task ? `${actionDialog.task.documentName} • ${actionDialog.task.currentStep}` : 'Select a task to continue.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder={actionDialog.action === 'reject' ? 'Provide rejection reason...' : 'Optional approval comment...'}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setActionDialog({ open: false, task: null, action: 'approve' })}>Cancel</Button>
                            <Button onClick={executeAction} disabled={submitting} variant={actionDialog.action === 'reject' ? 'destructive' : 'default'}>
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}

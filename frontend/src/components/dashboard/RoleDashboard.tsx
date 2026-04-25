import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { workflowApi, type ApiNotification, type ApiTaskInstance, type ApiWorkflow } from '@/lib/workflowApi';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { toast } from 'sonner';

interface DemoSessionUser {
    username: string;
    roleId: string;
    roleName: string;
    departmentName: string;
}

const DEMO_USERNAMES = ['user1', 'user2', 'user3', 'user4', 'user5'];

export function RoleDashboard() {
    const navigate = useNavigate();
    const [sessionUser, setSessionUser] = useState<DemoSessionUser | null>(null);
    const [tasks, setTasks] = useState<ApiTaskInstance[]>([]);
    const [notifications, setNotifications] = useState<ApiNotification[]>([]);
    const [workflows, setWorkflows] = useState<ApiWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [showStartDialog, setShowStartDialog] = useState(false);
    const [selectedWorkflowUuid, setSelectedWorkflowUuid] = useState('');
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('general');
    const [submissionNote, setSubmissionNote] = useState('');
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);

    const loadData = async (roleId: string) => {
        setLoading(true);
        try {
            const [taskData, notificationData, workflowData] = await Promise.all([
                workflowApi.listTaskInstances(roleId),
                workflowApi.listNotifications(roleId),
                workflowApi.listWorkflows(),
            ]);
            setTasks(taskData);
            setNotifications(notificationData);
            setWorkflows(workflowData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to load dashboard data';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const raw = localStorage.getItem('docflow_demo_user');
        if (!raw) {
            navigate('/userlogin', { replace: true });
            return;
        }

        const parsed = JSON.parse(raw) as DemoSessionUser;
        setSessionUser(parsed);
        void loadData(parsed.roleId);
    }, [navigate]);

    const pendingTasks = useMemo(() => tasks.filter((task) => task.status === 'pending'), [tasks]);
    const activeWorkflows = useMemo(() => workflows.filter((workflow) => workflow.status === 'active'), [workflows]);

    const handleComplete = async (task: ApiTaskInstance, action: 'complete' | 'approve' | 'reject', payload: Record<string, unknown>, files?: File[]) => {
        try {
            if (task.requiresSubmission && !task.requiresApproval && files && files.length > 0) {
                await workflowApi.submitTaskFiles(task.uuid, files, { action: 'complete', payload, comment: '' });
            } else {
                await workflowApi.completeTask(task.uuid, { action, payload, comment: '' });
            }
            toast.success('Task completed');
            if (sessionUser) {
                await loadData(sessionUser.roleId);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to complete task';
            toast.error(message);
        }
    };

    const handleMarkRead = async (notificationId: string) => {
        try {
            await workflowApi.markNotificationRead(notificationId);
            if (sessionUser) {
                await loadData(sessionUser.roleId);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to update notification';
            toast.error(message);
        }
    };

    const handleStartWorkflow = async () => {
        if (!sessionUser) return;

        const active =
            activeWorkflows.find((workflow) => workflow.uuid === selectedWorkflowUuid) ||
            activeWorkflows[0] ||
            workflows[0];
        if (!active) {
            toast.error('No workflow found to start');
            return;
        }

        setStarting(true);
        try {
            const started = await workflowApi.startWorkflow(active.uuid, {
                documentName: documentName.trim() || `Submission - ${sessionUser.username}`,
                documentType: documentType.trim() || active.documentType || 'general',
                payload: {
                    startedByRoleId: sessionUser.roleId,
                    startedByRoleName: sessionUser.roleName,
                    submission: {
                        notes: submissionNote,
                        files: submissionFiles.map((file) => ({
                            name: file.name,
                            size: file.size,
                            type: file.type || 'application/octet-stream',
                        })),
                    },
                },
            });

            setShowStartDialog(false);
            setSubmissionNote('');
            setSubmissionFiles([]);
            setSelectedWorkflowUuid('');

            // Auto-switch demo dashboard to the next assigned role if the task moved to another department/role.
            const allTasks = await workflowApi.listTaskInstances();
            const nextTask = allTasks.find(
                (task) => task.workflowInstance === started.uuid && task.status === 'pending'
            );

            if (nextTask?.assignedRoleId && nextTask.assignedRoleId !== sessionUser.roleId) {
                const profiles = await workflowApi.listProfiles();
                const targetProfile = profiles.find(
                    (profile) =>
                        profile.roleId === nextTask.assignedRoleId &&
                        DEMO_USERNAMES.includes(profile.username)
                );

                if (targetProfile?.roleId && targetProfile.roleName) {
                    const switchedUser: DemoSessionUser = {
                        username: targetProfile.username,
                        roleId: targetProfile.roleId,
                        roleName: targetProfile.roleName,
                        departmentName: targetProfile.departmentName || 'Unknown Department',
                    };

                    localStorage.setItem('docflow_demo_user', JSON.stringify(switchedUser));
                    setSessionUser(switchedUser);
                    await loadData(switchedUser.roleId);
                    toast.success(`Workflow started and routed to ${switchedUser.roleName} (${switchedUser.departmentName})`);
                    return;
                }
            }

            toast.success('Workflow started');
            await loadData(sessionUser.roleId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to start workflow';
            toast.error(message);
        } finally {
            setStarting(false);
        }
    };

    const canStartWorkflow = sessionUser?.username === 'user1';

    return (
        <MainLayout title="Role Dashboard" subtitle={sessionUser ? `${sessionUser.roleName} · ${sessionUser.departmentName}` : 'Role based queue'}>
            <div className="space-y-6">
                <Card className="enterprise-card-hover">
                    <CardHeader>
                        <CardTitle>Session</CardTitle>
                        <CardDescription>
                            {sessionUser ? `Logged in as ${sessionUser.username}` : 'Loading session...'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate('/userlogin')}>Switch User</Button>
                        {canStartWorkflow ? <Button onClick={() => setShowStartDialog(true)}>Start Workflow</Button> : null}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            <Card className="enterprise-card-hover">
                                <CardContent className="py-10 text-sm text-muted-foreground">Loading tasks...</CardContent>
                            </Card>
                        ) : pendingTasks.length === 0 ? (
                            <Card className="enterprise-card-hover">
                                <CardContent className="py-10 text-sm text-muted-foreground">No pending tasks for this role.</CardContent>
                            </Card>
                        ) : (
                            pendingTasks.map((task) => <TaskCard key={task.uuid} task={task} onComplete={handleComplete} />)
                        )}
                    </div>

                    <div>
                        <NotificationPanel notifications={notifications} onMarkRead={handleMarkRead} />
                    </div>
                </div>
            </div>

            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Workflow</DialogTitle>
                        <DialogDescription>
                            Select an active workflow and submit one or more documents to start the flow.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Workflow</Label>
                            <Select value={selectedWorkflowUuid} onValueChange={setSelectedWorkflowUuid}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select active workflow" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeWorkflows.map((workflow) => (
                                        <SelectItem key={workflow.uuid} value={workflow.uuid}>
                                            {workflow.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Document Name</Label>
                            <Input
                                value={documentName}
                                onChange={(event) => setDocumentName(event.target.value)}
                                placeholder="Enter document name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Input
                                value={documentType}
                                onChange={(event) => setDocumentType(event.target.value)}
                                placeholder="general"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Submission Notes</Label>
                            <Textarea
                                value={submissionNote}
                                onChange={(event) => setSubmissionNote(event.target.value)}
                                placeholder="Add details for the receiving role"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Submission Files (one or more)</Label>
                            <Input
                                type="file"
                                multiple
                                onChange={(event) => setSubmissionFiles(Array.from(event.target.files || []))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {submissionFiles.length > 0
                                    ? `${submissionFiles.length} file(s) selected`
                                    : 'No files selected'}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStartWorkflow}
                            disabled={starting || activeWorkflows.length === 0}
                        >
                            {starting ? 'Starting...' : 'Start'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}

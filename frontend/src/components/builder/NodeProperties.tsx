import { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { workflowApi, type ApiDepartment, type ApiRole } from '@/lib/workflowApi';

import type { ActivityEdgeModel as ActivityEdge, ActivityNode } from '@/components/builder/activity/types';
import type { AssignmentRule } from '@/types/workflow';

interface NodePropertiesProps {
    node: ActivityNode | null;
    edges: ActivityEdge[];
    onClose: () => void;
    onUpdateNode: (nodeId: string, updater: (node: ActivityNode) => ActivityNode) => void;
    onDeleteNode: (nodeId: string) => void;
    onUpdateEdge: (edgeId: string, updater: (edge: ActivityEdge) => ActivityEdge) => void;
}

const triggerOptions = [
    { value: 'onedrive', label: 'OneDrive Folder', description: 'Auto-start when files arrive in folder' },
    { value: 'manual', label: 'Manual Start', description: 'Start the workflow manually by a role' },
    { value: 'api', label: 'API / CSV Trigger', description: 'Start from API request or CSV import' },
] as const;

const assignmentRules: { value: AssignmentRule; label: string }[] = [
    { value: 'single', label: 'Single Approver' },
    { value: 'all', label: 'All Must Approve' },
    { value: 'first-response', label: 'First Response Wins' },
];

const taskActionOptions = [
    { value: 'approval', label: 'Approval' },
    { value: 'submission', label: 'Submission' },
] as const;

type TimeoutAction = NonNullable<ActivityNode['data']['config']['timeoutAction']>;
type TimerUnit = NonNullable<ActivityNode['data']['config']['timerUnit']>;
type NotificationType = NonNullable<ActivityNode['data']['config']['notificationType']>;

export function NodeProperties({ node, edges, onClose, onUpdateNode, onDeleteNode, onUpdateEdge }: NodePropertiesProps) {
    const [startTab, setStartTab] = useState<'basic' | 'trigger' | 'notification'>('basic');
    const [decisionTab, setDecisionTab] = useState<'basic' | 'branches'>('basic');
    const [endTab, setEndTab] = useState<'basic' | 'notify'>('basic');
    const [taskTab, setTaskTab] = useState<'basic' | 'approval' | 'sla' | 'escalation' | 'notify' | 'advanced'>('basic');
    const [departmentOptions, setDepartmentOptions] = useState<ApiDepartment[]>([]);
    const [rolesByDepartmentId, setRolesByDepartmentId] = useState<Record<string, ApiRole[]>>({});

    const outgoingEdges = useMemo(() => (node ? edges.filter((e) => e.source === node.id) : []), [edges, node]);
    const triggerMethods = node?.data.config.triggerMethods ?? [];
    const startSelectedDepartment = node?.data.config.triggerDepartment ?? '';
    const startDepartmentRoles = useMemo(() => {
        if (!startSelectedDepartment) return [];
        return rolesByDepartmentId[startSelectedDepartment] || [];
    }, [rolesByDepartmentId, startSelectedDepartment]);
    const taskSelectedDepartment = node?.data.config.taskDepartment ?? '';
    const taskDepartmentRoles = useMemo(() => {
        if (!taskSelectedDepartment) return [];
        return rolesByDepartmentId[taskSelectedDepartment] || [];
    }, [rolesByDepartmentId, taskSelectedDepartment]);
    const escalationSelectedDepartment = node?.data.config.escalationDepartment ?? '';
    const escalationDepartmentRoles = useMemo(() => {
        if (!escalationSelectedDepartment) return [];
        return rolesByDepartmentId[escalationSelectedDepartment] || [];
    }, [rolesByDepartmentId, escalationSelectedDepartment]);

    useEffect(() => {
        let active = true;

        const loadDepartments = async () => {
            try {
                const departments = await workflowApi.listDepartments();
                if (active) {
                    setDepartmentOptions(departments);
                }
            } catch {
                if (active) {
                    setDepartmentOptions([]);
                }
            }
        };

        loadDepartments();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadRolesForDepartment = async (departmentId: string) => {
            if (!departmentId || rolesByDepartmentId[departmentId]) {
                return;
            }
            try {
                const roles = await workflowApi.listRoles(departmentId);
                if (active) {
                    setRolesByDepartmentId((prev) => ({ ...prev, [departmentId]: roles }));
                }
            } catch {
                if (active) {
                    setRolesByDepartmentId((prev) => ({ ...prev, [departmentId]: [] }));
                }
            }
        };

        void loadRolesForDepartment(startSelectedDepartment);
        void loadRolesForDepartment(taskSelectedDepartment);
        void loadRolesForDepartment(escalationSelectedDepartment);

        return () => {
            active = false;
        };
    }, [escalationSelectedDepartment, rolesByDepartmentId, startSelectedDepartment, taskSelectedDepartment]);

    if (!node) {
        return (
            <div className="w-96 bg-card border-l border-border p-6 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a node to view its properties</p>
            </div>
        );
    }

    const update = (updater: (n: ActivityNode) => ActivityNode) => onUpdateNode(node.id, updater);

    const toggleTriggerMethod = (trigger: 'onedrive' | 'manual' | 'api') => {
        update((n) => {
            const current = n.data.config.triggerMethods ?? [];
            const next = current.includes(trigger) ? current.filter((item) => item !== trigger) : [...current, trigger];
            return { ...n, data: { ...n.data, config: { ...n.data.config, triggerMethods: next } } };
        });
    };

    if (node.type === 'start') {
        return (
            <div className="w-96 bg-card border-l border-border flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">Start node trigger settings</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <Tabs value={startTab} onValueChange={(value) => setStartTab(value as typeof startTab)} className="w-full">
                        <TabsList className="w-full grid grid-cols-3 sticky top-0 bg-card z-10">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="trigger">Trigger Method</TabsTrigger>
                            <TabsTrigger value="notification">Notification</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="mt-4 space-y-4">
                            <div>
                                <Label htmlFor="nodeName">Name</Label>
                                <Input
                                    id="nodeName"
                                    value={node.data.name}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="nodeDescription">Description</Label>
                                <Textarea
                                    id="nodeDescription"
                                    value={node.data.description || ''}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                    placeholder="Describe how this workflow starts"
                                    className="mt-1.5"
                                    rows={4}
                                />
                            </div>

                            <div className="text-xs text-muted-foreground">Start node defines how the workflow can be launched.</div>
                        </TabsContent>

                        <TabsContent value="trigger" className="mt-4 space-y-4">
                            <div>
                                <Label>Workflow Trigger Method</Label>
                                <div className="text-xs text-muted-foreground mt-1">Select one or more trigger methods.</div>
                            </div>

                            <div className="grid gap-3">
                                {triggerOptions.map((option) => {
                                    const active = triggerMethods.includes(option.value);
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => toggleTriggerMethod(option.value)}
                                            className={cn(
                                                'rounded-lg border-2 p-3 text-left transition-all',
                                                active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="font-medium text-sm">{option.label}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center',
                                                        active ? 'border-primary bg-primary' : 'border-border bg-background'
                                                    )}
                                                >
                                                    {active ? <div className="h-2 w-2 rounded-full bg-primary-foreground" /> : null}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {triggerMethods.includes('onedrive') ? (
                                <div>
                                    <Label htmlFor="triggerPath">OneDrive Folder Path</Label>
                                    <Input
                                        id="triggerPath"
                                        value={node.data.config.triggerPath || ''}
                                        onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, triggerPath: e.target.value } } }))}
                                        placeholder="/Documents/Invoices"
                                        className="mt-1.5"
                                    />
                                </div>
                            ) : null}

                            {triggerMethods.includes('manual') ? (
                                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                                    <div>
                                        <Label>Department</Label>
                                        <Select
                                            value={node.data.config.triggerDepartment || ''}
                                            onValueChange={(department) =>
                                                update((n) => ({
                                                    ...n,
                                                    data: {
                                                        ...n.data,
                                                        config: {
                                                            ...n.data.config,
                                                            triggerDepartment: department,
                                                            triggerRoleId: department === n.data.config.triggerDepartment ? n.data.config.triggerRoleId : undefined,
                                                        },
                                                        assignedRoleId: department === n.data.config.triggerDepartment ? n.data.assignedRoleId : undefined,
                                                    },
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder="Select department..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departmentOptions.map((department) => (
                                                    <SelectItem key={department.id} value={department.id}>
                                                        {department.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Role</Label>
                                        <Select
                                            value={node.data.assignedRoleId || node.data.config.triggerRoleId || ''}
                                            onValueChange={(roleId) =>
                                                update((n) => ({
                                                    ...n,
                                                    data: {
                                                        ...n.data,
                                                        assignedRoleId: roleId,
                                                        config: { ...n.data.config, triggerRoleId: roleId },
                                                    },
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder={startSelectedDepartment ? 'Select role...' : 'Select department first'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {startDepartmentRoles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : null}

                            {triggerMethods.includes('api') ? (
                                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                                    <div>
                                        <Label htmlFor="triggerEndpoint">API Endpoint or CSV Source</Label>
                                        <Input
                                            id="triggerEndpoint"
                                            value={node.data.config.triggerEndpoint || ''}
                                            onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, triggerEndpoint: e.target.value } } }))}
                                            className="mt-1.5"
                                            placeholder="/api/workflows/start or /imports/workflow-triggers.csv"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="triggerCsvPath">CSV File Path</Label>
                                        <Input
                                            id="triggerCsvPath"
                                            value={node.data.config.triggerCsvPath || ''}
                                            onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, triggerCsvPath: e.target.value } } }))}
                                            className="mt-1.5"
                                            placeholder="/imports/workflow-start.csv"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </TabsContent>

                        <TabsContent value="notification" className="mt-4 space-y-4">
                            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                                <div>
                                    <Label>Notification Trigger Event</Label>
                                    <Input
                                        value={node.data.config.notificationTriggerEvent || ''}
                                        onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationTriggerEvent: e.target.value } } }))}
                                        className="mt-1.5"
                                        placeholder="e.g. onStart, onSuccess, onManualTrigger"
                                    />
                                </div>

                                <div>
                                    <Label>Notification Type</Label>
                                    <Select
                                        value={node.data.config.notificationType || 'email'}
                                        onValueChange={(v) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationType: v as NotificationType } } }))}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="sms">SMS</SelectItem>
                                            <SelectItem value="in-app">In-App</SelectItem>
                                            <SelectItem value="all">All</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Email Template</Label>
                                    <Textarea
                                        value={node.data.config.notificationTemplate || ''}
                                        onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationTemplate: e.target.value } } }))}
                                        className="mt-1.5"
                                        rows={5}
                                        placeholder="Hello {{assignee}}, ..."
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    if (node.type === 'decision') {
        return (
            <div className="w-96 bg-card border-l border-border flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">Decision node settings</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <Tabs value={decisionTab} onValueChange={(value) => setDecisionTab(value as typeof decisionTab)} className="w-full">
                        <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-card z-10">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="branches">Decision with all branch</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="mt-4 space-y-4">
                            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                                <div>
                                    <Label htmlFor="nodeName">Name</Label>
                                    <Input
                                        id="nodeName"
                                        value={node.data.name}
                                        onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="nodeDescription">Description</Label>
                                    <Textarea
                                        id="nodeDescription"
                                        value={node.data.description || ''}
                                        onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                        placeholder="Describe this decision"
                                        className="mt-1.5"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="branches" className="mt-4 space-y-3">
                            <div>
                                <div className="font-medium text-sm">Decision with all branch</div>
                                <div className="text-xs text-muted-foreground mt-1">Configure each outgoing branch from this decision node.</div>
                            </div>

                            {outgoingEdges.length === 0 ? (
                                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    Create outgoing branches from this decision node to configure labels and conditions.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {outgoingEdges.map((e) => (
                                        <div key={e.id} className="rounded-lg border border-border p-3 space-y-3">
                                            <div className="text-xs text-muted-foreground">
                                                Branch to <span className="font-medium text-foreground">{e.target}</span>
                                            </div>
                                            <div>
                                                <Label>Branch Label</Label>
                                                <Input
                                                    value={e.data?.label || ''}
                                                    onChange={(ev) => onUpdateEdge(e.id, (edge) => ({ ...edge, data: { ...edge.data, label: ev.target.value } }))}
                                                    className="mt-1.5"
                                                    placeholder="e.g. Approved"
                                                />
                                            </div>
                                            <div>
                                                <Label>Condition</Label>
                                                <Input
                                                    value={e.data?.condition || ''}
                                                    onChange={(ev) => onUpdateEdge(e.id, (edge) => ({ ...edge, data: { ...edge.data, condition: ev.target.value } }))}
                                                    className="mt-1.5"
                                                    placeholder="e.g. amount > 1000"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    if (node.type === 'merge') {
        return (
            <div className="w-96 bg-card border-l border-border flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">Merge node settings</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                        <div>
                            <Label htmlFor="nodeName">Name</Label>
                            <Input
                                id="nodeName"
                                value={node.data.name}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="nodeDescription">Description</Label>
                            <Textarea
                                id="nodeDescription"
                                value={node.data.description || ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                placeholder="Describe this merge node"
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-1 text-sm">
                            <div className="font-medium">Merge Behavior</div>
                            <div className="text-xs text-muted-foreground">Continues when any one branch completes</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (node.type === 'parallel-split') {
        return (
            <div className="w-96 bg-card border-l border-border flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">Parallel Split node settings</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                        <div>
                            <Label htmlFor="nodeName">Name</Label>
                            <Input
                                id="nodeName"
                                value={node.data.name}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="nodeDescription">Description</Label>
                            <Textarea
                                id="nodeDescription"
                                value={node.data.description || ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                placeholder="Describe this parallel split node"
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-1 text-sm">
                            <div className="font-medium">Split Behavior</div>
                            <div className="text-xs text-muted-foreground">Splits workflow into multiple parallel branches</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (node.type === 'parallel-join') {
        return (
            <div className="w-96 bg-card border-l border-border flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">Parallel Join node settings</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                        <div>
                            <Label htmlFor="nodeName">Name</Label>
                            <Input
                                id="nodeName"
                                value={node.data.name}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="nodeDescription">Description</Label>
                            <Textarea
                                id="nodeDescription"
                                value={node.data.description || ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                placeholder="Describe this parallel join node"
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-1 text-sm">
                            <div className="font-medium">Join Behavior</div>
                            <div className="text-xs text-muted-foreground">Waits for all parallel branches to complete</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (node.type === 'end') {
        return (
            <div className="w-96 bg-card border-l border-border flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">End node settings</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <Tabs value={endTab} onValueChange={(value) => setEndTab(value as typeof endTab)} className="w-full">
                        <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-card z-10">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="notify">Notify</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="p-4 space-y-4">
                            <div>
                                <Label htmlFor="nodeName">Name</Label>
                                <Input
                                    id="nodeName"
                                    value={node.data.name}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="nodeDescription">Description</Label>
                                <Textarea
                                    id="nodeDescription"
                                    value={node.data.description || ''}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                    placeholder="Describe this end node"
                                    className="mt-1.5"
                                    rows={3}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="notify" className="p-4 space-y-4">
                            <div>
                                <Label>Notification Trigger Event</Label>
                                <Input
                                    value={node.data.config.notificationTriggerEvent || ''}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationTriggerEvent: e.target.value } } }))}
                                    className="mt-1.5"
                                    placeholder="e.g. onEnd, onComplete"
                                />
                            </div>

                            <div>
                                <Label>Notification Type</Label>
                                <Select
                                    value={node.data.config.notificationType || 'email'}
                                    onValueChange={(v) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationType: v as NotificationType } } }))}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="in-app">In-App</SelectItem>
                                        <SelectItem value="all">All</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Email Template</Label>
                                <Textarea
                                    value={node.data.config.notificationTemplate || ''}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationTemplate: e.target.value } } }))}
                                    className="mt-1.5"
                                    rows={5}
                                    placeholder="Workflow completed successfully."
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    const timeoutAction = (node.data.config.timeoutAction ?? 'escalate') as TimeoutAction;
    const timerUnit = (node.data.config.timerUnit ?? 'hours') as TimerUnit;
    const notificationType = (node.data.config.notificationType ?? 'email') as NotificationType;
    const showEscalationTab = !!node.data.config.escalateOnTimeout;

    return (
        <div className="w-96 bg-card border-l border-border flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{node.data.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{node.type?.replace('-', ' ')}</div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onDeleteNode(node.id)} aria-label="Delete node">
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <Tabs value={taskTab} onValueChange={(value) => setTaskTab(value as typeof taskTab)} className="w-full">
                    <TabsList className={`w-full grid ${showEscalationTab ? 'grid-cols-6' : 'grid-cols-5'} sticky top-0 bg-card z-10`}>
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="approval">Approval</TabsTrigger>
                        <TabsTrigger value="sla">SLA</TabsTrigger>
                        {showEscalationTab ? <TabsTrigger value="escalation">Escalation</TabsTrigger> : null}
                        <TabsTrigger value="notify">Notify</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="p-4 space-y-4">
                        <div>
                            <Label htmlFor="nodeName">Name</Label>
                            <Input id="nodeName" value={node.data.name} onChange={(e) => update((n) => ({ ...n, data: { ...n.data, name: e.target.value } }))} className="mt-1.5" />
                        </div>

                        <div>
                            <Label htmlFor="nodeDescription">Description</Label>
                            <Textarea
                                id="nodeDescription"
                                value={node.data.description || ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, description: e.target.value } }))}
                                placeholder="What does this step do?"
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Department</Label>
                            <Select
                                value={node.data.config.taskDepartment || ''}
                                onValueChange={(department) =>
                                    update((n) => ({
                                        ...n,
                                        data: {
                                            ...n.data,
                                            config: { ...n.data.config, taskDepartment: department },
                                            assignedRoleId: department === n.data.config.taskDepartment ? n.data.assignedRoleId : undefined,
                                        },
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Select department..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {departmentOptions.map((department) => (
                                        <SelectItem key={department.id} value={department.id}>
                                            {department.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Assigned Role</Label>
                            <Select
                                value={node.data.assignedRoleId || node.data.config.assigneeId || ''}
                                onValueChange={(roleId) =>
                                    update((n) => ({
                                        ...n,
                                        data: {
                                            ...n.data,
                                            assignedRoleId: roleId,
                                            config: { ...n.data.config, assigneeId: n.type === 'task' ? roleId : n.data.config.assigneeId },
                                        },
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder={taskSelectedDepartment ? 'Select role...' : 'Select department first'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {taskDepartmentRoles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-xs text-muted-foreground">Each node represents an execution state. Transitions define allowed movement between states.</div>
                    </TabsContent>

                    <TabsContent value="approval" className="p-4 space-y-4">
                        {node.type !== 'task' ? (
                            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">Approval rules apply to Task nodes.</div>
                        ) : (
                            <>
                                <div>
                                    <Label>Task Options</Label>
                                    <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                                        {taskActionOptions.map((option) => {
                                            const selectedActions = node.data.config.allowedActions || [];
                                            const checked = selectedActions.includes(option.value);

                                            return (
                                                <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4"
                                                        checked={checked}
                                                        onChange={(event) =>
                                                            update((n) => {
                                                                const currentActions = n.data.config.allowedActions || [];
                                                                const nextActions = event.target.checked
                                                                    ? Array.from(new Set([...currentActions, option.value]))
                                                                    : currentActions.filter((item) => item !== option.value);

                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        config: {
                                                                            ...n.data.config,
                                                                            allowedActions: nextActions,
                                                                        },
                                                                    },
                                                                };
                                                            })
                                                        }
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <Label>Approval Type</Label>
                                    <Select
                                        value={node.data.config.assignmentRule || 'single'}
                                        onValueChange={(v) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, assignmentRule: v as AssignmentRule } } }))}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assignmentRules.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Allow Rejection</span>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!node.data.config.allowRejection}
                                        onChange={(event) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, allowRejection: event.target.checked } } }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Allow Revision</span>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!node.data.config.allowRevision}
                                        onChange={(event) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, allowRevision: event.target.checked } } }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Delegation Allowed</span>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!node.data.config.delegationAllowed}
                                        onChange={(event) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, delegationAllowed: event.target.checked } } }))}
                                    />
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="sla" className="p-4 space-y-4">
                        <div>
                            <Label>SLA Duration (hours)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={node.data.config.slaHours ?? ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, slaHours: e.target.value === '' ? undefined : Number(e.target.value) } } }))}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label>Timeout Action</Label>
                            <Select value={timeoutAction} onValueChange={(v) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, timeoutAction: v as TimeoutAction } } }))}>
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="escalate">Escalate</SelectItem>
                                    <SelectItem value="auto-approve">Auto-Approve</SelectItem>
                                    <SelectItem value="auto-reject">Auto-Reject</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Escalate On Timeout</span>
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!node.data.config.escalateOnTimeout}
                                onChange={(event) => {
                                    const checked = event.target.checked;
                                    if (!checked && taskTab === 'escalation') {
                                        setTaskTab('sla');
                                    }
                                    update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, escalateOnTimeout: checked } } }));
                                }}
                            />
                        </div>

                        {node.type === 'timer' ? (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Timer</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>Duration</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={node.data.config.timerDuration ?? ''}
                                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, timerDuration: e.target.value === '' ? undefined : Number(e.target.value) } } }))}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Unit</Label>
                                            <Select value={timerUnit} onValueChange={(v) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, timerUnit: v as TimerUnit } } }))}>
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="minutes">Minutes</SelectItem>
                                                    <SelectItem value="hours">Hours</SelectItem>
                                                    <SelectItem value="days">Days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </TabsContent>

                    {showEscalationTab ? (
                        <TabsContent value="escalation" className="p-4 space-y-4">
                            <div>
                                <Label>Escalation Department</Label>
                                <Select
                                    value={node.data.config.escalationDepartment || ''}
                                    onValueChange={(department) =>
                                        update((n) => ({
                                            ...n,
                                            data: {
                                                ...n.data,
                                                config: {
                                                    ...n.data.config,
                                                    escalationDepartment: department,
                                                    escalationRoleId: undefined,
                                                    escalationTarget: undefined,
                                                },
                                            },
                                        }))
                                    }
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select department..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentOptions.map((department) => (
                                            <SelectItem key={department.id} value={department.id}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Escalation Role</Label>
                                <Select
                                    value={node.data.config.escalationRoleId || node.data.config.escalationTarget || ''}
                                    onValueChange={(roleId) =>
                                        update((n) => ({
                                            ...n,
                                            data: {
                                                ...n.data,
                                                config: { ...n.data.config, escalationRoleId: roleId, escalationTarget: roleId },
                                            },
                                        }))
                                    }
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder={escalationSelectedDepartment ? 'Select role...' : 'Select department first'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {escalationDepartmentRoles.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Escalation Delay (minutes)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={node.data.config.escalationDelayMinutes ?? ''}
                                    onChange={(e) =>
                                        update((n) => ({
                                            ...n,
                                            data: {
                                                ...n.data,
                                                config: {
                                                    ...n.data.config,
                                                    escalationDelayMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                                                },
                                            },
                                        }))
                                    }
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Notify On Escalation</span>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={!!node.data.config.notifyOnEscalation}
                                    onChange={(event) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notifyOnEscalation: event.target.checked } } }))}
                                />
                            </div>
                        </TabsContent>
                    ) : null}

                    <TabsContent value="notify" className="p-4 space-y-4">
                        <div>
                            <Label>Notification Trigger Event</Label>
                            <Input
                                value={node.data.config.notificationTriggerEvent || ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationTriggerEvent: e.target.value } } }))}
                                className="mt-1.5"
                                placeholder="e.g. onEnter, onExit, onTimeout"
                            />
                        </div>

                        <div>
                            <Label>Notification Type</Label>
                            <Select
                                value={notificationType}
                                onValueChange={(v) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationType: v as NotificationType } } }))}
                            >
                                <SelectTrigger className="mt-1.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="in-app">In-App</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Email Template</Label>
                            <Textarea
                                value={node.data.config.notificationTemplate || ''}
                                onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, notificationTemplate: e.target.value } } }))}
                                className="mt-1.5"
                                rows={5}
                                placeholder="Hello {{assignee}}, ..."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label>Retry Count</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={node.data.config.retryCount ?? ''}
                                    onChange={(e) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, retryCount: e.target.value === '' ? undefined : Number(e.target.value) } } }))}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label>Delegation Allowed</Label>
                                <div className="mt-2 flex items-center justify-end">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!node.data.config.delegationAllowed}
                                        onChange={(event) => update((n) => ({ ...n, data: { ...n.data, config: { ...n.data.config, delegationAllowed: event.target.checked } } }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

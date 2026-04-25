import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronRight, Clock, FileText, Search, Activity, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { InstanceTimeline } from '@/components/instances/InstanceTimeline';
import { cn } from '@/lib/utils';
import { workflowApi, type ApiWorkflowInstance } from '@/lib/workflowApi';
import { toast } from 'sonner';

const statusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'running':
        case 'completed':
            return 'success' as const;
        case 'pending':
            return 'warning' as const;
        case 'rejected':
        case 'failed':
            return 'destructive' as const;
        default:
            return 'secondary' as const;
    }
};

export default function InstancesPage() {
    const [instances, setInstances] = useState<ApiWorkflowInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInstance, setSelectedInstance] = useState<ApiWorkflowInstance | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await workflowApi.listWorkflowInstances();
                setInstances(data);
                setSelectedInstance((current) => {
                    if (!current) {
                        return null;
                    }
                    const refreshed = data.find((instance) => instance.uuid === current.uuid);
                    return refreshed || null;
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unable to load workflow instances';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const filteredInstances = useMemo(() => {
        return instances.filter((instance) => {
            const matchSearch =
                !search ||
                instance.documentName.toLowerCase().includes(search.toLowerCase()) ||
                instance.workflowName.toLowerCase().includes(search.toLowerCase()) ||
                instance.currentStep.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'all' || instance.status.toLowerCase() === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [instances, search, statusFilter]);

    return (
        <MainLayout title="Workflow Instances" subtitle="Track workflow progress and timelines from the backend">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Input placeholder="Search instances..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[170px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Active Instances', value: instances.filter((instance) => !['completed', 'rejected', 'failed'].includes(instance.status.toLowerCase())).length, icon: Activity, color: 'text-primary' },
                        { label: 'Pending', value: instances.filter((instance) => instance.status.toLowerCase() === 'pending').length, icon: Clock, color: 'text-warning' },
                        { label: 'Completed', value: instances.filter((instance) => instance.status.toLowerCase() === 'completed').length, icon: Activity, color: 'text-success' },
                        { label: 'Rejections', value: instances.filter((instance) => instance.status.toLowerCase() === 'rejected').length, icon: Activity, color: 'text-destructive' },
                    ].map((stat) => (
                        <div key={stat.label} className="enterprise-card p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                                </div>
                                <stat.icon className={cn('w-8 h-8', stat.color)} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="enterprise-card divide-y divide-border">
                    {loading ? (
                        <div className="p-8 text-sm text-muted-foreground">Loading workflow instances...</div>
                    ) : filteredInstances.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">No instances found</h3>
                            <p className="text-sm text-muted-foreground mt-1">Start a manual workflow from the dashboard</p>
                        </div>
                    ) : (
                        filteredInstances.map((instance) => (
                            <div
                                key={instance.uuid}
                                className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                                onClick={() => setSelectedInstance(instance)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-foreground truncate">{instance.documentName}</span>
                                            <Badge variant={statusVariant(instance.status)}>{instance.status}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                                            <span>{instance.workflowName}</span>
                                            <span>•</span>
                                            <span>{instance.documentType}</span>
                                            <span>•</span>
                                            <span>{instance.currentStep || 'Waiting for next step'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <div className="flex items-center gap-1.5 text-sm justify-end">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-foreground">{instance.currentAssignee || 'System'}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">Started {format(new Date(instance.startedAt), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Sheet open={!!selectedInstance} onOpenChange={(open) => !open && setSelectedInstance(null)}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    {selectedInstance && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedInstance.documentName}</SheetTitle>
                                <SheetDescription>{selectedInstance.workflowName} • {selectedInstance.documentType}</SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">Current Step</span>
                                        <Badge variant={statusVariant(selectedInstance.status)}>{selectedInstance.status}</Badge>
                                    </div>
                                    <div className="text-lg font-semibold text-foreground">{selectedInstance.currentStep || 'Waiting for next step'}</div>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        {selectedInstance.currentAssignee || 'Unassigned'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        Started {format(new Date(selectedInstance.startedAt), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                    {selectedInstance.completedAt && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            Completed {format(new Date(selectedInstance.completedAt), 'MMM dd, yyyy HH:mm')}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-4">Activity Timeline</h4>
                                    <InstanceTimeline events={selectedInstance.timeline.map((event) => ({
                                        ...event,
                                        timestamp: new Date(event.timestamp),
                                    }))} />
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </MainLayout>
    );
}

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { SlaCountdown } from '@/components/dashboard/SlaCountdown';
import { workflowApi, type ApiTaskInstance } from '@/lib/workflowApi';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, FileText, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function StaffDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<ApiTaskInstance[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await workflowApi.listTaskInstances();
            setTasks(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to load tasks';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in-progress');
    const completed = tasks.filter((t) => t.status === 'completed');
    const rejected = tasks.filter((t) => t.status === 'rejected');

    const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

    return (
        <MainLayout title="Staff Dashboard" subtitle="Your workflow tasks and submissions">
            <div className="space-y-6 animate-fade-in">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Pending Tasks', value: pending.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
                        { label: 'Rejected', value: rejected.length, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
                        { label: 'Total Tasks', value: tasks.length, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
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

                {/* Completion Progress */}
                <Card className="enterprise-card-hover">
                    <CardHeader>
                        <CardTitle>Completion Rate</CardTitle>
                        <CardDescription>Your task completion progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold">{Math.round(completionRate)}%</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Tasks */}
                <Card className="enterprise-card-hover">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pending Tasks</CardTitle>
                            <CardDescription>Tasks awaiting your action</CardDescription>
                        </div>
                        <Badge variant="outline">{pending.length}</Badge>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">No pending tasks</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pending.map((task) => (
                                    <div key={task.uuid} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{task.documentName}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{task.documentType} · {task.currentStep}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <StatusBadge status={task.status} />
                                            {task.dueAt ? <SlaCountdown deadline={new Date(task.dueAt)} compact /> : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="enterprise-card-hover">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link to="/instances">
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    View All Instances
                                </Button>
                            </Link>
                            <Link to="/documents">
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Browse Documents
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

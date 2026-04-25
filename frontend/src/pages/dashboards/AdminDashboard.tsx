import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { mockWorkflowTemplates } from '@/data/mockData';
import { mockNotifications } from '@/data/mockDashboardData';
import { Link } from 'react-router-dom';
import { GitBranch, FileText, Users, Settings, FolderOpen, Bell, Workflow, Activity, Plug, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { user } = useAuth();

  const activeTemplates = mockWorkflowTemplates.filter((t) => t.status === 'active');
  const draftTemplates = mockWorkflowTemplates.filter((t) => t.status === 'draft');
  const adminNotifs = mockNotifications.filter((n) => n.userId === user?.id && !n.read);

  return (
    <MainLayout title="Admin Dashboard" subtitle="System configuration and maintenance">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Active Templates', value: activeTemplates.length, icon: GitBranch, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Draft Workflows', value: draftTemplates.length, icon: Workflow, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Document Types', value: 8, icon: FolderOpen, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Roles & Users', value: '6 / 8', icon: Users, color: 'text-info', bg: 'bg-info/10' },
            { label: 'Integration', value: 'Active', icon: Plug, color: 'text-success', bg: 'bg-success/10' },
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

        {/* Quick Access */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Common admin tasks and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Create Workflow', icon: Plus, path: '/workflows', color: 'text-primary' },
                { label: 'Document Types', icon: FolderOpen, path: '/document-types', color: 'text-info' },
                { label: 'Roles & Users', icon: Users, path: '/roles', color: 'text-warning' },
                { label: 'Notifications', icon: Bell, path: '/notifications', color: 'text-destructive' },
                { label: 'Settings', icon: Settings, path: '/settings', color: 'text-muted-foreground' },
              ].map((a) => (
                <Link key={a.label} to={a.path}>
                  <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <a.icon className={cn('w-5 h-5', a.color)} />
                    </div>
                    <span className="font-medium text-foreground text-sm">{a.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Workflow Templates */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-primary" /> Workflow Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockWorkflowTemplates.map((wf) => (
                  <div key={wf.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{wf.name}</p>
                      <p className="text-xs text-muted-foreground">v{wf.version} • {wf.documentType}</p>
                    </div>
                    <StatusBadge status={wf.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> System Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {adminNotifs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
              ) : (
                <div className="space-y-3">
                  {adminNotifs.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-2 h-2 rounded-full mt-1.5 bg-primary shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.createdAt.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* System Status */}
              <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
                <h4 className="text-sm font-semibold text-foreground mb-3">System Status</h4>
                <div className="space-y-2">
                  {[
                    { name: 'OneDrive Sync', status: 'active' },
                    { name: 'Notification Engine', status: 'active' },
                    { name: 'SLA Monitor', status: 'active' },
                    { name: 'Archive Service', status: 'active' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{s.name}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-xs text-success font-medium">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

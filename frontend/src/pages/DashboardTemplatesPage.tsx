import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { DashboardTemplate, DashboardStatus, mockDashboardTemplates } from '@/data/mockDashboardBuilder';
import { AppRole, ROLE_LABELS } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, LayoutDashboard, Copy, Pencil, Trash2, Eye, Download, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const ALL_ROLES: AppRole[] = ['staff', 'approver', 'supervisor', 'admin', 'external'];

export default function DashboardTemplatesPage() {
  const [templates, setTemplates] = useState<DashboardTemplate[]>(mockDashboardTemplates);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRoles, setNewRoles] = useState<AppRole[]>([]);
  const navigate = useNavigate();

  const filtered = templates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newTemplate: DashboardTemplate = {
      id: `dt-${Date.now()}`,
      name: newName,
      description: newDesc,
      status: 'draft',
      assignedRoles: newRoles,
      isDefault: false,
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'John Smith',
    };
    setTemplates([...templates, newTemplate]);
    setCreateOpen(false);
    setNewName('');
    setNewDesc('');
    setNewRoles([]);
    toast({ title: 'Dashboard created', description: `"${newName}" has been created as a draft.` });
    navigate(`/dashboard-builder/${newTemplate.id}`);
  };

  const handleDuplicate = (t: DashboardTemplate) => {
    const dup: DashboardTemplate = {
      ...t,
      id: `dt-${Date.now()}`,
      name: `${t.name} (Copy)`,
      status: 'draft',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      widgets: t.widgets.map((w) => ({ ...w, id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    setTemplates([...templates, dup]);
    toast({ title: 'Dashboard duplicated', description: `"${dup.name}" has been created.` });
  };

  const handleToggleStatus = (id: string) => {
    setTemplates(templates.map((t) =>
      t.id === id ? { ...t, status: t.status === 'active' ? 'disabled' : 'active', updatedAt: new Date() } as DashboardTemplate : t
    ));
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast({ title: 'Dashboard deleted' });
  };

  const handleExport = (t: DashboardTemplate) => {
    const json = JSON.stringify(t, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Dashboard layout exported as JSON.' });
  };

  const toggleRole = (role: AppRole) => {
    setNewRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  return (
    <MainLayout title="Dashboard Configuration" subtitle="Create and manage role-based dashboard templates">
      <div className="space-y-6 animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search dashboards..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Create Dashboard</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>Define a new dashboard template and assign it to roles.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Dashboard Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Finance Team Dashboard" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Describe the dashboard purpose..." />
                </div>
                <div>
                  <Label>Assign to Roles</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {ALL_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={newRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                        {ROLE_LABELS[role]}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newName.trim()}>Create & Open Builder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Dashboards', value: templates.length, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Active', value: templates.filter((t) => t.status === 'active').length, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Draft', value: templates.filter((t) => t.status === 'draft').length, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Disabled', value: templates.filter((t) => t.status === 'disabled').length, color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map((s) => (
            <Card key={s.label} className="enterprise-card">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Templates Table */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" /> Dashboard Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No dashboards found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-foreground">{t.name}</h4>
                        <StatusBadge status={t.status} />
                        {t.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {t.assignedRoles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABELS[r]}</Badge>
                        ))}
                        {t.assignedRoles.length === 0 && <span className="text-xs text-muted-foreground italic">No roles assigned</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t.widgets.length} widgets • Updated {t.updatedAt.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard-builder/${t.id}`)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard-preview/${t.id}`)} title="Preview">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(t)} title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExport(t)} title="Export JSON">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

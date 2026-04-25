import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockWorkflowTemplates } from '@/data/mockData';
import { cn } from '@/lib/utils';
import {
  BarChart3, LineChart, PieChart, Gauge, Grid3X3,
  Plus, Pencil, Trash2, Copy, Save, Eye, EyeOff,
  AlertTriangle, Clock, Target, TrendingUp, Settings2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ── Types ──

interface ChartConfig {
  id: string;
  title: string;
  chartType: 'line' | 'bar' | 'donut' | 'gauge' | 'heatmap';
  dataSource: 'workflow_instances' | 'workflow_steps';
  groupBy: 'step_name' | 'status' | 'department';
  kpiMetric: 'avg_time' | 'sla_breach' | 'completion_rate';
  slaThreshold?: number;
  roleVisibility: string[];
  departmentScope: string;
  refreshInterval: number;
  status: 'active' | 'draft';
  workflowId: string;
}

interface SlaRule {
  id: string;
  workflowId: string;
  stepName: string;
  slaDuration: number;
  escalationTime: number;
  alertType: 'email' | 'dashboard' | 'sms';
}

interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  workflowScope: string;
  roleVisibility: string[];
  status: 'active' | 'draft';
}

interface BottleneckRule {
  id: string;
  workflowId: string;
  stepName: string;
  condition: 'avg_gt_sla' | 'avg_gt_sla_multiplier';
  multiplier: number;
  alertLevel: 'low' | 'medium' | 'high';
  highlightColor: string;
  showBadge: boolean;
}

// ── Mock seed data ──

const CHART_TYPE_ICONS: Record<string, React.ElementType> = {
  line: LineChart, bar: BarChart3, donut: PieChart, gauge: Gauge, heatmap: Grid3X3,
};

const STEPS_BY_WORKFLOW: Record<string, string[]> = {
  'wf-1': ['Document Upload', 'Manager Approval', 'CFO Approval', 'Finance Processing'],
  'wf-2': ['Invoice Upload', 'Verification', 'Finance Approval', 'Payment Processing'],
  'wf-3': ['Document Upload', 'Legal Review', 'Partner Approval', 'Execution'],
  'wf-4': ['Submission', 'Manager Review', 'Finance Approval', 'Reimbursement'],
  'wf-5': ['GRN Upload', 'Warehouse Check', 'Procurement Verification'],
};

const initialCharts: ChartConfig[] = [
  { id: 'ch-1', title: 'PO Approval Trend', chartType: 'line', dataSource: 'workflow_instances', groupBy: 'status', kpiMetric: 'completion_rate', roleVisibility: ['admin', 'supervisor'], departmentScope: 'all', refreshInterval: 300, status: 'active', workflowId: 'wf-1' },
  { id: 'ch-2', title: 'Step Bottleneck Heatmap', chartType: 'heatmap', dataSource: 'workflow_steps', groupBy: 'step_name', kpiMetric: 'avg_time', roleVisibility: ['admin'], departmentScope: 'all', refreshInterval: 600, status: 'active', workflowId: 'wf-1' },
  { id: 'ch-3', title: 'Invoice SLA Breach Rate', chartType: 'gauge', dataSource: 'workflow_instances', groupBy: 'department', kpiMetric: 'sla_breach', slaThreshold: 24, roleVisibility: ['admin', 'supervisor'], departmentScope: 'all', refreshInterval: 300, status: 'draft', workflowId: 'wf-2' },
];

const initialSlaRules: SlaRule[] = [
  { id: 'sla-1', workflowId: 'wf-1', stepName: 'Manager Approval', slaDuration: 24, escalationTime: 20, alertType: 'email' },
  { id: 'sla-2', workflowId: 'wf-1', stepName: 'CFO Approval', slaDuration: 48, escalationTime: 40, alertType: 'dashboard' },
  { id: 'sla-3', workflowId: 'wf-2', stepName: 'Finance Approval', slaDuration: 12, escalationTime: 10, alertType: 'sms' },
];

const initialKpis: KpiDefinition[] = [
  { id: 'kpi-1', name: 'Average Cycle Time', description: 'Mean end-to-end time for workflow completion', formula: 'AVG(completed_at - started_at)', workflowScope: 'all', roleVisibility: ['admin', 'supervisor'], status: 'active' },
  { id: 'kpi-2', name: 'SLA Compliance Rate', description: 'Percentage of tasks completed within SLA', formula: '(COUNT(WHERE completed_at <= sla_deadline) / COUNT(*)) * 100', workflowScope: 'all', roleVisibility: ['admin', 'supervisor'], status: 'active' },
  { id: 'kpi-3', name: 'Rejection Rate', description: 'Percentage of rejected documents', formula: '(COUNT(WHERE status = rejected) / COUNT(*)) * 100', workflowScope: 'all', roleVisibility: ['admin'], status: 'draft' },
];

const initialBottleneckRules: BottleneckRule[] = [
  { id: 'bn-1', workflowId: 'wf-1', stepName: 'CFO Approval', condition: 'avg_gt_sla_multiplier', multiplier: 1.5, alertLevel: 'high', highlightColor: '#ef4444', showBadge: true },
  { id: 'bn-2', workflowId: 'wf-2', stepName: 'Finance Approval', condition: 'avg_gt_sla', multiplier: 1, alertLevel: 'medium', highlightColor: '#f59e0b', showBadge: true },
];

// ── Helpers ──

const ALERT_COLORS: Record<string, string> = { low: 'bg-info/10 text-info', medium: 'bg-warning/10 text-warning', high: 'bg-destructive/10 text-destructive' };

export default function AnalyticsChartsPage() {
  // Workflow Charts state
  const [selectedWorkflow, setSelectedWorkflow] = useState('wf-1');
  const [charts, setCharts] = useState<ChartConfig[]>(initialCharts);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);

  // SLA state
  const [slaWorkflow, setSlaWorkflow] = useState('wf-1');
  const [slaRules, setSlaRules] = useState<SlaRule[]>(initialSlaRules);
  const [slaModalOpen, setSlaModalOpen] = useState(false);
  const [editingSla, setEditingSla] = useState<SlaRule | null>(null);

  // KPI state
  const [kpis, setKpis] = useState<KpiDefinition[]>(initialKpis);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiDefinition | null>(null);

  // Bottleneck state
  const [bnWorkflow, setBnWorkflow] = useState('wf-1');
  const [bnRules, setBnRules] = useState<BottleneckRule[]>(initialBottleneckRules);
  const [bnModalOpen, setBnModalOpen] = useState(false);
  const [editingBn, setEditingBn] = useState<BottleneckRule | null>(null);

  // ── Chart CRUD ──
  const openNewChart = () => {
    setEditingChart({ id: `ch-${Date.now()}`, title: '', chartType: 'bar', dataSource: 'workflow_instances', groupBy: 'status', kpiMetric: 'avg_time', roleVisibility: ['admin'], departmentScope: 'all', refreshInterval: 300, status: 'draft', workflowId: selectedWorkflow });
    setChartModalOpen(true);
  };
  const openEditChart = (c: ChartConfig) => { setEditingChart({ ...c }); setChartModalOpen(true); };
  const saveChart = () => {
    if (!editingChart?.title) return;
    setCharts(prev => { const idx = prev.findIndex(c => c.id === editingChart.id); return idx >= 0 ? prev.map(c => c.id === editingChart.id ? editingChart : c) : [...prev, editingChart]; });
    setChartModalOpen(false);
    toast({ title: 'Chart configuration saved', description: `"${editingChart.title}" saved as JSON config.` });
  };
  const deleteChart = (id: string) => { setCharts(prev => prev.filter(c => c.id !== id)); toast({ title: 'Chart deleted' }); };

  // ── SLA CRUD ──
  const openNewSla = () => {
    const steps = STEPS_BY_WORKFLOW[slaWorkflow] || [];
    setEditingSla({ id: `sla-${Date.now()}`, workflowId: slaWorkflow, stepName: steps[0] || '', slaDuration: 24, escalationTime: 20, alertType: 'email' });
    setSlaModalOpen(true);
  };
  const openEditSla = (s: SlaRule) => { setEditingSla({ ...s }); setSlaModalOpen(true); };
  const saveSla = () => {
    if (!editingSla) return;
    setSlaRules(prev => { const idx = prev.findIndex(s => s.id === editingSla.id); return idx >= 0 ? prev.map(s => s.id === editingSla.id ? editingSla : s) : [...prev, editingSla]; });
    setSlaModalOpen(false);
    toast({ title: 'SLA rule saved' });
  };

  // ── KPI CRUD ──
  const openNewKpi = () => {
    setEditingKpi({ id: `kpi-${Date.now()}`, name: '', description: '', formula: '', workflowScope: 'all', roleVisibility: ['admin'], status: 'draft' });
    setKpiModalOpen(true);
  };
  const openEditKpi = (k: KpiDefinition) => { setEditingKpi({ ...k }); setKpiModalOpen(true); };
  const saveKpi = () => {
    if (!editingKpi?.name) return;
    setKpis(prev => { const idx = prev.findIndex(k => k.id === editingKpi.id); return idx >= 0 ? prev.map(k => k.id === editingKpi.id ? editingKpi : k) : [...prev, editingKpi]; });
    setKpiModalOpen(false);
    toast({ title: 'KPI definition saved' });
  };

  // ── Bottleneck CRUD ──
  const openNewBn = () => {
    const steps = STEPS_BY_WORKFLOW[bnWorkflow] || [];
    setEditingBn({ id: `bn-${Date.now()}`, workflowId: bnWorkflow, stepName: steps[0] || '', condition: 'avg_gt_sla', multiplier: 1, alertLevel: 'medium', highlightColor: '#f59e0b', showBadge: true });
    setBnModalOpen(true);
  };
  const openEditBn = (b: BottleneckRule) => { setEditingBn({ ...b }); setBnModalOpen(true); };
  const saveBn = () => {
    if (!editingBn) return;
    setBnRules(prev => { const idx = prev.findIndex(b => b.id === editingBn.id); return idx >= 0 ? prev.map(b => b.id === editingBn.id ? editingBn : b) : [...prev, editingBn]; });
    setBnModalOpen(false);
    toast({ title: 'Bottleneck rule saved' });
  };

  const workflowName = (id: string) => mockWorkflowTemplates.find(w => w.id === id)?.name || id;

  return (
    <MainLayout title="Analytics & Chart Configuration" subtitle="Configure dynamic charts, SLA rules, KPIs, and bottleneck detection">
      <div className="animate-fade-in">
        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="charts" className="gap-2"><BarChart3 className="w-4 h-4" /> Workflow Charts</TabsTrigger>
            <TabsTrigger value="sla" className="gap-2"><Clock className="w-4 h-4" /> SLA Monitoring</TabsTrigger>
            <TabsTrigger value="kpi" className="gap-2"><Target className="w-4 h-4" /> KPI Definitions</TabsTrigger>
            <TabsTrigger value="bottleneck" className="gap-2"><AlertTriangle className="w-4 h-4" /> Bottleneck Rules</TabsTrigger>
          </TabsList>

          {/* ════════ TAB 1: Workflow Charts ════════ */}
          <TabsContent value="charts">
            <Card className="enterprise-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Workflow Charts</CardTitle>
                  <CardDescription>Configure charts per workflow — all stored as JSON config</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {mockWorkflowTemplates.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={openNewChart} size="sm"><Plus className="w-4 h-4 mr-1" /> Create Chart</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chart Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Based On</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charts.filter(c => c.workflowId === selectedWorkflow).map(c => {
                      const Icon = CHART_TYPE_ICONS[c.chartType] || BarChart3;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell><div className="flex items-center gap-1.5"><Icon className="w-4 h-4 text-primary" /><span className="capitalize">{c.chartType}</span></div></TableCell>
                          <TableCell className="capitalize">{c.dataSource.replace('_', ' ')}</TableCell>
                          <TableCell className="capitalize">{c.kpiMetric.replace('_', ' ')}</TableCell>
                          <TableCell><div className="flex gap-1">{c.roleVisibility.map(r => <Badge key={r} variant="secondary" className="text-xs capitalize">{r}</Badge>)}</div></TableCell>
                          <TableCell><Badge variant={c.status === 'active' ? 'default' : 'outline'} className="capitalize">{c.status}</Badge></TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditChart(c)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteChart(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {charts.filter(c => c.workflowId === selectedWorkflow).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No charts configured for this workflow</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ TAB 2: SLA Monitoring ════════ */}
          <TabsContent value="sla">
            <Card className="enterprise-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>SLA Monitoring Rules</CardTitle>
                  <CardDescription>Define SLA durations and escalation per workflow step</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={slaWorkflow} onValueChange={setSlaWorkflow}>
                    <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {mockWorkflowTemplates.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={openNewSla} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Rule</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step Name</TableHead>
                      <TableHead>SLA Duration (hrs)</TableHead>
                      <TableHead>Escalation Time (hrs)</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slaRules.filter(s => s.workflowId === slaWorkflow).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.stepName}</TableCell>
                        <TableCell>{s.slaDuration}h</TableCell>
                        <TableCell>{s.escalationTime}h</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{s.alertType}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditSla(s)}><Pencil className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {slaRules.filter(s => s.workflowId === slaWorkflow).length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No SLA rules for this workflow</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ TAB 3: KPI Definitions ════════ */}
          <TabsContent value="kpi">
            <Card className="enterprise-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>KPI Definitions</CardTitle>
                  <CardDescription>Define configurable KPI formulas and visibility</CardDescription>
                </div>
                <Button onClick={openNewKpi} size="sm"><Plus className="w-4 h-4 mr-1" /> Define KPI</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KPI Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Formula</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.map(k => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{k.description}</TableCell>
                        <TableCell><code className="text-xs bg-muted px-2 py-1 rounded font-mono">{k.formula.length > 40 ? k.formula.slice(0, 40) + '…' : k.formula}</code></TableCell>
                        <TableCell className="capitalize">{k.workflowScope}</TableCell>
                        <TableCell><div className="flex gap-1">{k.roleVisibility.map(r => <Badge key={r} variant="secondary" className="text-xs capitalize">{r}</Badge>)}</div></TableCell>
                        <TableCell><Badge variant={k.status === 'active' ? 'default' : 'outline'} className="capitalize">{k.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditKpi(k)}><Pencil className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ TAB 4: Bottleneck Rules ════════ */}
          <TabsContent value="bottleneck">
            <Card className="enterprise-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Bottleneck Detection Rules</CardTitle>
                  <CardDescription>Define logic for detecting workflow bottlenecks</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={bnWorkflow} onValueChange={setBnWorkflow}>
                    <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {mockWorkflowTemplates.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={openNewBn} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Rule</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Alert Level</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Dashboard Badge</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bnRules.filter(b => b.workflowId === bnWorkflow).map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.stepName}</TableCell>
                        <TableCell className="text-sm">{b.condition === 'avg_gt_sla' ? 'avg_time > SLA' : `avg_time > SLA × ${b.multiplier}`}</TableCell>
                        <TableCell>{b.multiplier}×</TableCell>
                        <TableCell><Badge className={cn('capitalize', ALERT_COLORS[b.alertLevel])}>{b.alertLevel}</Badge></TableCell>
                        <TableCell><div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: b.highlightColor }} /></TableCell>
                        <TableCell>{b.showBadge ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditBn(b)}><Pencil className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {bnRules.filter(b => b.workflowId === bnWorkflow).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No bottleneck rules for this workflow</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ════════ CHART MODAL ════════ */}
      <Dialog open={chartModalOpen} onOpenChange={setChartModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChart && charts.find(c => c.id === editingChart.id) ? 'Edit Chart' : 'Create Chart'}</DialogTitle>
            <DialogDescription>Configure chart to be saved as JSON and rendered dynamically</DialogDescription>
          </DialogHeader>
          {editingChart && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chart Title</Label>
                  <Input value={editingChart.title} onChange={e => setEditingChart({ ...editingChart, title: e.target.value })} placeholder="e.g. Approval Trend" />
                </div>
                <div className="space-y-2">
                  <Label>Chart Type</Label>
                  <Select value={editingChart.chartType} onValueChange={v => setEditingChart({ ...editingChart, chartType: v as ChartConfig['chartType'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['line', 'bar', 'donut', 'gauge', 'heatmap'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select value={editingChart.dataSource} onValueChange={v => setEditingChart({ ...editingChart, dataSource: v as ChartConfig['dataSource'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workflow_instances">Workflow Instances</SelectItem>
                      <SelectItem value="workflow_steps">Workflow Steps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Group By</Label>
                  <Select value={editingChart.groupBy} onValueChange={v => setEditingChart({ ...editingChart, groupBy: v as ChartConfig['groupBy'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="step_name">Step Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>KPI Metric</Label>
                  <Select value={editingChart.kpiMetric} onValueChange={v => setEditingChart({ ...editingChart, kpiMetric: v as ChartConfig['kpiMetric'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avg_time">Average Time</SelectItem>
                      <SelectItem value="sla_breach">SLA Breach</SelectItem>
                      <SelectItem value="completion_rate">Completion Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SLA Threshold (hrs, optional)</Label>
                  <Input type="number" value={editingChart.slaThreshold ?? ''} onChange={e => setEditingChart({ ...editingChart, slaThreshold: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department Scope</Label>
                  <Select value={editingChart.departmentScope} onValueChange={v => setEditingChart({ ...editingChart, departmentScope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Input type="number" value={editingChart.refreshInterval} onChange={e => setEditingChart({ ...editingChart, refreshInterval: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Visibility</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['admin', 'supervisor', 'approver', 'staff'].map(role => (
                      <label key={role} className="flex items-center gap-1.5 text-sm capitalize cursor-pointer">
                        <input type="checkbox" checked={editingChart.roleVisibility.includes(role)} onChange={e => {
                          const vis = e.target.checked ? [...editingChart.roleVisibility, role] : editingChart.roleVisibility.filter(r => r !== role);
                          setEditingChart({ ...editingChart, roleVisibility: vis });
                        }} className="rounded border-input" />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingChart.status} onValueChange={v => setEditingChart({ ...editingChart, status: v as 'active' | 'draft' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* JSON Preview */}
              <div className="space-y-2">
                <Label>JSON Configuration Preview</Label>
                <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-32">{JSON.stringify(editingChart, null, 2)}</pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChartModalOpen(false)}>Cancel</Button>
            <Button onClick={saveChart}><Save className="w-4 h-4 mr-1" /> Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════ SLA MODAL ════════ */}
      <Dialog open={slaModalOpen} onOpenChange={setSlaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSla && slaRules.find(s => s.id === editingSla.id) ? 'Edit SLA Rule' : 'New SLA Rule'}</DialogTitle>
          </DialogHeader>
          {editingSla && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Step Name</Label>
                <Select value={editingSla.stepName} onValueChange={v => setEditingSla({ ...editingSla, stepName: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(STEPS_BY_WORKFLOW[editingSla.workflowId] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SLA Duration (hours)</Label>
                  <Input type="number" value={editingSla.slaDuration} onChange={e => setEditingSla({ ...editingSla, slaDuration: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Escalation Time (hours)</Label>
                  <Input type="number" value={editingSla.escalationTime} onChange={e => setEditingSla({ ...editingSla, escalationTime: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select value={editingSla.alertType} onValueChange={v => setEditingSla({ ...editingSla, alertType: v as SlaRule['alertType'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlaModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSla}><Save className="w-4 h-4 mr-1" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════ KPI MODAL ════════ */}
      <Dialog open={kpiModalOpen} onOpenChange={setKpiModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingKpi && kpis.find(k => k.id === editingKpi.id) ? 'Edit KPI' : 'Define KPI'}</DialogTitle>
          </DialogHeader>
          {editingKpi && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2"><Label>KPI Name</Label><Input value={editingKpi.name} onChange={e => setEditingKpi({ ...editingKpi, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingKpi.description} onChange={e => setEditingKpi({ ...editingKpi, description: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Formula Expression</Label><Input value={editingKpi.formula} onChange={e => setEditingKpi({ ...editingKpi, formula: e.target.value })} className="font-mono text-sm" placeholder="AVG(completed_at - started_at)" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Workflow Scope</Label>
                  <Select value={editingKpi.workflowScope} onValueChange={v => setEditingKpi({ ...editingKpi, workflowScope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workflows</SelectItem>
                      {mockWorkflowTemplates.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingKpi.status} onValueChange={v => setEditingKpi({ ...editingKpi, status: v as 'active' | 'draft' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role Visibility</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['admin', 'supervisor', 'approver', 'staff'].map(role => (
                    <label key={role} className="flex items-center gap-1.5 text-sm capitalize cursor-pointer">
                      <input type="checkbox" checked={editingKpi.roleVisibility.includes(role)} onChange={e => {
                        const vis = e.target.checked ? [...editingKpi.roleVisibility, role] : editingKpi.roleVisibility.filter(r => r !== role);
                        setEditingKpi({ ...editingKpi, roleVisibility: vis });
                      }} className="rounded border-input" />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKpiModalOpen(false)}>Cancel</Button>
            <Button onClick={saveKpi}><Save className="w-4 h-4 mr-1" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════ BOTTLENECK MODAL ════════ */}
      <Dialog open={bnModalOpen} onOpenChange={setBnModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBn && bnRules.find(b => b.id === editingBn.id) ? 'Edit Bottleneck Rule' : 'New Bottleneck Rule'}</DialogTitle>
          </DialogHeader>
          {editingBn && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Step</Label>
                <Select value={editingBn.stepName} onValueChange={v => setEditingBn({ ...editingBn, stepName: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(STEPS_BY_WORKFLOW[editingBn.workflowId] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={editingBn.condition} onValueChange={v => setEditingBn({ ...editingBn, condition: v as BottleneckRule['condition'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avg_gt_sla">avg_time &gt; SLA</SelectItem>
                      <SelectItem value="avg_gt_sla_multiplier">avg_time &gt; SLA × multiplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Multiplier</Label>
                  <Input type="number" step="0.1" value={editingBn.multiplier} onChange={e => setEditingBn({ ...editingBn, multiplier: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Alert Level</Label>
                  <Select value={editingBn.alertLevel} onValueChange={v => setEditingBn({ ...editingBn, alertLevel: v as BottleneckRule['alertLevel'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Highlight Color</Label>
                  <Input type="color" value={editingBn.highlightColor} onChange={e => setEditingBn({ ...editingBn, highlightColor: e.target.value })} className="h-10 p-1" />
                </div>
                <div className="space-y-2">
                  <Label>Show Badge</Label>
                  <div className="pt-2"><Switch checked={editingBn.showBadge} onCheckedChange={v => setEditingBn({ ...editingBn, showBadge: v })} /></div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBnModalOpen(false)}>Cancel</Button>
            <Button onClick={saveBn}><Save className="w-4 h-4 mr-1" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

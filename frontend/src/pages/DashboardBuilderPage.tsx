import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DashboardTemplate, WidgetConfig, WidgetDefinition, WIDGET_LIBRARY, WIDGET_CATEGORIES,
  SIZE_PRESETS, WidgetSize, DataScope, mockDashboardTemplates,
} from '@/data/mockDashboardBuilder';
import { AppRole, ROLE_LABELS } from '@/contexts/AuthContext';
import {
  ArrowLeft, Save, Eye, GripVertical, Trash2, Settings2, Plus, Minus,
  ClipboardList, CheckSquare, AlertTriangle, RotateCcw, CheckCircle,
  FileText, PieChart, Upload, HelpCircle, ShieldAlert, Calendar, CalendarDays,
  Timer, Activity, BarChart3, Gauge, Clock, Users, Building2, Bell,
  Hash, LineChart, Puzzle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const ALL_ROLES: AppRole[] = ['staff', 'approver', 'supervisor', 'admin', 'external'];

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardList, CheckSquare, AlertTriangle, RotateCcw, CheckCircle,
  FileText, PieChart, Upload, HelpCircle, ShieldAlert, Calendar, CalendarDays,
  Timer, Activity, BarChart3, Gauge, Clock, Users, Building2, Bell,
  Hash, LineChart, Puzzle,
};

function getIcon(name: string) {
  return ICON_MAP[name] || HelpCircle;
}

export default function DashboardBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<DashboardTemplate>(() => {
    const found = mockDashboardTemplates.find((t) => t.id === id);
    return found ? { ...found, widgets: found.widgets.map((w) => ({ ...w })) } : {
      id: id || `dt-${Date.now()}`,
      name: 'New Dashboard',
      description: '',
      status: 'draft',
      assignedRoles: [],
      isDefault: false,
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'John Smith',
    };
  });

  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const selectedWidget = template.widgets.find((w) => w.id === selectedWidgetId) || null;

  const addWidget = useCallback((def: WidgetDefinition) => {
    const preset = SIZE_PRESETS[def.defaultSize];
    const newWidget: WidgetConfig = {
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      widgetType: def.type,
      title: def.label,
      posX: 0,
      posY: template.widgets.length * 2,
      width: preset.width,
      height: preset.height,
      dataScope: def.allowedScopes[0],
      filters: {},
      refreshInterval: 60,
      visibilityConditions: {},
      enabled: true,
    };
    setTemplate((prev) => ({ ...prev, widgets: [...prev.widgets, newWidget], updatedAt: new Date() }));
    setSelectedWidgetId(newWidget.id);
    toast({ title: 'Widget added', description: `"${def.label}" has been added to the canvas.` });
  }, [template.widgets.length]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setTemplate((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => w.id === widgetId ? { ...w, ...updates } : w),
      updatedAt: new Date(),
    }));
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setTemplate((prev) => ({ ...prev, widgets: prev.widgets.filter((w) => w.id !== widgetId), updatedAt: new Date() }));
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
    toast({ title: 'Widget removed' });
  }, [selectedWidgetId]);

  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    setTemplate((prev) => {
      const idx = prev.widgets.findIndex((w) => w.id === widgetId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(prev.widgets.length - 1, idx + 1);
      if (idx === newIdx) return prev;
      const widgets = [...prev.widgets];
      [widgets[idx], widgets[newIdx]] = [widgets[newIdx], widgets[idx]];
      return { ...prev, widgets, updatedAt: new Date() };
    });
  }, []);

  const handleSave = () => {
    toast({ title: 'Dashboard saved', description: `"${template.name}" has been saved successfully.` });
  };

  const filteredLibrary = WIDGET_LIBRARY.filter((w) => {
    const matchSearch = w.label.toLowerCase().includes(widgetSearch.toLowerCase());
    const matchCat = activeCategory === 'all' || w.category === activeCategory;
    return matchSearch && matchCat;
  });

  const getWidgetDef = (type: string) => WIDGET_LIBRARY.find((w) => w.type === type);

  return (
    <MainLayout title="Dashboard Builder" subtitle={template.name}>
      <div className="animate-fade-in">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard-templates')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <Input
                value={template.name}
                onChange={(e) => setTemplate((p) => ({ ...p, name: e.target.value }))}
                className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={template.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">{template.status}</Badge>
                {template.assignedRoles.map((r) => (
                  <Badge key={r} variant="outline" className="text-xs">{ROLE_LABELS[r]}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/dashboard-preview/${template.id}`)}>
              <Eye className="w-4 h-4 mr-2" /> Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>

        {/* Three-Panel Layout */}
        <div className="grid grid-cols-12 gap-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
          {/* LEFT: Widget Library */}
          <div className="col-span-3">
            <Card className="enterprise-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Widget Library</CardTitle>
                <Input placeholder="Search widgets..." value={widgetSearch} onChange={(e) => setWidgetSearch(e.target.value)} className="mt-2" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-wrap gap-1 px-4 pb-3">
                  <button
                    className={cn('text-xs px-2 py-1 rounded-full transition-colors', activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}
                    onClick={() => setActiveCategory('all')}
                  >All</button>
                  {WIDGET_CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      className={cn('text-xs px-2 py-1 rounded-full transition-colors capitalize', activeCategory === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}
                      onClick={() => setActiveCategory(c.key)}
                    >{c.label.split(' ')[0]}</button>
                  ))}
                </div>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-1 px-4 pb-4">
                    {filteredLibrary.map((def) => {
                      const Icon = getIcon(def.icon);
                      return (
                        <button
                          key={def.type}
                          onClick={() => addWidget(def)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">{def.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{def.description}</p>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* CENTER: Canvas */}
          <div className="col-span-6">
            <Card className="enterprise-card h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Canvas — {template.widgets.length} widgets</CardTitle>
                  <Badge variant="outline" className="text-xs">12-column grid</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-350px)]">
                  {template.widgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <Settings2 className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-medium">No widgets added yet</p>
                      <p className="text-xs mt-1">Click a widget from the library to add it</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {template.widgets.map((widget, idx) => {
                        const def = getWidgetDef(widget.widgetType);
                        const Icon = def ? getIcon(def.icon) : HelpCircle;
                        const isSelected = selectedWidgetId === widget.id;
                        return (
                          <div
                            key={widget.id}
                            onClick={() => setSelectedWidgetId(widget.id)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer',
                              isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30',
                              !widget.enabled && 'opacity-50'
                            )}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{widget.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">
                                  {widget.width}col × {widget.height}row
                                </span>
                                <Badge variant="outline" className="text-[10px] py-0">{widget.dataScope.replace('_', ' ')}</Badge>
                                {!widget.enabled && <Badge variant="destructive" className="text-[10px] py-0">Disabled</Badge>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); moveWidget(widget.id, 'up'); }} disabled={idx === 0}>
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); moveWidget(widget.id, 'down'); }} disabled={idx === template.widgets.length - 1}>
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Widget Config */}
          <div className="col-span-3">
            <Card className="enterprise-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Widget Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedWidget ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Settings2 className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm">Select a widget to configure</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-5 pr-2">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
                        <Input value={selectedWidget.title} onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })} />
                      </div>

                      {/* Size */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Size</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['small', 'medium', 'large'] as WidgetSize[]).map((size) => {
                            const p = SIZE_PRESETS[size];
                            const active = selectedWidget.width === p.width && selectedWidget.height === p.height;
                            return (
                              <button
                                key={size}
                                className={cn('text-xs px-3 py-2 rounded-lg border transition-colors capitalize', active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30')}
                                onClick={() => updateWidget(selectedWidget.id, { width: p.width, height: p.height })}
                              >{size}</button>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-[10px]">Width (cols)</Label>
                            <Input type="number" min={1} max={12} value={selectedWidget.width} onChange={(e) => updateWidget(selectedWidget.id, { width: Math.min(12, Math.max(1, parseInt(e.target.value) || 1)) })} />
                          </div>
                          <div>
                            <Label className="text-[10px]">Height (rows)</Label>
                            <Input type="number" min={1} max={4} value={selectedWidget.height} onChange={(e) => updateWidget(selectedWidget.id, { height: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) })} />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Data Source */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Source</Label>
                        <Select value={selectedWidget.dataScope} onValueChange={(v) => updateWidget(selectedWidget.id, { dataScope: v as DataScope })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(getWidgetDef(selectedWidget.widgetType)?.allowedScopes || ['current_user']).map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filters */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</Label>
                        <Select value={selectedWidget.filters.dateRange || 'all'} onValueChange={(v) => updateWidget(selectedWidget.id, { filters: { ...selectedWidget.filters, dateRange: v as any } })}>
                          <SelectTrigger><SelectValue placeholder="Date Range" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Refresh Interval */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Refresh Interval</Label>
                        <Select value={String(selectedWidget.refreshInterval)} onValueChange={(v) => updateWidget(selectedWidget.id, { refreshInterval: parseInt(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Manual</SelectItem>
                            <SelectItem value="30">30 seconds</SelectItem>
                            <SelectItem value="60">1 minute</SelectItem>
                            <SelectItem value="120">2 minutes</SelectItem>
                            <SelectItem value="300">5 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Visibility */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visibility Conditions</Label>
                        <div className="space-y-2">
                          {ALL_ROLES.map((role) => (
                            <label key={role} className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={!selectedWidget.visibilityConditions.roles || selectedWidget.visibilityConditions.roles.includes(role)}
                                onCheckedChange={(checked) => {
                                  const current = selectedWidget.visibilityConditions.roles || [...ALL_ROLES];
                                  const next = checked ? [...current, role] : current.filter((r) => r !== role);
                                  updateWidget(selectedWidget.id, { visibilityConditions: { ...selectedWidget.visibilityConditions, roles: next } });
                                }}
                              />
                              {ROLE_LABELS[role]}
                            </label>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Enable/Disable */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Enabled</Label>
                        <Switch checked={selectedWidget.enabled} onCheckedChange={(v) => updateWidget(selectedWidget.id, { enabled: v })} />
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

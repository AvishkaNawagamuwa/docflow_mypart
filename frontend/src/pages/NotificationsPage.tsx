import { useState } from 'react';
import { Bell, Mail, Clock, AlertTriangle, CheckCircle, Settings, Plus, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface NotificationRule {
  id: string;
  event: string;
  channel: 'email' | 'in-app' | 'both';
  recipients: string;
  enabled: boolean;
  description: string;
}

const defaultRules: NotificationRule[] = [
  { id: 'nr-1', event: 'task_assigned', channel: 'both', recipients: 'Assigned User', enabled: true, description: 'When a task is assigned to a user' },
  { id: 'nr-2', event: 'sla_reminder', channel: 'email', recipients: 'Assigned User + Manager', enabled: true, description: 'Reminder before SLA deadline' },
  { id: 'nr-3', event: 'sla_breach', channel: 'both', recipients: 'Assigned User + Manager + Admin', enabled: true, description: 'When SLA deadline is exceeded' },
  { id: 'nr-4', event: 'workflow_completed', channel: 'email', recipients: 'Initiator', enabled: true, description: 'When a workflow instance completes' },
  { id: 'nr-5', event: 'task_rejected', channel: 'both', recipients: 'Initiator + Assigned User', enabled: false, description: 'When a task is rejected' },
  { id: 'nr-6', event: 'document_uploaded', channel: 'in-app', recipients: 'Workflow Owner', enabled: false, description: 'When a new document is uploaded' },
];

const eventIcons: Record<string, React.ElementType> = {
  task_assigned: Bell,
  sla_reminder: Clock,
  sla_breach: AlertTriangle,
  workflow_completed: CheckCircle,
  task_rejected: AlertTriangle,
  document_uploaded: Mail,
};

export default function NotificationsPage() {
  const [rules, setRules] = useState<NotificationRule[]>(defaultRules);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ event: '', channel: 'email' as const, recipients: '' });

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    toast.success('Notification rule updated');
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success('Notification rule deleted');
  };

  const handleAddRule = () => {
    const rule: NotificationRule = {
      id: `nr-${Date.now()}`, event: newRule.event, channel: newRule.channel,
      recipients: newRule.recipients, enabled: true,
      description: `Custom rule for ${newRule.event.replace(/_/g, ' ')}`,
    };
    setRules([...rules, rule]);
    setShowAddRule(false);
    setNewRule({ event: '', channel: 'email', recipients: '' });
    toast.success('Notification rule created');
  };

  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <MainLayout title="Notifications" subtitle="Configure notification triggers and channels">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="enterprise-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">{rules.length}</div>
                  <div className="text-sm text-muted-foreground">Total Rules</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">{enabledCount}</div>
                  <div className="text-sm text-muted-foreground">Active Rules</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">{rules.length - enabledCount}</div>
                  <div className="text-sm text-muted-foreground">Disabled Rules</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules List */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Notification Rules</h3>
          <Button onClick={() => setShowAddRule(true)}><Plus className="w-4 h-4 mr-2" />Add Rule</Button>
        </div>

        <div className="space-y-3">
          {rules.map(rule => {
            const Icon = eventIcons[rule.event] || Bell;
            return (
              <div key={rule.id} className={`enterprise-card p-4 transition-opacity ${!rule.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground capitalize">
                        {rule.event.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={rule.channel === 'email' ? 'outline' : rule.channel === 'in-app' ? 'secondary' : 'default'}>
                        {rule.channel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Recipients: {rule.recipients}</p>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notification Rule</DialogTitle>
            <DialogDescription>Configure when and how notifications are sent</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trigger Event</Label>
              <Select value={newRule.event} onValueChange={(v) => setNewRule({ ...newRule, event: v })}>
                <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task_assigned">Task Assigned</SelectItem>
                  <SelectItem value="sla_reminder">SLA Reminder</SelectItem>
                  <SelectItem value="sla_breach">SLA Breach</SelectItem>
                  <SelectItem value="workflow_completed">Workflow Completed</SelectItem>
                  <SelectItem value="task_rejected">Task Rejected</SelectItem>
                  <SelectItem value="document_uploaded">Document Uploaded</SelectItem>
                  <SelectItem value="comment_added">Comment Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={newRule.channel} onValueChange={(v) => setNewRule({ ...newRule, channel: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="in-app">In-App Only</SelectItem>
                  <SelectItem value="both">Email + In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Input
                value={newRule.recipients}
                onChange={(e) => setNewRule({ ...newRule, recipients: e.target.value })}
                placeholder="e.g. Assigned User + Manager"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRule(false)}>Cancel</Button>
            <Button onClick={handleAddRule} disabled={!newRule.event || !newRule.recipients}>Add Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

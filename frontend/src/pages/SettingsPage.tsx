import { useState } from 'react';
import {
  Settings, Cloud, FolderArchive, Clock, Save, RefreshCw, ToggleLeft
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    onedriveEnabled: true,
    onedriveTenantId: 'acme-corp-tenant',
    onedriveWatchFolder: '/Documents/Incoming',
    onedriveSyncInterval: '15',
    archiveEnabled: true,
    archivePath: '/Documents/Archive',
    archiveAfterDays: '90',
    autoArchive: true,
    defaultSlaHours: '48',
    slaReminderHours: '8',
    slaEscalationEnabled: true,
    slaEscalationTarget: 'Admin',
    maxFileSize: '10',
    allowedExtensions: 'pdf,docx,xlsx',
    retentionDays: '365',
    auditLogEnabled: true,
  });

  const update = (key: string, value: string | boolean) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <MainLayout title="Settings" subtitle="System configuration and integrations">
      <div className="space-y-6 max-w-3xl">
        {/* OneDrive Integration */}
        <Card className="enterprise-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>OneDrive Integration</CardTitle>
                  <CardDescription>Sync documents from OneDrive folders</CardDescription>
                </div>
              </div>
              <Switch
                checked={settings.onedriveEnabled}
                onCheckedChange={(v) => update('onedriveEnabled', v)}
              />
            </div>
          </CardHeader>
          {settings.onedriveEnabled && (
            <CardContent className="space-y-4 pt-0">
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tenant ID</Label>
                  <Input value={settings.onedriveTenantId} onChange={(e) => update('onedriveTenantId', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sync Interval (minutes)</Label>
                  <Select value={settings.onedriveSyncInterval} onValueChange={(v) => update('onedriveSyncInterval', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 min</SelectItem>
                      <SelectItem value="15">Every 15 min</SelectItem>
                      <SelectItem value="30">Every 30 min</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Watch Folder Path</Label>
                <Input value={settings.onedriveWatchFolder} onChange={(e) => update('onedriveWatchFolder', e.target.value)} />
              </div>
              <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Test Connection</Button>
            </CardContent>
          )}
        </Card>

        {/* Archive Configuration */}
        <Card className="enterprise-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderArchive className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Archive Configuration</CardTitle>
                  <CardDescription>Configure document archival settings</CardDescription>
                </div>
              </div>
              <Switch
                checked={settings.archiveEnabled}
                onCheckedChange={(v) => update('archiveEnabled', v)}
              />
            </div>
          </CardHeader>
          {settings.archiveEnabled && (
            <CardContent className="space-y-4 pt-0">
              <Separator />
              <div className="space-y-2">
                <Label>Archive Path</Label>
                <Input value={settings.archivePath} onChange={(e) => update('archivePath', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Auto-Archive After (days)</Label>
                  <Input type="number" value={settings.archiveAfterDays} onChange={(e) => update('archiveAfterDays', e.target.value)} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={settings.autoArchive} onCheckedChange={(v) => update('autoArchive', v)} />
                  <Label>Enable Auto-Archive</Label>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Default SLA Settings */}
        <Card className="enterprise-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Default SLA Settings</CardTitle>
                <CardDescription>Configure default SLA durations and escalation behavior</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default SLA Duration (hours)</Label>
                <Input type="number" value={settings.defaultSlaHours} onChange={(e) => update('defaultSlaHours', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reminder Before (hours)</Label>
                <Input type="number" value={settings.slaReminderHours} onChange={(e) => update('slaReminderHours', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label>Auto-Escalation</Label>
                <p className="text-xs text-muted-foreground">Automatically escalate tasks when SLA is breached</p>
              </div>
              <Switch checked={settings.slaEscalationEnabled} onCheckedChange={(v) => update('slaEscalationEnabled', v)} />
            </div>
            {settings.slaEscalationEnabled && (
              <div className="space-y-2">
                <Label>Escalation Target</Label>
                <Select value={settings.slaEscalationTarget} onValueChange={(v) => update('slaEscalationTarget', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Department Manager</SelectItem>
                    <SelectItem value="CFO">CFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="enterprise-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>File upload limits and data retention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max File Size (MB)</Label>
                <Input type="number" value={settings.maxFileSize} onChange={(e) => update('maxFileSize', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Retention (days)</Label>
                <Input type="number" value={settings.retentionDays} onChange={(e) => update('retentionDays', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Allowed File Extensions</Label>
              <Input value={settings.allowedExtensions} onChange={(e) => update('allowedExtensions', e.target.value)} />
              <p className="text-xs text-muted-foreground">Comma-separated list of extensions</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-xs text-muted-foreground">Record all user actions for compliance</p>
              </div>
              <Switch checked={settings.auditLogEnabled} onCheckedChange={(v) => update('auditLogEnabled', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4 mr-2" />Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

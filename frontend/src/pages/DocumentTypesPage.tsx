import { useState } from 'react';
import {
  Plus, Pencil, Trash2, FolderOpen, Link2, GripVertical, ToggleLeft, ToggleRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { mockDocumentTypeConfigs, DocumentTypeConfig, MetadataField } from '@/data/mockDocumentTypes';
import { mockWorkflowTemplates } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DocumentTypesPage() {
  const [docTypes, setDocTypes] = useState<DocumentTypeConfig[]>(mockDocumentTypeConfigs);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<DocumentTypeConfig | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'Financial', description: '', allowedFileTypes: ['pdf'],
    linkedWorkflowId: '', fields: [] as MetadataField[],
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', category: 'Financial', description: '', allowedFileTypes: ['pdf'], linkedWorkflowId: '', fields: [] });
    setShowEditor(true);
  };

  const openEdit = (dt: DocumentTypeConfig) => {
    setEditing(dt);
    setForm({
      name: dt.name, category: dt.category, description: dt.description,
      allowedFileTypes: dt.allowedFileTypes, linkedWorkflowId: dt.linkedWorkflowId || '',
      fields: dt.requiredFields,
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    const linkedWf = mockWorkflowTemplates.find(w => w.id === form.linkedWorkflowId);
    if (editing) {
      setDocTypes(docTypes.map(dt =>
        dt.id === editing.id ? {
          ...dt, name: form.name, category: form.category, description: form.description,
          allowedFileTypes: form.allowedFileTypes, linkedWorkflowId: form.linkedWorkflowId,
          linkedWorkflowName: linkedWf?.name, requiredFields: form.fields,
        } : dt
      ));
      toast.success('Document type updated');
    } else {
      const newDt: DocumentTypeConfig = {
        id: `dtype-${Date.now()}`, name: form.name, category: form.category,
        description: form.description, allowedFileTypes: form.allowedFileTypes,
        linkedWorkflowId: form.linkedWorkflowId, linkedWorkflowName: linkedWf?.name,
        requiredFields: form.fields, isActive: true,
      };
      setDocTypes([...docTypes, newDt]);
      toast.success('Document type created');
    }
    setShowEditor(false);
  };

  const handleDelete = (id: string) => {
    setDocTypes(docTypes.filter(dt => dt.id !== id));
    toast.success('Document type deleted');
  };

  const toggleActive = (id: string) => {
    setDocTypes(docTypes.map(dt =>
      dt.id === id ? { ...dt, isActive: !dt.isActive } : dt
    ));
  };

  const addField = () => {
    setForm({
      ...form,
      fields: [...form.fields, { id: `f-${Date.now()}`, name: '', type: 'text', required: false }],
    });
  };

  const removeField = (id: string) => {
    setForm({ ...form, fields: form.fields.filter(f => f.id !== id) });
  };

  const updateField = (id: string, updates: Partial<MetadataField>) => {
    setForm({ ...form, fields: form.fields.map(f => f.id === id ? { ...f, ...updates } : f) });
  };

  return (
    <MainLayout title="Document Types" subtitle="Configure document types and their metadata fields">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {docTypes.length} document types configured • {docTypes.filter(d => d.isActive).length} active
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Document Type</Button>
        </div>

        <div className="enterprise-card">
          {docTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No document types configured</h3>
              <p className="text-sm text-muted-foreground mt-1">Create your first document type to get started</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Document Type</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Metadata Fields</TableHead>
                  <TableHead>Linked Workflow</TableHead>
                  <TableHead>File Types</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docTypes.map(dt => (
                  <TableRow key={dt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{dt.name}</div>
                        <div className="text-xs text-muted-foreground">{dt.description}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{dt.category}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dt.requiredFields.slice(0, 3).map(f => (
                          <Badge key={f.id} variant="secondary" className="text-xs">{f.name}</Badge>
                        ))}
                        {dt.requiredFields.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{dt.requiredFields.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dt.linkedWorkflowName ? (
                        <div className="flex items-center gap-1.5 text-sm text-primary">
                          <Link2 className="w-3.5 h-3.5" />{dt.linkedWorkflowName}
                        </div>
                      ) : <span className="text-sm text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {dt.allowedFileTypes.map(ft => (
                          <Badge key={ft} variant="outline" className="text-xs uppercase">{ft}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={dt.isActive} onCheckedChange={() => toggleActive(dt.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(dt)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dt.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Document Type</DialogTitle>
            <DialogDescription>Configure the document type and its metadata fields</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Purchase Order" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Financial', 'Procurement', 'HR', 'Legal', 'Operations', 'Custom'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this document type..." />
            </div>
            <div className="space-y-2">
              <Label>Link to Workflow Template</Label>
              <Select value={form.linkedWorkflowId} onValueChange={(v) => setForm({ ...form, linkedWorkflowId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a workflow..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {mockWorkflowTemplates.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Metadata Fields</Label>
                <Button variant="outline" size="sm" onClick={addField}><Plus className="w-3 h-3 mr-1" />Add Field</Button>
              </div>
              {form.fields.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">No fields defined. Add fields to capture document metadata.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="Field name"
                        className="flex-1"
                      />
                      <Select value={field.type} onValueChange={(v) => updateField(field.id, { type: v as MetadataField['type'] })}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch checked={field.required} onCheckedChange={(v) => updateField(field.id, { required: v })} />
                        <span className="text-xs text-muted-foreground w-14">{field.required ? 'Required' : 'Optional'}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

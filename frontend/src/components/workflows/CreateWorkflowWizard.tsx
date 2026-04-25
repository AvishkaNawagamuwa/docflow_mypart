import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WorkflowFormData } from '@/types/workflow';
import { defaultStatuses } from '@/data/mockData';

interface CreateWorkflowWizardProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkflowWizard({ open, onClose }: CreateWorkflowWizardProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    documentCategory: '',
    documentType: '',
    trigger: ['manual'],
    triggerPath: '',
    allowedFileTypes: ['pdf'],
    initiatorRoles: [],
    approverRoles: [],
    viewerRoles: [],
    defaultOwner: '',
    allowOverride: true,
    statuses: defaultStatuses,
    finalStatuses: ['status-4', 'status-5', 'status-6'],
  });

  const updateField = <K extends keyof WorkflowFormData>(
    field: K,
    value: WorkflowFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    navigate('/workflows/new/builder', {
      state: {
        draft: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          documentCategory: formData.documentCategory || 'general',
          documentType: formData.documentType || 'general',
          trigger: formData.trigger[0] || 'manual',
          triggerPath: formData.triggerPath || '',
          allowedFileTypes: formData.allowedFileTypes || [],
        },
      },
    });
    onClose();
  };

  const isFormValid = formData.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Add the basics now. You can configure the rest in the builder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Purchase Order Approval"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the purpose of this workflow..."
                className="mt-1.5 resize-none"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleCreate} disabled={!isFormValid}>
            Create & Build
            <Check className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

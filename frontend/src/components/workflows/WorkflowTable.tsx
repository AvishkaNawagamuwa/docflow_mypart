import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Rocket, 
  Archive, 
  Trash2, 
  Eye,
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkflowTemplate, WorkflowStatus } from '@/types/workflow';
import { formatDistanceToNow } from 'date-fns';

interface WorkflowTableProps {
  workflows: WorkflowTemplate[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusVariantMap: Record<WorkflowStatus, 'active' | 'draft' | 'archived' | 'disabled'> = {
  active: 'active',
  draft: 'draft',
  archived: 'archived',
  disabled: 'disabled',
};

export function WorkflowTable({
  workflows,
  onEdit,
  onDuplicate,
  onPublish,
  onArchive,
  onDelete,
}: WorkflowTableProps) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === workflows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(workflows.map((w) => w.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRowClick = (id: string) => {
    navigate(`/workflows/${id}/builder`);
  };

  return (
    <div className="enterprise-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === workflows.length && workflows.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Workflow Name</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead className="text-center">Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.map((workflow) => (
            <TableRow 
              key={workflow.id} 
              className="cursor-pointer hover:bg-muted/30"
              onClick={() => handleRowClick(workflow.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(workflow.id)}
                  onCheckedChange={() => toggleSelect(workflow.id)}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-foreground">{workflow.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {workflow.description}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{workflow.documentType}</span>
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {workflow.documentCategory}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  v{workflow.version}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariantMap[workflow.status]} className="capitalize">
                  {workflow.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(workflow.lastUpdated, { addSuffix: true })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  {workflow.createdBy}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRowClick(workflow.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(workflow.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(workflow.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {workflow.status === 'draft' && (
                      <DropdownMenuItem onClick={() => onPublish(workflow.id)}>
                        <Rocket className="w-4 h-4 mr-2" />
                        Publish
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onArchive(workflow.id)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(workflow.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {workflows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Archive className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No workflows found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create your first workflow template to get started with document automation.
          </p>
        </div>
      )}
    </div>
  );
}

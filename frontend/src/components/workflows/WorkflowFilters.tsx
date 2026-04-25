import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { WorkflowStatus } from '@/types/workflow';

interface WorkflowFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: WorkflowStatus | 'all';
  onStatusChange: (value: WorkflowStatus | 'all') => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  categories?: string[];
}

export function WorkflowFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  onClearFilters,
  categories = ['Financial', 'Procurement', 'HR', 'Legal', 'Operations'],
}: WorkflowFiltersProps) {
  const hasActiveFilters = search || status !== 'all' || category !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={status} onValueChange={(v) => onStatusChange(v as WorkflowStatus | 'all')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((categoryItem) => (
            <SelectItem key={categoryItem} value={categoryItem}>
              {categoryItem}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}

      <Button variant="outline" size="icon" className="ml-auto">
        <Filter className="w-4 h-4" />
      </Button>
    </div>
  );
}

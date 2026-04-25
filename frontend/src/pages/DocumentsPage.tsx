import { useState } from 'react';
import {
  FileText, Upload, Search, Filter, Play, Eye, Archive,
  MoreHorizontal, FolderOpen, CheckCircle, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mockDocuments, Document } from '@/data/mockDocuments';
import { documentTypes } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AIAssistPanel } from '@/components/documents/AIAssistPanel';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; icon: React.ElementType }> = {
  uploaded: { label: 'Uploaded', variant: 'secondary', icon: FolderOpen },
  processing: { label: 'Processing', variant: 'warning', icon: Clock },
  'in-workflow': { label: 'In Workflow', variant: 'default', icon: Play },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
  archived: { label: 'Archived', variant: 'outline', icon: Archive },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showStartWorkflow, setShowStartWorkflow] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'Purchase Order' });
  const [aiDoc, setAiDoc] = useState<Document | null>(null);

  const filtered = documents.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleUpload = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: uploadForm.name || 'Untitled-Document.pdf',
      type: uploadForm.type,
      metadata: {},
      filePath: `/Documents/${uploadForm.name}`,
      status: 'uploaded',
      uploadedBy: 'Current User',
      uploadedAt: new Date(),
      fileSize: '0 KB',
    };
    setDocuments([newDoc, ...documents]);
    setShowUpload(false);
    setUploadForm({ name: '', type: 'Purchase Order' });
    toast.success('Document uploaded successfully');
  };

  const handleStartWorkflow = () => {
    if (!selectedDoc) return;
    setDocuments(documents.map(d =>
      d.id === selectedDoc.id ? { ...d, status: 'in-workflow' as const, workflowInstanceId: `inst-${Date.now()}` } : d
    ));
    setShowStartWorkflow(false);
    setSelectedDoc(null);
    toast.success('Workflow started for document');
  };

  const handleArchive = (doc: Document) => {
    setDocuments(documents.map(d =>
      d.id === doc.id ? { ...d, status: 'archived' as const } : d
    ));
    toast.success('Document archived');
  };

  return (
    <MainLayout title="Documents" subtitle="Manage and track all documents">
      <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="in-workflow">In Workflow</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => { if (filtered.length > 0) setAiDoc(filtered[0]); }}>
            <Sparkles className="w-4 h-4 mr-2" />AI Assist
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-5">
          {[
            { label: 'Total', value: documents.length, color: 'bg-primary' },
            { label: 'Uploaded', value: documents.filter(d => d.status === 'uploaded').length, color: 'bg-muted-foreground' },
            { label: 'In Workflow', value: documents.filter(d => d.status === 'in-workflow').length, color: 'bg-info' },
            { label: 'Completed', value: documents.filter(d => d.status === 'completed').length, color: 'bg-success' },
            { label: 'Archived', value: documents.filter(d => d.status === 'archived').length, color: 'bg-warning' },
          ].map(s => (
            <div key={s.label} className="enterprise-card p-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-8 rounded-full", s.color)} />
                <div>
                  <div className="text-2xl font-semibold text-foreground">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="enterprise-card">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No documents found</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a document or adjust your filters</p>
              <Button className="mt-4" onClick={() => setShowUpload(true)}>
                <Upload className="w-4 h-4 mr-2" />Upload Document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(doc => {
                  const sc = statusConfig[doc.status];
                  return (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.type}</TableCell>
                      <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{doc.uploadedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{format(doc.uploadedAt, 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.fileSize}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAiDoc(doc)}>
                                <Sparkles className="w-4 h-4 mr-2" />AI Assist
                              </DropdownMenuItem>
                            {doc.status === 'uploaded' && (
                              <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setShowStartWorkflow(true); }}>
                                <Play className="w-4 h-4 mr-2" />Start Workflow
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {doc.status !== 'archived' && (
                              <DropdownMenuItem onClick={() => handleArchive(doc)}>
                                <Archive className="w-4 h-4 mr-2" />Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* AI Assist Panel */}
      {aiDoc && (
        <div className="w-[360px] shrink-0">
          <AIAssistPanel documentName={aiDoc.name} documentType={aiDoc.type} onClose={() => setAiDoc(null)} />
        </div>
      )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new document and assign its type</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input
                placeholder="e.g. PO-2024-0200.pdf"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadForm.type} onValueChange={(v) => setUploadForm({ ...uploadForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Drag & drop your file here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, XLSX (max 10MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Workflow Dialog */}
      <Dialog open={showStartWorkflow} onOpenChange={setShowStartWorkflow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Workflow</DialogTitle>
            <DialogDescription>
              Start a workflow instance for <strong>{selectedDoc?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Document Type</span>
                <span className="font-medium text-foreground">{selectedDoc?.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Matched Workflow</span>
                <span className="font-medium text-primary">
                  {selectedDoc?.type === 'Purchase Order' ? 'Purchase Order Approval' :
                   selectedDoc?.type === 'Invoice' ? 'Invoice Processing' :
                   selectedDoc?.type === 'Contract' ? 'Contract Review' : 'Default Workflow'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Starting a workflow will lock the document and begin the approval process. This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartWorkflow(false)}>Cancel</Button>
            <Button onClick={handleStartWorkflow}>
              <Play className="w-4 h-4 mr-2" />Start Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

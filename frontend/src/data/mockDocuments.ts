export interface Document {
  id: string;
  name: string;
  type: string;
  metadata: Record<string, string>;
  filePath: string;
  status: 'uploaded' | 'processing' | 'in-workflow' | 'completed' | 'archived';
  uploadedBy: string;
  uploadedAt: Date;
  workflowInstanceId?: string;
  fileSize: string;
}

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'PO-2024-0125.pdf',
    type: 'Purchase Order',
    metadata: { amount: '$12,500', supplier: 'ACME Corp', department: 'Engineering' },
    filePath: '/Documents/PurchaseOrders/PO-2024-0125.pdf',
    status: 'in-workflow',
    uploadedBy: 'Alice Cooper',
    uploadedAt: new Date('2024-01-28T09:30:00'),
    workflowInstanceId: 'inst-1',
    fileSize: '245 KB',
  },
  {
    id: 'doc-2',
    name: 'INV-ACME-2024-001.pdf',
    type: 'Invoice',
    metadata: { amount: '$8,750', vendor: 'ACME Corp', poNumber: 'PO-2024-0098' },
    filePath: '/Documents/Invoices/INV-ACME-2024-001.pdf',
    status: 'completed',
    uploadedBy: 'Bob Martin',
    uploadedAt: new Date('2024-01-25T14:00:00'),
    workflowInstanceId: 'inst-2',
    fileSize: '189 KB',
  },
  {
    id: 'doc-3',
    name: 'PO-2024-0126.pdf',
    type: 'Purchase Order',
    metadata: { amount: '$67,000', supplier: 'TechVendor Inc', department: 'IT' },
    filePath: '/Documents/PurchaseOrders/PO-2024-0126.pdf',
    status: 'in-workflow',
    uploadedBy: 'Diana Ross',
    uploadedAt: new Date('2024-01-20T08:00:00'),
    workflowInstanceId: 'inst-3',
    fileSize: '312 KB',
  },
  {
    id: 'doc-4',
    name: 'CONTRACT-2024-008.pdf',
    type: 'Contract',
    metadata: { client: 'GlobalTech', value: '$150,000', duration: '12 months' },
    filePath: '/Documents/Contracts/CONTRACT-2024-008.pdf',
    status: 'uploaded',
    uploadedBy: 'Sarah Johnson',
    uploadedAt: new Date('2024-01-30T10:15:00'),
    fileSize: '1.2 MB',
  },
  {
    id: 'doc-5',
    name: 'EXP-2024-042.xlsx',
    type: 'Expense Report',
    metadata: { employee: 'Mike Wilson', totalAmount: '$3,200', period: 'Jan 2024' },
    filePath: '/Documents/Expenses/EXP-2024-042.xlsx',
    status: 'uploaded',
    uploadedBy: 'Mike Wilson',
    uploadedAt: new Date('2024-01-29T16:45:00'),
    fileSize: '56 KB',
  },
  {
    id: 'doc-6',
    name: 'GRN-2024-0089.pdf',
    type: 'GRN (Goods Received Note)',
    metadata: { poReference: 'PO-2024-0110', warehouse: 'Main Warehouse' },
    filePath: '/Documents/GRN/GRN-2024-0089.pdf',
    status: 'archived',
    uploadedBy: 'David Lee',
    uploadedAt: new Date('2024-01-15T11:00:00'),
    fileSize: '178 KB',
  },
];

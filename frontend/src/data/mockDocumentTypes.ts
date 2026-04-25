export interface DocumentTypeConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  requiredFields: MetadataField[];
  linkedWorkflowId?: string;
  linkedWorkflowName?: string;
  allowedFileTypes: string[];
  isActive: boolean;
}

export interface MetadataField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  required: boolean;
  options?: string[];
}

export const mockDocumentTypeConfigs: DocumentTypeConfig[] = [
  {
    id: 'dtype-1',
    name: 'Purchase Order',
    category: 'Procurement',
    description: 'Standard purchase order document for procurement',
    requiredFields: [
      { id: 'f-1', name: 'Amount', type: 'currency', required: true },
      { id: 'f-2', name: 'Supplier', type: 'text', required: true },
      { id: 'f-3', name: 'Department', type: 'select', required: true, options: ['Engineering', 'IT', 'Operations', 'Marketing'] },
      { id: 'f-4', name: 'Delivery Date', type: 'date', required: false },
    ],
    linkedWorkflowId: 'wf-1',
    linkedWorkflowName: 'Purchase Order Approval',
    allowedFileTypes: ['pdf', 'docx'],
    isActive: true,
  },
  {
    id: 'dtype-2',
    name: 'Invoice',
    category: 'Financial',
    description: 'Vendor invoice for payment processing',
    requiredFields: [
      { id: 'f-5', name: 'Invoice Amount', type: 'currency', required: true },
      { id: 'f-6', name: 'Vendor', type: 'text', required: true },
      { id: 'f-7', name: 'PO Reference', type: 'text', required: false },
      { id: 'f-8', name: 'Due Date', type: 'date', required: true },
    ],
    linkedWorkflowId: 'wf-2',
    linkedWorkflowName: 'Invoice Processing',
    allowedFileTypes: ['pdf'],
    isActive: true,
  },
  {
    id: 'dtype-3',
    name: 'Contract',
    category: 'Legal',
    description: 'Legal contracts and agreements',
    requiredFields: [
      { id: 'f-9', name: 'Client/Party', type: 'text', required: true },
      { id: 'f-10', name: 'Contract Value', type: 'currency', required: true },
      { id: 'f-11', name: 'Duration (months)', type: 'number', required: true },
      { id: 'f-12', name: 'Start Date', type: 'date', required: true },
    ],
    linkedWorkflowId: 'wf-3',
    linkedWorkflowName: 'Contract Review',
    allowedFileTypes: ['pdf', 'docx'],
    isActive: true,
  },
  {
    id: 'dtype-4',
    name: 'Expense Report',
    category: 'Financial',
    description: 'Employee expense reimbursement reports',
    requiredFields: [
      { id: 'f-13', name: 'Employee', type: 'text', required: true },
      { id: 'f-14', name: 'Total Amount', type: 'currency', required: true },
      { id: 'f-15', name: 'Period', type: 'text', required: true },
    ],
    linkedWorkflowId: 'wf-4',
    linkedWorkflowName: 'Expense Reimbursement',
    allowedFileTypes: ['pdf', 'xlsx'],
    isActive: false,
  },
  {
    id: 'dtype-5',
    name: 'GRN (Goods Received Note)',
    category: 'Procurement',
    description: 'Goods received verification documents',
    requiredFields: [
      { id: 'f-16', name: 'PO Reference', type: 'text', required: true },
      { id: 'f-17', name: 'Warehouse', type: 'select', required: true, options: ['Main Warehouse', 'Secondary', 'Returns'] },
    ],
    linkedWorkflowId: 'wf-5',
    linkedWorkflowName: 'GRN Verification',
    allowedFileTypes: ['pdf'],
    isActive: true,
  },
];

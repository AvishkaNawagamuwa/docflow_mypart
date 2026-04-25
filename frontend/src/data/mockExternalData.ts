// Mock data for External Third-Party Portal

export type ExternalSubmissionStatus = 'submitted' | 'under-review' | 'revision-required' | 'completed' | 'rejected';

export type SafeStageLabel = 'Submitted' | 'Under Review' | 'Revision Required' | 'Approved' | 'Rejected';

export interface ExternalSubmission {
  id: string;
  externalUserId: string;
  documentName: string;
  documentType: string;
  referenceNo: string;
  companyName: string;
  status: ExternalSubmissionStatus;
  currentStage: SafeStageLabel;
  submittedAt: Date;
  notes?: string;
  fileSize: string;
  timeline: ExternalTimelineEvent[];
  externalMessages: ExternalMessage[];
  revisionReason?: string;
}

export interface ExternalTimelineEvent {
  id: string;
  stage: SafeStageLabel;
  timestamp: Date;
  message: string;
  completed: boolean;
  current: boolean;
}

export interface ExternalMessage {
  id: string;
  sender: 'external' | 'internal';
  senderName: string;
  message: string;
  timestamp: Date;
}

export interface ReasonMessage {
  id: string;
  instanceId: string;
  text: string;
  visibility: 'INTERNAL' | 'EXTERNAL';
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);

export const mockExternalSubmissions: ExternalSubmission[] = [
  {
    id: 'ext-sub-1',
    externalUserId: 'ext-1',
    documentName: 'INV-SUPPLIER-2024-001.pdf',
    documentType: 'Invoice',
    referenceNo: 'REF-2024-0901',
    companyName: 'Acme Supplies Ltd',
    status: 'under-review',
    currentStage: 'Under Review',
    submittedAt: daysAgo(3),
    notes: 'Invoice for Q4 supplies delivery',
    fileSize: '1.2 MB',
    timeline: [
      { id: 'tl-1', stage: 'Submitted', timestamp: daysAgo(3), message: 'Document received and queued for review.', completed: true, current: false },
      { id: 'tl-2', stage: 'Under Review', timestamp: daysAgo(1), message: 'Your document is being reviewed by our team.', completed: false, current: true },
    ],
    externalMessages: [
      { id: 'm-1', sender: 'external', senderName: 'You', message: 'Please expedite this invoice processing.', timestamp: daysAgo(2) },
      { id: 'm-2', sender: 'internal', senderName: 'Document Team', message: 'We have received your request and are reviewing.', timestamp: daysAgo(1) },
    ],
  },
  {
    id: 'ext-sub-2',
    externalUserId: 'ext-1',
    documentName: 'PO-RESPONSE-2024-055.pdf',
    documentType: 'Purchase Order',
    referenceNo: 'REF-2024-0855',
    companyName: 'Acme Supplies Ltd',
    status: 'revision-required',
    currentStage: 'Revision Required',
    submittedAt: daysAgo(7),
    revisionReason: 'Missing company stamp on page 2. Please re-upload with the stamp applied.',
    fileSize: '850 KB',
    timeline: [
      { id: 'tl-3', stage: 'Submitted', timestamp: daysAgo(7), message: 'Document received.', completed: true, current: false },
      { id: 'tl-4', stage: 'Under Review', timestamp: daysAgo(5), message: 'Document reviewed.', completed: true, current: false },
      { id: 'tl-5', stage: 'Revision Required', timestamp: daysAgo(2), message: 'Missing company stamp on page 2.', completed: false, current: true },
    ],
    externalMessages: [],
    notes: 'Response to PO-2024-055',
  },
  {
    id: 'ext-sub-3',
    externalUserId: 'ext-1',
    documentName: 'CERT-ISO-2024.pdf',
    documentType: 'Certificate',
    referenceNo: 'REF-2024-0770',
    companyName: 'Acme Supplies Ltd',
    status: 'completed',
    currentStage: 'Approved',
    submittedAt: daysAgo(14),
    fileSize: '2.1 MB',
    timeline: [
      { id: 'tl-6', stage: 'Submitted', timestamp: daysAgo(14), message: 'Document received.', completed: true, current: false },
      { id: 'tl-7', stage: 'Under Review', timestamp: daysAgo(12), message: 'Document reviewed.', completed: true, current: false },
      { id: 'tl-8', stage: 'Approved', timestamp: daysAgo(10), message: 'Your document has been approved.', completed: true, current: true },
    ],
    externalMessages: [],
  },
  {
    id: 'ext-sub-4',
    externalUserId: 'ext-1',
    documentName: 'CONTRACT-DRAFT-2024.pdf',
    documentType: 'Contract',
    referenceNo: 'REF-2024-0999',
    companyName: 'Acme Supplies Ltd',
    status: 'rejected',
    currentStage: 'Rejected',
    submittedAt: daysAgo(10),
    revisionReason: 'Document does not meet the required format. Please contact support.',
    fileSize: '3.4 MB',
    timeline: [
      { id: 'tl-9', stage: 'Submitted', timestamp: daysAgo(10), message: 'Document received.', completed: true, current: false },
      { id: 'tl-10', stage: 'Under Review', timestamp: daysAgo(8), message: 'Document reviewed.', completed: true, current: false },
      { id: 'tl-11', stage: 'Rejected', timestamp: daysAgo(6), message: 'Document does not meet the required format.', completed: true, current: true },
    ],
    externalMessages: [],
  },
];

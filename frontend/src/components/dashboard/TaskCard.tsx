import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { ApiTaskInstance } from '@/lib/workflowApi';

type TaskAction = 'complete' | 'approve' | 'reject';

interface TaskCardProps {
    task: ApiTaskInstance;
    onComplete: (task: ApiTaskInstance, action: TaskAction, payload: Record<string, unknown>, files?: File[]) => Promise<void>;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
    const [approvalComment, setApprovalComment] = useState('');
    const [approvalChoice, setApprovalChoice] = useState<'approve' | 'reject'>('approve');
    const [submitting, setSubmitting] = useState(false);

    const showSubmission = !!task.requiresSubmission;
    const showApproval = !!task.requiresApproval;

    const sectionLabel = useMemo(() => {
        if (showSubmission && showApproval) return 'Submission + Approval';
        if (showSubmission) return 'Submission';
        if (showApproval) return 'Approval';
        return 'General';
    }, [showApproval, showSubmission]);

    const handleComplete = async () => {
        const action: TaskAction = showApproval ? approvalChoice : 'complete';
        const payload: Record<string, unknown> = {
            submission: showSubmission
                ? {
                    notes: submissionText,
                    files: submissionFiles.map((file) => file.name),
                }
                : undefined,
            approval: showApproval ? { decision: approvalChoice, comment: approvalComment } : undefined,
        };

        if (showSubmission && !showApproval && submissionFiles.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            await onComplete(task, action, payload, showSubmission ? submissionFiles : undefined);
            setSubmissionText('');
            setSubmissionFiles([]);
            setApprovalComment('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="enterprise-card-hover">
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">{task.documentName}</CardTitle>
                        <CardDescription>{task.currentStep} · {task.workflowName}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{sectionLabel}</Badge>
                        {task.slaExceeded ? <Badge variant="destructive">SLA Exceeded</Badge> : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showSubmission ? (
                    <div className="space-y-2 rounded-lg border border-border p-3">
                        <Label className="text-sm font-medium">Submission Section</Label>
                        <Textarea
                            value={submissionText}
                            onChange={(event) => setSubmissionText(event.target.value)}
                            placeholder="Enter submission details"
                            rows={3}
                        />
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Upload one or more documents</Label>
                            <input
                                type="file"
                                multiple
                                onChange={(event) => setSubmissionFiles(Array.from(event.target.files || []))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {submissionFiles.length > 0 ? `${submissionFiles.length} file(s) selected` : 'No files selected'}
                            </p>
                        </div>
                    </div>
                ) : null}

                {showApproval ? (
                    <div className="space-y-2 rounded-lg border border-border p-3">
                        <Label className="text-sm font-medium">Approval Section</Label>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant={approvalChoice === 'approve' ? 'default' : 'outline'} onClick={() => setApprovalChoice('approve')}>
                                Approve
                            </Button>
                            <Button type="button" variant={approvalChoice === 'reject' ? 'destructive' : 'outline'} onClick={() => setApprovalChoice('reject')}>
                                Reject
                            </Button>
                        </div>
                        <Textarea
                            value={approvalComment}
                            onChange={(event) => setApprovalComment(event.target.value)}
                            placeholder="Approval notes"
                            rows={2}
                        />
                    </div>
                ) : null}

                <div className="flex justify-end">
                    <Button onClick={handleComplete} disabled={submitting}>
                        {submitting ? 'Processing...' : (showSubmission && !showApproval ? 'Submit Documents' : 'Complete')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLayout } from '@/components/layout/ExternalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { mockExternalSubmissions, ExternalSubmissionStatus } from '@/data/mockExternalData';
import { CheckCircle, Clock, AlertTriangle, XCircle, Upload, Send, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const stageIcons: Record<string, React.ElementType> = {
  'Submitted': FileText,
  'Under Review': Clock,
  'Revision Required': AlertTriangle,
  'Approved': CheckCircle,
  'Rejected': XCircle,
};

const statusVariant: Record<ExternalSubmissionStatus, 'default' | 'secondary' | 'destructive' | 'warning' | 'success'> = {
  submitted: 'secondary',
  'under-review': 'default',
  'revision-required': 'warning',
  completed: 'success',
  rejected: 'destructive',
};

export default function ExternalSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const submission = mockExternalSubmissions.find(s => s.id === id);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(submission?.externalMessages || []);

  if (!submission) {
    return (
      <ExternalLayout title="Submission Not Found">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 space-y-4">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">Submission not found. Check your tracking ID.</p>
            <Button asChild><Link to="/external/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </ExternalLayout>
    );
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: `m-${Date.now()}`,
      sender: 'external',
      senderName: 'You',
      message: newMessage.trim(),
      timestamp: new Date(),
    }]);
    setNewMessage('');
    toast.success('Message sent');
  };

  return (
    <ExternalLayout title="Submission Details" subtitle={submission.referenceNo}>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/external/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
        </Button>

        {/* Header Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Document</p><p className="font-medium text-foreground">{submission.documentName}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium text-foreground">{submission.documentType}</p></div>
              <div><p className="text-xs text-muted-foreground">Submitted</p><p className="font-medium text-foreground">{format(submission.submittedAt, 'MMM dd, yyyy')}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={statusVariant[submission.status]}>{submission.currentStage}</Badge></div>
            </div>
          </CardContent>
        </Card>

        {/* Revision notice */}
        {submission.status === 'revision-required' && submission.revisionReason && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Revision Required</p>
                  <p className="text-sm text-muted-foreground mt-1">{submission.revisionReason}</p>
                  <Button size="sm" className="mt-3">
                    <Upload className="w-4 h-4 mr-2" />Upload Corrected Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Progress Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {submission.timeline.map((ev, i) => {
                  const Icon = stageIcons[ev.stage] || Clock;
                  return (
                    <div key={ev.id} className="relative pl-8 pb-6 last:pb-0">
                      {i < submission.timeline.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className={cn(
                        "absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        ev.completed ? "bg-primary border-primary" : ev.current ? "bg-background border-primary" : "bg-background border-muted-foreground/30"
                      )}>
                        <Icon className={cn("w-3 h-3", ev.completed ? "text-primary-foreground" : ev.current ? "text-primary" : "text-muted-foreground/50")} />
                      </div>
                      <div>
                        <p className={cn("font-medium text-sm", ev.current ? "text-primary" : "text-foreground")}>{ev.stage}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(ev.timestamp, 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader><CardTitle className="text-base">Messages</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                ) : messages.map(msg => (
                  <div key={msg.id} className={cn("p-3 rounded-lg text-sm", msg.sender === 'external' ? "bg-primary/10 ml-6" : "bg-muted mr-6")}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-foreground">{msg.senderName}</span>
                      <span className="text-xs text-muted-foreground">{format(msg.timestamp, 'MMM dd HH:mm')}</span>
                    </div>
                    <p className="text-muted-foreground">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea placeholder="Send a message to the team..." value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={2} className="flex-1" />
                <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ExternalLayout>
  );
}

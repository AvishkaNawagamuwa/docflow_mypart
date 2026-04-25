import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIResult {
  classification: { type: string; confidence: number };
  metadata: { field: string; value: string; confidence: number }[];
  issues: { message: string; severity: 'warning' | 'error' }[];
}

const mockAIResults: Record<string, AIResult> = {
  'Purchase Order': {
    classification: { type: 'Purchase Order', confidence: 0.96 },
    metadata: [
      { field: 'PO Number', value: 'PO-2024-0125', confidence: 0.99 },
      { field: 'Supplier', value: 'Acme Supplies Ltd', confidence: 0.94 },
      { field: 'Amount', value: '$12,450.00', confidence: 0.91 },
      { field: 'Date', value: '2024-01-15', confidence: 0.97 },
      { field: 'Currency', value: 'USD', confidence: 0.98 },
    ],
    issues: [],
  },
  'Invoice': {
    classification: { type: 'Invoice', confidence: 0.93 },
    metadata: [
      { field: 'Invoice No', value: 'INV-ACME-2024-002', confidence: 0.97 },
      { field: 'Supplier', value: 'ACME Corp', confidence: 0.88 },
      { field: 'Amount', value: '$8,320.00', confidence: 0.95 },
      { field: 'Due Date', value: '2024-02-15', confidence: 0.92 },
    ],
    issues: [{ message: 'Missing supplier signature on page 2', severity: 'warning' }],
  },
  default: {
    classification: { type: 'Other', confidence: 0.72 },
    metadata: [
      { field: 'Reference', value: 'REF-UNKNOWN', confidence: 0.65 },
      { field: 'Date', value: '2024-01-20', confidence: 0.78 },
    ],
    issues: [
      { message: 'Low confidence classification — manual review recommended', severity: 'warning' },
      { message: 'Some fields may be unreadable (poor scan quality)', severity: 'error' },
    ],
  },
};

interface AIAssistPanelProps {
  documentName: string;
  documentType: string;
  onClose: () => void;
}

export function AIAssistPanel({ documentName, documentType, onClose }: AIAssistPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult(mockAIResults[documentType] || mockAIResults.default);
      setAnalyzing(false);
    }, 2000);
  };

  const handleConfirm = () => {
    toast.success('AI-extracted fields saved successfully');
    onClose();
  };

  const confidenceColor = (c: number) =>
    c >= 0.9 ? 'text-success' : c >= 0.75 ? 'text-warning' : 'text-destructive';

  return (
    <Card className="border-primary/30 shadow-lg">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">AI Document Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{documentName}</span>
          </div>
        </div>

        {!result && !analyzing && (
          <Button onClick={handleAnalyze} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />Analyze Document
          </Button>
        )}

        {analyzing && (
          <div className="flex flex-col items-center py-6 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing document...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Classification */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classification</p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{result.classification.type}</Badge>
                </div>
                <span className={cn("text-sm font-mono font-semibold", confidenceColor(result.classification.confidence))}>
                  {(result.classification.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Extracted Metadata */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Extracted Fields</p>
              <div className="space-y-1.5">
                {result.metadata.map(m => (
                  <div key={m.field} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm">
                    <span className="text-muted-foreground">{m.field}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{m.value}</span>
                      <span className={cn("text-xs font-mono", confidenceColor(m.confidence))}>
                        {(m.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issues Found</p>
                {result.issues.map((issue, i) => (
                  <div key={i} className={cn("flex items-start gap-2 p-2.5 rounded-lg text-sm",
                    issue.severity === 'error' ? 'bg-destructive/10' : 'bg-warning/10'
                  )}>
                    <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5",
                      issue.severity === 'error' ? 'text-destructive' : 'text-warning'
                    )} />
                    <span className="text-foreground">{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleAnalyze} className="flex-1">Re-analyze</Button>
              <Button onClick={handleConfirm} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />Confirm & Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

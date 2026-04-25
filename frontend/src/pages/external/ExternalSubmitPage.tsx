import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLayout } from '@/components/layout/ExternalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ExternalSubmitPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ documentType: '', referenceNo: '', companyName: '', notes: '', fileName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.documentType) e.documentType = 'Please select a document type';
    if (!form.referenceNo.trim()) e.referenceNo = 'Reference number is required';
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    if (!form.fileName) e.fileName = 'Please upload a file';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    toast.success('Document submitted successfully');
  };

  if (submitted) {
    return (
      <ExternalLayout title="Submit Document" subtitle="Upload a new document for processing">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Submission Successful</h2>
            <p className="text-muted-foreground">Your document has been submitted and will be reviewed by our team. You can track its progress from your dashboard.</p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ documentType: '', referenceNo: '', companyName: '', notes: '', fileName: '' }); }}>Submit Another</Button>
              <Button onClick={() => navigate('/external/dashboard')}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </ExternalLayout>
    );
  }

  return (
    <ExternalLayout title="Submit Document" subtitle="Upload a new document for processing">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Submission</CardTitle>
          <CardDescription>Fill in the details and upload your document</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                  <SelectTrigger className={errors.documentType ? 'border-destructive' : ''}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Purchase Order">Purchase Order</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                    <SelectItem value="GRN">GRN</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.documentType && <p className="text-xs text-destructive">{errors.documentType}</p>}
              </div>
              <div className="space-y-2">
                <Label>Reference Number *</Label>
                <Input placeholder="e.g. REF-2024-001" value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} className={errors.referenceNo ? 'border-destructive' : ''} />
                {errors.referenceNo && <p className="text-xs text-destructive">{errors.referenceNo}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input placeholder="Your company name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className={errors.companyName ? 'border-destructive' : ''} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Upload File *</Label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${errors.fileName ? 'border-destructive' : 'border-border'}`}
                onClick={() => setForm({ ...form, fileName: 'uploaded-document.pdf' })}>
                {form.fileName ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-success" />{form.fileName}
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX (max 10MB)</p>
                  </>
                )}
              </div>
              {errors.fileName && <p className="text-xs text-destructive">{errors.fileName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Any additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => navigate('/external/dashboard')}>Cancel</Button>
              <Button type="submit"><Upload className="w-4 h-4 mr-2" />Submit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ExternalLayout>
  );
}

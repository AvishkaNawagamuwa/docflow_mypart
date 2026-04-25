import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLayout } from '@/components/layout/ExternalLayout';
import { mockExternalSubmissions, ExternalSubmissionStatus } from '@/data/mockExternalData';
import { FileText, Upload, Eye, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<ExternalSubmissionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; icon: React.ElementType }> = {
  submitted: { label: 'Submitted', variant: 'secondary', icon: FileText },
  'under-review': { label: 'Under Review', variant: 'default', icon: Clock },
  'revision-required': { label: 'Revision Required', variant: 'warning', icon: AlertTriangle },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

export default function ExternalDashboard() {
  const { user } = useAuth();
  const submissions = mockExternalSubmissions;

  const stats = [
    { label: 'Total Submissions', value: submissions.length, icon: FileText, color: 'bg-primary' },
    { label: 'Under Review', value: submissions.filter(s => s.status === 'under-review').length, icon: Clock, color: 'bg-info' },
    { label: 'Revision Required', value: submissions.filter(s => s.status === 'revision-required').length, icon: AlertTriangle, color: 'bg-warning' },
    { label: 'Completed', value: submissions.filter(s => s.status === 'completed').length, icon: CheckCircle, color: 'bg-success' },
  ];

  return (
    <ExternalLayout title="Dashboard" subtitle={`Welcome back, ${user?.name || 'Partner'}`}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/external/submit"><Upload className="w-4 h-4 mr-2" />Submit Document</Link>
          </Button>
        </div>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(sub => {
                    const sc = statusConfig[sub.status];
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.documentName}</TableCell>
                        <TableCell className="text-muted-foreground">{sub.referenceNo}</TableCell>
                        <TableCell className="text-muted-foreground">{format(sub.submittedAt, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-muted-foreground">{sub.currentStage}</TableCell>
                        <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/external/submissions/${sub.id}`}><Eye className="w-4 h-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ExternalLayout>
  );
}

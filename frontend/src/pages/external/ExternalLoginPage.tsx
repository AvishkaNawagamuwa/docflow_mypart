import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, AlertCircle, Loader2, Search } from 'lucide-react';

export default function ExternalLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/external/dashboard', { replace: true });
    } else {
      setError('Invalid email or password');
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }
    navigate(`/external/submissions/${trackingId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Supplier / Client Portal</h1>
          <p className="text-sm text-muted-foreground">Submit and track your documents</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="track">Track Submission</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="supplier@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sign In
                  </Button>
                </form>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Demo: <code className="bg-muted px-1 rounded">external@docflow.com</code> / <code className="bg-muted px-1 rounded">password</code></p>
                </div>
              </TabsContent>

              <TabsContent value="track" className="mt-4">
                <form onSubmit={handleTrack} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tracking / Submission ID</Label>
                    <Input placeholder="e.g. ext-sub-1" value={trackingId} onChange={e => setTrackingId(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full">
                    <Search className="w-4 h-4 mr-2" />Track Submission
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

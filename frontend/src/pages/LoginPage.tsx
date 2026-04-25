import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DASHBOARD_ROUTES, ROLE_LABELS } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      const stored = localStorage.getItem('docflow_user');
      if (stored) {
        const user = JSON.parse(stored);
        navigate(DASHBOARD_ROUTES[user.role as keyof typeof DASHBOARD_ROUTES], { replace: true });
      }
    } else {
      setError('Invalid email or password');
    }
  };

  const demoAccounts = [
    { email: 'staff@docflow.com', role: 'Staff / Initiator' },
    { email: 'approver@docflow.com', role: 'Approver' },
    { email: 'supervisor@docflow.com', role: 'Supervisor' },
    { email: 'admin@docflow.com', role: 'Admin' },
    { email: 'external@docflow.com', role: 'External Party' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Workflow className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">DocFlow</h1>
          <p className="text-lg text-muted-foreground">
            Enterprise Document Management & Workflow Automation Platform
          </p>
          <div className="mt-8 p-6 rounded-xl bg-card border border-border text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">Demo Accounts</p>
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                onClick={() => { setEmail(a.email); setPassword('password'); }}
                className="w-full flex justify-between items-center text-xs p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-muted-foreground font-mono">{a.email}</span>
                <span className="text-primary font-semibold">{a.role}</span>
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground mt-2">Password for all: <code className="bg-muted px-1 rounded">password</code></p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2 lg:hidden">
              <Workflow className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Sign in to DocFlow</CardTitle>
            <CardDescription>Enter your credentials to access the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
                </div>
                <button type="button" className="text-sm text-primary hover:underline">Forgot password?</button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>

            {/* Mobile demo accounts */}
            <div className="mt-6 lg:hidden">
              <p className="text-xs text-muted-foreground text-center mb-2">Quick login as:</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => { setEmail(a.email); setPassword('password'); }}
                    className="text-xs p-2 rounded-lg border border-border hover:bg-muted transition-colors text-center"
                  >
                    {a.role}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

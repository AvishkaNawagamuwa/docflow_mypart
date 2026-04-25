import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { workflowApi, type ApiUserProfile } from '@/lib/workflowApi';
import { toast } from 'sonner';

const DEMO_USERNAMES = ['user1', 'user2', 'user3', 'user4', 'user5'];

export default function UserLoginPage() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<ApiUserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfiles = async () => {
            setLoading(true);
            try {
                const data = await workflowApi.listProfiles();
                setProfiles(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unable to load demo users';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        void loadProfiles();
    }, []);

    const demoProfiles = useMemo(
        () => profiles.filter((profile) => DEMO_USERNAMES.includes(profile.username) && profile.roleId),
        [profiles]
    );

    const handleLogin = (profile: ApiUserProfile) => {
        if (!profile.roleId || !profile.roleName) {
            toast.error('This user has no role assigned');
            return;
        }

        localStorage.setItem(
            'docflow_demo_user',
            JSON.stringify({
                username: profile.username,
                roleId: profile.roleId,
                roleName: profile.roleName,
                departmentName: profile.departmentName || 'Unknown Department',
            })
        );

        navigate('/dashboard/role');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Demo User Login</CardTitle>
                    <CardDescription>Select one of 5 seeded users for role-based workflow testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
                    {!loading && demoProfiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No demo users found. Run backend command: python manage.py seed_demo_workflow_users
                        </p>
                    ) : null}
                    {demoProfiles.map((profile) => (
                        <div key={profile.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="font-medium text-foreground">{profile.username}</p>
                                <p className="text-sm text-muted-foreground">{profile.roleName} · {profile.departmentName}</p>
                            </div>
                            <Button onClick={() => handleLogin(profile)}>Login</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

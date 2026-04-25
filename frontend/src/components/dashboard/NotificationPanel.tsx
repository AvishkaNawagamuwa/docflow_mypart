import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ApiNotification } from '@/lib/workflowApi';

interface NotificationPanelProps {
    notifications: ApiNotification[];
    onMarkRead: (notificationId: string) => Promise<void>;
}

export function NotificationPanel({ notifications, onMarkRead }: NotificationPanelProps) {
    return (
        <Card className="enterprise-card-hover">
            <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notifications for this role.</p>
                ) : (
                    notifications.map((item) => (
                        <div key={item.id} className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{new Date(item.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge variant={item.isRead ? 'secondary' : 'default'}>{item.isRead ? 'Read' : 'Unread'}</Badge>
                                    {!item.isRead ? (
                                        <Button size="sm" variant="outline" onClick={() => onMarkRead(item.id)}>
                                            Mark as read
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

import { useState, useEffect } from 'react';
import {
    Bell,
    CheckCircle2,
    AlertTriangle,
    Info,
    X,
    Trash2,
    Check
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
    timestamp: Date;
    read: boolean;
}

const NotificationCenter = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load initial simulated notifications
    useEffect(() => {
        // In a real app, this would fetch from Supabase 'notifications' table
        // For now, we simulate "Smart Alerts" based on user state
        const initialNotifications: Notification[] = [
            {
                id: '1',
                title: 'Weekly Report Ready',
                message: 'Your carbon audit for last week is available for review.',
                type: 'info',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                read: false,
            },
            {
                id: '2',
                title: 'High Efficiency Detected',
                message: 'Model "GPT-4-Eco" reached 98% efficiency score today.',
                type: 'success',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                read: true,
            }
        ];

        // Simulate a "Carbon Spike" warning if they have settings enabled? 
        // Just adding mock data for the visual "Premium" feel.
        if (Math.random() > 0.5) {
            initialNotifications.unshift({
                id: '3',
                title: 'Carbon Spike Alert',
                message: 'Unusual emission spike detected in region eu-central-1.',
                type: 'warning',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
                read: false,
            });
        }

        setNotifications(initialNotifications);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative transition-all hover:bg-secondary">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border-border/60 backdrop-blur-xl bg-card/95">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="px-1.5 py-0.5 h-5 text-[10px] font-bold">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Mark all as read"
                                onClick={markAllAsRead}
                            >
                                <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                title="Clear all"
                                onClick={clearAll}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                            <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 p-4 border-b border-border/40 hover:bg-muted/40 transition-colors relative group",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className="mt-1 shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 rounded-full p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                            >
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator className="my-0" />
                <div className="p-2 bg-muted/20">
                    <Button variant="ghost" className="w-full text-xs h-8 text-muted-foreground hover:text-primary" onClick={() => setIsOpen(false)}>
                        View All Activity
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationCenter;

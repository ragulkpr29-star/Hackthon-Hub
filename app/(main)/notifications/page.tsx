'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  UserPlus,
  Trophy,
  MessageSquare,
  Heart,
  Eye,
  Award,
  UsersRound,
  Clock,
  CheckCheck,
  BellOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Notification } from '@/lib/types';

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  connection_request: UserPlus,
  team_invitation: UsersRound,
  hackathon_announcement: Trophy,
  certificate_verified: Award,
  profile_viewed: Eye,
  message_received: MessageSquare,
  post_liked: Heart,
  comment_added: MessageSquare,
  team_accepted: UsersRound,
  hackathon_deadline: Clock,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user, supabase]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="space-y-3 max-w-3xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={markAllAsRead}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="You're all caught up!"
          description="No notifications at the moment. We'll notify you about connection requests, team invitations, and hackathon announcements."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, index) => {
            const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`glass-card border-border/50 rounded-2xl cursor-pointer transition-all hover:shadow-md ${!notif.is_read ? 'ring-1 ring-primary/20 bg-primary/[0.03]' : ''
                    }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                  }}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${!notif.is_read ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                      <Icon className={`h-5 w-5 ${!notif.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

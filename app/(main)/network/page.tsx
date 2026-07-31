'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserPlus, Clock, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import type { Connection } from '@/lib/types';

export default function NetworkPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Connection[]>([]);
  const [pendingSent, setPendingSent] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNetwork() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Accepted connections
      const { data: accepted } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, name, avatar_url, department, year),
          receiver:profiles!connections_receiver_id_fkey(id, name, avatar_url, department, year)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      setConnections((accepted as Connection[]) || []);

      // Pending received
      const { data: received } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, name, avatar_url, department, year)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      setPendingReceived((received as Connection[]) || []);

      // Pending sent
      const { data: sent } = await supabase
        .from('connections')
        .select(`
          *,
          receiver:profiles!connections_receiver_id_fkey(id, name, avatar_url, department, year)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending');
      setPendingSent((sent as Connection[]) || []);

      setLoading(false);
    }
    fetchNetwork();
  }, [supabase]);

  const handleAccept = async (connectionId: string) => {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);
    setPendingReceived((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const handleReject = async (connectionId: string) => {
    await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);
    setPendingReceived((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getConnectionPeer = (conn: Connection) => {
    if (conn.requester_id === userId) return conn.receiver;
    return conn.requester;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Network</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your professional connections at KEC.
        </p>
      </div>

      <Tabs defaultValue="connections">
        <TabsList className="glass-card border border-border/50 rounded-xl p-1 h-auto">
          <TabsTrigger value="connections" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Requests ({pendingReceived.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Sent ({pendingSent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-border/50" />)}
            </div>
          ) : connections.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connections yet"
              description="Start connecting with fellow KEC students by visiting the Discover page."
              action={
                <Link href="/discover">
                  <Button className="rounded-xl gradient-primary text-white border-0">
                    Discover Students
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connections.map((conn) => {
                const peer = getConnectionPeer(conn);
                if (!peer) return null;
                return (
                  <motion.div key={conn.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Link href={`/profile/${peer.id}`}>
                      <Card className="glass-card border-border/50 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                            <AvatarImage src={peer.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-semibold">
                              {getInitials(peer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{peer.name}</p>
                            <p className="text-xs text-muted-foreground">{peer.department} — Year {peer.year}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          {pendingReceived.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No pending requests"
              description="You don't have any connection requests at the moment."
            />
          ) : (
            <div className="space-y-3">
              {pendingReceived.map((conn) => {
                const requester = conn.requester;
                if (!requester) return null;
                return (
                  <Card key={conn.id} className="glass-card border-border/50 rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={requester.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs">
                            {getInitials(requester.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{requester.name}</p>
                          <p className="text-xs text-muted-foreground">{requester.department} — Year {requester.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl gradient-primary text-white border-0 h-8" onClick={() => handleAccept(conn.id)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl h-8" onClick={() => handleReject(conn.id)}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          {pendingSent.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No sent requests"
              description="You haven't sent any connection requests yet."
            />
          ) : (
            <div className="space-y-3">
              {pendingSent.map((conn) => {
                const receiver = conn.receiver;
                if (!receiver) return null;
                return (
                  <Card key={conn.id} className="glass-card border-border/50 rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={receiver.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs">
                            {getInitials(receiver.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{receiver.name}</p>
                          <p className="text-xs text-muted-foreground">{receiver.department} — Year {receiver.year}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full text-xs">Pending</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

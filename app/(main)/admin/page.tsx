'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Trophy,
  Activity,
  UserCheck,
  ShieldAlert,
  BarChart3,
  CalendarPlus,
  Plus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { EmptyState } from '@/components/shared/empty-state';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTeams: 0,
    ongoingHackathons: 0,
    pendingVerifications: 0
  });

  const [pendingCerts, setPendingCerts] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    if (!profile || profile.role !== 'admin') return;

    setLoading(true);

    const [
      { count: totalUsers },
      { count: activeTeams },
      { count: ongoingHackathons },
      { count: pendingVerifications },
      { data: certsData }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('hackathons').select('id', { count: 'exact', head: true }).eq('status', 'ongoing'),
      supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('verified', false),
      supabase.from('certificates').select('*, user:profiles!certificates_user_id_fkey(name, department, year)').eq('verified', false).limit(5)
    ]);

    setStats({
      totalUsers: totalUsers || 0,
      activeTeams: activeTeams || 0,
      ongoingHackathons: ongoingHackathons || 0,
      pendingVerifications: pendingVerifications || 0
    });

    setPendingCerts(certsData || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/home'); // Redirect non-admins
      } else {
        fetchStats();
      }
    }
  }, [authLoading, user, profile, router, fetchStats]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border/50" />
          ))}
        </div>
        <div className="h-[400px] rounded-2xl bg-card animate-pulse border border-border/50" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
     return null; // Should have redirected
  }

  const handleApproveCert = async (certId: string) => {
    await supabase.from('certificates').update({ verified: true }).eq('id', certId);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform analytics, user management, and event creation.
          </p>
        </div>
        <Button className="rounded-xl gradient-primary text-white border-0 shadow-lg shadow-primary/25">
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Teams</p>
              <p className="text-2xl font-bold">{stats.activeTeams}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Ongoing Events</p>
              <p className="text-2xl font-bold">{stats.ongoingHackathons}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pending Verifications</p>
              <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-card border border-border/50 rounded-xl p-1 h-auto inline-flex">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            User Management
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Events & Hackathons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Activity Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">Chart Visualization Placeholder</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Certificate Approvals Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingCerts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    All caught up! No certificates pending verification.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCerts.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {cert.user?.name?.substring(0, 2).toUpperCase() || 'ST'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{cert.name} ({cert.issuer})</p>
                            <p className="text-xs text-muted-foreground">
                              {cert.user?.name} • {cert.user?.department} • Year {cert.user?.year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            className="h-8 rounded-lg text-xs"
                            onClick={() => handleApproveCert(cert.id)}
                          >
                            Verify
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

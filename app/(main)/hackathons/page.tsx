'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  Bookmark,
  ExternalLink,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import type { Hackathon } from '@/lib/types';

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHackathons(data as Hackathon[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const upcoming = hackathons.filter((h) => h.status === 'upcoming');
  const ongoing = hackathons.filter((h) => h.status === 'ongoing');
  const completed = hackathons.filter((h) => h.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ongoing': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  const HackathonCard = ({ hackathon }: { hackathon: Hackathon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-card border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all group h-full flex flex-col">
        {/* Banner */}
        <div className="h-36 gradient-primary relative overflow-hidden shrink-0">
          {hackathon.banner_url && (
            <img
              src={hackathon.banner_url}
              alt={hackathon.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <Badge className={`rounded-full text-xs ${getStatusColor(hackathon.status)}`}>
              {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
            {hackathon.title}
          </h3>

          {hackathon.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-2 mb-3">
              {hackathon.description}
            </p>
          )}

          <div className="space-y-2 text-xs text-muted-foreground mt-auto mb-4">
            {hackathon.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(hackathon.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {(hackathon.team_size_min || hackathon.team_size_max) && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {hackathon.team_size_min}–{hackathon.team_size_max} members
              </span>
            )}
            {hackathon.registration_deadline && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Deadline: {formatDistanceToNow(new Date(hackathon.registration_deadline), { addSuffix: true })}
              </span>
            )}
          </div>

          {hackathon.tech_domain && hackathon.tech_domain.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {hackathon.tech_domain.map((domain) => (
                <Badge key={domain} variant="secondary" className="rounded-full text-[10px]">
                  {domain}
                </Badge>
              ))}
            </div>
          )}

          {hackathon.prize && (
            <div className="flex items-center gap-2 text-sm mb-4">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{hackathon.prize}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border/30 mt-auto">
            {hackathon.registration_link && hackathon.status === 'upcoming' && (
              <a href={hackathon.registration_link} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="rounded-xl gradient-primary text-white border-0 gap-1.5">
                  Register <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            {/* Note: Bookmark functionality is visual-only for now until saved_hackathons table is added */}
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Bookmark className="h-3.5 w-3.5" />
              Bookmark
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border border-border/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hackathons</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover and join hackathons organized by the Innovation Cell.
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="glass-card border border-border/50 rounded-xl p-1 h-auto">
          <TabsTrigger value="upcoming" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            Ongoing ({ongoing.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No upcoming hackathons"
              description="Check back later for new hackathon announcements from the Innovation Cell."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {upcoming.map((h) => <HackathonCard key={h.id} hackathon={h} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ongoing" className="mt-4">
          {ongoing.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No ongoing hackathons"
              description="There are no hackathons currently in progress."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {ongoing.map((h) => <HackathonCard key={h.id} hackathon={h} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completed.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No completed hackathons"
              description="Past hackathon results will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {completed.map((h) => <HackathonCard key={h.id} hackathon={h} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

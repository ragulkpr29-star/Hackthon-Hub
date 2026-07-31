'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Users, FileText, Trophy, FolderGit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Post, Hackathon } from '@/lib/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [students, setStudents] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!query.trim()) {
      setStudents([]);
      setPosts([]);
      setHackathons([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      const [studentsRes, postsRes, hackathonsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .or(`name.ilike.%${query}%,department.ilike.%${query}%`)
          .limit(20),
        supabase
          .from('posts')
          .select(`*, author:profiles!posts_author_id_fkey(id, name, avatar_url, department)`)
          .ilike('content', `%${query}%`)
          .limit(20),
        supabase
          .from('hackathons')
          .select('*')
          .ilike('title', `%${query}%`)
          .limit(20),
      ]);

      setStudents((studentsRes.data as Profile[]) || []);
      setPosts((postsRes.data as Post[]) || []);
      setHackathons((hackathonsRes.data as Hackathon[]) || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const totalResults = students.length + posts.length + hackathons.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students, posts, hackathons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-muted/30 border-border/50 text-base focus-visible:ring-primary/30"
            autoFocus
          />
        </div>
      </div>

      {!query.trim() ? (
        <EmptyState
          icon={Search}
          title="Start searching"
          description="Search for students, posts, hackathons, and more."
        />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse border border-border/50" />)}
        </div>
      ) : totalResults === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No results for "${query}". Try different keywords.`}
        />
      ) : (
        <Tabs defaultValue="students">
          <TabsList className="glass-card border border-border/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="students" className="rounded-lg text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="posts" className="rounded-lg text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="hackathons" className="rounded-lg text-xs gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Hackathons ({hackathons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4 space-y-2">
            {students.map((s) => (
              <Link key={s.id} href={`/profile/${s.id}`}>
                <Card className="glass-card border-border/50 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={s.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(s.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.department} — Year {s.year}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="posts" className="mt-4 space-y-2">
            {posts.map((p) => (
              <Card key={p.id} className="glass-card border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {p.author ? getInitials(p.author.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{p.author?.name}</span>
                  </div>
                  <p className="text-sm line-clamp-2">{p.content}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="hackathons" className="mt-4 space-y-2">
            {hackathons.map((h) => (
              <Card key={h.id} className="glass-card border-border/50 rounded-2xl hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{h.title}</p>
                    <Badge variant="outline" className="rounded-full text-[10px] mt-1">{h.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />}>
      <SearchContent />
    </Suspense>
  );
}

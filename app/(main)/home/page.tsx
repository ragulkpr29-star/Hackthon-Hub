'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreatePost } from '@/components/feed/create-post';
import { PostCard } from '@/components/feed/post-card';
import { EmptyState } from '@/components/shared/empty-state';
import type { Post } from '@/lib/types';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, name, avatar_url, department, year)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!postsData || !user) {
      setPosts((postsData as Post[]) || []);
      setLoading(false);
      return;
    }

    // Check which posts the current user has liked and saved
    const postIds = postsData.map((p: any) => p.id);

    const [likesRes, savesRes] = await Promise.all([
      supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds),
      supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds),
    ]);

    const likedSet = new Set((likesRes.data || []).map((l: any) => l.post_id));
    const savedSet = new Set((savesRes.data || []).map((s: any) => s.post_id));

    const enriched = postsData.map((p: any) => ({
      ...p,
      is_liked: likedSet.has(p.id),
      is_saved: savedSet.has(p.id),
    }));

    setPosts(enriched as Post[]);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (user) fetchPosts();
    else setLoading(false);
  }, [user, fetchPosts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Feed */}
      <div className="lg:col-span-8 space-y-6">
        <CreatePost onPostCreated={fetchPosts} />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-card animate-pulse border border-border/50"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No posts yet"
            description="Be the first to share a project, hackathon win, or find team members. Your activity will appear here."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PostCard
                  post={post}
                  currentUserId={user?.id ?? null}
                  onUpdate={fetchPosts}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block lg:col-span-4 space-y-4">
        <div className="glass-card rounded-2xl p-5 border border-border/50">
          <h3 className="text-sm font-semibold mb-3">About Hackathon Hub</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The AI-powered collaboration platform for Kongu Engineering College students.
            Discover teammates, verify skills, and build winning projects.
          </p>
        </div>
      </aside>
    </div>
  );
}

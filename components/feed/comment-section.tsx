'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/shared/empty-state';
import type { Comment } from '@/lib/types';

interface CommentSectionProps {
  postId: string;
  currentUserId: string | null;
  onCommentAdded: () => void;
}

export function CommentSection({ postId, currentUserId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, name, avatar_url, department, year)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as Comment[]);
    }
    setLoading(false);
  }, [postId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);
    
    // Insert new comment
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: currentUserId,
      content: newComment.trim(),
    });

    if (!error) {
      // Get the post author to notify them
      const { data: postData } = await supabase.from('posts').select('author_id, comments_count').eq('id', postId).single();
      
      // Update comments count
      if (postData) {
        await supabase.from('posts').update({ comments_count: (postData.comments_count || 0) + 1 }).eq('id', postId);
        
        // Notify post author if it's not their own comment
        if (postData.author_id !== currentUserId) {
          await supabase.from('notifications').insert({
            user_id: postData.author_id,
            type: 'comment_added',
            title: 'New Comment',
            message: `Someone commented on your post.`,
            data: { post_id: postId },
          });
        }
      }

      setNewComment('');
      await fetchComments();
      onCommentAdded();
    }
    
    setSubmitting(false);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Be the first to share your thoughts."
          className="py-6"
        />
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {comment.author ? getInitials(comment.author.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted/40 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold">{comment.author?.name}</p>
                  <p className="text-sm leading-relaxed mt-0.5">{comment.content}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-3">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="h-9 rounded-xl bg-muted/30 border-border/50 text-sm focus-visible:ring-primary/30"
          disabled={!currentUserId}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || submitting || !currentUserId}
          className="h-9 w-9 shrink-0 rounded-xl gradient-primary text-white border-0 hover:opacity-90"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
}

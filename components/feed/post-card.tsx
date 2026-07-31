'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { POST_TYPE_LABELS } from '@/lib/types';
import type { Post } from '@/lib/types';
import { CommentSection } from './comment-section';

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  onUpdate: () => void;
}

export function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [showComments, setShowComments] = useState(false);
  const supabase = createClient();

  const author = post.author;
  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLike = async () => {
    if (!currentUserId) return;

    if (liked) {
      setLiked(false);
      setLikesCount((c) => Math.max(0, c - 1));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', post.id);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', post.id);

      // Create notification for post author (don't notify yourself)
      if (post.author_id !== currentUserId) {
        await supabase.from('notifications').insert({
          user_id: post.author_id,
          type: 'post_liked',
          title: 'Post Liked',
          message: `Someone liked your post.`,
          data: { post_id: post.id },
        });
      }
    }
  };

  const handleSave = async () => {
    if (!currentUserId) return;

    if (saved) {
      setSaved(false);
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', currentUserId);
    } else {
      setSaved(true);
      await supabase.from('saved_posts').insert({ post_id: post.id, user_id: currentUserId });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="glass-card border-border/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={author ? `/profile/${author.id}` : '#'}>
              <Avatar className="h-11 w-11 ring-2 ring-primary/10 cursor-pointer hover:ring-primary/30 transition-all">
                <AvatarImage src={author?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-semibold">
                  {author ? getInitials(author.name) : '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={author ? `/profile/${author.id}` : '#'}
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                {author?.name || 'Unknown'}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{author?.department} — Year {author?.year}</span>
                <span>·</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Type Badge */}
        <Badge
          variant="secondary"
          className="mb-3 rounded-full text-xs font-medium"
        >
          {POST_TYPE_LABELS[post.post_type] || post.post_type}
        </Badge>

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-primary/80 font-medium hover:text-primary cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        {(likesCount > 0 || post.comments_count > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            {likesCount > 0 && (
              <span>
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            {post.comments_count > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:text-foreground transition-colors"
              >
                {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        <Separator className="mb-1 opacity-50" />

        {/* Actions */}
        <div className="flex items-center justify-between -mx-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`rounded-xl gap-1.5 transition-all ${liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'
              }`}
          >
            <motion.div animate={{ scale: liked ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
              <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
            </motion.div>
            Like
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="rounded-xl gap-1.5 text-muted-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={`rounded-xl gap-1.5 transition-all ${saved ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            Save
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-muted-foreground"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Comments */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Separator className="my-3 opacity-50" />
            <CommentSection postId={post.id} currentUserId={currentUserId} onCommentAdded={onUpdate} />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

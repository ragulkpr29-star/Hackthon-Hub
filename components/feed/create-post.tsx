'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { POST_TYPE_LABELS, type PostType } from '@/lib/types';

interface CreatePostProps {
  onPostCreated: () => void;
}

const postTypes: { value: PostType; label: string }[] = Object.entries(POST_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as PostType, label })
);

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<PostType>('project_release');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content.trim() || !profile) return;

    setLoading(true);

    const { error } = await supabase.from('posts').insert({
      author_id: profile.id,
      content: content.trim(),
      post_type: selectedType,
      tags,
    });

    if (!error) {
      setContent('');
      setTags([]);
      setTagInput('');
      setExpanded(false);
      onPostCreated();
    }

    setLoading(false);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-semibold">
              {profile ? getInitials(profile.name) : '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="w-full text-left rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/70 transition-colors"
              >
                Share a project, hackathon win, or find teammates...
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <Textarea
                    placeholder="What would you like to share?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] resize-none bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/30"
                    autoFocus
                  />

                  {/* Post Type Selector */}
                  <div className="flex flex-wrap gap-2">
                    {postTypes.map((type) => (
                      <Badge
                        key={type.value}
                        variant={selectedType === type.value ? 'default' : 'outline'}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-all ${
                          selectedType === type.value
                            ? 'gradient-primary text-white border-0'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedType(type.value)}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="rounded-full gap-1"
                      >
                        #{tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                        />
                      </Badge>
                    ))}
                    {tags.length < 5 && (
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="bg-transparent text-sm outline-none w-20 placeholder:text-muted-foreground/60"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
                      <ImagePlus className="h-4 w-4 mr-1.5" />
                      Media
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpanded(false);
                          setContent('');
                          setTags([]);
                        }}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!content.trim() || loading}
                        onClick={handleSubmit}
                        className="rounded-xl gradient-primary text-white border-0 hover:opacity-90"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1.5" />
                            Post
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

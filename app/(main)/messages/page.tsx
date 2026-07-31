'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation, Message } from '@/lib/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const { user } = useAuth();
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    // Fetch conversations the user is part of
    const { data: participantsData, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
      
    if (partError || !participantsData || participantsData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convoIds = participantsData.map(p => p.conversation_id);

    // Fetch conversation details with all participants
    const { data: convosData, error: convosError } = await supabase
      .from('conversations')
      .select(`
        id,
        name,
        created_at,
        participants:conversation_participants(
          user:profiles(id, name, avatar_url)
        )
      `)
      .in('id', convoIds);

    if (convosError || !convosData) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // For each conversation, fetch the last message
    const formattedConvos = await Promise.all(convosData.map(async (c: any) => {
      const { data: lastMsgData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: c.id,
        name: c.name,
        created_at: c.created_at,
        participants: c.participants.map((p: any) => p.user).filter(Boolean),
        last_message: lastMsgData || undefined
      } as Conversation;
    }));

    // Sort by last message time
    formattedConvos.sort((a, b) => {
      const timeA = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    setConversations(formattedConvos);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConvoId || !user) return;
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, avatar_url)
      `)
      .eq('conversation_id', selectedConvoId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
           scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
    setLoadingMessages(false);
  }, [selectedConvoId, supabase, user]);

  useEffect(() => {
    fetchMessages();
    
    if (!selectedConvoId) return;

    // Realtime subscription for new messages in this conversation
    const channel = supabase
      .channel(`messages:${selectedConvoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConvoId}`
        },
        async (payload) => {
          // Fetch sender details for the new message
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();
            
          const newMsg = {
            ...payload.new,
            sender: senderData
          } as Message;
          
          setMessages(prev => [...prev, newMsg]);
          
          // Scroll to bottom
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 100);
          
          // Update last message in conversation list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvoId, fetchMessages, fetchConversations, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedConvoId) return;

    setSendingMessage(true);
    
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConvoId,
        sender_id: user.id,
        content: newMessage.trim(),
        message_type: 'text'
      });

    if (!error) {
      setNewMessage('');
    }
    setSendingMessage(false);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getConvoDisplayName = (convo: Conversation) => {
    if (convo.name) return convo.name;
    const otherParticipants = convo.participants?.filter((p) => p.id !== user?.id) || [];
    return otherParticipants.map((p) => p.name).join(', ') || 'Unknown';
  };
  
  const getConvoAvatar = (convo: Conversation) => {
     const otherParticipants = convo.participants?.filter((p) => p.id !== user?.id) || [];
     if (otherParticipants.length === 1 && otherParticipants[0].avatar_url) {
        return otherParticipants[0].avatar_url;
     }
     return undefined;
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-14rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-4 glass-card border-border/50 rounded-2xl overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {conversations.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Connect with students and start chatting."
                  className="py-12"
                />
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvoId(convo.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                      selectedConvoId === convo.id
                        ? 'bg-primary/10 ring-1 ring-primary/20'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={getConvoAvatar(convo)} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(getConvoDisplayName(convo))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getConvoDisplayName(convo)}</p>
                      {convo.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {convo.last_message.sender_id === user?.id ? 'You: ' : ''}{convo.last_message.content}
                        </p>
                      )}
                    </div>
                    {convo.last_message && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(convo.last_message.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-8 glass-card border-border/50 rounded-2xl overflow-hidden flex flex-col">
          {!selectedConvoId ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list to start messaging."
              />
            </div>
          ) : (
            <>
              {loadingMessages ? (
                 <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 </div>
              ) : (
                 <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                  <div className="space-y-3 pb-2">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && (
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                  {msg.sender ? getInitials(msg.sender.name) : '?'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm break-words ${
                                isOwn
                                  ? 'gradient-primary text-white rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              <div className="p-3 border-t border-border/50">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/30"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sendingMessage || loadingMessages}
                    className="h-10 w-10 shrink-0 rounded-xl gradient-primary text-white border-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

-- ============================================================
-- Hackathon Hub — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  technical_interests TEXT[] DEFAULT '{}',
  programming_languages TEXT[] DEFAULT '{}',
  frameworks TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  github_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'in_team', 'looking_for_team')),
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  ai_overall_score NUMERIC,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POSTS (Home Feed)
-- ==========================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN (
    'project_release', 'hackathon_win', 'looking_for_team', 'new_portfolio',
    'open_source', 'technical_blog', 'certificate', 'research', 'internship'
  )),
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POST LIKES
-- ==========================================
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ==========================================
-- COMMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SAVED POSTS
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_posts (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- ==========================================
-- CONNECTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, receiver_id)
);

-- ==========================================
-- FOLLOWERS
-- ==========================================
CREATE TABLE IF NOT EXISTS followers (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ==========================================
-- CONVERSATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'team')),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CONVERSATION PARTICIPANTS
-- ==========================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ==========================================
-- MESSAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'link')),
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- HACKATHONS
-- ==========================================
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  rules TEXT,
  problem_statements JSONB,
  registration_deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  prize TEXT,
  team_size_min INTEGER,
  team_size_max INTEGER,
  tech_domain TEXT[] DEFAULT '{}',
  registration_link TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TEAMS
-- ==========================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hackathon_id UUID REFERENCES hackathons(id),
  leader_id UUID REFERENCES profiles(id) NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  github_repo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TEAM MEMBERS
-- ==========================================
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  contribution TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- ==========================================
-- TASKS (Kanban)
-- ==========================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  assignee_id UUID REFERENCES profiles(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MILESTONES
-- ==========================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PROJECTS
-- ==========================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  github_url TEXT,
  live_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CERTIFICATES
-- ==========================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AI SKILL SCORES
-- ==========================================
CREATE TABLE IF NOT EXISTS skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score BETWEEN 0 AND 100),
  evidence JSONB NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL,
  improvement_tips TEXT[] DEFAULT '{}',
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category)
);

-- ==========================================
-- ACHIEVEMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_type)
);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users can update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Posts: anyone can read, users create their own
CREATE POLICY "Posts are viewable by authenticated users" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Post Likes
CREATE POLICY "Likes are viewable by authenticated users" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are viewable by authenticated users" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Saved Posts
CREATE POLICY "Users can view their saved posts" ON saved_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON saved_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON saved_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Connections
CREATE POLICY "Connections are viewable by involved users" ON connections FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send connection requests" ON connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connections they received" ON connections FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Followers
CREATE POLICY "Followers are viewable by authenticated users" ON followers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow" ON followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Conversations
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT TO authenticated USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (true);

-- Conversation Participants
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants FOR SELECT TO authenticated USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can add participants" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

-- Messages
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT TO authenticated USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Hackathons: everyone can read
CREATE POLICY "Hackathons are viewable by authenticated users" ON hackathons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage hackathons" ON hackathons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Teams
CREATE POLICY "Teams are viewable by authenticated users" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create teams" ON teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Team leaders can update" ON teams FOR UPDATE TO authenticated USING (auth.uid() = leader_id);

-- Team Members
CREATE POLICY "Team members are viewable by authenticated users" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team leaders can manage members" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team members can leave" ON team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Tasks are viewable by team members" ON tasks FOR SELECT TO authenticated USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can create tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can update tasks" ON tasks FOR UPDATE TO authenticated USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- Milestones
CREATE POLICY "Milestones are viewable by team members" ON milestones FOR SELECT TO authenticated USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can manage milestones" ON milestones FOR INSERT TO authenticated WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- Projects
CREATE POLICY "Projects are viewable by authenticated users" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Certificates
CREATE POLICY "Certificates are viewable by authenticated users" ON certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their certificates" ON certificates FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Skill Scores
CREATE POLICY "Skill scores are viewable by authenticated users" ON skill_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage skill scores" ON skill_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "System can update skill scores" ON skill_scores FOR UPDATE TO authenticated USING (true);

-- Achievements
CREATE POLICY "Achievements are viewable by authenticated users" ON achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (true);

-- ==========================================
-- ENABLE REALTIME on key tables
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- ==========================================
-- INDEXES for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(requester_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ==========================================
-- HELPER FUNCTIONS FOR COUNTERS
-- ==========================================
CREATE OR REPLACE FUNCTION increment_post_likes(p_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(p_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_post_comments(p_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = p_id;
END;
$$;

-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT (id) DO NOTHING;

-- Policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Policies for resumes
CREATE POLICY "Resumes are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Authenticated users can upload resumes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Users can update their own resumes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own resumes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND auth.uid() = owner);


// ============================================================
// Hackathon Hub — Core Type Definitions
// ============================================================

// ---------- Profile ----------
export interface Profile {
  id: string;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  technical_interests: string[];
  programming_languages: string[];
  frameworks: string[];
  tools: string[];
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  availability_status: 'available' | 'busy' | 'in_team' | 'looking_for_team';
  role: 'student' | 'admin';
  ai_overall_score: number | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Post ----------
export type PostType =
  | 'project_release'
  | 'hackathon_win'
  | 'looking_for_team'
  | 'new_portfolio'
  | 'open_source'
  | 'technical_blog'
  | 'certificate'
  | 'research'
  | 'internship';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  post_type: PostType;
  media_urls: string[];
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  // Joined fields
  author?: Profile;
  is_liked?: boolean;
  is_saved?: boolean;
}

// ---------- Comment ----------
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

// ---------- Connection ----------
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  requester?: Profile;
  receiver?: Profile;
}

// ---------- Notification ----------
export type NotificationType =
  | 'connection_request'
  | 'team_invitation'
  | 'hackathon_announcement'
  | 'certificate_verified'
  | 'profile_viewed'
  | 'message_received'
  | 'post_liked'
  | 'comment_added'
  | 'team_accepted'
  | 'hackathon_deadline';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// ---------- Message ----------
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'document' | 'link';
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'team';
  name: string | null;
  created_at: string;
  participants?: Profile[];
  last_message?: Message;
}

// ---------- Team ----------
export interface Team {
  id: string;
  name: string;
  description: string | null;
  hackathon_id: string | null;
  leader_id: string;
  tech_stack: string[];
  completion_percentage: number;
  github_repo_url: string | null;
  created_at: string;
  leader?: Profile;
  members?: TeamMember[];
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: string;
  contribution: string | null;
  joined_at: string;
  user?: Profile;
}

// ---------- Hackathon ----------
export type HackathonStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Hackathon {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  rules: string | null;
  problem_statements: Record<string, unknown> | null;
  registration_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  prize: string | null;
  team_size_min: number | null;
  team_size_max: number | null;
  tech_domain: string[];
  registration_link: string | null;
  status: HackathonStatus;
  created_by: string | null;
  created_at: string;
}

// ---------- Task (Kanban) ----------
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
  assignee?: Profile;
}

// ---------- AI Skill Score ----------
export type SkillCategory =
  | 'programming'
  | 'frontend'
  | 'backend'
  | 'ai_ml'
  | 'ui_ux'
  | 'cloud'
  | 'cybersecurity'
  | 'embedded'
  | 'iot'
  | 'leadership'
  | 'communication'
  | 'problem_solving'
  | 'overall';

export interface SkillScore {
  id: string;
  user_id: string;
  category: SkillCategory;
  score: number;
  evidence: Record<string, unknown>;
  explanation: string;
  improvement_tips: string[];
  last_analyzed: string;
}

// ---------- Certificate ----------
export interface Certificate {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
  verified: boolean;
  verification_data: Record<string, unknown> | null;
  created_at: string;
}

// ---------- Project ----------
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

// ---------- Achievement ----------
export interface Achievement {
  id: string;
  user_id: string;
  badge_type: string;
  title: string;
  description: string | null;
  earned_at: string;
}

// ---------- Milestone ----------
export interface Milestone {
  id: string;
  team_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

// ---------- Department Enum ----------
export const DEPARTMENTS = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'AIDS',
  'AIML',
  'CSE (Cyber Security)',
  'Mechatronics',
  'Biomedical',
  'Chemical',
  'Food Technology',
  'Automobile',
  'Textile',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// ---------- Post Type Labels ----------
export const POST_TYPE_LABELS: Record<PostType, string> = {
  project_release: '🚀 Project Release',
  hackathon_win: '🏆 Hackathon Win',
  looking_for_team: '👥 Looking for Team',
  new_portfolio: '💼 New Portfolio',
  open_source: '🌐 Open Source',
  technical_blog: '📝 Technical Blog',
  certificate: '📜 Certificate',
  research: '🔬 Research',
  internship: '💻 Internship',
};

// ============================================================
// Hackathon Hub — Constants
// ============================================================

export const APP_NAME = 'Hackathon Hub';
export const APP_TAGLINE = 'Build Better Teams. Build Bigger Ideas.';
export const COLLEGE_NAME = 'Kongu Engineering College';
export const COLLEGE_SHORT = 'KEC';

// Navigation items (student-facing)
export const NAV_ITEMS = [
  { label: 'Home', href: '/home', icon: 'Home' },
  { label: 'Discover', href: '/discover', icon: 'Search' },
  { label: 'My Network', href: '/network', icon: 'Users' },
  { label: 'Messages', href: '/messages', icon: 'MessageSquare' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'My Team', href: '/my-team', icon: 'UsersRound' },
  { label: 'Hackathons', href: '/hackathons', icon: 'Trophy' },
] as const;

// Availability status options
export const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', color: '#10B981' },
  { value: 'busy', label: 'Busy', color: '#F59E0B' },
  { value: 'in_team', label: 'In a Team', color: '#6366F1' },
  { value: 'not_available', label: 'Not Available', color: '#EF4444' },
] as const;

// Skill categories with display info
export const SKILL_CATEGORIES = [
  { key: 'programming', label: 'Programming', icon: 'Code2' },
  { key: 'frontend', label: 'Frontend', icon: 'Monitor' },
  { key: 'backend', label: 'Backend', icon: 'Server' },
  { key: 'ai_ml', label: 'AI / ML', icon: 'Brain' },
  { key: 'ui_ux', label: 'UI / UX', icon: 'Palette' },
  { key: 'cloud', label: 'Cloud', icon: 'Cloud' },
  { key: 'cybersecurity', label: 'Cybersecurity', icon: 'Shield' },
  { key: 'embedded', label: 'Embedded', icon: 'Cpu' },
  { key: 'iot', label: 'IoT', icon: 'Wifi' },
  { key: 'leadership', label: 'Leadership', icon: 'Crown' },
  { key: 'communication', label: 'Communication', icon: 'MessageCircle' },
  { key: 'problem_solving', label: 'Problem Solving', icon: 'Lightbulb' },
  { key: 'overall', label: 'Overall', icon: 'Star' },
] as const;

// Certificate issuers
export const CERTIFICATE_ISSUERS = [
  'Google',
  'NPTEL',
  'Coursera',
  'AWS',
  'Cisco',
  'Microsoft',
  'IBM',
  'Meta',
  'Oracle',
  'HackerRank',
  'LeetCode',
  'Udemy',
  'edX',
  'Other',
] as const;

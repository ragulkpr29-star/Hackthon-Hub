'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  FolderGit2,
  Globe,
  FileText,
  Award,
  Code2,
  Users,
  Mail,
  Edit3,
  UserPlus,
  UserCheck,
  Briefcase,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Profile, Project, Certificate, SkillScore, Achievement } from '@/lib/types';
import { AVAILABILITY_OPTIONS } from '@/lib/constants';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [skillScores, setSkillScores] = useState<SkillScore[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const currentUserId = user?.id || null;
  const isOwnProfile = currentUserId === id;

  const fetchProfileData = useCallback(async () => {
    setLoading(true);

    // Fetch basic profile info
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profileData) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    // Fetch related data in parallel
    const [projectsRes, certsRes, skillsRes, achievementsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('skill_scores').select('*').eq('user_id', id),
      supabase.from('achievements').select('*').eq('user_id', id).order('earned_at', { ascending: false })
    ]);

    setProjects((projectsRes.data as Project[]) || []);
    setCertificates((certsRes.data as Certificate[]) || []);
    setSkillScores((skillsRes.data as SkillScore[]) || []);
    setAchievements((achievementsRes.data as Achievement[]) || []);

    // Check connection status if not own profile
    if (currentUserId && currentUserId !== id) {
      const { data: connectionData } = await supabase
        .from('connections')
        .select('status')
        .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${id}),and(requester_id.eq.${id},receiver_id.eq.${currentUserId})`)
        .single();

      if (connectionData) {
        setConnectionStatus(connectionData.status);
      } else {
        setConnectionStatus(null);
      }
    }

    setLoading(false);
  }, [id, supabase, currentUserId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleConnect = async () => {
    if (!currentUserId) return;

    setConnectionStatus('pending');

    // Create connection request
    await supabase.from('connections').insert({
      requester_id: currentUserId,
      receiver_id: id,
      status: 'pending'
    });

    // Create notification
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Someone wants to connect with you.',
      data: { requester_id: currentUserId }
    });
  };

  const availabilityOption = AVAILABILITY_OPTIONS.find(
    (opt) => opt.value === profile?.availability_status
  );

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
        <div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={Users}
        title="Profile not found"
        description="This student profile doesn't exist or has been removed."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Header Card */}
      <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
        {/* Cover Image */}
        <div className="h-40 sm:h-52 gradient-primary relative">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-16 mb-4 flex items-end justify-between">
            <Avatar className="h-28 w-28 ring-4 ring-card shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2 mt-4">
              {isOwnProfile ? (
                <Button variant="outline" className="rounded-xl gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  {connectionStatus === 'accepted' ? (
                    <Button variant="outline" className="rounded-xl gap-2">
                      <UserCheck className="h-4 w-4" />
                      Connected
                    </Button>
                  ) : connectionStatus === 'pending' ? (
                    <Button variant="outline" className="rounded-xl gap-2" disabled>
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      className="rounded-xl gradient-primary text-white border-0 gap-2 hover:opacity-90"
                    >
                      <UserPlus className="h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {profile.department} — Year {profile.year}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Kongu Engineering College
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Availability */}
            {availabilityOption && (
              <Badge variant="outline" className="rounded-full gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: availabilityOption.color }}
                />
                {availabilityOption.label}
              </Badge>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <FolderGit2 className="h-3.5 w-3.5" />
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Portfolio
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profile.resume_url && (
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Resume
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Technologies */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Skills & Technologies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.programming_languages && profile.programming_languages.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {profile.programming_languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="rounded-full text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {profile.frameworks && profile.frameworks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Frameworks</p>
              <div className="flex flex-wrap gap-2">
                {profile.frameworks.map((fw) => (
                  <Badge key={fw} variant="secondary" className="rounded-full text-xs">
                    {fw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {profile.tools && profile.tools.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Tools</p>
              <div className="flex flex-wrap gap-2">
                {profile.tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="rounded-full text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {profile.technical_interests && profile.technical_interests.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.technical_interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="rounded-full text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {(!profile.programming_languages || profile.programming_languages.length === 0) &&
            (!profile.frameworks || profile.frameworks.length === 0) &&
            (!profile.tools || profile.tools.length === 0) &&
            (!profile.technical_interests || profile.technical_interests.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No skills added yet.{' '}
                {isOwnProfile && 'Edit your profile to add your technical skills.'}
              </p>
            )}
        </CardContent>
      </Card>

      {/* Tabs: AI Score, Projects, Certificates, Achievements */}
      <Tabs defaultValue="ai-score" className="space-y-4">
        <TabsList className="glass-card border border-border/50 rounded-xl p-1 h-auto">
          <TabsTrigger value="ai-score" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            AI Skill Score
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Projects
          </TabsTrigger>
          <TabsTrigger value="certificates" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Certificates
          </TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* AI Skill Score */}
        <TabsContent value="ai-score">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-6">
              {skillScores.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="Not enough verified data"
                  description="AI skill scores will appear once verified evidence (resume, GitHub, certificates, portfolio) has been uploaded and analyzed."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skillScores.map((score) => (
                    <div
                      key={score.id}
                      className="rounded-xl border border-border/50 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {score.category.replace('_', '/')}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {score.score}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score.score}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full gradient-primary rounded-full"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {score.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-6">
              {projects.length === 0 ? (
                <EmptyState
                  icon={Code2}
                  title="No projects yet"
                  description={
                    isOwnProfile
                      ? 'Add your projects to showcase your work and improve your AI skill score.'
                      : 'This student hasn\'t added any projects yet.'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-border/50 p-4 space-y-3 hover:border-primary/20 transition-colors"
                    >
                      <h4 className="font-semibold text-sm">{project.title}</h4>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tech_stack.map((tech) => (
                            <Badge key={tech} variant="secondary" className="rounded-full text-[10px]">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3">
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <FolderGit2 className="h-3 w-3" /> Code
                          </a>
                        )}
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Live
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-6">
              {certificates.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No certificates yet"
                  description={
                    isOwnProfile
                      ? 'Upload your certificates to get them verified and boost your AI skill score.'
                      : 'This student hasn\'t uploaded any certificates yet.'
                  }
                />
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                        </div>
                      </div>
                      <Badge
                        variant={cert.verified ? 'default' : 'outline'}
                        className="rounded-full text-xs"
                      >
                        {cert.verified ? '✓ Verified' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardContent className="pt-6">
              {achievements.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No achievements yet"
                  description="Badges are earned automatically based on verified activity — never manually selected."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 rounded-xl border border-border/50 p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{achievement.title}</p>
                        {achievement.description && (
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

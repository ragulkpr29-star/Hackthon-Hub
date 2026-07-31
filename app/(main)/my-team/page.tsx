'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  UsersRound,
  ClipboardList,
  FolderGit2,
  Calendar,
  Target,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Team, TeamMember, Task, Milestone } from '@/lib/types';

export default function MyTeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchTeamData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // 1. Find the team the user is part of
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (memberError || !memberData) {
      setTeam(null);
      setLoading(false);
      return;
    }

    const teamId = memberData.team_id;

    // 2. Fetch team details
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamData) setTeam(teamData as Team);

    // 3. Fetch team members with profile data
    const { data: membersData } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles!team_members_user_id_fkey(id, name, avatar_url, department, year)
      `)
      .eq('team_id', teamId);

    if (membersData) setMembers(membersData as TeamMember[]);

    // 4. Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, name, avatar_url)
      `)
      .eq('team_id', teamId);

    if (tasksData) setTasks(tasksData as Task[]);

    // 5. Fetch milestones
    const { data: milestonesData } = await supabase
      .from('milestones')
      .select('*')
      .eq('team_id', teamId)
      .order('due_date', { ascending: true });

    if (milestonesData) setMilestones(milestonesData as Milestone[]);

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState
        icon={UsersRound}
        title="You're not in a team yet"
        description="Join or create a team to start collaborating on hackathon projects. Visit the Discover page to find teammates."
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
        {team.description && (
          <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
        )}
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{team.completion_percentage || 0}%</p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${team.completion_percentage || 0}%` }}
                transition={{ duration: 1 }}
                className="h-full gradient-primary rounded-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tech Stack & Links */}
      {(team.tech_stack?.length > 0 || team.github_repo_url) && (
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="p-5 flex flex-wrap items-center gap-3">
            {team.tech_stack?.map((tech) => (
              <Badge key={tech} variant="secondary" className="rounded-full">
                {tech}
              </Badge>
            ))}
            {team.github_repo_url && (
              <a
                href={team.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline ml-auto"
              >
                <FolderGit2 className="h-4 w-4" />
                Repository
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => {
              const u = member.user;
              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {u ? getInitials(u.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u?.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {u?.department}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Task Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks yet"
              description="Add tasks to track your team's progress."
              className="py-8"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['todo', 'in_progress', 'review', 'done'] as const).map((status) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      {status.replace('_', ' ')}
                    </h4>
                    <Badge variant="outline" className="rounded-full text-[10px] h-5">
                      {tasksByStatus[status].length}
                    </Badge>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {tasksByStatus[status].map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-border/50 p-3 bg-card/50 hover:border-primary/20 transition-colors"
                      >
                        <p className="text-xs font-medium">{task.title}</p>
                        {task.assignee && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Avatar className="h-5 w-5">
                               <AvatarImage src={task.assignee.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[8px]">
                                {getInitials(task.assignee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No milestones set"
              description="Add milestones to track your team's progress towards the deadline."
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
                >
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${
                      milestone.completed ? 'text-green-500' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {milestone.title}
                    </p>
                    {milestone.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(milestone.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

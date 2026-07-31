'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  UserSearch,
  FolderGit2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { DEPARTMENTS } from '@/lib/types';
import type { Profile } from '@/lib/types';

export default function DiscoverPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const { user } = useAuth();
  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    if (!user) return; // Wait for auth to load so we can exclude current user

    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .neq('id', user.id); // Exclude current user

    if (filterDept !== 'all') {
      query = query.eq('department', filterDept);
    }
    if (filterYear !== 'all') {
      query = query.eq('year', parseInt(filterYear));
    }
    if (filterAvailability !== 'all') {
      query = query.eq('availability_status', filterAvailability);
    }

    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      // Search by name, department, or bio
      query = query.or(`name.ilike.${q},department.ilike.${q},bio.ilike.${q}`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setStudents(data as Profile[]);
    }

    setLoading(false);
  }, [searchQuery, filterDept, filterYear, filterAvailability, supabase, user]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover Students</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find teammates across departments at Kongu Engineering College.
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, department, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/30"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterDept} onValueChange={(v) => v && setFilterDept(v)}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-muted/30 border-border/50">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterYear} onValueChange={(v) => v && setFilterYear(v)}>
                <SelectTrigger className="w-[110px] h-10 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAvailability} onValueChange={(v) => v && setFilterAvailability(v)}>
                <SelectTrigger className="w-[130px] h-10 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="in_team">In Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-card animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="No students match your filters"
          description="Try adjusting your search criteria or clearing filters to see more results."
          action={
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setSearchQuery('');
                setFilterDept('all');
                setFilterYear('all');
                setFilterAvailability('all');
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/profile/${student.id}`}>
                <Card className="glass-card border-border/50 rounded-2xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarImage src={student.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-semibold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">{student.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {student.department} — Year {student.year}
                        </p>
                      </div>
                      {student.ai_overall_score !== null && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs font-semibold">{student.ai_overall_score}</span>
                        </div>
                      )}
                    </div>

                    {student.bio && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                        {student.bio}
                      </p>
                    )}

                    <div className="flex-grow"></div>

                    {student.programming_languages && student.programming_languages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {student.programming_languages.slice(0, 4).map((lang) => (
                          <Badge key={lang} variant="secondary" className="rounded-full text-[10px]">
                            {lang}
                          </Badge>
                        ))}
                        {student.programming_languages.length > 4 && (
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            +{student.programming_languages.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        {student.availability_status === 'available' ? '🟢 Available' :
                          student.availability_status === 'busy' ? '🟡 Busy' :
                            student.availability_status === 'in_team' ? '🔵 In Team' : '🔴 Unavailable'}
                      </span>
                      {student.github_url && (
                        <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

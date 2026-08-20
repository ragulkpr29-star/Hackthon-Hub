'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { ProfilePhotoUploader } from '@/components/onboarding/ProfilePhotoUploader';
import { ResumeUploader } from '@/components/onboarding/ResumeUploader';
import { SkillsSelector } from '@/components/onboarding/SkillsSelector';
import { SocialLinksForm } from '@/components/onboarding/SocialLinksForm';
import { profileSchema, type ProfileFormData } from '@/lib/schemas/profile.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronRight, User, Mail, Hash, GraduationCap, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { StorageService } from '@/lib/storage/StorageService';
import { AnalysisLoadingOverlay } from '@/components/onboarding/AnalysisLoadingOverlay';
import { DEPARTMENTS } from '@/lib/types';
import Link from 'next/link';

const CACHE_KEY = 'hackathon_hub_onboarding_cache';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [resumeFile, setResumeFile] = useState<File | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Email verification state
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  // Analysis overlay state
  const [jobId, setJobId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    name: '',
    email: '',
    student_id: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: '',
    bio: '',
    availability_status: 'looking_for_team',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    technical_interests: [],
    programming_languages: [],
    frameworks: [],
    tools: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    // Load cached data if it exists
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse cached onboarding data', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.profile_completed) {
        router.push('/home');
      } else {
        // We have an authenticated user but incomplete profile.
        // Pre-fill fields from their auth meta data or existing profile.
        setFormData(prev => ({
          ...prev,
          name: profile.name || user.user_metadata?.name || prev.name,
          email: profile.email || user.email || prev.email,
          student_id: profile.student_id || user.user_metadata?.student_id || prev.student_id,
          department: profile.department || user.user_metadata?.department || prev.department,
          year: profile.year?.toString() || user.user_metadata?.year?.toString() || prev.year,
          bio: profile.bio || prev.bio,
          availability_status: profile.availability_status || prev.availability_status || 'looking_for_team',
          github_url: profile.github_url || prev.github_url,
          linkedin_url: profile.linkedin_url || prev.linkedin_url,
          portfolio_url: profile.portfolio_url || prev.portfolio_url,
          technical_interests: profile.technical_interests || prev.technical_interests || [],
        }));
      }
    }
  }, [user, profile, authLoading, router]);

  if (!mounted || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdate = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Save to cache on every update, but never save passwords
      const { password, confirmPassword, ...cacheableData } = next;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheableData));
      return next;
    });
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaveError(null);

    // If they are already authenticated, we don't need password
    const dataToValidate = user ? { ...formData, password: 'password123', confirmPassword: 'password123' } : formData;

    const validationResult = profileSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    let currentUserId = user?.id;

    try {
      // Step 1: Sign up if not authenticated
      if (!user) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email!.trim(),
          password: formData.password!,
          options: {
            data: {
              name: formData.name!.trim(),
              student_id: formData.student_id!.trim(),
              department: formData.department!,
              year: Number(formData.year!),
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (!authData.session) {
          // Email confirmation is required!
          setAwaitingVerification(true);
          setIsSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        currentUserId = authData.user?.id;
      }

      if (!currentUserId) throw new Error("Could not determine user ID.");

      const storage = new StorageService();

      // Step 2: Upload avatar
      let avatarUrl: string | null = profile?.avatar_url || null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const path = `${currentUserId}/avatar-${Date.now()}.${ext}`;
        const uploaded = await storage.uploadFile('avatars', path, avatarFile);
        if (uploaded) avatarUrl = uploaded;
      }

      // Step 3: Upload resume
      let resumeUrl: string | null = profile?.resume_url || null;
      if (resumeFile) {
        const path = `${currentUserId}/resume-${Date.now()}.pdf`;
        const uploaded = await storage.uploadFile('resumes', path, resumeFile);
        if (uploaded) resumeUrl = uploaded;
      }

      // Step 4: Call onboarding API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validationResult.data,
          avatar_url: avatarUrl,
          resume_url: resumeUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }

      // Success! Clear cache
      localStorage.removeItem(CACHE_KEY);
      
      // Step 5: Show analysis overlay
      setJobId(result.jobId);
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalysisComplete = () => router.push('/home');
  const handleAnalysisError = (msg: string) => {
    setSaveError(`Analysis encountered an issue: ${msg}. You can still access your dashboard.`);
    setJobId(null);
    setTimeout(() => router.push('/home'), 3000);
  };

  if (awaitingVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 gradient-primary" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to <strong>{formData.email}</strong>. Please click the link to confirm your account.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Your form progress is securely saved. Once you verify and log in, you can complete your profile.
          </p>
          <Button 
            className="w-full rounded-xl gradient-primary text-white" 
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-chart-3/5 blur-[120px]" />
      </div>

      {jobId && (
        <AnalysisLoadingOverlay
          jobId={jobId}
          onComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight"
          >
            Welcome to Hackathon Hub! 🚀
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Let's set up your profile to personalize your experience and connect you with the right opportunities.
          </motion.p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-6 w-6 rounded-full gradient-primary text-white flex items-center justify-center text-xs font-bold shadow-md shadow-primary/20">1</div>
              <span className="text-sm font-medium">Complete Profile</span>
            </div>
            <div className="w-10 h-[2px] bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-sm">AI Analysis</span>
            </div>
            <div className="w-10 h-[2px] bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-sm">Get Matched</span>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-5 py-4 rounded-xl text-sm font-medium">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {!user && (
            <Card className="glass-card border-border/50 rounded-2xl overflow-hidden shadow-lg">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <CardTitle className="text-xl">Academic & Security</CardTitle>
                <CardDescription>Your college details and account security</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">College Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="yourname@kongu.edu"
                        value={formData.email}
                        onChange={(e) => handleUpdate('email', e.target.value)}
                        className={`pl-10 h-12 rounded-xl bg-muted/30 ${errors.email ? 'border-destructive' : 'border-border/50'}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Register Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student_id"
                        placeholder="e.g., 22CSR001"
                        value={formData.student_id}
                        onChange={(e) => handleUpdate('student_id', e.target.value)}
                        className={`pl-10 h-12 rounded-xl bg-muted/30 ${errors.student_id ? 'border-destructive' : 'border-border/50'}`}
                      />
                    </div>
                    {errors.student_id && <p className="text-xs text-destructive mt-1">{errors.student_id}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={formData.department} onValueChange={(v) => handleUpdate('department', v)}>
                        <SelectTrigger className={`pl-10 h-12 rounded-xl bg-muted/30 ${errors.department ? 'border-destructive' : 'border-border/50'}`}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.department && <p className="text-xs text-destructive mt-1">{errors.department}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year of Study</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={formData.year} onValueChange={(v) => handleUpdate('year', v)}>
                        <SelectTrigger className={`pl-10 h-12 rounded-xl bg-muted/30 ${errors.year ? 'border-destructive' : 'border-border/50'}`}>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.year && <p className="text-xs text-destructive mt-1">{errors.year}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => handleUpdate('password', e.target.value)}
                        className={`pl-10 pr-10 h-12 rounded-xl bg-muted/30 ${errors.password ? 'border-destructive' : 'border-border/50'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleUpdate('confirmPassword', e.target.value)}
                        className={`pl-10 h-12 rounded-xl bg-muted/30 ${errors.confirmPassword ? 'border-destructive' : 'border-border/50'}`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-xl">Personal Info</CardTitle>
              <CardDescription>Tell us about yourself and your skills</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleUpdate('name', e.target.value)}
                    disabled={!!user && !!profile?.name}
                    className={`pl-10 h-12 rounded-xl bg-muted/30 ${errors.name ? 'border-destructive' : 'border-border/50'}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a little bit about yourself, your goals, and what you're passionate about building."
                  className={`rounded-xl resize-none h-28 bg-muted/30 ${errors.bio ? 'border-destructive' : 'border-border/50'}`}
                  value={formData.bio || ''}
                  onChange={(e) => handleUpdate('bio', e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  {errors.bio ? <span className="text-destructive">{errors.bio}</span> : <span />}
                  <span>{(formData.bio || '').length}/500</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <SkillsSelector
                  label="Skills"
                  placeholder="e.g. React, Python, UI Design (press Enter)"
                  value={formData.technical_interests || []}
                  onChange={(val) => handleUpdate('technical_interests', val)}
                  suggestions={['React', 'Next.js', 'Python', 'Machine Learning', 'UI/UX', 'Cloud Computing', 'Cyber Security']}
                />
                {errors.technical_interests && <p className="text-xs text-destructive mt-1">{errors.technical_interests}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-xl">Links & Files</CardTitle>
              <CardDescription>Connect your profiles and upload your resume</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <SocialLinksForm
                githubUrl={formData.github_url || ''}
                onGithubUrlChange={(val) => handleUpdate('github_url', val)}
                linkedinUrl={formData.linkedin_url || ''}
                onLinkedinUrlChange={(val) => handleUpdate('linkedin_url', val)}
                portfolioUrl={formData.portfolio_url || ''}
                onPortfolioUrlChange={(val) => handleUpdate('portfolio_url', val)}
                githubError={errors.github_url}
                linkedinError={errors.linkedin_url}
                portfolioError={errors.portfolio_url}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Profile Picture</Label>
                  <ProfilePhotoUploader
                    initialImage={profile?.avatar_url || undefined}
                    onFileSelect={setAvatarFile}
                    name={formData.name || 'User'}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Resume (PDF)</Label>
                  <ResumeUploader
                    onFileSelect={setResumeFile}
                    initialResumeUrl={profile?.resume_url || undefined}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-6 z-10 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-border/50 shadow-2xl flex items-center justify-between w-full max-w-xl gap-6"
            >
              <div className="text-sm font-medium">
                {Object.keys(errors).length > 0 ? (
                  <span className="text-destructive flex items-center">
                    Please fix the errors above
                  </span>
                ) : (
                  <span className="text-muted-foreground">Ready to connect?</span>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                className="rounded-xl gradient-primary text-white shadow-lg shadow-primary/25 border-0 font-semibold px-8 h-12"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Profile & Continue
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {!user && (
            <p className="text-center text-sm text-muted-foreground mt-8 pb-10">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Login
              </Link>
            </p>
          )}

        </form>
      </div>
    </div>
  );
}

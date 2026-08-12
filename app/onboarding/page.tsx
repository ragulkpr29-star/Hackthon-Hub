'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { ProfilePhotoUploader } from '@/components/onboarding/ProfilePhotoUploader';
import { ResumeUploader } from '@/components/onboarding/ResumeUploader';
import { SkillsSelector } from '@/components/onboarding/SkillsSelector';
import { AvailabilitySelector } from '@/components/onboarding/AvailabilitySelector';
import { SocialLinksForm } from '@/components/onboarding/SocialLinksForm';
import { profileSchema, type ProfileFormData } from '@/lib/schemas/profile.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronRight } from 'lucide-react';
import { StorageService } from '@/lib/storage/StorageService';
import { AnalysisLoadingOverlay } from '@/components/onboarding/AnalysisLoadingOverlay';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [resumeFile, setResumeFile] = useState<File | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Analysis overlay state
  const [jobId, setJobId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
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
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.profile_completed) {
        router.push('/home');
      } else if (profile) {
        setFormData(prev => ({
          ...prev,
          bio: profile.bio || '',
          availability_status: profile.availability_status || 'looking_for_team',

          github_url: profile.github_url || '',
          linkedin_url: profile.linkedin_url || '',
          portfolio_url: profile.portfolio_url || '',
          technical_interests: profile.technical_interests || [],
          programming_languages: profile.programming_languages || [],
          frameworks: profile.frameworks || [],
          tools: profile.tools || [],
        }));
      }
    }
  }, [user, profile, authLoading, router]);

  if (!mounted || authLoading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdate = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    // Step 1: Zod validation
    const validationResult = profileSchema.safeParse(formData);
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

    try {
      const storage = new StorageService();

      // Step 2: Upload avatar (browser-side, direct to Supabase Storage)
      let avatarUrl: string | null = profile.avatar_url || null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
        const uploaded = await storage.uploadFile('avatars', path, avatarFile);
        if (uploaded) avatarUrl = uploaded;
      }

      // Step 3: Upload resume (browser-side, direct to Supabase Storage)
      let resumeUrl: string | null = profile.resume_url || null;
      if (resumeFile) {
        const path = `${profile.id}/resume-${Date.now()}.pdf`;
        const uploaded = await storage.uploadFile('resumes', path, resumeFile);
        if (uploaded) resumeUrl = uploaded;
      }

      // Step 4: POST /api/onboarding — backend does everything
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

      // Step 5: Show analysis overlay — it polls until the job completes
      setJobId(result.jobId);
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // When analysis is complete → redirect home
  const handleAnalysisComplete = () => {
    router.push('/home');
  };

  const handleAnalysisError = (msg: string) => {
    // Don't block the user — they can still go home even if analysis failed
    setSaveError(`Analysis encountered an issue: ${msg}. You can still access your dashboard.`);
    setJobId(null);
    // Redirect after 3 seconds
    setTimeout(() => router.push('/home'), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">

      {/* Analysis Loading Overlay — shown after job is created */}
      {jobId && (
        <AnalysisLoadingOverlay
          jobId={jobId}
          onComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Let's get your profile set up so you can start collaborating on Hackathon Hub.
          </p>
        </div>

        {saveError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a professional photo or avatar</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProfilePhotoUploader
                initialImage={profile.avatar_url || undefined}
                onFileSelect={setAvatarFile}
                name={profile.name}
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.name} disabled className="bg-muted/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input value={profile.student_id} disabled className="bg-muted/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={profile.department} disabled className="bg-muted/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={profile.year} disabled className="bg-muted/50 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell us a little bit about yourself, your goals, and what you're passionate about building."
                  className={`rounded-xl resize-none h-24 ${errors.bio ? 'border-destructive' : ''}`}
                  value={formData.bio || ''}
                  onChange={(e) => handleUpdate('bio', e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  {errors.bio ? <span className="text-destructive">{errors.bio}</span> : <span />}
                  <span>{(formData.bio || '').length}/500</span>
                </div>
              </div>

              <AvailabilitySelector
                value={formData.availability_status || 'looking_for_team'}
                onChange={(val) => handleUpdate('availability_status', val)}
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>Add skills by typing and pressing Enter or comma</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <SkillsSelector
                label="Technical Interests"
                placeholder="e.g. Artificial Intelligence, Web Development..."
                value={formData.technical_interests || []}
                onChange={(val) => handleUpdate('technical_interests', val)}
                suggestions={['Artificial Intelligence', 'Machine Learning', 'Cyber Security', 'Web Development', 'Cloud Computing']}
              />
              <SkillsSelector
                label="Programming Languages"
                placeholder="e.g. JavaScript, Python, C++..."
                value={formData.programming_languages || []}
                onChange={(val) => handleUpdate('programming_languages', val)}
                suggestions={['Python', 'Java', 'C++', 'JavaScript', 'TypeScript']}
              />
              <SkillsSelector
                label="Frameworks"
                placeholder="e.g. React, Next.js, Django..."
                value={formData.frameworks || []}
                onChange={(val) => handleUpdate('frameworks', val)}
                suggestions={['React', 'Next.js', 'Express', 'Flutter', 'Django']}
              />
              <SkillsSelector
                label="Tools & Technologies"
                placeholder="e.g. Git, Docker, Figma..."
                value={formData.tools || []}
                onChange={(val) => handleUpdate('tools', val)}
                suggestions={['Git', 'Docker', 'Figma', 'Firebase', 'Supabase']}
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle>Social Links & Resume</CardTitle>
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
              <div className="space-y-3">
                <Label className="text-sm font-medium">Resume (Optional)</Label>
                <ResumeUploader
                  onFileSelect={setResumeFile}
                  initialResumeUrl={profile.resume_url}
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-6 z-10 flex justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-border shadow-2xl flex items-center justify-between w-full md:w-auto md:min-w-[400px] gap-6"
            >
              <div className="text-sm font-medium">
                {Object.keys(errors).length > 0 ? (
                  <span className="text-destructive flex items-center gap-1.5">
                    Please fix the errors above
                  </span>
                ) : (
                  <span className="text-muted-foreground">Ready to start?</span>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                className="rounded-xl gradient-primary text-white shadow-lg shadow-primary/25 border-0 font-semibold px-8"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>

        </form>
      </div>
    </div>
  );
}

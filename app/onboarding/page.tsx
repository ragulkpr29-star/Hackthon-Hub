'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { useProfile } from '@/hooks/useProfile';
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
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { completeProfile, loading: saving, error: saveError } = useProfile();

  const [mounted, setMounted] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [resumeFile, setResumeFile] = useState<File | undefined>();

  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    bio: '',
    availability_status: 'looking_for_team',
    github_url: '',
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

    // Zod Validation
    const validationResult = profileSchema.safeParse(formData);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      // Scroll to top to see error summary if needed
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Analyze GitHub Profile
    console.log("STEP 1: Starting GitHub Analysis");
    if (validationResult.data.github_url) {
      console.log("STEP 2: GitHub URL =", validationResult.data.github_url);
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubUrl: validationResult.data.github_url,
        }),
      });

      const githubAnalysis = await response.json();

      if (!githubAnalysis.success) {
        alert("GitHub Analysis Failed");
        return;
      }

      console.log("GitHub Analysis:", githubAnalysis);
    }

    const success = await completeProfile(
      profile.id,
      validationResult.data,
      avatarFile,
      resumeFile
    );

    if (success) {
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
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
                portfolioUrl={formData.portfolio_url || ''}
                onPortfolioUrlChange={(val) => handleUpdate('portfolio_url', val)}
                githubError={errors.github_url}
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
                disabled={saving}
                className="rounded-xl gradient-primary text-white shadow-lg shadow-primary/25 border-0 font-semibold px-8"
              >
                {saving ? (
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

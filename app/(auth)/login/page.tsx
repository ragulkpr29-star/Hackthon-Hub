
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // --------------------------------------------------
      // STEP 1: Authenticate with Supabase
      // --------------------------------------------------
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const user = data.user;

      if (!user) {
        setError('Unable to retrieve your account. Please try again.');
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // STEP 2: Check Hackathon Hub profile
      // --------------------------------------------------
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup error:', profileError);

        setError(
          'Unable to load your profile. Please try again.'
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // STEP 3: New user → onboarding
      // --------------------------------------------------
      if (!profile) {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      // --------------------------------------------------
      // STEP 4: Profile exists but onboarding incomplete
      // --------------------------------------------------
      if (!profile.profile_completed) {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      // --------------------------------------------------
      // STEP 5: Existing completed user → home
      // --------------------------------------------------
      router.push('/home');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while signing in.'
      );

      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />

        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Link
            href="/"
            className="group mb-4 flex items-center gap-2.5"
          >
            <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105">
              <Zap
                className="h-6 w-6 text-white"
                strokeWidth={2.5}
              />
            </div>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to Hackathon Hub
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              {/* Error */}
              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                  }}
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  College Email
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@kongu.edu"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                    autoComplete="email"
                    className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10 focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Password
                </Label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-border/50 bg-muted/30 pl-10 pr-10 focus-visible:ring-primary/30"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading}
                className="gradient-primary h-11 w-full rounded-xl border-0 font-semibold text-white transition-opacity hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}

          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Register with your KEC email
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Loader2, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // MOCK UI DEMONSTRATION
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-chart-4/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-xl gradient-primary mb-6 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <KeyRound className="h-6 w-6 text-white" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your KEC email to receive a reset link
            </p>
          </div>

          <Card className="glass-card border-border/50 shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">College Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="rollno@kongu.edu"
                        required
                        className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl font-semibold gradient-primary text-white border-0 hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Check your email</h3>
                  <p className="text-muted-foreground mb-6">
                    We've sent a password reset link to <br/><span className="font-medium text-foreground">{email}</span>
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl"
                    onClick={() => setSubmitted(false)}
                  >
                    Try a different email
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Remember your password?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center">
              <ArrowLeft className="h-3 w-3 mr-1" /> Back to login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
